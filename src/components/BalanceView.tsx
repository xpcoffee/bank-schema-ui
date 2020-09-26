import * as d3 from "d3";
import React, { useMemo } from "react";
import { BalancePoint } from "../types";
import { weekTimestampToJSDate, jsDateToWeekTimestamp } from "../time";

interface Props {
  balanceData: BalancePoint[];
}

function minMaxDates(balanceData: BalancePoint[]): [Date, Date] {
  if (balanceData.length === 0) {
    return [new Date(), new Date()];
  }
  let minTimestamp = balanceData[0].timeStamp;
  let maxTimestamp = balanceData[0].timeStamp;

  balanceData.forEach((point) => {
    if (point.timeStamp > maxTimestamp) {
      maxTimestamp = point.timeStamp;
    }

    if (point.timeStamp < minTimestamp) {
      minTimestamp = point.timeStamp;
    }
  });

  return [
    weekTimestampToJSDate(minTimestamp),
    weekTimestampToJSDate(maxTimestamp),
  ];
}

export const BalanceView = ({ balanceData }: Props) => {
  const xScaleDomain = useMemo(() => minMaxDates(balanceData), [balanceData]);
  const yScaleDomain = useMemo(() => {
    const yAxisLowerBound = Math.min(
      d3.min(balanceData, (d) => d.balance || 0) as number,
      0
    );

    const yAxisUpperBound = d3.max(
      balanceData,
      (d) => d.balance || 0
    ) as number;

    return [yAxisLowerBound, yAxisUpperBound];
  }, [balanceData]);

  if (balanceData.length === 0) {
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
    .line<BalancePoint>()
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
      <path
        fill="none"
        strokeWidth="2"
        stroke="steelblue"
        d={line(balanceData) || undefined}
      />
      <g className="axis-labels">{xTicks}</g>
      <g className="axis-labels">{yTicks}</g>
    </svg>
  );

  return <div>{oldChart}</div>;
};
