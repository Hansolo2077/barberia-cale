import { BUSINESS } from "../constants/business";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function getDateTimeParts(date: Date) {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: BUSINESS.timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }
  ).formatToParts(date);

  return Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
}

export function isValidIsoDate(value: string) {
  if (!ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value
    .split("-")
    .map(Number);
  const parsed = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function getBusinessDateTimeKey(
  date = new Date()
) {
  const parts = getDateTimeParts(date);

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function getBusinessTodayIso(
  date = new Date()
) {
  return getBusinessDateTimeKey(date).slice(0, 10);
}

export function addDaysToIso(
  isoDate: string,
  amount: number
) {
  if (!isValidIsoDate(isoDate)) {
    throw new Error("Fecha ISO inválida.");
  }

  const [year, month, day] = isoDate
    .split("-")
    .map(Number);
  const parsed = new Date(
    Date.UTC(year, month - 1, day + amount)
  );

  return parsed.toISOString().slice(0, 10);
}

export function isAppointmentPast(
  date: string,
  time: string,
  now = new Date()
) {
  return `${date} ${time}` <= getBusinessDateTimeKey(now);
}

export function isAtLeastMinutesBeforeAppointment(
  date: string,
  time: string,
  minimumMinutes: number,
  now = new Date()
) {
  if (
    !isValidIsoDate(date) ||
    !TIME_PATTERN.test(time) ||
    !Number.isFinite(minimumMinutes) ||
    minimumMinutes < 0
  ) {
    return false;
  }

  const normalizedTime =
    time.length === 5 ? `${time}:00` : time;
  const minimumAppointmentTime = new Date(
    now.getTime() + minimumMinutes * 60_000
  );

  return (
    `${date} ${normalizedTime}` >=
    getBusinessDateTimeKey(minimumAppointmentTime)
  );
}
