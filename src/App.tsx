import React, { useCallback, useReducer } from "react";
import "./App.css";
import {
  Banks,
  InputFileTypes,
  parseFromString,
  Transaction,
} from "bank-schema-parser";
import { useDropzone } from "react-dropzone";

function App() {
  const banks = Object.values(Banks);
  const fileTypes = Object.values(InputFileTypes);

  type InfoLogEvent = { isoTimestamp: string; source: string; message: string };
  type Action =
    | {
        type: "add";
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
  type TransactionMap = Record<string, Transaction>;
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
        const newState = { ...state };

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
          state.transactions[transaction.hash] = transaction;
          return state;
        }, newState);

        newState.eventLog = [
          ...newState.eventLog,
          ...action.eventLogs,
          ...nullParseLog,
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

  const [state, dispatch] = useReducer(reducer, initialState);

  const bankSelect = (
    <label>
      Bank
      <select
        className="bg-gray-300 mx-4"
        value={state.inputFileBank}
        onChange={(change) =>
          dispatch({ type: "selectBank", bank: change.target.value as Banks })
        }
      >
        {banks.map((bank) => (
          <option key={bank} value={bank}>
            {bank}
          </option>
        ))}
      </select>
    </label>
  );

  const inputFileTypeSelect = (
    <label>
      Input file type
      <select
        className="bg-gray-300 mx-4"
        value={state.inputFileType}
        onChange={(change) =>
          dispatch({
            type: "selectFileType",
            inputFileType: change.target.value as InputFileTypes,
          })
        }
      >
        {fileTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </label>
  );

  function getCurrentIsoTimestamp() {
    return new Date(Date.now()).toISOString();
  }

  const parsingErrorsToInfoLogEvent = useCallback(
    (source: string, errors: string[]): InfoLogEvent[] => {
      const isoTimestamp = getCurrentIsoTimestamp();
      return errors.map((message) => {
        return { isoTimestamp, source, message };
      });
    },
    []
  );

  const processFileContents = useCallback(
    (fileName: string, contents: string) => {
      parseFromString({
        bank: state.inputFileBank,
        type: state.inputFileType,
        inputString: contents,
        deduplicateTransactions: true,
      }).then((statement) => {
        dispatch({
          type: "add",
          transactions: statement.transactions,
          source: fileName,
          eventLogs: parsingErrorsToInfoLogEvent(
            fileName,
            statement.parsingErrors
          ),
        });
      });
    },
    [parsingErrorsToInfoLogEvent, state.inputFileBank, state.inputFileType]
  );

  const readFiles = useCallback(() => {
    if (!state.selectedFiles) {
      console.error("No file selected. Please select a file first.");
      return;
    }

    state.selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () =>
        processFileContents(file.name, reader.result as string);
      reader.readAsText(file);
    });
  }, [processFileContents, state.selectedFiles]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    dispatch({ type: "selectFiles", files: acceptedFiles });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const dropZone = (
    <div
      {...getRootProps()}
      className="flex items-center p-5 bg-gray-300 mt-2"
      style={{ height: "50%" }}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
    </div>
  );

  function getFileRow(file: File) {
    return (
      <li key={file.lastModified + " " + file.name}>
        {file.name}{" "}
        <button onClick={() => dispatch({ type: "removeSelectedFile", file })}>
          Remove
        </button>
      </li>
    );
  }

  const selectedFileList = (
    <div>
      <h3>
        {state.selectedFiles?.length ? "Selected files" : "No files selected"}
      </h3>
      <ul>{state.selectedFiles?.map(getFileRow)}</ul>
    </div>
  );

  const toolBar = (
    <div className="flex p-4 bg-gray-100" style={{ minWidth: "400px" }}>
      <div>
        <h2 className="text-2xl">Import data</h2>
        <form
          className="flex flex-col"
          style={{ height: "100%" }}
          onSubmit={(e) => {
            e.preventDefault();
            readFiles();
          }}
        >
          {bankSelect}
          {inputFileTypeSelect}
          {dropZone}
          {selectedFileList}
          <div className="flex mt-2">
            <button type="submit" className="bg-blue-200 p-1 flex-1">
              Import
            </button>
            <div className="flex-1"></div>
            <div className="flex-1"></div>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="App">
      <header className="bg-gray-700 text-gray-300 p-2">
        <h1 className="text-4xl">bank-schema UI</h1>
      </header>
      <div className="flex justify-between" style={{ height: "100%" }}>
        <div className="flex-grow p-2" style={{ width: "100%" }}>
          <h2 className="text-2xl">Transactions</h2>
          <pre>{JSON.stringify(Object.values(state.transactions))}</pre>
          <h2 className="text-2xl">Event log</h2>
          <pre>{JSON.stringify(state.eventLog)}</pre>
        </div>
        {toolBar}
      </div>
    </div>
  );
}

export default App;
