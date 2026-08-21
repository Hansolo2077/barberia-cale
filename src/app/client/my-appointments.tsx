import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    cancelAppointment,
    getMyAppointments,
} from "../../api/appointments.api";

import { useAuth } from "../../context/AuthContext";

type Appointment = {
  id: number;
  service: string;
  date: string;
  time: string;
  status:
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "CANCELLED";
  createdAt: string;
};

export default function MyAppointmentsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [cancellingId, setCancellingId] =
    useState<number | null>(null);

  useEffect(() => {
    if (token) {
      loadAppointments();
    }
  }, [token]);

  async function loadAppointments() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await getMyAppointments(token);

      setAppointments(
        result.appointments
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar tus citas."
      );
    } finally {
      setLoading(false);
    }
  }

  function getStatusText(
    status: Appointment["status"]
  ) {
    switch (status) {
      case "PENDING":
        return "Pendiente";

      case "ACCEPTED":
        return "Aceptada";

      case "REJECTED":
        return "Rechazada";

      case "CANCELLED":
        return "Cancelada";

      default:
        return status;
    }
  }

  function confirmCancel(
    appointmentId: number
  ) {
    if (typeof window !== "undefined") {
      const confirmed =
        window.confirm(
          "¿Estás seguro de que deseas cancelar esta cita? El horario quedará disponible para otro cliente."
        );

      if (confirmed) {
        handleCancel(
          appointmentId
        );
      }

      return;
    }

    Alert.alert(
      "Cancelar cita",
      "¿Estás seguro de que deseas cancelar esta cita? El horario quedará disponible para otro cliente.",
      [
        {
          text: "Volver",
          style: "cancel",
        },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () =>
            handleCancel(
              appointmentId
            ),
        },
      ]
    );
  }

  async function handleCancel(
    appointmentId: number
  ) {
    if (!token) {
      return;
    }

    try {
      setCancellingId(
        appointmentId
      );

      setError("");

      await cancelAppointment(
        token,
        appointmentId
      );

      await loadAppointments();

      Alert.alert(
        "Cita cancelada",
        "La cita fue cancelada correctamente."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo cancelar la cita.";

      Alert.alert(
        "No se pudo cancelar",
        message
      );
    } finally {
      setCancellingId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Cargando tus citas...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >
      <Text style={styles.title}>
        Mis citas
      </Text>

      <Text style={styles.subtitle}>
        Consulta tus próximas
        solicitudes y su estado.
      </Text>

      {error ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={loadAppointments}
          >
            <Text style={styles.retryButtonText}>
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.messageBox}>
          <Text style={styles.emptyTitle}>
            Aún no tienes citas
          </Text>

          <Text style={styles.messageText}>
            Cuando solicites una cita
            aparecerá aquí.
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.push(
                "/client/appointment"
              )
            }
          >
            <Text style={styles.primaryButtonText}>
              Agendar una cita
            </Text>
          </Pressable>
        </View>
      ) : (
        appointments.map(
          (appointment) => (
            <View
              key={appointment.id}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.service}>
                  {appointment.service}
                </Text>

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>
                    {getStatusText(
                      appointment.status
                    )}
                  </Text>
                </View>
              </View>

              <Text style={styles.date}>
                {appointment.date}
              </Text>

              <Text style={styles.time}>
                {appointment.time}
              </Text>

              {(appointment.status ===
                "PENDING" ||
                appointment.status ===
                  "ACCEPTED") && (
                <Pressable
                  style={[
                    styles.cancelButton,

                    cancellingId ===
                      appointment.id &&
                      styles.disabledButton,
                  ]}
                  disabled={
                    cancellingId ===
                    appointment.id
                  }
                  onPress={() =>
                    confirmCancel(
                      appointment.id
                    )
                  }
                >
                  <Text style={styles.cancelButtonText}>
                    {cancellingId ===
                    appointment.id
                      ? "Cancelando..."
                      : "Cancelar cita"}
                  </Text>
                </Pressable>
              )}
            </View>
          )
        )
      )}

      <Pressable
        style={styles.backButton}
        onPress={() =>
          router.back()
        }
      >
        <Text style={styles.backButtonText}>
          Volver
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#f5f5f5",
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  loadingText: {
    marginTop: 12,
    color: "#666",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 28,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  service: {
    fontSize: 18,
    fontWeight: "600",
  },

  statusBadge: {
    backgroundColor: "#eeeeee",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  date: {
    fontSize: 16,
    marginBottom: 4,
  },

  time: {
    fontSize: 22,
    fontWeight: "bold",
  },

  cancelButton: {
    marginTop: 18,
    borderWidth: 1,
    borderColor: "#999",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.6,
  },

  messageBox: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },

  messageText: {
    color: "#666",
    lineHeight: 20,
  },

  primaryButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },

  primaryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  retryButton: {
    marginTop: 16,
  },

  retryButtonText: {
    fontWeight: "600",
  },

  backButton: {
    alignItems: "center",
    padding: 14,
    marginTop: 10,
  },

  backButtonText: {
    color: "#555",
  },
});