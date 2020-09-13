# bank-schema-ui

A UI for working with [bank-schema](https://github.com/xpcoffee/bank-schema) files and with files supported by [bank-schema-parser](https://github.com/xpcoffee/bank-schema-parser).

**`IMPORTANT`** Still under active development! Don't start using this yet!

## Work in progress

- hook into `bank-schema-parser` to load and display data from supported bank files
- add ability to load in vanilla `bank-schema` JSON files
- graph balance for loaded data over time
- graph monthly income/expendetures for loaded data over time
- add ability to flag duplicate loaded items (e.g. if an item gets imported twice)
- add ability to remove duplicate loaded items from loaded data (e.g. if an item gets imported twice)
- add ability to define categories in the UI (regex on an attribute)
- add ability to graph monthly aggregate for the categories
- add ability to save categories (browser storage? config file?)

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br />
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.<br />
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br />
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br />
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
