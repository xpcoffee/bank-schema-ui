import React, { useCallback, useMemo, useReducer } from "react";
import "./App.css";
import { FileType, Transaction } from "@xpcoffee/bank-schema-parser";
import { Action } from "./actions";
import { Toolbar } from "./components/Toolbar";
import { getCurrentIsoTimestamp } from "./time";
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
import { BalanceChart } from "./components/BalanceChart";
import { AggregationResult, aggregateTransactions } from "./aggregation";
import { StaticBankAccountFilters } from "./accounts";
import {
  getBankBalances,
  sampleLowestBalance,
  groupByYearWeek,
} from "./balance";

type TransactionMap = Record<string, DenormalizedTransaction>;

type State = {
  transactions: TransactionMap;
  eventLog: InfoLogEvent[];
  selectedFiles: KeyedFile[] | undefined;
  accountFilter: string;
  viewIndex: number;
  defaultFileType: FileType;
};

const INITIAL_STATE: State = {
  transactions: {},
  accountFilter: StaticBankAccountFilters.All,
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
        id: "balance",
        label: () => "Balance",
      },
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

  const filteredTransactions = useMemo<DenormalizedTransaction[]>(() => {
    const predicate = (aggregation: DenormalizedTransaction) => {
      if (
        StaticBankAccountFilters.All === store.accountFilter ||
        StaticBankAccountFilters.Total === store.accountFilter
      ) {
        return true;
      }
      return store.accountFilter === aggregation.bankAccount;
    };

    return transactions.filter(predicate);
  }, [transactions, store.accountFilter]);

  const balanceData = useMemo(
    () =>
      getBankBalances(
        filteredTransactions,
        sampleLowestBalance,
        groupByYearWeek
      ),
    [filteredTransactions]
  );

  // technically this is a state selector
  const { monthlyAggregations, bankAccountAggregates } = useMemo<
    AggregationResult
  >(() => aggregateTransactions(filteredTransactions), [filteredTransactions]);

  const filteredAggregations = useMemo<MonthlyAggregation[]>(() => {
    const predicate = (aggregation: MonthlyAggregation) => {
      if (StaticBankAccountFilters.All === store.accountFilter) {
        return true;
      }
      return store.accountFilter === aggregation.bankAccount;
    };

    return monthlyAggregations.filter(predicate);
  }, [monthlyAggregations, store.accountFilter]);

  /**
   * Allows guests to select a bank account to filter their views on
   */
  const getAccountFilterSelect = useCallback(
    () => (
      <select
        className="bg-gray-300 mx-4"
        value={store.accountFilter}
        onChange={(change) =>
          dispatch({
            type: "updateAggregateFilter",
            filter: change.target.value,
          })
        }
      >
        {[StaticBankAccountFilters.All, ...bankAccountAggregates].map(
          (aggregate) => (
            <option key={aggregate} value={aggregate}>
              {aggregate}
            </option>
          )
        )}
      </select>
    ),
    [bankAccountAggregates, store.accountFilter]
  );

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
              <div>{getAccountFilterSelect()}</div>
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
              <BalanceChart balanceData={balanceData} />
            </TabPanel>
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

function appReducer(state: State, action: Action): State {
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
