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

  async getEmails(maxResults: number = 10): Promise<TransactionData[]> {
    try {
      const response = await this.gmail.users.messages.list({
        userId: "me",
        q: "from:alerts@hdfcbank.net after:2025/06/1 before:2025/06/19",
      });
      if (!response.data.messages) {
        return [];
      }

      const emails = await Promise.all(
        response.data.messages.map(async (message) => {
          const email = await this.gmail.users.messages.get({
            userId: "me",
            id: message.id!,
          });
          return email.data.snippet as string;
        })
      );

      const parsedTransactions = parseMultipleTransactions(emails);

      return parsedTransactions;
    } catch (error) {
      console.error("Error fetching emails:", error);
      throw error;
    }
  }
}
