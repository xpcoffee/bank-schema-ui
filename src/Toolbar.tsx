import { Banks, InputFileTypes, parseFromString } from "bank-schema-parser";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Action } from "./actions";
import { InfoLogEvent } from "./infoLog";
import { getCurrentIsoTimestamp } from "./time";

type Props = {
  inputFileBank: Banks;
  inputFileType: InputFileTypes;
  selectedFiles: File[] | undefined;
  dispatch: React.Dispatch<Action>;
};

export const Toolbar = ({
  inputFileBank,
  inputFileType,
  selectedFiles,
  dispatch,
}: Props) => {
  const banks = Object.values(Banks);
  const fileTypes = Object.values(InputFileTypes);

  const parsingErrorsToInfoLogEvent = useCallback(
    (source: string, errors: string[]): InfoLogEvent[] => {
      const isoTimestamp = getCurrentIsoTimestamp();
      return errors.map((message) => {
        return { isoTimestamp, source, message };
      });
    },
    []
  );

  const bankSelect = (
    <label>
      Bank
      <select
        className="bg-gray-300 mx-4"
        value={inputFileBank}
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
        value={inputFileType}
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

  const processFileContents = useCallback(
    (fileName: string, contents: string) => {
      parseFromString({
        bank: inputFileBank,
        type: inputFileType,
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
    [inputFileBank, inputFileType, dispatch, parsingErrorsToInfoLogEvent]
  );

  const readFiles = useCallback(() => {
    if (!selectedFiles) {
      console.error("No file selected. Please select a file first.");
      return;
    }

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () =>
        processFileContents(file.name, reader.result as string);
      reader.readAsText(file);
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
      <h3>{selectedFiles?.length ? "Selected files" : "No files selected"}</h3>
      <ul>{selectedFiles?.map(getFileRow)}</ul>
    </div>
  );

  return (
    <div
      className="flex flex-col p-4 bg-gray-100"
      style={{ minWidth: "450px" }}
    >
      <h2 className="text-2xl">Import data</h2>
      <form
        className="flex flex-col"
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
  );
};
