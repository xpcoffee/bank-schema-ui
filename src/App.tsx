import React, { useCallback, useState } from "react";
import "./App.css";
import { Banks, InputFileTypes } from "bank-schema-parser";
import { useDropzone } from "react-dropzone";

function App() {
  const banks = Object.values(Banks);
  const fileTypes = Object.values(InputFileTypes);

  const [selectedBank, setSelectedBank] = useState(Banks.StandardBank);
  const [selectedFileType, setSelectedFileType] = useState(
    InputFileTypes.Default
  );
  const [selectedFile, setSelectedFile] = useState<File | undefined>();

  const bankSelect = (
    <label>
      Bank
      <select
        className="bg-gray-300 mx-4"
        value={selectedBank}
        onChange={(change) => setSelectedBank(change.target.value as Banks)}
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
        value={selectedFileType}
        onChange={(change) =>
          setSelectedFileType(change.target.value as InputFileTypes)
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

  const readFile = useCallback(() => {
    if (!selectedFile) {
      console.error("No file selected. Please select a file first.");
      return;
    }

    const reader = new FileReader();
    reader.onabort = () => console.log("file reading was aborted");
    reader.onerror = () => console.log("file reading has failed");
    reader.onload = () => {
      // Do whatever you want with the file contents
      const binaryStr = reader.result;
      console.log(binaryStr);
    };
    reader.readAsArrayBuffer(selectedFile);
  }, [selectedFile]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length !== 1) {
      console.log("Please only select a single file.");
    }

    setSelectedFile(acceptedFiles[0]);
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

  const toolBar = (
    <div className="flex p-4 bg-gray-100" style={{ minWidth: "400px" }}>
      <div>
        <h2 className="text-2xl">Import data</h2>
        <form
          className="flex flex-col"
          style={{ height: "100%" }}
          onSubmit={(e) => {
            e.preventDefault();
            readFile();
          }}
        >
          {bankSelect}
          {inputFileTypeSelect}
          {dropZone}
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
          Display stuff
        </div>
        {toolBar}
      </div>
    </div>
  );
}

export default App;
