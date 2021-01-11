// Takes two arrays and combines them into a single array of objects
// Each object contains a left/right value corresponding to the given array type or undefined.
export function combineArrays<L, R>(leftArray: L[], rightArray: R[]) {
  const combined: Array<Partial<{ left: L; right: R }>> = [];
  const largestLength = Math.max(leftArray.length, rightArray.length);

  for (let i = 0; i < largestLength; i++) {
    combined.push({ left: leftArray[i], right: rightArray[i] });
  }

  return combined;
}

export const formatPoints = (points: number) => {
  return `${points} ${process.env.CURRENCY_NAME || "point"}${
    points != 1 ? "s" : ""
  } ${process.env.CURRENCY_EMOJI || ":moneybag:"}`;
};

const minPerYear = 525960;
const minPerMonth = 43200;
const minPerWeek = 10080;
const minPerDay = 1440;
const minPerHour = 60;

const timeToString = (num: number, label: string, suffix: string = " ") => {
  if (!num) return "";

  num = Math.round(num);
  return `${num} ${label}${num > 1 ? "s" : ""}`;
};

export const formatWatchTime = (minutes: number) => {
  let years, months, weeks, days, hours;

  years = Math.floor(minutes / minPerYear);
  minutes %= minPerYear;

  months = Math.floor(minutes / minPerMonth);
  minutes %= minPerMonth;

  weeks = Math.floor(minutes / minPerWeek);
  minutes %= minPerWeek;

  days = Math.floor(minutes / minPerDay);
  minutes %= minPerDay;

  hours = Math.floor(minutes / minPerHour);
  minutes %= minPerHour;

  return `${timeToString(years, "year")} ${timeToString(
    months,
    "month"
  )} ${timeToString(weeks, "week")} ${timeToString(days, "day")} ${timeToString(
    hours,
    "hour"
  )} ${timeToString(minutes, "minute", "")}`;
};

export const millisecondsToMinutes = (milliseconds: number) => {
  return milliseconds / (1000 * 60);
};
