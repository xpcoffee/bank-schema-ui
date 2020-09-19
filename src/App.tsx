import React, { useCallback, useMemo, useReducer } from "react";
import "./App.css";
import { Transaction } from "@xpcoffee/bank-schema-parser";
import { InfoLogEvent } from "./infoLog";
import { Action } from "./actions";
import { Toolbar } from "./Toolbar";
import { getCurrentIsoTimestamp, getYearMonthFromTimeStamp } from "./time";
import { KeyedFile, toKeyedFile } from "./file";

interface DenormalizedTransaction extends Transaction {
  bankAccount: string;
}

type TransactionMap = Record<string, DenormalizedTransaction>;

enum StaticBankAccountAggregateFilters {
  All = "All",
}

type State = {
  transactions: TransactionMap;
  eventLog: InfoLogEvent[];
  selectedFiles: KeyedFile[] | undefined;
  aggregateFilter: string;
};

const INITIAL_STATE: State = {
  transactions: {},
  aggregateFilter: StaticBankAccountAggregateFilters.All,
  eventLog: [],
  selectedFiles: undefined,
};

function App() {
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

  function reducer(state: State, action: Action): State {
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
          selectedFiles: action.files.map((file) => toKeyedFile(file)),
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
    }
  }

  const [store, dispatch] = useReducer(reducer, INITIAL_STATE);

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

  const aggregationTable = (
    <div>
      <table className="tableAuto">
        <thead>
          <tr>
            <th className="border px-4 text-left">Month</th>
            <th className="border px-4 text-left">Bank/Account</th>
            <th className="border px-4 text-left">Income (ZAR)</th>
            <th className="border px-4 text-left">Expenditures (ZAR)</th>
          </tr>
          <tr>
            <th className="border px-4 text-center">-</th>
            <th className="border px-4 text-left">
              {getAggregateFilterSelect()}
            </th>
            <th className="border px-4 text-center">-</th>
            <th className="border px-4 text-center">-</th>
          </tr>
        </thead>
        <tbody>
          {filteredAggregations.map((aggregation, index) => {
            const shadeClass = index % 2 ? " bg-gray-100" : "";

            return (
              <tr key={aggregation.yearMonth + aggregation.bankAccount}>
                <td className={"border px-4" + shadeClass}>
                  {aggregation.yearMonth}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {aggregation.bankAccount}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {aggregation.incomeInZAR.toFixed(2)}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {aggregation.expensesInZAR.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
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

  const transactionTable = (
    <div>
      <table className="tableAuto">
        <thead>
          <tr>
            <th className="border px-4 text-left">Timestamp</th>
            <th className="border px-4 text-left">Bank account</th>
            <th className="border px-4 text-left">Description</th>
            <th className="border px-4 text-left">Amount (ZAR)</th>
            <th className="border px-4 text-left">Account balance (ZAR)</th>
          </tr>
        </thead>
        <tbody>
          {filteredTransactions.map((transaction, index) => {
            const shadeClass = index % 2 ? " bg-gray-100" : "";

            return (
              <tr key={transaction.hash}>
                <td className={"border px-4" + shadeClass}>
                  {transaction.timeStamp}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.bankAccount}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.description}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {transaction.amountInZAR.toFixed(2)}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {transaction.balance.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const eventLog = (
    <div style={{ overflowY: "auto", height: "200px" }}>
      <table className="tableAuto">
        <tbody>
          {store.eventLog.map((event, index) => {
            const shadeClass = index % 2 ? " bg-gray-100" : "";

            return (
              <tr key={event.isoTimestamp + "-" + event.message}>
                <td className={"px-4" + shadeClass}>{event.isoTimestamp}</td>
                <td className={"px-4" + shadeClass}>{event.source}</td>
                <td className={"px-4" + shadeClass}>{event.message}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="App flex items-stretch flex-col">
      <header className="bg-gray-700 text-gray-300 p-2">
        <h1 className="text-4xl">bank-schema UI</h1>
      </header>
      <div className="flex flex-1 justify-between">
        <div className="p-2 flex flex-1 flex-col justify-between">
          <div>
            <h2 className="text-2xl">Aggregation</h2>
            {aggregationTable}
          </div>
          <div>
            <h2 className="text-2xl">Transactions ({transactions.length})</h2>
            {transactionTable}
          </div>
          <div>
            <h2 className="text-2xl">Event log</h2>
            {eventLog}
          </div>
        </div>
        <Toolbar selectedFiles={store.selectedFiles} dispatch={dispatch} />
      </div>
    </div>
  );
}

export default App;

type MonthlyAggregation = {
  yearMonth: string;
  bankAccount: string;
  incomeInZAR: number;
  expensesInZAR: number;
};

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
