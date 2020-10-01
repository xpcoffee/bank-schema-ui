import * as d3 from "d3";
import React, { useMemo } from "react";
import { BalanceDataPoint } from "../types";
import { weekTimestampToJSDate, jsDateToWeekTimestamp } from "../time";
import { BankAccountBalances } from "../balance";
import { DateTime } from "luxon";

interface Props {
  balanceData: BankAccountBalances;
}

export const BalanceChart = ({ balanceData }: Props) => {
  const xScaleDomain = useMemo(() => minMaxDates(balanceData), [balanceData]);
  const yScaleDomain = useMemo(() => minMaxBalanceValues(balanceData), [
    balanceData,
  ]);

  const accounts = Object.keys(balanceData);
  if (accounts.length === 0) {
    return <div>No balance data to display. Please import data first.</div>;
  }

  const margin = { top: 20, right: 30, bottom: 100, left: 100 };

  const width = 1000;
  const height = 600;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const XScale = d3
    .scaleUtc()
    .domain(xScaleDomain)
    .range([margin.left, innerWidth]);

  const xTicks = XScale.ticks().map((date) =>
    XScale(date) > margin.left && XScale(date) < innerWidth ? (
      <g
        key={date.toISOString()}
        transform={`translate(${XScale(date)},${innerHeight + margin.top})`}
      >
        <text transform="rotate(45)">{jsDateToWeekTimestamp(date)}</text>
        <line x1="0" x2="0" y1="0" y2="5" transform="translate(0,-20)" />
      </g>
    ) : null
  );

  const YScale = d3
    .scaleLinear()
    .domain(yScaleDomain)
    .range([innerHeight, margin.bottom]);

  const yTicks = YScale.ticks().map((balance) =>
    YScale(balance) > 10 && YScale(balance) < innerHeight ? (
      <g
        key={balance}
        transform={`translate(${margin.left},${YScale(balance)})`}
      >
        <text textAnchor="end" x="-10" y="5">
          {balance}
        </text>
        <line
          strokeWidth="1"
          stroke="black"
          x1="0"
          x2="5"
          y1="0"
          y2="0"
          transform="translate(-5,0)"
        />
        <line
          strokeWidth="1"
          stroke="gray"
          className="gridline"
          x1="0"
          x2={innerWidth}
          y1="0"
          y2="0"
        />
      </g>
    ) : null
  );

  const line = d3
    .line<BalanceDataPoint>()
    .x((date) => {
      const jsDate = weekTimestampToJSDate(date.timeStamp);
      const scaleValue = XScale(jsDate);
      if (isNaN(scaleValue)) {
        console.log({ scaleValue, date, jsDate });
      }
      return scaleValue;
    })
    .y((balancePoint) => YScale(balancePoint.balance));

  const oldChart = (
    <svg width={width} height={height}>
      <line
        strokeWidth="1"
        stroke="black"
        className="axis"
        x1={margin.left}
        x2={margin.left + innerWidth}
        y1={innerHeight}
        y2={innerHeight}
      />
      <line
        strokeWidth="1"
        stroke="black"
        className="axis"
        x1={margin.left}
        x2={margin.left}
        y1={margin.bottom}
        y2={innerHeight}
      />
      {accounts.map((account) => (
        <path
          fill="none"
          strokeWidth="2"
          stroke="steelblue"
          d={line(balanceData[account]) || undefined}
        />
      ))}
      <g className="axis-labels">{xTicks}</g>
      <g className="axis-labels">{yTicks}</g>
    </svg>
  );

  return <div>{oldChart}</div>;
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
