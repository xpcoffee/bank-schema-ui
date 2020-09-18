import { Transaction } from "@xpcoffee/bank-schema-parser";
import { KeyedFile, KeyedFileUpdate } from "./file";
import { InfoLogEvent } from "./infoLog";

export type Action =
  | {
      type: "add";
      bank: string;
      account: string;
      transactions: Transaction[];
      source: string;
      eventLogs: InfoLogEvent[];
    }
  | { type: "reset" }
  | { type: "selectFiles"; files: File[] }
  | { type: "updateFile"; update: KeyedFileUpdate }
  | { type: "removeSelectedFile"; key: string }
  | { type: "clearSelectedFiles" };
