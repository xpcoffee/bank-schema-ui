import React, { useCallback, useMemo, useReducer } from "react";
import { DenormalizedTransaction } from "./types";

interface Props {
  transactions: DenormalizedTransaction[];
}

export const TransactionTable = ({ transactions }: Props) => {
  return (
    <div>
      <table className="tableAuto">
        <thead>
          <tr>
            <th className="border px-4 text-left">Timestamp</th>
            <th className="border px-4 text-left">Bank account</th>
            <th className="border px-4 text-left">Description</th>
            <th className="border px-4 text-left">Amount (ZAR)</th>
            <th className="border px-4 text-left">Account balance (ZAR)</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction, index) => {
            const shadeClass = index % 2 ? " bg-gray-100" : "";

            return (
              <tr key={transaction.hash}>
                <td className={"border px-4" + shadeClass}>
                  {transaction.timeStamp}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.bankAccount}
                </td>
                <td className={"border px-4" + shadeClass}>
                  {transaction.description}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {transaction.amountInZAR.toFixed(2)}
                </td>
                <td className={"border px-4 text-right" + shadeClass}>
                  {transaction.balance.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
