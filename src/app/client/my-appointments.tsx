import {
    useFocusEffect,
    useRouter,
} from "expo-router";
import {
    useCallback,
    useEffect,
    useState,
} from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { showMessage } from "../../utils/show-message";



import {
    cancelAppointment,
    getMyAppointments,
} from "../../api/appointments.api";

import { useAuth } from "../../context/AuthContext";

import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";

import {
    COLORS,
    FONT,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

import BackButton from "../../components/BackButton";

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
  canCancel?: boolean;
};

type AppointmentView =
  | "UPCOMING"
  | "HISTORY";

export default function MyAppointmentsScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const [
    appointments,
    setAppointments,
  ] =
    useState<Appointment[]>([]);

  const [
    selectedView,
    setSelectedView,
  ] =
    useState<AppointmentView>(
      "UPCOMING"
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [
    cancellingId,
    setCancellingId,
  ] =
    useState<number | null>(null);

  const [currentTime, setCurrentTime] =
    useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30_000);

    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
  useCallback(() => {
    if (token) {
      loadAppointments();
    }
  }, [token])
);

  async function loadAppointments() {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await getMyAppointments(
          token
        );

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

      case "PENDING":
        return {
          background:
            COLORS.warningBackground,
          text:
            COLORS.warning,
        };

      case "COMPLETED":
        return {
          background:
            COLORS.primarySoft,
          text:
            COLORS.text,
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
    const message =
      "¿Estás seguro de que deseas cancelar esta cita? El horario quedará disponible para otro cliente.";

    if (Platform.OS !== "web") {
      Alert.alert(
        "Cancelar cita",
        message,
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

      return;
    }

    if (
      typeof window.confirm === "function" &&
      window.confirm(message)
    ) {
      void handleCancel(appointmentId);
    }
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

    showMessage(
      "Cita cancelada",
      "La cita fue cancelada correctamente."
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo cancelar la cita.";

    showMessage(
      "No se pudo cancelar",
      message
    );
  } finally {
    setCancellingId(null);
  }
}

  const upcomingAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status ===
          "PENDING" ||
        appointment.status ===
          "ACCEPTED"
    );

  const historyAppointments =
    appointments.filter(
      (appointment) =>
        appointment.status ===
          "COMPLETED" ||
        appointment.status ===
          "REJECTED" ||
        appointment.status ===
          "CANCELLED"
    );

  const visibleAppointments =
    selectedView === "UPCOMING"
      ? upcomingAppointments
      : historyAppointments;

  if (loading) {
    return (
      <View
        style={
          styles.centerContainer
        }
      >
        <ActivityIndicator
          size="large"
        />

        <Text
          style={
            styles.loadingText
          }
        >
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
        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>
            TU AGENDA
          </Text>

          <Text style={styles.title}>
            Mis citas
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Consulta tus próximas
            reservas y el historial de
            citas anteriores.
          </Text>
        </View>

        <BackButton
          iconOnly
          fallbackHref="/client"
        />
      </View>

      <View
        style={
          styles.tabsContainer
        }
      >
        <Pressable
          style={[
            styles.tabButton,

            selectedView ===
              "UPCOMING" &&
              styles.activeTabButton,
          ]}
          onPress={() =>
            setSelectedView(
              "UPCOMING"
            )
          }
        >
          <Text
            style={[
              styles.tabText,

              selectedView ===
                "UPCOMING" &&
                styles.activeTabText,
            ]}
          >
            Próximas
          </Text>

          {upcomingAppointments.length >
            0 && (
            <View
              style={[
                styles.countBadge,

                selectedView ===
                  "UPCOMING" &&
                  styles.activeCountBadge,
              ]}
            >
              <Text
                style={[
                  styles.countBadgeText,

                  selectedView ===
                    "UPCOMING" &&
                    styles.activeCountBadgeText,
                ]}
              >
                {
                  upcomingAppointments.length
                }
              </Text>
            </View>
          )}
        </Pressable>

        <Pressable
          style={[
            styles.tabButton,

            selectedView ===
              "HISTORY" &&
              styles.activeTabButton,
          ]}
          onPress={() =>
            setSelectedView(
              "HISTORY"
            )
          }
        >
          <Text
            style={[
              styles.tabText,

              selectedView ===
                "HISTORY" &&
                styles.activeTabText,
            ]}
          >
            Historial
          </Text>
        </Pressable>
      </View>

      {error ? (
        <View
          style={
            styles.messageCard
          }
        >
          <Text
            style={
              styles.messageTitle
            }
          >
            No pudimos cargar tus citas
          </Text>

          <Text
            style={
              styles.messageText
            }
          >
            {error}
          </Text>

          <Pressable
            style={
              styles.retryButton
            }
            onPress={
              loadAppointments
            }
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      ) : visibleAppointments.length ===
        0 ? (
        <View
          style={
            styles.emptyCard
          }
        >
          <View
            style={
              styles.emptyIcon
            }
          >
            <Text
              style={
                styles.emptyIconText
              }
            >
              ✂
            </Text>
          </View>

          <Text
            style={
              styles.emptyTitle
            }
          >
            {selectedView ===
            "UPCOMING"
              ? "No tienes próximas citas"
              : "Tu historial está vacío"}
          </Text>

          <Text
            style={
              styles.emptyText
            }
          >
            {selectedView ===
            "UPCOMING"
              ? "Cuando reserves tu próximo corte, aparecerá aquí."
              : "Las citas completadas, rechazadas o canceladas aparecerán aquí."}
          </Text>

          {selectedView ===
            "UPCOMING" && (
            <Pressable
              style={
                styles.primaryButton
              }
              onPress={() =>
                router.push(
                  "/client/appointment"
                )
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Agendar una cita
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <>
          <Text
            style={
              styles.sectionTitle
            }
          >
            {selectedView ===
            "UPCOMING"
              ? "Próximas reservas"
              : "Historial"}
          </Text>

          {visibleAppointments.map(
            (appointment) => {
              const statusStyle =
                getStatusStyle(
                  appointment.status
                );

              const hasCancellableStatus =
                appointment.status ===
                  "PENDING" ||
                appointment.status ===
                  "ACCEPTED";

              const cancellationExpired =
                currentTime >
                  new Date(
                    appointment.createdAt
                  ).getTime() +
                    60 * 60 * 1000 ||
                appointment.canCancel === false;

              const canCancel =
                hasCancellableStatus &&
                !cancellationExpired;

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
                        {formatDisplayDate(
                          appointment.date
                        )}
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
                        {formatDisplayTime(
                          appointment.time
                        )}
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

                  {appointment.status ===
                    "ACCEPTED" && (
                    <View
                      style={
                        styles.confirmedNotice
                      }
                    >
                      <Text
                        style={
                          styles.confirmedNoticeText
                        }
                      >
                        Tu cita está confirmada.
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

                  {hasCancellableStatus &&
                    cancellationExpired && (
                    <View style={styles.expiredNotice}>
                      <Text style={styles.expiredNoticeText}>
                        Ya no se puede cancelar esta cita. El plazo de cancelación expiró.
                      </Text>
                    </View>
                  )}
                </View>
              );
            }
          )}

          {selectedView ===
            "UPCOMING" && (
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
          )}
        </>
      )}

      <BackButton fallbackHref="/client" />
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
    paddingTop:
      SPACING.xl,
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
    marginTop:
      SPACING.sm,
    fontSize:
      FONT.small,
    color:
      COLORS.textSecondary,
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom:
      SPACING.lg,
  },

  headerContent: {
    flex: 1,
  },

  eyebrow: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.xs,
  },

  title: {
    fontSize:
      FONT.title,
    fontWeight: "800",
    color:
      COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  subtitle: {
    fontSize:
      FONT.body,
    lineHeight: 24,
    color:
      COLORS.textSecondary,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor:
      COLORS.primarySoft,
    borderRadius:
      RADIUS.pill,
    padding: 4,
    marginBottom:
      SPACING.xl,
  },

  tabButton: {
    flex: 1,
    minHeight: 44,
    borderRadius:
      RADIUS.pill,
    flexDirection: "row",
    justifyContent:
      "center",
    alignItems: "center",
    gap: SPACING.xs,
  },

  activeTabButton: {
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
  },

  tabText: {
    fontSize:
      FONT.small,
    fontWeight: "700",
    color:
      COLORS.textSecondary,
  },

  activeTabText: {
    color:
      COLORS.text,
  },

  countBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.border,
    justifyContent:
      "center",
    alignItems: "center",
  },

  activeCountBadge: {
    backgroundColor:
      COLORS.primary,
  },

  countBadgeText: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
    color:
      COLORS.textSecondary,
  },

  activeCountBadgeText: {
    color: "#FFFFFF",
  },

  sectionTitle: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color:
      COLORS.text,
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
    gap: SPACING.md,
  },

  serviceName: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom: 3,
  },

  serviceMeta: {
    fontSize:
      FONT.small,
    color:
      COLORS.textSecondary,
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
    gap:
      SPACING.lg,
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
    fontSize:
      FONT.body,
    fontWeight: "700",
    color:
      COLORS.text,
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
    alignItems: "center",
    justifyContent:
      "center",
  },

  infoNoticeText: {
    color:
      COLORS.warning,
    fontSize:
      FONT.small,
    lineHeight: 20,
    textAlign: "center",
  },

  confirmedNotice: {
    backgroundColor:
      COLORS.successBackground,
    borderRadius:
      RADIUS.md,
    padding:
      SPACING.md,
    marginTop:
      SPACING.md,
    alignItems: "center",
  },

  confirmedNoticeText: {
    color:
      COLORS.success,
    fontSize:
      FONT.small,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
  },

  cancelButton: {
    borderWidth: 1,
    borderColor:
      COLORS.danger,
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
    fontSize:
      FONT.small,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.5,
  },

  expiredNotice: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor:
      COLORS.dangerBackground,
  },

  expiredNoticeText: {
    color: COLORS.danger,
    fontSize: FONT.small,
    lineHeight: 20,
    fontWeight: "600",
    textAlign: "center",
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
    fontSize:
      FONT.body,
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
    color:
      COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  messageText: {
    fontSize:
      FONT.small,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
    textAlign: "center",
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
    fontSize:
      FONT.small,
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
    justifyContent:
      "center",
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
    color:
      COLORS.text,
    marginBottom:
      SPACING.sm,
    textAlign: "center",
  },

  emptyText: {
    fontSize:
      FONT.body,
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
    fontSize:
      FONT.body,
    fontWeight: "700",
  },
});
