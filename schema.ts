import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: text("type"),
  amount: integer("amount"),
  currency: text("currency"),
  account: text("account"),
  vpa: text("vpa"),
  recipient_name: text("recipient_name"),
  date: text("date"),
  reference_number: integer("reference_number"),
});
