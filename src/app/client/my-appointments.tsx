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

import BackButton from "../../components/BackButton";

import {
    COLORS,
    FONT,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

type Appointment = {
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
};

export default function MyAppointmentsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

const [showHistory, setShowHistory] =
  useState(true);

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
        return "Confirmada";

        case "COMPLETED":
  return "Completada";

      case "REJECTED":
        return "Rechazada";

      case "CANCELLED":
        return "Cancelada";

      default:
        return status;
    }
  }

  function getStatusStyle(
    status: Appointment["status"]
  ) {
    switch (status) {
      case "ACCEPTED":
        return {
          background:
            COLORS.successBackground,
          text:
            COLORS.success,
        };

        case "COMPLETED":
  return {
    background:
      COLORS.primarySoft,
    text:
      COLORS.text,
  };

      case "PENDING":
        return {
          background:
            COLORS.warningBackground,
          text:
            COLORS.warning,
        };

      case "REJECTED":
      case "CANCELLED":
        return {
          background:
            COLORS.dangerBackground,
          text:
            COLORS.danger,
        };

      default:
        return {
          background:
            COLORS.primarySoft,
          text:
            COLORS.textSecondary,
        };
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

  const visibleAppointments =
  showHistory
    ? appointments
    : appointments.filter(
        (appointment) =>
          appointment.status === "PENDING" ||
          appointment.status === "ACCEPTED"
      );

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
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          TU AGENDA
        </Text>

        <Text style={styles.title}>
          Mis citas
        </Text>

        <Text style={styles.subtitle}>
          Revisa tus próximas reservas y el estado de cada solicitud.
        </Text>
      </View>

      {error ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>
            No pudimos cargar tus citas
          </Text>

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
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>
              ✂
            </Text>
          </View>

          <Text style={styles.emptyTitle}>
            Aún no tienes citas
          </Text>

          <Text style={styles.emptyText}>
            Cuando reserves tu próximo corte, aparecerá aquí.
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
        <>
          <Text style={styles.sectionTitle}>
            Reservas
          </Text>

          <Pressable
  style={styles.historyButton}
  onPress={() =>
    setShowHistory(
      (current) => !current
    )
  }
>
  <Text style={styles.historyButtonText}>
    {showHistory
      ? "Ocultar historial"
      : "Mostrar historial"}
  </Text>
</Pressable>

          {visibleAppointments.map(
            (appointment) => {
              const statusStyle =
                getStatusStyle(
                  appointment.status
                );

              const canCancel =
                appointment.status ===
                  "PENDING" ||
                appointment.status ===
                  "ACCEPTED";

              const isCancelling =
                cancellingId ===
                appointment.id;

              return (
                <View
                  key={
                    appointment.id
                  }
                  style={
                    styles.appointmentCard
                  }
                >
                  <View
                    style={
                      styles.cardTopRow
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.serviceName
                        }
                      >
                        {
                          appointment.service
                        }
                      </Text>

                      <Text
                        style={
                          styles.serviceMeta
                        }
                      >
                        50 min
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            statusStyle.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              statusStyle.text,
                          },
                        ]}
                      >
                        {getStatusText(
                          appointment.status
                        )}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.divider
                    }
                  />

                  <View
                    style={
                      styles.bookingInfoRow
                    }
                  >
                    <View
                      style={
                        styles.bookingInfoBlock
                      }
                    >
                      <Text
                        style={
                          styles.infoLabel
                        }
                      >
                        Fecha
                      </Text>

                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {
                          appointment.date
                        }
                      </Text>
                    </View>

                    <View
                      style={
                        styles.bookingInfoBlock
                      }
                    >
                      <Text
                        style={
                          styles.infoLabel
                        }
                      >
                        Hora
                      </Text>

                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {
                          appointment.time
                        }
                      </Text>
                    </View>
                  </View>

                  {appointment.status ===
                    "PENDING" && (
                    <View
                      style={
                        styles.infoNotice
                      }
                    >
                      <Text
                        style={
                          styles.infoNoticeText
                        }
                      >
                        La barbería todavía debe aceptar esta solicitud.
                      </Text>
                    </View>
                  )}

                  {canCancel && (
                    <Pressable
                      style={[
                        styles.cancelButton,
                        isCancelling &&
                          styles.disabledButton,
                      ]}
                      disabled={
                        isCancelling
                      }
                      onPress={() =>
                        confirmCancel(
                          appointment.id
                        )
                      }
                    >
                      <Text
                        style={
                          styles.cancelButtonText
                        }
                      >
                        {isCancelling
                          ? "Cancelando..."
                          : "Cancelar cita"}
                      </Text>
                    </Pressable>
                  )}
                </View>
              );
            }
          )}

          <Pressable
            style={
              styles.newBookingButton
            }
            onPress={() =>
              router.push(
                "/client/appointment"
              )
            }
          >
            <Text
              style={
                styles.newBookingButtonText
              }
            >
              Agendar otra cita
            </Text>
          </Pressable>
        </>
      )}

      <BackButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor:
      COLORS.background,
    paddingHorizontal:
      SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom:
      SPACING.xxl,
  },

  centerContainer: {
    flex: 1,
    justifyContent:
      "center",
    alignItems: "center",
    backgroundColor:
      COLORS.background,
  },

  loadingText: {
    marginTop: SPACING.sm,
    fontSize: FONT.small,
    color:
      COLORS.textSecondary,
  },

  header: {
    marginBottom:
      SPACING.xl,
  },

  eyebrow: {
    fontSize: FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.xs,
  },

  title: {
    fontSize: FONT.title,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  subtitle: {
    fontSize: FONT.body,
    lineHeight: 24,
    color:
      COLORS.textSecondary,
  },

  sectionTitle: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom:
      SPACING.md,
  },

  appointmentCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding:
      SPACING.lg,
    marginBottom:
      SPACING.md,
  },

  cardTopRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems:
      "flex-start",
  },

  serviceName: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 3,
  },

  serviceMeta: {
    fontSize: FONT.small,
    color:
      COLORS.textSecondary,
  },

  historyButton: {
  alignSelf: "flex-start",
  backgroundColor:
    COLORS.primarySoft,
  paddingHorizontal:
    SPACING.md,
  paddingVertical:
    SPACING.sm,
  borderRadius:
    RADIUS.pill,
  marginBottom:
    SPACING.md,
},

historyButtonText: {
  color: COLORS.text,
  fontSize: FONT.small,
  fontWeight: "700",
},

  statusBadge: {
    borderRadius:
      RADIUS.pill,
    paddingHorizontal:
      SPACING.md,
    paddingVertical: 7,
  },

  statusText: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor:
      COLORS.border,
    marginVertical:
      SPACING.md,
  },

  bookingInfoRow: {
    flexDirection: "row",
    gap: SPACING.lg,
  },

  bookingInfoBlock: {
    flex: 1,
  },

  infoLabel: {
    fontSize:
      FONT.caption,
    color:
      COLORS.textSecondary,
    marginBottom: 5,
  },

  infoValue: {
    fontSize: FONT.body,
    fontWeight: "700",
    color: COLORS.text,
  },

  infoNotice: {
    backgroundColor:
      COLORS.warningBackground,
    borderRadius:
      RADIUS.md,
    padding:
      SPACING.md,
    marginTop:
      SPACING.md,
  },

  infoNoticeText: {
    color:
      COLORS.warning,
    fontSize: FONT.small,
    lineHeight: 20,
     textAlign: "center",
  },

  cancelButton: {
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius:
      RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
    marginTop:
      SPACING.md,
    backgroundColor:
      COLORS.surface,
  },

  cancelButtonText: {
    color:
      COLORS.danger,
    fontSize: FONT.small,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.5,
  },

  newBookingButton: {
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop:
      SPACING.sm,
  },

  newBookingButtonText: {
    color: "#FFFFFF",
    fontSize: FONT.body,
    fontWeight: "700",
  },

  messageCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.lg,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding:
      SPACING.lg,
  },

  messageTitle: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  messageText: {
    fontSize: FONT.small,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
  },

  retryButton: {
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
    marginTop:
      SPACING.lg,
  },

  retryButtonText: {
    color: "#FFFFFF",
    fontSize: FONT.small,
    fontWeight: "700",
  },

  emptyCard: {
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.xl,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding:
      SPACING.xl,
    alignItems: "center",
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom:
      SPACING.md,
  },

  emptyIconText: {
    fontSize: 28,
  },

  emptyTitle: {
    fontSize:
      FONT.heading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  emptyText: {
    fontSize: FONT.body,
    lineHeight: 23,
    color:
      COLORS.textSecondary,
    textAlign: "center",
    marginBottom:
      SPACING.lg,
  },

  primaryButton: {
    width: "100%",
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: FONT.body,
    fontWeight: "700",
  },

  
});