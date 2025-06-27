"use server";
import { db } from "@/db";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export const runGeneratedSQLQuery = async (query: string) => {
  // Ensure the query is a SELECT statement. Otherwise, throw an error
  if (
    !query.trim().toLowerCase().startsWith("select") ||
    query.trim().toLowerCase().includes("drop") ||
    query.trim().toLowerCase().includes("delete") ||
    query.trim().toLowerCase().includes("insert") ||
    query.trim().toLowerCase().includes("update") ||
    query.trim().toLowerCase().includes("alter") ||
    query.trim().toLowerCase().includes("truncate") ||
    query.trim().toLowerCase().includes("create") ||
    query.trim().toLowerCase().includes("grant") ||
    query.trim().toLowerCase().includes("revoke")
  ) {
    throw new Error("Only SELECT queries are allowed");
  }

  let data: any;
  try {
    data = await db.execute(query);
  } catch (e: any) {
    if (e.message.includes('relation "unicorns" does not exist')) {
      console.log(
        "Table does not exist, creating and seeding it with dummy data now..."
      );
      // throw error
      throw Error("Table does not exist");
    } else {
      throw e;
    }
  }

  return data.rows;
};

export const generateQuery = async (input: string) => {
  try {
    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      system: `
      You are a highly skilled SQL (PostgreSQL) and data visualization expert. Your primary role is to assist users in crafting precise SQL queries to extract data from a \`transactions\` table, specifically for bank statement analysis.

      Your goal is to understand the user's data retrieval needs thoroughly and translate them into efficient, accurate SQL queries. Always consider how the retrieved data might be used for **data visualization** and aim to provide queries that are well-suited for such purposes.

      transactions (
        id SERIAL PRIMARY KEY,
        type VARCHAR(255),
        amount INTEGER,
        currency VARCHAR(255),
        account VARCHAR(255),
        vpa VARCHAR(255),
        recipient_name VARCHAR(255),
        date VARCHAR(255),
        reference_number INTEGER,
      );

      Only retrieval queries are allowed.

      This is a bank statement. The user is asking for a query to retrieve the data they need.
      type field is either 'credit' or 'debit'.
      amount field is the amount of the transaction.
      currency field is the currency of the transaction.
      account field is the account number of the transaction.
      vpa field is the virtual payment address of the transaction.
      recipient_name field is the name of the recipient of the transaction.
      vpa and recipient_name combined are the same thing.
      date field is the date of the transaction.

      The user is asking for a query to retrieve the data they need.

      `,
      prompt: `Generate the query necessary to retrieve the data the user wants: ${input}`,
      schema: z.object({
        query: z.string(),
      }),
    });

    return result.object.query;
  } catch (e) {
    console.error(e);
    throw new Error("Failed to generate query");
  }
};
