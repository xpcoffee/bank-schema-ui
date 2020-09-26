import { Transaction } from "@xpcoffee/bank-schema-parser";
import { KeyedFileUpdate } from "./file";
import { InfoLogEvent } from "./types";

export type Action =
  | {
      type: "add";
      bank: string;
      account: string;
      transactions: Transaction[];
      source: string;
      eventLogs: InfoLogEvent[];
    }
  | { type: "clearData" }
  | { type: "selectFiles"; files: File[] }
  | { type: "updateFile"; update: KeyedFileUpdate }
  | { type: "removeSelectedFile"; key: string }
  | { type: "clearSelectedFiles" }
  | { type: "updateAggregateFilter"; filter: string }
  | { type: "updateViewIndex"; index: number };
