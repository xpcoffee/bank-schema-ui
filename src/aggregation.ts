import { StaticBankAccounts } from "./accounts";
import { getYearMonthFromTimeStamp } from "./time";
import { DenormalizedTransaction, MonthlyAggregation } from "./types";

/**
 * Aggregates and sorts transactions
 * currently only by month
 * Heavy operation; may want to move this to a service worker in future
 */
export function aggregateTransactions(transactions: DenormalizedTransaction[]) {
  const { aggregationMap, bankAccountAggregates } = aggregateTransactionsByKey(
    transactions
  );
  return {
    monthlyAggregations: Object.values(aggregationMap).sort((a, b) =>
      b.yearMonth > a.yearMonth ? 1 : -1
    ),
    bankAccountAggregates,
  };
}

function aggregateTransactionsByKey(
  transactions: DenormalizedTransaction[]
): KeyedAggregationResult {
  return transactions.reduce<KeyedAggregationResult>(
    (aggregationResult, transaction) => {
      const accountKey = getAccountKey(transaction);
      const totalKey = getTotalKey(transaction);
      const keyedAggregations = aggregationResult.aggregationMap;

      const accountAggregation: MonthlyAggregation = keyedAggregations[
        accountKey
      ] || {
        yearMonth: getYearMonthFromTimeStamp(transaction.timeStamp),
        bankAccount: transaction.bankAccount,
        incomeInZAR: 0,
        expensesInZAR: 0,
      };

      const totalAggregation: MonthlyAggregation = keyedAggregations[
        totalKey
      ] || {
        yearMonth: getYearMonthFromTimeStamp(transaction.timeStamp),
        bankAccount: StaticBankAccounts.Total,
        incomeInZAR: 0,
        expensesInZAR: 0,
      };

      if (transaction.amount > 0) {
        accountAggregation.incomeInZAR += transaction.amount;
        totalAggregation.incomeInZAR += transaction.amount;
      } else {
        accountAggregation.expensesInZAR += transaction.amount;
        totalAggregation.expensesInZAR += transaction.amount;
      }

      keyedAggregations[accountKey] = accountAggregation;
      keyedAggregations[totalKey] = totalAggregation;

      const bankAccountAggregates = aggregationResult.bankAccountAggregates;
      if (!bankAccountAggregates.includes(transaction.bankAccount)) {
        bankAccountAggregates.push(transaction.bankAccount);
      }
      return { aggregationMap: keyedAggregations, bankAccountAggregates };
    },
    {
      aggregationMap: {},
      bankAccountAggregates: [StaticBankAccounts.Total],
    }
  );
}

function getAccountKey(transaction: DenormalizedTransaction) {
  return `${getYearMonthFromTimeStamp(transaction.timeStamp)}-${
    transaction.bankAccount
  }`;
}

function getTotalKey(transaction: DenormalizedTransaction) {
  return `${getYearMonthFromTimeStamp(transaction.timeStamp)}-total`;
}

export type AggregationResult = {
  monthlyAggregations: MonthlyAggregation[];
  bankAccountAggregates: string[];
};
export type KeyedAggregationResult = {
  aggregationMap: Record<string, MonthlyAggregation>;
  bankAccountAggregates: string[]; // the identifiers for aggregations
};
