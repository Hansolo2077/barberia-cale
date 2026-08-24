export const BUSINESS = Object.freeze({
  name: "Barbería Cale",
  timeZone: "America/Managua",
  locale: "es-NI",
  countryCallingCode: "505",
  openingHour: "08:00",
  closingHour: "17:00",
  slotMinutes: 60,
  service: {
    name: "Corte de cabello",
    durationMinutes: 50,
  },
  bookingPolicy: {
    minLeadHours: 24,
    maxActivePerDay: 1,
    maxActiveInSevenDays: 2,
    cancellationWindowMinutes: 60,
  },
});

export type BookingPolicy =
  typeof BUSINESS.bookingPolicy;
