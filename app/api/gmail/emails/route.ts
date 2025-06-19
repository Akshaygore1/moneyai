import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { GmailService } from "@/lib/gmail";
import { transactions } from "@/schema";
import { db } from "@/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-ignore
    const accessToken = session.accessToken;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token found" },
        { status: 401 }
      );
    }

    const gmailService = new GmailService(accessToken);
    const emails = await gmailService.getEmails();

    const transactionData = emails.map((transaction) => ({
      type: transaction.type,
      amount: transaction.amount,
      currency: transaction.currency,
      account: transaction.account,
      vpa: transaction.vpa,
      recipient_name: transaction.recipientName,
      date: transaction.date,
      reference_number: transaction.referenceNumber,
    }));

    const allTransactions = await db
      .insert(transactions)
      .values(transactionData)
      .returning();

    return NextResponse.json({ allTransactions });
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
