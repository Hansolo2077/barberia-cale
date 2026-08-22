const API_URL = "https://barberia-cale.onrender.com/api";

export async function getAvailability(
  token: string,
  date: string
) {
  const response = await fetch(
    `${API_URL}/appointments/availability?date=${date}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    const error = new Error(
      result.message || "No se pudo consultar la disponibilidad."
    );

    Object.assign(error, {
      status: response.status,
    });

    throw error;
  }

  return result;
}

export type CreateAppointmentData = {
  service: string;
  date: string;
  time: string;
};

export async function createAppointment(
  token: string,
  data: CreateAppointmentData
) {
  const response = await fetch(
    `${API_URL}/appointments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message || "No se pudo agendar la cita."
    );
  }

  return result;
}

export async function getMyAppointments(
  token: string
) {
  const response = await fetch(
    `${API_URL}/appointments/my`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudieron consultar tus citas."
    );
  }

  return result;
}

export async function cancelAppointment(
  token: string,
  appointmentId: number
) {
  const response = await fetch(
    `${API_URL}/appointments/${appointmentId}/cancel`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "No se pudo cancelar la cita."
    );
  }

  return result;
}
