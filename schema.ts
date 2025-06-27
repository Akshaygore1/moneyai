import { integer, numeric, pgTable, serial, text } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  transaction_type: text("transaction_type"),
  category: text("category"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  currency: text("currency"),
  transaction_date: text("transaction_date"),
  recipient_name: text("recipient_name"),
});
