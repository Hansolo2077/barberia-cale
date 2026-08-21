import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    acceptAdminAppointment,
    AdminAppointment,
    getAdminAppointments,
    rejectAdminAppointment,
} from "../../api/admin.api";

import { useAuth } from "../../context/AuthContext";

export default function AdminAppointmentsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [appointments, setAppointments] =
    useState<AdminAppointment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

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
        await getAdminAppointments(token);

      setAppointments(
        result.appointments
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las citas."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(
    appointmentId: number
  ) {
    if (!token) {
      return;
    }

    try {
      setProcessingId(
        appointmentId
      );

      setError("");

      await acceptAdminAppointment(
        token,
        appointmentId
      );

      await loadAppointments();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo aceptar la cita."
      );
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(
    appointmentId: number
  ) {
    if (!token) {
      return;
    }

    const confirmed =
      typeof window !== "undefined"
        ? window.confirm(
            "¿Deseas rechazar esta cita?"
          )
        : true;

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(
        appointmentId
      );

      setError("");

      await rejectAdminAppointment(
        token,
        appointmentId
      );

      await loadAppointments();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo rechazar la cita."
      );
    } finally {
      setProcessingId(null);
    }
  }

  function getStatusText(
    status: AdminAppointment["status"]
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

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Cargando citas...
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
        Gestión de citas
      </Text>

      <Text style={styles.subtitle}>
        Revisa las solicitudes de los
        clientes y administra su estado.
      </Text>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={loadAppointments}
          >
            <Text style={styles.retryText}>
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>
            No hay citas
          </Text>

          <Text style={styles.emptyText}>
            Las solicitudes de los
            clientes aparecerán aquí.
          </Text>
        </View>
      ) : (
        appointments.map(
          (appointment) => {
            const processing =
              processingId ===
              appointment.id;

            return (
              <View
                key={appointment.id}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.clientName}>
                      {appointment.firstName}{" "}
                      {appointment.lastName}
                    </Text>

                    <Text style={styles.phone}>
                      {appointment.phone}
                    </Text>
                  </View>

                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>
                      {getStatusText(
                        appointment.status
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <Text style={styles.service}>
                  {appointment.service}
                </Text>

                <Text style={styles.date}>
                  {appointment.date}
                </Text>

                <Text style={styles.time}>
                  {appointment.time}
                </Text>

                {appointment.status ===
                  "PENDING" && (
                  <View style={styles.actionsContainer}>
                    <Pressable
                      style={[
                        styles.acceptButton,
                        processing &&
                          styles.disabledButton,
                      ]}
                      disabled={processing}
                      onPress={() =>
                        handleAccept(
                          appointment.id
                        )
                      }
                    >
                      <Text style={styles.acceptButtonText}>
                        {processing
                          ? "Procesando..."
                          : "Aceptar"}
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.rejectButton,
                        processing &&
                          styles.disabledButton,
                      ]}
                      disabled={processing}
                      onPress={() =>
                        handleReject(
                          appointment.id
                        )
                      }
                    >
                      <Text style={styles.rejectButtonText}>
                        {processing
                          ? "Procesando..."
                          : "Rechazar"}
                      </Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }
        )
      )}

      <Pressable
        style={styles.backButton}
        onPress={() =>
          router.back()
        }
      >
        <Text style={styles.backText}>
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
    marginBottom: 24,
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
    alignItems: "flex-start",
  },

  clientName: {
    fontSize: 18,
    fontWeight: "600",
  },

  phone: {
    color: "#666",
    marginTop: 3,
  },

  statusBadge: {
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 14,
  },

  service: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },

  date: {
    fontSize: 15,
    color: "#555",
  },

  time: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 3,
  },

  actionsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
  },

  acceptButton: {
    flex: 1,
    backgroundColor: "#111",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },

  acceptButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#111",
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },

  rejectButtonText: {
    color: "#111",
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.5,
  },

  errorBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
  },

  errorText: {
    color: "#555",
  },

  retryButton: {
    marginTop: 10,
  },

  retryText: {
    fontWeight: "600",
  },

  emptyBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 5,
  },

  emptyText: {
    color: "#666",
  },

  backButton: {
    alignItems: "center",
    padding: 14,
    marginTop: 8,
  },

  backText: {
    color: "#555",
  },
});