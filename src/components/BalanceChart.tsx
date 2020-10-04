import * as d3 from "d3";
import React, { useMemo, useRef, useState } from "react";
import { BalanceDataPoint } from "../types";
import { weekTimestampToJSDate, jsDateToWeekTimestamp } from "../time";
import { BankAccountBalances } from "../balance";
import { DateTime } from "luxon";
import { StaticBankAccounts } from "../accounts";

interface Props {
  balanceData: BankAccountBalances;
  onlyTotal?: boolean; // only show Total
}

export const BalanceChart = ({ balanceData, onlyTotal = false }: Props) => {
  const xScaleDomain = useMemo(() => minMaxDates(balanceData), [balanceData]);
  const yScaleDomain = useMemo(() => minMaxBalanceValues(balanceData), [
    balanceData,
  ]);

  const accounts = Object.keys(balanceData);
  if (accounts.length === 0) {
    return <div>No balance data to display. Please import data first.</div>;
  }

  const margin = { top: 20, right: 300, bottom: 100, left: 100 };

  const width = 1200;
  const height = 600;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scales transform x and y data points to their equivalent places on the graph canvas
  const xScale = d3
    .scaleUtc()
    .domain(xScaleDomain)
    .range([margin.left, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(yScaleDomain)
    .range([innerHeight, margin.bottom]);

  // Ticks are periodic lines (both gridlines and the small notches on the axes)
  const xTicks = xScale.ticks().map((date) =>
    xScale(date) > margin.left && xScale(date) < innerWidth ? (
      <g
        key={date.toISOString()}
        transform={`translate(${xScale(date)},${innerHeight + margin.top})`}
      >
        <text fill="#858585" transform="rotate(45)">
          {jsDateToWeekTimestamp(date)}
        </text>
        <line x1="0" x2="0" y1="0" y2="5" transform="translate(0,-20)" />
      </g>
    ) : null
  );

  const yTicks = yScale.ticks().map((balance) =>
    yScale(balance) > 10 && yScale(balance) < innerHeight ? (
      <g
        key={balance}
        transform={`translate(${margin.left},${yScale(balance)})`}
      >
        <text textAnchor="end" x="-10" y="5" fill="#858585">
          {balance / 1000}k
        </text>
        <line
          strokeWidth="1"
          stroke="#A9A9A9"
          x1="0"
          x2="5"
          y1="0"
          y2="0"
          transform="translate(-5,0)"
        />
        <line
          strokeWidth="1"
          stroke="#A9A9A9"
          className="gridline"
          x1="0"
          x2={innerWidth}
          y1="0"
          y2="0"
        />
      </g>
    ) : null
  );

  // Creates a path for the actual chart line given chart data
  const line = d3
    .line<BalanceDataPoint>()
    .x((date) => {
      const jsDate = weekTimestampToJSDate(date.timeStamp);
      const scaleValue = xScale(jsDate);
      return scaleValue;
    })
    .y((balancePoint) => yScale(balancePoint.balance));

  var accountColorPicker = d3
    .scaleOrdinal<string>()
    .domain(accounts)
    .range([
      "steelblue",
      "green",
      "red",
      "yellow",
      "black",
      "grey",
      "darkgreen",
      "pink",
      "brown",
      "slateblue",
      "grey1",
      "orange",
    ]);

  function Tooltips({ data }: { data: BalanceDataPoint[][] }) {
    const displayRef = useRef("none");
    const [datapointIndex, setDatapointIndex] = useState(0);

    // use the first account's data to set up mouse listeners
    // the other accounts should have data sets that are the same size
    let index = 0;
    const mouseListeners = d3.pairs(data[0], (a, b) => {
      const listenerIndex = index;
      index++;
      const listener = (
        <rect
          key={a.timeStamp + "-" + b.timeStamp}
          x={xScale(weekTimestampToJSDate(a.timeStamp))}
          height={height}
          width={
            xScale(weekTimestampToJSDate(b.timeStamp)) -
            xScale(weekTimestampToJSDate(a.timeStamp))
          }
          onMouseOut={() => (displayRef.current = "none")}
          onMouseOver={() => {
            displayRef.current = "block";
            setDatapointIndex(listenerIndex);
          }}
        ></rect>
      );
      return listener;
    });

    const circles = data.map((accountData) => {
      const datapoint = accountData[datapointIndex];
      const transform = `translate(${xScale(
        weekTimestampToJSDate(datapoint.timeStamp)
      )},${yScale(datapoint.balance)})`;
      const color = accountColorPicker(datapoint.bankAccount);

      return (
        <g
          key={`tooltip-${datapoint.bankAccount}`}
          pointerEvents="none"
          display={displayRef.current}
          transform={transform}
        >
          <circle r="2.5" fill={color}></circle>
        </g>
      );
    });

    const tooltipData = data.reduce<BalanceDataPoint[]>(
      (texts, accountData) => {
        texts.push(accountData[datapointIndex]);
        return texts;
      },
      []
    );
    return (
      <>
        {mouseListeners}
        {circles}
        {tooltipData.map((datapoint, index) => {
          const account = datapoint.bankAccount;
          const color = accountColorPicker(account);
          return (
            <g
              key={`tooltip-text-${account}`}
              transform={`translate(${innerWidth + margin.left}, ${
                margin.top
              })`}
            >
              <text fill={color} transform={`translate(0,${index * 20})`}>
                {account}: {datapoint.balance}
              </text>
            </g>
          );
        })}
      </>
    );
  }

  return (
    <div id="chart">
      <svg width={width} height={height}>
        <line
          strokeWidth="1"
          stroke="#858585"
          className="axis"
          x1={margin.left}
          x2={margin.left + innerWidth}
          y1={innerHeight}
          y2={innerHeight}
        />
        <line
          strokeWidth="1"
          stroke="#858585"
          className="axis"
          x1={margin.left}
          x2={margin.left}
          y1={margin.bottom}
          y2={innerHeight}
        />
        <g className="axis-labels">{xTicks}</g>
        <g className="axis-labels">{yTicks}</g>
        {accounts.map((account) => {
          if (onlyTotal && account !== StaticBankAccounts.Total) {
            return undefined;
          }

          return (
            <path
              key={`chart-${account}`}
              fill="none"
              strokeWidth="2"
              stroke={accountColorPicker(account)}
              d={line(balanceData[account]) || undefined}
            />
          );
        })}
        <g fill="none" pointerEvents="all">
          <Tooltips data={Object.values(balanceData)} />
        </g>
      </svg>
    </div>
  );
};

function minMaxDates(balanceData: BankAccountBalances): [Date, Date] {
  const accounts = Object.keys(balanceData);
  if (accounts.length === 0) {
    const now = DateTime.utc();
    return [now.toJSDate(), now.plus({ days: 1 }).toJSDate()];
  }
  const firstValue = balanceData[accounts[0]][0];

  let minTimestamp = firstValue.timeStamp;
  let maxTimestamp = firstValue.timeStamp;

  accounts.forEach((account) => {
    balanceData[account].forEach((point) => {
      if (point.timeStamp > maxTimestamp) {
        maxTimestamp = point.timeStamp;
      }

      if (point.timeStamp < minTimestamp) {
        minTimestamp = point.timeStamp;
      }
    });
  });

  return [
    weekTimestampToJSDate(minTimestamp),
    weekTimestampToJSDate(maxTimestamp),
  ];
}

function minMaxBalanceValues(
  balanceData: BankAccountBalances
): [number, number] {
  const accounts = Object.keys(balanceData);
  const yAxisLowerBound = Math.min(
    ...accounts.map(
      (account) => d3.min(balanceData[account], (d) => d.balance || 0) as number
    ),
    0
  );

  const yAxisUpperBound = Math.max(
    ...accounts.map(
      (account) => d3.max(balanceData[account], (d) => d.balance || 0) as number
    )
  );

  return [yAxisLowerBound, yAxisUpperBound];
}
