import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { GmailService } from "@/lib/gmail";
import { transactions } from "@/schema";
import { db } from "@/db";
import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import z from "zod";

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
    console.log("emails", emails);
    const result = await generateObject({
      model: google("gemini-2.5-flash"),
      system: `
      You are a bank statement parser. You are given a list of emails. You need to parse the emails and return the data in a structured format.

      by using vpa and recipient_name, you can determine the type of transaction.
      like if vpa is upi and recipient_name is amazon, then the type is shopping.
      if vpa is upi and recipient_name is zomato or swiggy, then the type is food.
      if vpa is upi and recipient_name is irctc, then the type is travel.
      if vpa is upi and recipient_name is netflix, then the type is entertainment.
      if vpa is upi and recipient_name is zepto blinkit,instamart then the type is grocery.
      similarly, analysing vpa and recipient_name, you can determine the type of transaction.
      The data should be strictly in this format format:
      [
        {
          transaction_type: "credit" | "debit",
          amount: number,
          currency: string,
          category: food | shopping | travel | entertainment | other | etc.,
          transaction_date: string,
          recipient_name: string,
        }
      ]

      `,
      prompt: `Here are the transactions: ${emails}`,
      output: "array",
      schema: z.object({
        transaction_type: z.string(),
        amount: z.number(),
        currency: z.string(),
        category: z.string(),
        transaction_date: z.string(),
        recipient_name: z.string(),
      }),
    });

    let jsonArray = result.object;

    function formatDate(dateStr: string): string {
      const [day, month, year] = dateStr.split("-");
      const fullYear = year.length === 2 ? `20${year}` : year;
      return `${fullYear}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    try {
      const formattedData = jsonArray.map((item: any) => ({
        transaction_type: String(item.transaction_type),
        amount: String(item.amount),
        currency: String(item.currency),
        category: String(item.category),
        transaction_date: formatDate(item.transaction_date),
        recipient_name: String(item.recipient_name),
      }));

      const allTransactions = await db
        .insert(transactions)
        .values(formattedData)
        .returning();

      console.log("allTransactions", allTransactions);
      return NextResponse.json(allTransactions);
    } catch (error) {
      console.error("Error processing data:", error);
      return NextResponse.json(
        { error: "Failed to process transaction data" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch emails" },
      { status: 500 }
    );
  }
}
