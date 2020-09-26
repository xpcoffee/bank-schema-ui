import {
  parseFromString,
  fileTypes,
  FileType,
} from "@xpcoffee/bank-schema-parser";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Action } from "./actions";
import { getFileKey, KeyedFile } from "./file";
import { getCurrentIsoTimestamp } from "./time";
import { InfoLogEvent } from "./types";

type Props = {
  selectedFiles: KeyedFile[] | undefined;
  dispatch: React.Dispatch<Action>;
};

export const Toolbar = ({ selectedFiles, dispatch }: Props) => {
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
    (fileName: string, fileType: FileType, contents: string) => {
      parseFromString({
        fileType,
        inputString: contents,
        deduplicateTransactions: true,
      }).then((statement) => {
        dispatch({
          type: "add",
          transactions: statement.transactions,
          bank: statement.bank,
          account: statement.account,
          source: fileName,
          eventLogs: parsingErrorsToInfoLogEvent(
            fileName,
            statement.parsingErrors
          ),
        });
      });
    },
    [dispatch, parsingErrorsToInfoLogEvent]
  );

  const readFiles = useCallback(() => {
    if (!selectedFiles) {
      console.error("No file selected. Please select a file first.");
      return;
    }

    selectedFiles.forEach((keyedFile) => {
      const reader = new FileReader();
      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () =>
        processFileContents(
          keyedFile.file.name,
          keyedFile.fileType,
          reader.result as string
        );
      reader.readAsText(keyedFile.file);
    });
  }, [processFileContents, selectedFiles]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      dispatch({ type: "selectFiles", files: acceptedFiles });
    },
    [dispatch]
  );

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

  function getFileTypeSelect(keyedFile: KeyedFile) {
    return (
      <label>
        Input file type
        <select
          className="bg-gray-300 mx-4"
          value={keyedFile.fileType}
          onChange={(change) =>
            dispatch({
              type: "updateFile",
              update: {
                key: getFileKey(keyedFile.file),
                fileType: change.target.value as FileType,
              },
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
  }

  function getFileRow(keyedFile: KeyedFile) {
    return (
      <li key={keyedFile.key}>
        <span className="mx-4">{keyedFile.file.name}</span>
        <span className="mx-4">{getFileTypeSelect(keyedFile)}</span>
        <button
          onClick={() =>
            dispatch({ type: "removeSelectedFile", key: keyedFile.key })
          }
        >
          Remove
        </button>
      </li>
    );
  }

  const selectedFileList = (
    <div>
      <h3>{selectedFiles?.length ? "Selected files" : "No files selected"}</h3>
      <ul>{selectedFiles?.map(getFileRow)}</ul>
    </div>
  );

  const onSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      readFiles();
      dispatch({ type: "clearSelectedFiles" });
    },
    [dispatch, readFiles]
  );

  const clearData = useCallback(() => {
    dispatch({ type: "clearData" });
  }, [dispatch]);

  return (
    <div
      className="flex flex-col p-4 bg-gray-100"
      style={{ minWidth: "450px" }}
    >
      <h2 className="text-2xl">Import data</h2>
      <form className="flex flex-col" onSubmit={onSubmit}>
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
      <h2 className="text-2xl">Clear data</h2>
      <div className="flex mt-2">
        <button onClick={clearData} className="bg-red-200 p-1 flex-1">
          Clear all data
        </button>
        <div className="flex-1"></div>
        <div className="flex-1"></div>
      </div>
    </div>
  );
};
