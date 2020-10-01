import { FileType, Transaction } from "@xpcoffee/bank-schema-parser";
import { StaticBankAccountFilters } from "../accounts";
import { toKeyedFile } from "../file";
import { getCurrentIsoTimestamp } from "../time";
import { DenormalizedTransaction, InfoLogEvent, KeyedFile } from "../types";
import { Views } from "../views";
import { Action } from "./actions";

type TransactionMap = Record<string, DenormalizedTransaction>;

export type State = {
  transactions: TransactionMap;
  eventLog: InfoLogEvent[];
  selectedFiles: KeyedFile[] | undefined;
  accountFilter: string;
  viewIndex: number;
  defaultFileType: FileType;
  newEvents: boolean;
};

export const INITIAL_STATE: State = {
  transactions: {},
  accountFilter: StaticBankAccountFilters.All,
  eventLog: [],
  selectedFiles: undefined,
  viewIndex: 0,
  defaultFileType: "FNB-Default",
  newEvents: false,
};

export function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case "clearData":
      return {
        ...state,
        transactions: {},
        accountFilter: StaticBankAccountFilters.All,
      };

    case "add":
      const newState: State = {
        ...state,
        transactions: { ...state.transactions },
        accountFilter: StaticBankAccountFilters.All,
      };

      const nullParseLog: InfoLogEvent[] = [];
      if (!(action.transactions.length || action.eventLogs.length)) {
        nullParseLog.push({
          isoTimestamp: getCurrentIsoTimestamp(),
          source: action.source,
          message:
            "No results from parsing file. Do you have the right bank and file type selected?",
        });
      }

      action.transactions.reduce((state, transaction) => {
        state.transactions[
          transaction.hash
        ] = transactionToDenormalizedTransaction(
          transaction,
          action.bank,
          action.account
        );
        return state;
      }, newState);

      if (action.eventLogs.length + nullParseLog.length > 0) {
        newState.newEvents = true;
      }

      newState.eventLog = [
        ...action.eventLogs,
        ...nullParseLog,
        ...newState.eventLog,
      ];
      return newState;

    case "selectFiles":
      return {
        ...state,
        selectedFiles: action.files.map((file) =>
          toKeyedFile(file, state.defaultFileType)
        ),
      };

    case "updateFile":
      const selectedFiles = state.selectedFiles?.map((keyedFile) => {
        return action.update.key === keyedFile.key
          ? { ...keyedFile, ...action.update }
          : keyedFile;
      });
      return {
        ...state,
        selectedFiles,
      };

    case "clearSelectedFiles":
      return { ...state, selectedFiles: undefined };

    case "removeSelectedFile":
      if (!state.selectedFiles) {
        return state;
      }
      return {
        ...state,
        selectedFiles: state.selectedFiles.filter(
          (keyedFile) => keyedFile.key !== action.key
        ),
      };

    case "updateAggregateFilter":
      return {
        ...state,
        accountFilter: action.filter,
      };

    case "updateViewIndex":
      return {
        ...state,
        newEvents:
          Views[action.index].id === "eventLog" ? false : state.newEvents, // clear new event notification when moving to events tab
        viewIndex: action.index,
      };

    case "updateDefaultFileType":
      return {
        ...state,
        defaultFileType: action.fileType,
      };
  }
}

function transactionToDenormalizedTransaction(
  transaction: Transaction,
  bank: string,
  account: string
) {
  return {
    ...transaction,
    bankAccount: bank + "/" + account,
  };
}
