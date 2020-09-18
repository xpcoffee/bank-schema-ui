import React, { useMemo, useReducer } from "react";
import "./App.css";
import { Transaction } from "bank-schema-parser";
import { InfoLogEvent } from "./infoLog";
import { Action } from "./actions";
import { Toolbar } from "./Toolbar";
import { getCurrentIsoTimestamp, getYearMonthFromTimeStamp } from "./time";
import { KeyedFile, toKeyedFile } from "./file";

function App() {
  interface DenormalizedTransaction extends Transaction {
    bankAccount: string;
  }
  type TransactionMap = Record<string, DenormalizedTransaction>;
  type State = {
    transactions: TransactionMap;
    eventLog: InfoLogEvent[];
    selectedFiles: KeyedFile[] | undefined;
  };
  const initialState: State = {
    transactions: {},
    eventLog: [],
    selectedFiles: undefined,
  };

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
      case "reset":
        return initialState;
      case "add":
        const newState: State = {
          ...state,
          transactions: { ...state.transactions },
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
    }
  }

  const [store, dispatch] = useReducer(reducer, initialState);

  const transactions = useMemo<DenormalizedTransaction[]>(() => {
    const thing = Object.values(store.transactions);

    thing.sort((a, b) => (b.timeStamp > a.timeStamp ? 1 : -1));

    return thing;
  }, [store.transactions]);

  type MonthlyAggregation = {
    yearMonth: string;
    bankAccount: string;
    incomeInZAR: number;
    expensesInZAR: number;
  };

  const monthlyAggregations = useMemo<MonthlyAggregation[]>(() => {
    function getKey(transaction: DenormalizedTransaction) {
      return `${getYearMonthFromTimeStamp(transaction.timeStamp)}-${
        transaction.bankAccount
      }`;
    }

    const aggregationMap = transactions.reduce<
      Record<string, MonthlyAggregation>
    >((keyedAggregations, transaction) => {
      const key = getKey(transaction);

      const aggregation: MonthlyAggregation = keyedAggregations[key] || {
        yearMonth: getYearMonthFromTimeStamp(transaction.timeStamp),
        bankAccount: transaction.bankAccount,
        incomeInZAR: 0,
        expensesInZAR: 0,
      };

      if (transaction.amountInZAR > 0) {
        aggregation.incomeInZAR += transaction.amountInZAR;
      } else {
        aggregation.expensesInZAR += transaction.amountInZAR;
      }

      keyedAggregations[key] = aggregation;

      return keyedAggregations;
    }, {});

    return Object.values(aggregationMap).sort((a, b) =>
      b.yearMonth > a.yearMonth ? 1 : -1
    );
  }, [transactions]);

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
        </thead>
        <tbody>
          {monthlyAggregations.map((transaction, index) => {
            const shadeClass = index % 2 ? " bg-gray-100" : "";

            return (
              <tr key={transaction.yearMonth + transaction.bankAccount}>
                <td className={"border px-4" + shadeClass}>
                  {transaction.yearMonth}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.bankAccount}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {transaction.incomeInZAR.toFixed(2)}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {transaction.expensesInZAR.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

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
          {transactions.map((transaction, index) => {
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
