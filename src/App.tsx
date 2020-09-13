import React, { useState } from "react";
import "./App.css";
import { Banks, InputFileTypes } from "bank-schema-parser";

function App() {
  const banks = Object.values(Banks);
  const fileTypes = Object.values(InputFileTypes);

  const [selectedBank, setSelectedBank] = useState(Banks.StandardBank);
  const [selectedFileType, setSelectedFileType] = useState(
    InputFileTypes.Default
  );

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

  const toolBar = (
    <div className="container flex p-4 bg-gray-100">
      <div>
        <h2 className="text-2xl">Import data</h2>
        <form className="flex flex-col">
          {bankSelect}
          {inputFileTypeSelect}
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
      <header className="bg-gray-700 text-gray-300 text-center">
        <h1 className="text-4xl">bank-schema UI</h1>
      </header>
      <div className="flex" style={{ height: "100%" }}>
        <div className="container flex">Display stuff</div>
        {toolBar}
      </div>
    </div>
  );
}

export default App;
