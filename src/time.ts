export function getCurrentIsoTimestamp() {
  return new Date(Date.now()).toISOString();
}

export function getYearMonthFromTimeStamp(timeStamp: string) {
  const [year, month] = timeStamp.split("-");
  return year + "-" + month;
}
