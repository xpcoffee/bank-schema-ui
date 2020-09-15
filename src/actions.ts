import { Transaction, Banks, InputFileTypes } from "bank-schema-parser";
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
  | { type: "selectBank"; bank: Banks }
  | { type: "selectFileType"; inputFileType: InputFileTypes }
  | { type: "selectFiles"; files: File[] }
  | { type: "removeSelectedFile"; file: File }
  | { type: "clearSelectedFiles" };
