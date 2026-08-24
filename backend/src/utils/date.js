const BUSINESS_TIME_ZONE = "America/Managua";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value) {
  if (
    typeof value !== "string" ||
    !ISO_DATE_PATTERN.test(value)
  ) {
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

function daysBetween(startDate, endDate) {
  if (
    !isValidIsoDate(startDate) ||
    !isValidIsoDate(endDate)
  ) {
    return Number.NaN;
  }

  const start = Date.parse(`${startDate}T00:00:00Z`);
  const end = Date.parse(`${endDate}T00:00:00Z`);

  return Math.round(
    (end - start) / (24 * 60 * 60 * 1000)
  );
}

module.exports = {
  BUSINESS_TIME_ZONE,
  daysBetween,
  isValidIsoDate,
};
