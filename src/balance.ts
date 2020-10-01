import { generateYearWeeksForPeriod, getYearWeek } from "./time";
import { DenormalizedTransaction, BalancePoint } from "./types";

export function getBankBalances(
  transactions: DenormalizedTransaction[],
  getSample: SamplingFn,
  getGroupKey: GroupKeyFn
): BalancePoint[] {
  if (transactions.length === 0) {
    return [];
  }

  // The beginning and end of the entire balance period
  let startTimeStamp = transactions[0].timeStamp;
  let endTimeStamp = transactions[0].timeStamp;

  // group transactions so that the data can be sampled
  const groups = transactions.reduce<Record<string, DenormalizedTransaction[]>>(
    (groupedTransactions, transaction) => {
      const key = getGroupKey(transaction);
      if (!groupedTransactions[key]) {
        groupedTransactions[key] = [];
      }
      groupedTransactions[key].push(transaction);

      if (transaction.timeStamp > endTimeStamp) {
        endTimeStamp = transaction.timeStamp;
      }

      if (transaction.timeStamp < startTimeStamp) {
        startTimeStamp = transaction.timeStamp;
      }

      return groupedTransactions;
    },
    {}
  );

  // build a set of points for the balance by taking a sample for each group
  const balancePoints = Object.keys(groups).reduce<
    Record<string, BalancePoint[]>
  >((balancePoints, key) => {
    const group = groups[key];
    const sample = group.reduce<DenormalizedTransaction>(
      (previous, current) => {
        if (previous === undefined) {
          return current;
        }

        switch (getSample(previous, current).pick) {
          case "a":
            return previous;
          default:
            return current;
        }
      },
      group[0]
    );

    const account = sample.bankAccount;
    if (!balancePoints[account]) {
      balancePoints[account] = [];
    }

    balancePoints[account].push({
      timeStamp: sample.timeStamp,
      bankAccount: sample.bankAccount,
      balance: sample.balance,
    });

    return balancePoints;
  }, {});

  // sort the points by time
  Object.keys(balancePoints).forEach((key) => {
    const sortedPoints = balancePoints[key].sort((a, b) =>
      b.timeStamp < a.timeStamp ? 1 : -1
    );
    balancePoints[key] = sortedPoints;
  });

  // get iterators for each group
  const iterators = Object.keys(balancePoints).reduce<Record<string, number>>(
    (its, key) => {
      its[key] = 0;
      return its;
    },
    {}
  );

  // fill any gaps in the datapoints using the last previously known balance value
  const filledBalancePoints = generateYearWeeksForPeriod(
    startTimeStamp,
    endTimeStamp
  ).reduce<BalancePoint[]>((filledPoints, weekToFill) => {
    // fill this week's point for all groups
    Object.keys(balancePoints).forEach((bankAccount) => {
      const current = balancePoints[bankAccount][iterators[bankAccount]];
      let balance = 0; // default to a balance of 0 if we don't know what to do

      if (current && weekToFill === getYearWeek(current.timeStamp)) {
        // we have data for this timestamp
        balance = current.balance;
        iterators[bankAccount]++;
      } else if (iterators[bankAccount] > 0) {
        // this timestamp doesn't have a datapoint use last known datapoint
        const previous = balancePoints[bankAccount][iterators[bankAccount] - 1];
        balance = previous.balance;
      }

      filledPoints.push({
        timeStamp: weekToFill,
        balance,
        bankAccount,
      });
    });

    return filledPoints;
  }, []);

  return filledBalancePoints;
}

/**
 * Return the grouping key for a given transaction.
 */
export type GroupKeyFn = (transaction: DenormalizedTransaction) => string;

/**
 * Generate a group key based on year-week
 */
export const groupByYearWeek: GroupKeyFn = (transaction) => {
  return transaction.bankAccount + "-" + getYearWeek(transaction.timeStamp);
};

/**
 * Given two transactions in the same group, which transaction should be picked as the sample?
 */
export type SamplingFn = (
  a: DenormalizedTransaction,
  b: DenormalizedTransaction
) => { pick: "a" } | { pick: "b" };

/**
 * Sample the datapoint with lowest balance
 */
export const sampleLowestBalance: SamplingFn = (a, b) => {
  return { pick: a.balance < b.balance ? "a" : "b" };
};
