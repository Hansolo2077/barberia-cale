import { BUSINESS } from "../constants/business";

export function formatDisplayDate(
  dateString: string
) {
  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  const date = new Date(
    year,
    month - 1,
    day
  );

  return new Intl.DateTimeFormat(
    BUSINESS.locale,
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  ).format(date);
}

export function formatDisplayTime(
  timeString: string
) {
  const [hour, minute] =
    timeString
      .split(":")
      .map(Number);

  const date = new Date();

  date.setHours(
    hour,
    minute,
    0,
    0
  );

  return new Intl.DateTimeFormat(
    BUSINESS.locale,
    {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);
}
