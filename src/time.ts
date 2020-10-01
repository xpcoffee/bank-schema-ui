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

/**
 * Get an identifying key given a timestamp - these keys are compared to determine if two timestamps belong to the same period
 */
export function getYearWeek(timeStamp: string): string;
export function getYearWeek(dateTime: DateTime): string;
export function getYearWeek(input: any): string {
  let dateTime: DateTime;

  if (typeof input === "string") {
    dateTime = DateTime.fromISO(input);
  } else {
    dateTime = input;
  }

  return dateTime.toFormat("kkkk-'W'WW");
}

/**
 * Returns a set of periodic timestamps that fills the period between two timestamps
 * @param firstDataPoint
 * @param lastDataPoint
 */
export function generateYearWeeksForPeriod(
  startTimeStamp: string,
  endLastTimeStamp: string
): string[] {
  const yearWeeks = [];
  let weekIterator = DateTime.fromISO(startTimeStamp);
  const endDate = DateTime.fromISO(endLastTimeStamp);

  while (weekIterator < endDate) {
    yearWeeks.push(getYearWeek(weekIterator));
    weekIterator = weekIterator.plus({ weeks: 1 });
  }

  return yearWeeks;
}
