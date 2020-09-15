import React, { useMemo, useReducer } from "react";
import "./App.css";
import { Banks, InputFileTypes, Transaction } from "bank-schema-parser";
import { InfoLogEvent } from "./infoLog";
import { Action } from "./actions";
import { Toolbar } from "./Toolbar";
import { getCurrentIsoTimestamp } from "./time";

function App() {
  interface NormalizedTransaction extends Transaction {
    bank: string;
    account: string;
  }
  type TransactionMap = Record<string, NormalizedTransaction>;
  type State = {
    transactions: TransactionMap;
    eventLog: InfoLogEvent[];
    inputFileBank: Banks;
    inputFileType: InputFileTypes;
    selectedFiles: File[] | undefined;
  };
  const initialState: State = {
    transactions: {},
    eventLog: [],
    inputFileBank: Banks.StandardBank,
    inputFileType: InputFileTypes.Default,
    selectedFiles: undefined,
  };

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
          state.transactions[transaction.hash] = {
            ...transaction,
            bank: action.bank,
            account: action.account,
          };
          return state;
        }, newState);

        newState.eventLog = [
          ...action.eventLogs,
          ...nullParseLog,
          ...newState.eventLog,
        ];
        return newState;

      case "selectBank":
        return { ...state, inputFileBank: action.bank };

      case "selectFileType":
        return { ...state, inputFileType: action.inputFileType };

      case "selectFiles":
        return { ...state, selectedFiles: action.files };

      case "clearSelectedFiles":
        return { ...state, selectedFiles: undefined };

      case "removeSelectedFile":
        if (!state.selectedFiles) {
          return state;
        }
        return {
          ...state,
          selectedFiles: state.selectedFiles.filter(
            (file) => file !== action.file
          ),
        };
    }
  }

  const [store, dispatch] = useReducer(reducer, initialState);

  const transactions = useMemo<NormalizedTransaction[]>(() => {
    const thing = Object.values(store.transactions);

    thing.sort((a, b) => (b.timeStamp > a.timeStamp ? 1 : -1));

    return thing;
  }, [store.transactions]);

  const transactionTable = (
    <div>
      <table className="tableAuto">
        <thead>
          <tr>
            <th className="border px-4 text-left">Timestamp</th>
            <th className="border px-4 text-left">Account</th>
            <th className="border px-4 text-left">Bank</th>
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
                  {transaction.account}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.bank}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.description}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.amountInZAR}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.balance}
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
            <h2 className="text-2xl">Transactions ({transactions.length})</h2>
            {transactionTable}
          </div>
          <div>
            <h2 className="text-2xl">Event log</h2>
            {eventLog}
          </div>
        </div>
        <Toolbar
          inputFileBank={store.inputFileBank}
          inputFileType={store.inputFileType}
          selectedFiles={store.selectedFiles}
          dispatch={dispatch}
        />
      </div>
    </div>
  );
}

export default App;
