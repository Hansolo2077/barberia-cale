import {
  apiRequest,
  createQueryString,
} from "./api-client";
import type {
  AttendanceStatus,
  AppointmentStatus,
  Pagination,
} from "./appointments.api";

export type AdminAppointment = {
  id: number;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  createdAt: string;
  clientAttendanceConfirmedAt: string | null;
  attendanceStatus: AttendanceStatus;
  canConfirmAttendance: boolean;
  reminderSentAt: string | null;
  canAccept?: boolean;
  canComplete?: boolean;
  canAdminCancel?: boolean;
  isPast?: boolean;
  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
};

export type AppointmentStatusCounts = Partial<
  Record<AppointmentStatus, number>
>;

export type AdminAppointmentsQuery = {
  page?: number;
  pageSize?: number;
  status?: AppointmentStatus | "ALL";
  search?: string;
  upcomingOnly?: boolean;
};

export type AdminAppointmentsResponse = {
  success: boolean;
  appointments: AdminAppointment[];
  statusCounts: AppointmentStatusCounts;
  pagination: Pagination;
};

export type AdminScheduleResponse = AdminAppointmentsResponse & {
  startDate: string;
  endDate: string;
};

export type AdminAppointmentMutation = Pick<
  AdminAppointment,
  | "id"
  | "userId"
  | "service"
  | "date"
  | "time"
  | "status"
  | "createdAt"
>;

export type AdminAppointmentMutationResponse = {
  success: boolean;
  message: string;
  appointment: AdminAppointmentMutation;
};

function normalizeAdminQuery(
  query: AdminAppointmentsQuery | AppointmentStatus | "ALL"
): AdminAppointmentsQuery {
  return typeof query === "string" ? { status: query } : query;
}

type AdminAppointmentsWireResponse = Partial<
  AdminAppointmentsResponse
> & {
  appointments?: AdminAppointment[];
};

function countAppointmentStatuses(
  appointments: AdminAppointment[]
): AppointmentStatusCounts {
  return appointments.reduce<AppointmentStatusCounts>(
    (counts, appointment) => {
      counts[appointment.status] =
        (counts[appointment.status] ?? 0) + 1;
      return counts;
    },
    {}
  );
}

function filterLegacyAppointments(
  appointments: AdminAppointment[],
  query: AdminAppointmentsQuery
) {
  const search = query.search?.trim().toLocaleLowerCase("es-NI") ?? "";

  return appointments.filter((appointment) => {
    if (
      query.status &&
      query.status !== "ALL" &&
      appointment.status !== query.status
    ) {
      return false;
    }

    if (!search) {
      return true;
    }

    return [
      `#${appointment.id}`,
      String(appointment.id),
      appointment.firstName,
      appointment.lastName,
      appointment.phone,
      appointment.service,
      appointment.date,
      appointment.time,
    ]
      .join(" ")
      .toLocaleLowerCase("es-NI")
      .includes(search);
  });
}

function normalizeAdminAppointmentsResponse(
  response: AdminAppointmentsWireResponse,
  query: AdminAppointmentsQuery
): AdminAppointmentsResponse {
  const receivedAppointments = Array.isArray(response.appointments)
    ? response.appointments
    : [];
  const appointments = response.pagination
    ? receivedAppointments
    : filterLegacyAppointments(receivedAppointments, query);
  const fallbackPage = query.page ?? 1;
  const fallbackPageSize = Math.max(appointments.length, 1);
  const fallbackTotal = appointments.length;

  return {
    success: response.success !== false,
    appointments,
    statusCounts:
      response.statusCounts ??
      countAppointmentStatuses(receivedAppointments),
    pagination: response.pagination ?? {
      page: fallbackPage,
      pageSize: fallbackPageSize,
      total: fallbackTotal,
      totalPages: fallbackTotal > 0 ? 1 : 0,
      hasMore: false,
    },
  };
}

export async function getAdminAppointments(
  token: string,
  query: AdminAppointmentsQuery | AppointmentStatus | "ALL" = {}
) {
  const normalizedQuery = normalizeAdminQuery(query);

  const response = await apiRequest<AdminAppointmentsWireResponse>(
    `/admin/appointments${createQueryString({ ...normalizedQuery })}`,
    {
      method: "GET",
      token,
    }
  );

  return normalizeAdminAppointmentsResponse(response, normalizedQuery);
}

export async function getAdminSchedule(
  token: string,
  startDate: string,
  endDate: string,
  query: AdminAppointmentsQuery = {}
) {
  const response = await apiRequest<
    AdminAppointmentsWireResponse &
      Partial<Pick<AdminScheduleResponse, "startDate" | "endDate">>
  >(
    `/admin/appointments${createQueryString({
      startDate,
      endDate,
      ...query,
    })}`,
    {
      method: "GET",
      token,
    }
  );

  return {
    ...normalizeAdminAppointmentsResponse(response, query),
    startDate: response.startDate ?? startDate,
    endDate: response.endDate ?? endDate,
  } satisfies AdminScheduleResponse;
}

function updateAdminAppointment(
  token: string,
  appointmentId: number,
  action: "accept" | "reject" | "cancel" | "complete"
) {
  return apiRequest<AdminAppointmentMutationResponse>(
    `/admin/appointments/${appointmentId}/${action}`,
    {
      method: "PATCH",
      token,
    }
  );
}

export function acceptAdminAppointment(
  token: string,
  appointmentId: number
) {
  return updateAdminAppointment(token, appointmentId, "accept");
}

export function rejectAdminAppointment(
  token: string,
  appointmentId: number
) {
  return updateAdminAppointment(token, appointmentId, "reject");
}

export function cancelAdminAppointment(
  token: string,
  appointmentId: number
) {
  return updateAdminAppointment(token, appointmentId, "cancel");
}

export function completeAdminAppointment(
  token: string,
  appointmentId: number
) {
  return updateAdminAppointment(token, appointmentId, "complete");
}
