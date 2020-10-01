import { FileType, Transaction } from "@xpcoffee/bank-schema-parser";
import { InfoLogEvent, KeyedFileUpdate } from "../types";

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
  | { type: "updateDefaultFileType"; fileType: FileType }
  | { type: "removeSelectedFile"; key: string }
  | { type: "clearSelectedFiles" }
  | { type: "updateAggregateFilter"; filter: string }
  | { type: "updateViewIndex"; index: number };
