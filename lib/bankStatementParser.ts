export interface TransactionData {
  type: "credit" | "debit";
  amount: number;
  currency: string;
  account: string;
  vpa: string;
  recipientName: string;
  date: string;
  referenceNumber: number;
}

// Helper function to convert DD-MM-YY to YYYY-MM-DD format
function formatDate(dateStr: string): string {
  // Handle DD-MM-YY format (e.g., "18-06-25")
  const ddmmyyPattern = /^(\d{2})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(ddmmyyPattern);

  if (match) {
    const [, day, month, year] = match;
    // Assume years 00-30 are 2000s, 31-99 are 1900s
    const fullYear = parseInt(year) <= 30 ? `20${year}` : `19${year}`;
    return `${fullYear}-${month}-${day}`;
  }

  // If it's already in a different format, return as is
  return dateStr;
}

// Regex patterns for different transaction types
const CREDIT_PATTERN =
  /Rs\.\s*(\d+(?:\.\d{2})?)\s*is successfully credited to your account \*\*(\d+)\s*by VPA\s*([^\s]+)\s*([^o]+?)on\s*([^\s.]+).*?reference number is\s*(\d+)/i;

// Updated DEBIT_PATTERN to handle HDFC Bank SMS format
const DEBIT_PATTERN =
  /Rs\.(\d+(?:\.\d{2})?)\s*has been debited from account\s*(\d+)\s*to VPA\s*([^\s]+)\s*([^o]+?)on\s*([^\s.]+).*?reference number is\s*(\d+)/i;

// New HDFC Bank specific patterns
const HDFC_DEBIT_PATTERN =
  /Dear Customer,\s*Rs\.(\d+(?:\.\d{2})?)\s*has been debited from account\s*(\d+)\s*to VPA\s*([^\s]+)\s*(.+?)\s*on\s*(\d{2}-\d{2}-\d{2}).*?UPI transaction reference number is\s*(\d+)/i;

const HDFC_CREDIT_PATTERN =
  /Dear Customer,\s*Rs\.(\d+(?:\.\d{2})?)\s*has been credited to your account\s*(\d+)\s*from VPA\s*([^\s]+)\s*(.+?)\s*on\s*(\d{2}-\d{2}-\d{2}).*?UPI transaction reference number is\s*(\d+)/i;

export function parseTransaction(message: string): TransactionData | null {
  // Try to parse as HDFC Bank debit transaction first
  const hdfcDebitMatch = message.match(HDFC_DEBIT_PATTERN);
  if (hdfcDebitMatch) {
    return {
      type: "debit",
      amount: parseFloat(hdfcDebitMatch[1]),
      currency: "INR",
      account: hdfcDebitMatch[2],
      vpa: hdfcDebitMatch[3],
      recipientName: hdfcDebitMatch[4].trim(),
      date: formatDate(hdfcDebitMatch[5]),
      referenceNumber: parseInt(hdfcDebitMatch[6]),
    };
  }

  // Try to parse as HDFC Bank credit transaction
  const hdfcCreditMatch = message.match(HDFC_CREDIT_PATTERN);
  if (hdfcCreditMatch) {
    return {
      type: "credit",
      amount: parseFloat(hdfcCreditMatch[1]),
      currency: "INR",
      account: hdfcCreditMatch[2],
      vpa: hdfcCreditMatch[3],
      recipientName: hdfcCreditMatch[4].trim(),
      date: formatDate(hdfcCreditMatch[5]),
      referenceNumber: parseInt(hdfcCreditMatch[6]),
    };
  }

  // Try to parse as credit transaction (original pattern)
  const creditMatch = message.match(CREDIT_PATTERN);
  if (creditMatch) {
    return {
      type: "credit",
      amount: parseFloat(creditMatch[1]),
      currency: "INR",
      account: creditMatch[2],
      vpa: creditMatch[3],
      recipientName: creditMatch[4].trim(),
      date: formatDate(creditMatch[5]),
      referenceNumber: parseInt(creditMatch[6]),
    };
  }

  // Try to parse as debit transaction (original pattern)
  const debitMatch = message.match(DEBIT_PATTERN);
  if (debitMatch) {
    return {
      type: "debit",
      amount: parseFloat(debitMatch[1]),
      currency: "INR",
      account: debitMatch[2],
      vpa: debitMatch[3],
      recipientName: debitMatch[4].trim(),
      date: formatDate(debitMatch[5]),
      referenceNumber: parseInt(debitMatch[6]),
    };
  }

  return null;
}

export function parseMultipleTransactions(
  messages: string[]
): TransactionData[] {
  return messages
    .map((message) => parseTransaction(message))
    .filter(
      (transaction): transaction is TransactionData => transaction !== null
    );
}

export function formatTransaction(transaction: TransactionData): string {
  const symbol = transaction.type === "credit" ? "+" : "-";
  const color = transaction.type === "credit" ? "green" : "red";

  return `${symbol}₹${transaction.amount.toFixed(2)} | ${
    transaction.recipientName
  } | ${transaction.vpa} | ${transaction.date} | Ref: ${
    transaction.referenceNumber
  }`;
}

export function getTransactionSummary(transactions: TransactionData[]): {
  totalCredits: number;
  totalDebits: number;
  netAmount: number;
  transactionCount: number;
} {
  let totalCredits = 0;
  let totalDebits = 0;

  transactions.forEach((transaction) => {
    if (transaction.type === "credit") {
      totalCredits += transaction.amount;
    } else {
      totalDebits += transaction.amount;
    }
  });

  return {
    totalCredits,
    totalDebits,
    netAmount: totalCredits - totalDebits,
    transactionCount: transactions.length,
  };
}

// Test function to debug parsing
export function testParsing(message: string): void {
  console.log("Testing message:", message);
  const result = parseTransaction(message);
  console.log("Parsed result:", result);
}
