import React from "react";
import { MonthlyAggregation } from "./types";

interface Props {
  aggregations: MonthlyAggregation[];
}

export const AggregationTable = ({ aggregations }: Props) => {
  if (aggregations.length === 0) {
    return <div>No aggregations to display. Please import data first.</div>;
  }

  return (
    <div>
      <table className="tableAuto">
        <thead>
          <tr>
            <th className="border px-4 text-left">Month</th>
            <th className="border px-4 text-left">Bank/Account</th>
            <th className="border px-4 text-left">Income (ZAR)</th>
            <th className="border px-4 text-left">Expenditures (ZAR)</th>
          </tr>
        </thead>
        <tbody>
          {aggregations.map((aggregation, index) => {
            const shadeClass = index % 2 ? " bg-gray-100" : "";

            return (
              <tr key={aggregation.yearMonth + aggregation.bankAccount}>
                <td className={"border px-4" + shadeClass}>
                  {aggregation.yearMonth}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {aggregation.bankAccount}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {aggregation.incomeInZAR.toFixed(2)}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {aggregation.expensesInZAR.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
