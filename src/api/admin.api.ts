const API_URL =
  "http://localhost:4000/api";

export type AdminAppointment = {
  id: number;
  service: string;
  date: string;
  time: string;

  status:
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED"
  | "COMPLETED";

  createdAt: string;

  userId: number;
  firstName: string;
  lastName: string;
  phone: string;
};

export async function completeAdminAppointment(
  token: string,
  appointmentId: number
) {
  const response = await fetch(
    `${API_URL}/admin/appointments/${appointmentId}/complete`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudo completar la cita."
    );
  }

  return result;
}

export async function getAdminAppointments(
  token: string
) {
  const response = await fetch(
    `${API_URL}/admin/appointments`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudieron consultar las citas."
    );
  }

  return result;
}

export async function getAdminSchedule(
  token: string,
  startDate: string,
  endDate: string
) {
  const response = await fetch(
    `${API_URL}/admin/appointments?startDate=${startDate}&endDate=${endDate}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudo consultar la agenda."
    );
  }

  return result;
}

export async function acceptAdminAppointment(
  token: string,
  appointmentId: number
) {
  const response = await fetch(
    `${API_URL}/admin/appointments/${appointmentId}/accept`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudo aceptar la cita."
    );
  }

  return result;
}

export async function rejectAdminAppointment(
  token: string,
  appointmentId: number
) {
  const response = await fetch(
    `${API_URL}/admin/appointments/${appointmentId}/reject`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudo rechazar la cita."
    );
  }

  return result;
}

export async function cancelAdminAppointment(
  token: string,
  appointmentId: number
) {
  const response = await fetch(
    `${API_URL}/admin/appointments/${appointmentId}/cancel`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudo cancelar la cita."
    );
  }

  return result;
}