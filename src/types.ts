import { Transaction } from "@xpcoffee/bank-schema-parser";

export interface DenormalizedTransaction extends Transaction {
  bankAccount: string;
}

export type MonthlyAggregation = {
  yearMonth: string;
  bankAccount: string;
  incomeInZAR: number;
  expensesInZAR: number;
};

export type InfoLogEvent = {
  isoTimestamp: string;
  source: string;
  message: string;
};
