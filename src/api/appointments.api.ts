import {
  apiRequest,
  createQueryString,
} from "./api-client";

export type AppointmentStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

export type BookingPolicy = {
  minLeadHours: number;
  maxActivePerDay: number;
  maxActiveInSevenDays: number;
  cancellationWindowMinutes: number;
  businessTimeZone?: string;
};

export type BookingEligibility = {
  allowed: boolean;
  reason: string | null;
  activeOnDate: number;
  activeInSevenDays: number;
};

export type AvailabilitySlot = {
  time: string;
  available: boolean;
};

export type AvailabilityResponse = {
  success: boolean;
  date: string;
  times: AvailabilitySlot[];
  eligibility: BookingEligibility;
  policy: BookingPolicy;
};

export type NextAvailabilityResponse = {
  success: boolean;
  date: string | null;
  times: AvailabilitySlot[];
  eligibility: BookingEligibility | null;
  policy: BookingPolicy;
};

export type UserAppointment = {
  id: number;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  cancelUntil?: string;
  canCancel?: boolean;
  isPast?: boolean;
};

export type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type AppointmentListQuery = {
  page?: number;
  pageSize?: number;
};

export type MyAppointmentsResponse = {
  success: boolean;
  appointments: UserAppointment[];
  pagination: Pagination;
  policy: BookingPolicy;
};

export function getAvailability(token: string, date: string) {
  return apiRequest<AvailabilityResponse>(
    `/appointments/availability${createQueryString({ date })}`,
    {
      method: "GET",
      token,
    }
  );
}

export function getNextAvailability(
  token: string,
  startDate: string
) {
  return apiRequest<NextAvailabilityResponse>(
    `/appointments/next-availability${createQueryString({ startDate })}`,
    {
      method: "GET",
      token,
    }
  );
}

export type CreateAppointmentData = {
  service: string;
  date: string;
  time: string;
};

export type AppointmentMutationResponse = {
  success: boolean;
  message: string;
  appointment: UserAppointment;
};

export function createAppointment(
  token: string,
  data: CreateAppointmentData
) {
  return apiRequest<AppointmentMutationResponse>("/appointments", {
    method: "POST",
    token,
    json: data,
  });
}

export function getMyAppointments(
  token: string,
  query: AppointmentListQuery = {}
) {
  return apiRequest<MyAppointmentsResponse>(
    `/appointments/my${createQueryString(query)}`,
    {
      method: "GET",
      token,
    }
  );
}

export function cancelAppointment(
  token: string,
  appointmentId: number
) {
  return apiRequest<AppointmentMutationResponse>(
    `/appointments/${appointmentId}/cancel`,
    {
      method: "PATCH",
      token,
    }
  );
}
