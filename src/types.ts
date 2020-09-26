import { Transaction } from "@xpcoffee/bank-schema-parser";

export interface DenormalizedTransaction extends Transaction {
  bankAccount: string;
}
