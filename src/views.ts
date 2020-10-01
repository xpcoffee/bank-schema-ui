export const Views = [
  {
    id: "balance",
    label: () => "Balance",
  },
  {
    id: "aggregations",
    label: () => "Aggregations",
  },
  {
    id: "transactions",
    label: (numberOfTransactions: number) =>
      `Transactions${numberOfTransactions ? `(${numberOfTransactions})` : ""}`,
  },
  {
    id: "eventLog",
    label: (newEvents: boolean) => "Event log" + (newEvents ? " 🛈" : ""),
  },
] as const;
