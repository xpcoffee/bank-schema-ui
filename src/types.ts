import { FileType, Transaction } from "@xpcoffee/bank-schema-parser";

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

export type KeyedFile = { key: string; file: File; fileType: FileType };
export interface KeyedFileUpdate extends Partial<KeyedFile> {
  key: string;
}

export interface BalanceDataPoint
  extends Omit<
    Omit<Omit<DenormalizedTransaction, "amount">, "description">,
    "hash"
  > {}
