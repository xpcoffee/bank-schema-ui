import React, { useCallback, useMemo, useReducer, useState } from "react";
import "./App.css";
import { Toolbar } from "./components/Toolbar";
import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import { DenormalizedTransaction, MonthlyAggregation } from "./types";
import { TransactionTable } from "./components/TransactionTable";
import { AggregationTable } from "./components/AggregationTable";
import { EventLog } from "./components/EventLog";
import { BalanceChart } from "./components/BalanceChart";
import { AggregationResult, aggregateTransactions } from "./aggregation";
import { StaticBankAccounts } from "./accounts";
import {
  getBankBalances,
  sampleLowestBalance,
  groupByYearWeek,
} from "./balance";
import { appReducer, INITIAL_STATE } from "./store/reducers";
import { Views } from "./views";
import { AppErrorBoundary } from "./components/AppErrorBoundary";

function App() {
  const [store, dispatch] = useReducer(appReducer, INITIAL_STATE);

  // basically a state selector
  const bankAccounts = useMemo<string[]>(() => {
    const accountSet = Object.values(store.transactions).reduce<Set<string>>(
      (accountSet, transaction) => {
        accountSet.add(transaction.bankAccount);
        return accountSet;
      },
      new Set<string>()
    );

    return Array.from(accountSet);
  }, [store.transactions]);

  const transactions = useMemo<DenormalizedTransaction[]>(() => {
    const thing = Object.values(store.transactions);

    thing.sort((a, b) => (b.timeStamp > a.timeStamp ? 1 : -1));

    return thing;
  }, [store.transactions]);

  const filteredTransactions = useMemo<DenormalizedTransaction[]>(() => {
    const predicate = (aggregation: DenormalizedTransaction) => {
      if (
        StaticBankAccounts.All === store.accountFilter ||
        StaticBankAccounts.Total === store.accountFilter
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
  const { monthlyAggregations } = useMemo<AggregationResult>(
    () => aggregateTransactions(filteredTransactions),
    [filteredTransactions]
  );

  const filteredAggregations = useMemo<MonthlyAggregation[]>(() => {
    const predicate = (aggregation: MonthlyAggregation) => {
      if (StaticBankAccounts.All === store.accountFilter) {
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
        {[
          StaticBankAccounts.All,
          StaticBankAccounts.Total,
          ...bankAccounts,
        ].map((aggregate) => (
          <option key={aggregate} value={aggregate}>
            {aggregate}
          </option>
        ))}
      </select>
    ),
    [bankAccounts, store.accountFilter]
  );

  const BoomButton = () => {
    const [trigger, setTrigger] = useState(false);

    if (trigger) {
      throw new Error("BOOM");
    }

    return (
      <button
        onClick={() => {
          setTrigger(true);
        }}
      >
        BOOM
      </button>
    );
  };

  return (
    <div className="App flex items-stretch flex-col">
      <header className="bg-gray-700 p-2 flex items-center">
        <h1 className="text-2xl text-white">bank-schema</h1>
      </header>
      <AppErrorBoundary appState={store}>
        <BoomButton />
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
                {Views.map((view, index) => {
                  const isActive = store.viewIndex === index;
                  const pointer = isActive ? "" : " cursor-pointer";
                  const style = isActive ? " bg-white" : "";
                  const label = (function getLabel() {
                    switch (view.id) {
                      case "transactions":
                        return view.label(filteredTransactions.length);
                      case "eventLog":
                        return view.label(store.newEvents);
                      default:
                        return view.label();
                    }
                  })();
                  return (
                    <Tab key={index} className={"px-4 py-1" + pointer + style}>
                      <h2 className="text-xl">{label}</h2>
                    </Tab>
                  );
                })}
              </TabList>
              <TabPanel className="px-2">
                <BalanceChart
                  balanceData={balanceData}
                  onlyTotal={store.accountFilter === StaticBankAccounts.Total}
                />
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
      </AppErrorBoundary>
    </div>
  );
}

export default App;
