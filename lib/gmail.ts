import { google } from "googleapis";
import {
  TransactionData,
  parseMultipleTransactions,
} from "./bankStatementParser";

export interface EmailData {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
    };
  };
}

export class GmailService {
  private gmail;

  constructor(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    this.gmail = google.gmail({ version: "v1", auth });
  }

  async getEmails(maxResults: number = 10): Promise<string[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: "from:alerts@hdfcbank.net after:2025/06/01 before:2025/06/28",
      });
      if (!response.data.messages) {
        return [];
      }

      const emails: string[] = await Promise.all(
        response.data.messages.map(async (message) => {
          const email = await this.gmail.users.messages.get({
            userId: "me",
            id: message.id!,
          });
          const text: string | null | undefined = email.data.snippet;
          if (!text) {
            return null;
          }
          const cleanedMessage = text
            .replace("Dear Customer, ", "")
            .replace("from account 9434 ", "")
            .replace("Your UPI transaction reference number is.", "")
            .replace("If you did not authorize this", "")
            .replace("Your UPI transaction reference number", "")
            .trim();
          return cleanedMessage[0] === "R" ? cleanedMessage : null;
        })
      ).then((emails) =>
        emails.filter(
          (email): email is string => email !== null && email !== undefined
        )
      );
      // const parsedTransactions = parseMultipleTransactions(emails);

      // return parsedTransactions;
      return emails;
    } catch (error) {
      console.error("Error fetching emails:", error);
      throw error;
    }
  }
}
