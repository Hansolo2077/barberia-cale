import { createClient } from "npm:@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const NOTIFICATION_CHANNEL_ID = "appointment-reminders-v1";
const NOTIFICATION_CATEGORY_ID = "attendance_reminder";
const BUSINESS_TIME_ZONE = "America/Managua";
const MAX_REMINDERS_PER_RUN = 5;
const MAX_DEVICE_TOKENS_PER_APPOINTMENT = 100;
const EXPO_FETCH_TIMEOUT_MS = 10_000;

type ClaimedReminder = {
  appointment_id: number;
  client_user_id: number;
  appointment_at: string;
};

type DeviceToken = {
  id: number;
  expo_push_token: string;
};

type ExpoPushError = {
  code?: string;
  message?: string;
  details?: unknown;
};

type ExpoPushTicket = {
  status?: "ok" | "error";
  id?: string;
  message?: string;
  details?: {
    error?: string;
  };
};

type ExpoPushPayload = {
  data?: ExpoPushTicket[] | ExpoPushTicket;
  errors?: ExpoPushError[] | ExpoPushError;
};

type ReminderResult = {
  appointmentId: number;
  status: "sent" | "skipped" | "failed";
  acceptedDevices: number;
};

function getRequiredEnvironmentVariable(name: string) {
  const value = Deno.env.get(name)?.trim();

  if (!value) {
    throw new Error(`Falta la variable requerida ${name}.`);
  }

  return value;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function asArray<T>(value: T[] | T | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  return value ? [value] : [];
}

function formatAppointmentTime(appointmentAt: string) {
  return new Intl.DateTimeFormat("es-NI", {
    timeZone: BUSINESS_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(appointmentAt));
}

async function sendExpoMessages(messages: unknown[]) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    EXPO_FETCH_TIMEOUT_MS
  );

  try {
    return await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Expo Push excedió el tiempo límite de ${EXPO_FETCH_TIMEOUT_MS} ms.`
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse(
      { success: false, message: "Método no permitido." },
      405
    );
  }

  let supabaseUrl: string;
  let serviceRoleKey: string;
  let cronSecret: string;

  try {
    supabaseUrl = getRequiredEnvironmentVariable("SUPABASE_URL");
    serviceRoleKey = getRequiredEnvironmentVariable(
      "SUPABASE_SERVICE_ROLE_KEY"
    );
    cronSecret = getRequiredEnvironmentVariable("REMINDER_CRON_SECRET");
  } catch (error) {
    console.error(error);
    return jsonResponse(
      { success: false, message: "La función no está configurada." },
      500
    );
  }

  if (request.headers.get("x-cron-secret") !== cronSecret) {
    return jsonResponse(
      { success: false, message: "Solicitud no autorizada." },
      401
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const reminderApi = supabase.schema("reminder_api");
  const claimToken = crypto.randomUUID();

  const releaseClaim = async (
    appointmentId: number,
    { warnIfMissing = true } = {}
  ) => {
    const { data: released, error } = await reminderApi.rpc(
      "release_appointment_reminder_claim",
      {
        p_appointment_id: appointmentId,
        p_claim_token: claimToken,
      }
    );

    if (error) {
      console.error(
        `No se pudo liberar el reclamo ${appointmentId}:`,
        error
      );
      return false;
    }

    if (released !== true && warnIfMissing) {
      console.warn(
        `El reclamo ${appointmentId} ya no estaba activo al liberarlo.`
      );
    }

    return released === true;
  };

  const revalidateClaim = async (appointmentId: number) => {
    const { data: isEligible, error } = await reminderApi.rpc(
      "revalidate_appointment_reminder_claim",
      {
        p_appointment_id: appointmentId,
        p_claim_token: claimToken,
      }
    );

    if (error) {
      console.error(
        `No se pudo revalidar el recordatorio ${appointmentId}:`,
        error
      );
      throw error;
    }

    return isEligible === true;
  };

  const { data, error: claimError } = await reminderApi.rpc(
    "claim_due_appointment_reminders",
    {
      p_claim_token: claimToken,
      p_limit: MAX_REMINDERS_PER_RUN,
    }
  );

  if (claimError) {
    console.error("No se pudieron reclamar recordatorios:", claimError);
    return jsonResponse(
      { success: false, message: "No se pudieron preparar los recordatorios." },
      500
    );
  }

  const reminders = (data ?? []) as ClaimedReminder[];
  const results: ReminderResult[] = [];

  for (const reminder of reminders) {
    let acceptedDevices = 0;

    try {
      // This heartbeat also closes the race with a confirmation/cancellation
      // that occurred after the batch was claimed.
      if (!(await revalidateClaim(reminder.appointment_id))) {
        await releaseClaim(reminder.appointment_id, {
          warnIfMissing: false,
        });
        results.push({
          appointmentId: reminder.appointment_id,
          status: "skipped",
          acceptedDevices,
        });
        continue;
      }

      const { data: tokenRows, error: tokenError } = await reminderApi.rpc(
        "get_claimed_appointment_device_tokens",
        {
          p_appointment_id: reminder.appointment_id,
          p_claim_token: claimToken,
        }
      );

      if (tokenError) {
        console.error(
          `No se pudieron consultar dispositivos para ${reminder.appointment_id}:`,
          tokenError
        );
        throw tokenError;
      }

      const tokens = (tokenRows ?? []) as DeviceToken[];

      if (tokens.length === 0) {
        await releaseClaim(reminder.appointment_id);
        results.push({
          appointmentId: reminder.appointment_id,
          status: "skipped",
          acceptedDevices,
        });
        continue;
      }

      if (tokens.length > MAX_DEVICE_TOKENS_PER_APPOINTMENT) {
        throw new Error(
          `La cita tiene más de ${MAX_DEVICE_TOKENS_PER_APPOINTMENT} dispositivos.`
        );
      }

      // Use exactly one Expo request per appointment. This avoids retrying a
      // successful first chunk when a later chunk fails.
      if (!(await revalidateClaim(reminder.appointment_id))) {
        await releaseClaim(reminder.appointment_id, {
          warnIfMissing: false,
        });
        results.push({
          appointmentId: reminder.appointment_id,
          status: "skipped",
          acceptedDevices,
        });
        continue;
      }

      const appointmentTime = formatAppointmentTime(
        reminder.appointment_at
      );
      const expiresAt = Math.floor(
        new Date(reminder.appointment_at).getTime() / 1_000
      );
      const messages = tokens.map((token) => ({
        to: token.expo_push_token,
        title: "Tu cita es en una hora",
        body: `Confirma tu asistencia para las ${appointmentTime}.`,
        data: {
          kind: "appointment_reminder",
          version: 1,
          appointmentId: reminder.appointment_id,
        },
        priority: "high",
        expiration: expiresAt,
        channelId: NOTIFICATION_CHANNEL_ID,
        categoryId: NOTIFICATION_CATEGORY_ID,
        collapseId: `appointment-reminder-${reminder.appointment_id}`,
        tag: `appointment-reminder-${reminder.appointment_id}`,
      }));
      const expoResponse = await sendExpoMessages(messages);

      if (!expoResponse.ok) {
        throw new Error(`Expo Push respondió ${expoResponse.status}.`);
      }

      const payload = (await expoResponse.json()) as ExpoPushPayload;
      const topLevelErrors = asArray(payload.errors);

      if (topLevelErrors.length > 0) {
        console.error(
          `Expo Push reportó errores para ${reminder.appointment_id}:`,
          topLevelErrors
        );
      }

      const tickets = asArray(payload.data);

      if (tickets.length !== tokens.length) {
        console.warn(
          `Expo Push devolvió ${tickets.length} tickets para ${tokens.length} dispositivos de la cita ${reminder.appointment_id}.`
        );
      }

      for (let index = 0; index < tokens.length; index += 1) {
        const ticket = tickets[index];
        const token = tokens[index];

        if (ticket?.status === "ok") {
          acceptedDevices += 1;
          continue;
        }

        console.error(
          `Expo rechazó un dispositivo para ${reminder.appointment_id}:`,
          {
            tokenId: token.id,
            message: ticket?.message ?? "Ticket ausente o inválido.",
            details: ticket?.details ?? null,
          }
        );

        if (ticket?.details?.error === "DeviceNotRegistered") {
          const { data: deactivated, error: deactivateError } =
            await reminderApi.rpc("deactivate_claimed_device_token", {
              p_appointment_id: reminder.appointment_id,
              p_claim_token: claimToken,
              p_token_id: token.id,
            });

          if (deactivateError) {
            console.error(
              `No se pudo desactivar el dispositivo ${token.id}:`,
              deactivateError
            );
          } else if (deactivated !== true) {
            console.warn(
              `El dispositivo ${token.id} no se desactivó porque el reclamo cambió.`
            );
          }
        }
      }

      if (acceptedDevices === 0) {
        await releaseClaim(reminder.appointment_id);
        results.push({
          appointmentId: reminder.appointment_id,
          status: "failed",
          acceptedDevices,
        });
        continue;
      }

      // The mark RPC revalidates again too. Keeping this explicit heartbeat
      // makes a concurrent state transition observable before the final write.
      if (!(await revalidateClaim(reminder.appointment_id))) {
        console.warn(
          `La cita ${reminder.appointment_id} cambió después de que Expo aceptó el envío.`
        );
        await releaseClaim(reminder.appointment_id, {
          warnIfMissing: false,
        });
        results.push({
          appointmentId: reminder.appointment_id,
          status: "skipped",
          acceptedDevices,
        });
        continue;
      }

      const { data: markedSent, error: markError } = await reminderApi.rpc(
        "mark_appointment_reminder_sent",
        {
          p_appointment_id: reminder.appointment_id,
          p_claim_token: claimToken,
        }
      );

      if (markError) {
        console.error(
          `No se pudo marcar el recordatorio ${reminder.appointment_id}:`,
          markError
        );
        throw markError;
      }

      if (markedSent !== true) {
        throw new Error(
          "La cita dejó de ser elegible antes de confirmar el envío."
        );
      }

      results.push({
        appointmentId: reminder.appointment_id,
        status: "sent",
        acceptedDevices,
      });
    } catch (error) {
      console.error(
        `Error enviando recordatorio ${reminder.appointment_id}:`,
        error
      );
      await releaseClaim(reminder.appointment_id, {
        warnIfMissing: false,
      });
      results.push({
        appointmentId: reminder.appointment_id,
        status: "failed",
        acceptedDevices,
      });
    }
  }

  return jsonResponse({
    success: true,
    claimed: reminders.length,
    sent: results.filter((result) => result.status === "sent").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    failed: results.filter((result) => result.status === "failed").length,
  });
});
