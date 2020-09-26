import React, { useCallback, useMemo, useReducer } from "react";
import "./App.css";
import { FileType, Transaction } from "@xpcoffee/bank-schema-parser";
import { Action } from "./actions";
import { Toolbar } from "./components/Toolbar";
import { getCurrentIsoTimestamp, getYearMonthFromTimeStamp } from "./time";
import { toKeyedFile } from "./file";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import {
  DenormalizedTransaction,
  InfoLogEvent,
  KeyedFile,
  MonthlyAggregation,
} from "./types";
import { TransactionTable } from "./components/TransactionTable";
import { AggregationTable } from "./components/AggregationTable";
import { EventLog } from "./components/EventLog";

type TransactionMap = Record<string, DenormalizedTransaction>;

enum StaticBankAccountAggregateFilters {
  All = "All",
}

type State = {
  transactions: TransactionMap;
  eventLog: InfoLogEvent[];
  selectedFiles: KeyedFile[] | undefined;
  aggregateFilter: string;
  viewIndex: number;
  defaultFileType: FileType;
};

const INITIAL_STATE: State = {
  transactions: {},
  aggregateFilter: StaticBankAccountAggregateFilters.All,
  eventLog: [],
  selectedFiles: undefined,
  viewIndex: 0,
  defaultFileType: "FNB-Default",
};

function App() {
  const views = useMemo<
    {
      id: string;
      label: ({
        numberOfTransactions,
      }: {
        numberOfTransactions?: number;
      }) => string;
    }[]
  >(
    () => [
      {
        id: "aggregations",
        label: () => "Aggregations",
      },
      {
        id: "transactions",
        label: ({ numberOfTransactions }) =>
          `Transactions${
            numberOfTransactions ? `(${numberOfTransactions})` : ""
          }`,
      },
      {
        id: "eventLog",
        label: () => "Event log",
      },
    ],
    []
  );

  const [store, dispatch] = useReducer(appReducer, INITIAL_STATE);

  const transactions = useMemo<DenormalizedTransaction[]>(() => {
    const thing = Object.values(store.transactions);

    thing.sort((a, b) => (b.timeStamp > a.timeStamp ? 1 : -1));

    return thing;
  }, [store.transactions]);

  // technically this is a state selector
  const { monthlyAggregations, bankAccountAggregates } = useMemo<
    AggregationResult
  >(() => aggregateTransactions(transactions), [transactions]);

  const filteredAggregations = useMemo<MonthlyAggregation[]>(() => {
    const predicate = (aggregation: MonthlyAggregation) => {
      if (StaticBankAccountAggregateFilters.All === store.aggregateFilter) {
        return true;
      }
      return store.aggregateFilter === aggregation.bankAccount;
    };

    return monthlyAggregations.filter(predicate);
  }, [monthlyAggregations, store.aggregateFilter]);

  const getAggregateFilterSelect = useCallback(
    () => (
      <select
        className="bg-gray-300 mx-4"
        value={store.aggregateFilter}
        onChange={(change) =>
          dispatch({
            type: "updateAggregateFilter",
            filter: change.target.value,
          })
        }
      >
        {[StaticBankAccountAggregateFilters.All, ...bankAccountAggregates].map(
          (aggregate) => (
            <option key={aggregate} value={aggregate}>
              {aggregate}
            </option>
          )
        )}
      </select>
    ),
    [bankAccountAggregates, store.aggregateFilter]
  );

  const filteredTransactions = useMemo<DenormalizedTransaction[]>(() => {
    const predicate = (aggregation: DenormalizedTransaction) => {
      if (
        StaticBankAccountAggregateFilters.All === store.aggregateFilter ||
        TOTAL_ACCOUNT_AGGREGATE === store.aggregateFilter
      ) {
        return true;
      }
      return store.aggregateFilter === aggregation.bankAccount;
    };

    return transactions.filter(predicate);
  }, [transactions, store.aggregateFilter]);

  return (
    <div className="App flex items-stretch flex-col">
      <header className="bg-gray-700 p-2 flex items-center">
        <h1 className="text-2xl text-white">bank-schema</h1>
      </header>
      <div className="flex flex-1 flex-col-reverse lg:flex-row justify-between">
        <div className="flex flex-1 flex-col">
          <div className="p-2 bg-gray-300">
            <h2 className="text-xl">Filters</h2>
            <label className="flex">
              Bank/Account
              <div>{getAggregateFilterSelect()}</div>
            </label>
          </div>
          <Tabs
            onSelect={(index) => dispatch({ type: "updateViewIndex", index })}
          >
            <TabList className="flex flex-row mb-4 bg-gray-300">
              {views.map((view, index) => {
                const isActive = store.viewIndex === index;
                const pointer = isActive ? "" : " cursor-pointer";
                const style = isActive ? " bg-white" : "";
                return (
                  <Tab key={index} className={"px-4 py-1" + pointer + style}>
                    <h2 className="text-xl">
                      {view.label({
                        numberOfTransactions: filteredTransactions.length,
                      })}
                    </h2>
                  </Tab>
                );
              })}
            </TabList>
            <TabPanel className="px-2">
              <AggregationTable aggregations={filteredAggregations} />
            </TabPanel>
            <TabPanel className="px-2">
              <TransactionTable transactions={filteredTransactions} />
            </TabPanel>
            <TabPanel className="px-2">
              <EventLog events={store.eventLog} />
            </TabPanel>
          </Tabs>
        </div>
        <Toolbar
          selectedFiles={store.selectedFiles}
          dispatch={dispatch}
          defaultFileType={store.defaultFileType}
        />
      </div>
    </div>
  );
}

export default App;

type AggregationResult = {
  monthlyAggregations: MonthlyAggregation[];
  bankAccountAggregates: string[];
};
type KeyedAggregationResult = {
  aggregationMap: Record<string, MonthlyAggregation>;
  bankAccountAggregates: string[]; // the identifiers for aggregations
};

/**
 * Aggregates and sorts transactions
 * currently only by month
 * Heavy operation; may want to move this to a service worker in future
 */
function aggregateTransactions(transactions: DenormalizedTransaction[]) {
  const { aggregationMap, bankAccountAggregates } = aggregateTransactionsByKey(
    transactions
  );
  return {
    monthlyAggregations: Object.values(aggregationMap).sort((a, b) =>
      b.yearMonth > a.yearMonth ? 1 : -1
    ),
    bankAccountAggregates,
  };
}

const TOTAL_ACCOUNT_AGGREGATE = "Total";
function aggregateTransactionsByKey(
  transactions: DenormalizedTransaction[]
): KeyedAggregationResult {
  return transactions.reduce<KeyedAggregationResult>(
    (aggregationResult, transaction) => {
      const accountKey = getAccountKey(transaction);
      const totalKey = getTotalKey(transaction);
      const keyedAggregations = aggregationResult.aggregationMap;

      const accountAggregation: MonthlyAggregation = keyedAggregations[
        accountKey
      ] || {
        yearMonth: getYearMonthFromTimeStamp(transaction.timeStamp),
        bankAccount: transaction.bankAccount,
        incomeInZAR: 0,
        expensesInZAR: 0,
      };

      const totalAggregation: MonthlyAggregation = keyedAggregations[
        totalKey
      ] || {
        yearMonth: getYearMonthFromTimeStamp(transaction.timeStamp),
        bankAccount: TOTAL_ACCOUNT_AGGREGATE,
        incomeInZAR: 0,
        expensesInZAR: 0,
      };

      if (transaction.amountInZAR > 0) {
        accountAggregation.incomeInZAR += transaction.amountInZAR;
        totalAggregation.incomeInZAR += transaction.amountInZAR;
      } else {
        accountAggregation.expensesInZAR += transaction.amountInZAR;
        totalAggregation.expensesInZAR += transaction.amountInZAR;
      }

      keyedAggregations[accountKey] = accountAggregation;
      keyedAggregations[totalKey] = totalAggregation;

      const bankAccountAggregates = aggregationResult.bankAccountAggregates;
      if (!bankAccountAggregates.includes(transaction.bankAccount)) {
        bankAccountAggregates.push(transaction.bankAccount);
      }
      return { aggregationMap: keyedAggregations, bankAccountAggregates };
    },
    {
      aggregationMap: {},
      bankAccountAggregates: [TOTAL_ACCOUNT_AGGREGATE],
    }
  );
}

function getAccountKey(transaction: DenormalizedTransaction) {
  return `${getYearMonthFromTimeStamp(transaction.timeStamp)}-${
    transaction.bankAccount
  }`;
}

function getTotalKey(transaction: DenormalizedTransaction) {
  return `${getYearMonthFromTimeStamp(transaction.timeStamp)}-total`;
}

function appReducer(state: State, action: Action): State {
  switch (action.type) {
    case "clearData":
      return {
        ...state,
        transactions: {},
        aggregateFilter: StaticBankAccountAggregateFilters.All,
      };

    case "add":
      const newState: State = {
        ...state,
        transactions: { ...state.transactions },
        aggregateFilter: StaticBankAccountAggregateFilters.All,
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
        aggregateFilter: action.filter,
      };

    case "updateViewIndex":
      return {
        ...state,
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
