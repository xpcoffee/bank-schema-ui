import { DateTime } from "luxon";

export function getCurrentIsoTimestamp() {
  return new Date(Date.now()).toISOString();
}

export function getYearMonthFromTimeStamp(timeStamp: string) {
  const [year, month] = timeStamp.split("-");
  return year + "-" + month;
}

export function weekTimestampToJSDate(weekTimestamp: string): Date {
  return DateTime.fromISO(`${weekTimestamp}-1`) // add -1 to add the day of the week to make it ISO compatible https://en.wikipedia.org/wiki/ISO_week_date
    .toJSDate();
}

export function jsDateToWeekTimestamp(jsDate: Date): string {
  return `${jsDate.getUTCFullYear()}-W${DateTime.fromJSDate(jsDate)
    .weekNumber.toString()
    .padStart(2, "0")}`;
}
