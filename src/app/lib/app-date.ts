import { DEMO_MODE, DEMO_TODAY } from "../config";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function buildLocalDate(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
  seconds = 0,
  milliseconds = 0
) {
  return new Date(year, month - 1, day, hours, minutes, seconds, milliseconds);
}

export function getAppTodayParts() {
  if (DEMO_MODE) {
    return parseDateOnly(DEMO_TODAY);
  }

  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
}

export function getAppTodayDate() {
  const { year, month, day } = getAppTodayParts();
  return buildLocalDate(year, month, day);
}

export function getAppNow() {
  if (!DEMO_MODE) {
    return new Date();
  }

  const actualNow = new Date();
  const { year, month, day } = parseDateOnly(DEMO_TODAY);
  return buildLocalDate(
    year,
    month,
    day,
    actualNow.getHours(),
    actualNow.getMinutes(),
    actualNow.getSeconds(),
    actualNow.getMilliseconds()
  );
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateTime(date: Date) {
  return `${formatDateKey(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
}

export function getAppTodayKey() {
  return formatDateKey(getAppTodayDate());
}

export function getAppNowDateTimeString() {
  return formatDateTime(getAppNow());
}
