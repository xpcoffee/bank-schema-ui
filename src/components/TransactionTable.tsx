import React, { useEffect, useMemo, useState } from "react";
import { DenormalizedTransaction } from "../types";

interface Props {
  transactions: DenormalizedTransaction[];
}

const PAGE_SIZE = 100;

export const TransactionTable = ({ transactions }: Props) => {
  const [page, setPage] = useState(1);
  const lastPage = useMemo(
    () => Math.floor(transactions.length / PAGE_SIZE) + 1,
    [transactions]
  );

  useEffect(() => {
    if (page > lastPage) {
      setPage(lastPage);
    }
  }, [transactions, page, lastPage]);

  const pageOfTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, page]);

  if (transactions.length === 0) {
    return <div>No transactions to display. Please import data first.</div>;
  }

  return (
    <div>
      <div>
        <div>
          Page {page} of {lastPage}
        </div>
        <button
          className="px-2 my-2 bg-gray-300"
          onClick={() => setPage((page) => (page > 1 ? page - 1 : 1))}
        >
          Previous page
        </button>
        <button
          className="px-2 my-2 mx-2 bg-gray-300"
          onClick={() =>
            setPage((page) => (page < lastPage ? page + 1 : lastPage))
          }
        >
          Next Page
        </button>
      </div>
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
          {pageOfTransactions.map((transaction, index) => {
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
                  {transaction.amount.toFixed(2)}
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
