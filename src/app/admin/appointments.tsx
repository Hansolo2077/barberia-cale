import { Fragment, useEffect, useRef, useState } from "react";
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

import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";

import {
    acceptAdminAppointment,
    AdminAppointment,
    cancelAdminAppointment,
    completeAdminAppointment,
    getAdminAppointments,
    rejectAdminAppointment,
} from "../../api/admin.api";

import { useAuth } from "../../context/AuthContext";

import BackButton from "../../components/BackButton";

import {
    COLORS,
    FONT,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";



import { showMessage } from "../../utils/show-message";

type StatusFilter =
  | "PENDING"
  | "ACCEPTED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | "ALL";

export default function AdminAppointmentsScreen() {
  const { token } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const resultsOffsetRef = useRef(0);

  const [appointments, setAppointments] =
    useState<AdminAppointment[]>([]);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("PENDING");

  const [loading, setLoading] =
    useState(true);

  const [processingId, setProcessingId] =
    useState<number | null>(null);

  const [error, setError] =
    useState("");

  const [expandedAppointmentId, setExpandedAppointmentId] =
    useState<number | null>(null);

  useEffect(() => {
    if (token) {
      loadAppointments(true);
    }
  }, [token]);

  async function loadAppointments(
    showFullScreen = false
  ) {
    if (!token) {
      return;
    }

    try {
      if (showFullScreen) {
        setLoading(true);
      }
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

    await loadAppointments(false);

    showMessage(
      "Cita confirmada",
      "La solicitud fue aceptada correctamente."
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo aceptar la cita.";

    showMessage(
      "No se pudo aceptar",
      message
    );
  } finally {
    setProcessingId(null);
  }
}

  function handleReject(
    appointmentId: number
  ) {
    if (!token) {
      return;
    }

    const message =
      "¿Deseas rechazar esta solicitud?";

    if (Platform.OS !== "web") {
      Alert.alert(
        "Rechazar cita",
        message,
        [
          {
            text: "Volver",
            style: "cancel",
          },
          {
            text: "Sí, rechazar",
            style: "destructive",
            onPress: () =>
              executeReject(
                appointmentId
              ),
          },
        ]
      );

      return;
    }

    const confirmed =
      typeof window.confirm === "function"
        ? window.confirm(message)
        : false;

    if (!confirmed) {
      return;
    }

    void executeReject(appointmentId);
  }

  async function executeReject(
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

    await rejectAdminAppointment(
      token,
      appointmentId
    );

    await loadAppointments(false);

    showMessage(
      "Cita rechazada",
      "La solicitud fue rechazada correctamente."
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo rechazar la cita.";

    showMessage(
      "No se pudo rechazar",
      message
    );
  } finally {
    setProcessingId(null);
  }
}

  function handleComplete(
    appointmentId: number
  ) {
    if (!token) {
      return;
    }

    const message =
      "¿Confirmas que esta cita ya fue atendida y completada?";

    if (Platform.OS !== "web") {
      Alert.alert(
        "Completar cita",
        message,
        [
          {
            text: "Volver",
            style: "cancel",
          },
          {
            text: "Sí, completar",
            onPress: () =>
              executeComplete(
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
      void executeComplete(appointmentId);
    }
  }

  async function executeComplete(
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

    await completeAdminAppointment(
      token,
      appointmentId
    );

    await loadAppointments(false);

    showMessage(
      "Cita completada",
      "La cita fue marcada como completada."
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo completar la cita.";

    showMessage(
      "No se pudo completar",
      message
    );
  } finally {
    setProcessingId(null);
  }
}

  function confirmAdminCancel(
    appointmentId: number
  ) {
    const message =
      "¿Deseas cancelar esta cita confirmada? El horario volverá a quedar disponible para otros clientes.";

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
              handleAdminCancel(
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
      void handleAdminCancel(appointmentId);
    }
  }

  async function handleAdminCancel(
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

    await cancelAdminAppointment(
      token,
      appointmentId
    );

    await loadAppointments(false);

    showMessage(
      "Cita cancelada",
      "La cita fue cancelada administrativamente y el horario quedó disponible."
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
    status: AdminAppointment["status"]
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

  const pendingCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "PENDING"
    ).length;

  const filteredAppointments = (
    statusFilter === "ALL"
      ? appointments
      : appointments.filter(
          (appointment) =>
            appointment.status ===
            statusFilter
        )
  ).slice();

  if (
    statusFilter === "PENDING" ||
    statusFilter === "ACCEPTED"
  ) {
    filteredAppointments.sort(
      (first, second) =>
        `${first.date} ${first.time}`.localeCompare(
          `${second.date} ${second.time}`
        )
    );
  }

  const filters: {
    value: StatusFilter;
    label: string;
  }[] = [
    {
      value: "PENDING",
      label: "Pendientes",
    },
    {
      value: "ACCEPTED",
      label: "Confirmadas",
    },
    {
      value: "ALL",
      label: "Todas",
    },
    {
      value: "COMPLETED",
      label: "Completadas",
    },
    {
      value: "REJECTED",
      label: "Rechazadas",
    },
    {
      value: "CANCELLED",
      label: "Canceladas",
    },
  ];

  function getFilterCount(filter: StatusFilter) {
    if (filter === "ALL") {
      return appointments.length;
    }

    return appointments.filter(
      (appointment) => appointment.status === filter
    ).length;
  }

  function handleFilterPress(filter: StatusFilter) {
    setStatusFilter(filter);
    setExpandedAppointmentId(null);

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(
          resultsOffsetRef.current - SPACING.md,
          0
        ),
        animated: true,
      });
    });
  }

  function getSectionTitle() {
    switch (statusFilter) {
      case "PENDING":
        return "Pendientes de gestión";

      case "ACCEPTED":
        return "Citas confirmadas";

      case "COMPLETED":
        return "Citas completadas";

      case "REJECTED":
        return "Citas rechazadas";

      case "CANCELLED":
        return "Citas canceladas";

      case "ALL":
        return "Todas las citas";
    }
  }

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
          Cargando citas...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          SOLICITUDES
        </Text>

        <Text style={styles.title}>
          Gestión de citas
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Gestiona las solicitudes
          pendientes y consulta citas
          por estado.
        </Text>
      </View>

      <View
        style={
          styles.summaryCard
        }
      >
        <View>
          <Text
            style={
              styles.summaryLabel
            }
          >
            Requieren atención
          </Text>

          <Text
            style={
              styles.summaryValue
            }
          >
            {pendingCount}
          </Text>

          <Text
            style={
              styles.summaryHint
            }
          >
            solicitudes pendientes
          </Text>
        </View>

        <View
          style={
            styles.summaryIcon
          }
        >
          <Text
            style={
              styles.summaryIconText
            }
          >
            !
          </Text>
        </View>
      </View>

      <Text
        style={
          styles.filterLabel
        }
      >
        Filtrar por estado
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.filterContainer
        }
      >
        {filters.map(
          (filter) => {
            const active =
              statusFilter ===
              filter.value;

            return (
              <Pressable
                key={
                  filter.value
                }
                style={[
                  styles.filterButton,
                  active &&
                    styles.activeFilterButton,
                ]}
                onPress={() =>
                  handleFilterPress(filter.value)
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    active &&
                      styles.activeFilterButtonText,
                  ]}
                >
                  {filter.label}
                </Text>

                <View
                  style={[
                    styles.filterCountBadge,
                    active && styles.activeFilterCountBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      active && styles.activeFilterCountText,
                    ]}
                  >
                    {getFilterCount(filter.value)}
                  </Text>
                </View>
              </Pressable>
            );
          }
        )}
      </ScrollView>

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
            No pudimos cargar las citas
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
            onPress={() =>
              loadAppointments(true)
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
      ) : (
        <>
          <View
            onLayout={(event) => {
              resultsOffsetRef.current =
                event.nativeEvent.layout.y;
            }}
          >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {getSectionTitle()}
          </Text>
          </View>

          {filteredAppointments
            .length === 0 ? (
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
                  ✓
                </Text>
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nada por aquí
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                No hay citas con este
                estado actualmente.
              </Text>
            </View>
          ) : (
            filteredAppointments.map(
              (appointment, index) => {
                const processing =
                  processingId ===
                  appointment.id;

                const statusStyle =
                  getStatusStyle(
                    appointment.status
                  );

                const operationalView =
                  statusFilter === "PENDING" ||
                  statusFilter === "ACCEPTED";

                const startsNewDay =
                  operationalView &&
                  (index === 0 ||
                    filteredAppointments[index - 1].date !==
                      appointment.date);

                const expanded =
                  expandedAppointmentId === appointment.id;

                const appointmentTimestamp =
                  new Date(
                    `${appointment.date}T${appointment.time}:00-06:00`
                  ).getTime();

                const canComplete =
                  appointment.canComplete ??
                  Date.now() >= appointmentTimestamp;

                const canAdminCancel =
                  appointment.canAdminCancel ??
                  Date.now() < appointmentTimestamp;

                return (
                  <Fragment key={appointment.id}>
                  {startsNewDay && (
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayHeaderText}>
                        {formatDisplayDate(appointment.date)}
                      </Text>

                      <Text style={styles.dayHeaderCount}>
                        {
                          filteredAppointments.filter(
                            (item) => item.date === appointment.date
                          ).length
                        }{" "}
                        citas
                      </Text>
                    </View>
                  )}

                  <View
                    style={
                      styles.card
                    }
                  >
                    <View
                      style={
                        styles.cardTopRow
                      }
                    >
                      <View
                        style={
                          styles.clientInfo
                        }
                      >
                        <View
                          style={
                            styles.avatar
                          }
                        >
                          <Text
                            style={
                              styles.avatarText
                            }
                          >
                            {appointment.firstName
                              ?.charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.clientTextBlock
                          }
                        >
                          <Text
                            style={
                              styles.clientName
                            }
                          >
                            {
                              appointment.firstName
                            }{" "}
                            {
                              appointment.lastName
                            }
                          </Text>

                        </View>
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

                    <Text
                      style={
                        styles.serviceLabel
                      }
                    >
                      SERVICIO
                    </Text>

                    <Text
                      style={
                        styles.service
                      }
                    >
                      {
                        appointment.service
                      }
                    </Text>

                    <View
                      style={
                        styles.infoRow
                      }
                    >
                      <View
                        style={
                          styles.infoBlock
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
                            formatDisplayDate(
  appointment.date
)
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.infoBlock
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
                            formatDisplayTime(
  appointment.time
)
                          }
                        </Text>
                      </View>
                    </View>

                    {expanded && (
                      <View style={styles.expandedDetails}>
                        <Text style={styles.detailLabel}>
                          Teléfono
                        </Text>

                        <Text style={styles.phone}>
                          {appointment.phone}
                        </Text>
                      </View>
                    )}

                    <Pressable
                      style={styles.detailsButton}
                      onPress={() =>
                        setExpandedAppointmentId(
                          expanded ? null : appointment.id
                        )
                      }
                    >
                      <Text style={styles.detailsButtonText}>
                        {expanded
                          ? "Ocultar detalles"
                          : "Ver detalles"}
                      </Text>
                    </Pressable>

                    {appointment.status ===
                      "PENDING" && (
                      <View
                        style={
                          styles.actionsContainer
                        }
                      >
                        <Pressable
                          style={[
                            styles.acceptButton,
                            processing &&
                              styles.disabledButton,
                          ]}
                          disabled={
                            processing
                          }
                          onPress={() =>
                            handleAccept(
                              appointment.id
                            )
                          }
                        >
                          <Text
                            style={
                              styles.acceptButtonText
                            }
                          >
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
                          disabled={
                            processing
                          }
                          onPress={() =>
                            handleReject(
                              appointment.id
                            )
                          }
                        >
                          <Text
                            style={
                              styles.rejectButtonText
                            }
                          >
                            Rechazar
                          </Text>
                        </Pressable>
                      </View>
                    )}

                    {appointment.status ===
                      "ACCEPTED" && (
                      <View
                        style={
                          styles.acceptedActionsSection
                        }
                      >
                        <Text
                          style={
                            styles.acceptedActionsTitle
                          }
                        >
                          Gestión de la cita
                        </Text>

                        {canComplete ? (
                          <Pressable
                            style={[
                              styles.completeButton,
                              processing && styles.disabledButton,
                            ]}
                            disabled={processing}
                            onPress={() =>
                              handleComplete(appointment.id)
                            }
                          >
                            <Text style={styles.completeButtonText}>
                              {processing
                                ? "Procesando..."
                                : "Marcar como completada"}
                            </Text>
                          </Pressable>
                        ) : (
                          <Text style={styles.actionAvailabilityHint}>
                            Podrás completar esta cita después de la hora programada.
                          </Text>
                        )}

                        {canAdminCancel && (
                          <>
                            <Text style={styles.adminCancelHint}>
                              Si surge una situación de fuerza mayor antes de la cita, puedes cancelarla y liberar el horario.
                            </Text>

                            <Pressable
                              style={[
                                styles.adminCancelButton,
                                processing && styles.disabledButton,
                              ]}
                              disabled={processing}
                              onPress={() =>
                                confirmAdminCancel(appointment.id)
                              }
                            >
                              <Text style={styles.adminCancelButtonText}>
                                {processing
                                  ? "Procesando..."
                                  : "Cancelar cita"}
                              </Text>
                            </Pressable>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                  </Fragment>
                );
              }
            )
          )}
        </>
      )}

      <BackButton fallbackHref="/admin" />
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
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
      justifyContent: "center",
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
      marginBottom:
        SPACING.xl,
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

    summaryCard: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.lg,
      marginBottom:
        SPACING.xl,
    },

    summaryLabel: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
      marginBottom: 4,
    },

    summaryValue: {
      fontSize: 34,
      fontWeight: "800",
      color: COLORS.text,
    },

    summaryHint: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textMuted,
      marginTop: 2,
    },

    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.warningBackground,
      justifyContent: "center",
      alignItems: "center",
    },

    summaryIconText: {
      color:
        COLORS.warning,
      fontSize: 22,
      fontWeight: "800",
    },

    filterLabel: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.md,
    },

    filterContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
      paddingRight: SPACING.lg,
      marginBottom:
        SPACING.xl,
    },

    filterButton: {
      minHeight: 42,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.pill,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 9,
    },

    activeFilterButton: {
      backgroundColor:
        COLORS.primary,
      borderColor:
        COLORS.primary,
    },

    filterButtonText: {
      color:
        COLORS.textSecondary,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    activeFilterButtonText: {
      color: "#FFFFFF",
    },

    filterCountBadge: {
      minWidth: 24,
      height: 24,
      paddingHorizontal: SPACING.xs,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
    },

    activeFilterCountBadge: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },

    filterCountText: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      fontWeight: "800",
    },

    activeFilterCountText: {
      color: "#FFFFFF",
    },

    sectionTitle: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.md,
    },

    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
    },

    dayHeaderText: {
      color: COLORS.text,
      fontSize: FONT.subheading,
      fontWeight: "800",
    },

    dayHeaderCount: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      fontWeight: "600",
    },

    expandedDetails: {
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },

    detailLabel: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      fontWeight: "700",
      marginBottom: SPACING.xs,
    },

    detailsButton: {
      alignItems: "center",
      marginTop: SPACING.md,
      paddingVertical: 10,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.primarySoft,
    },

    detailsButtonText: {
      color: COLORS.text,
      fontSize: FONT.small,
      fontWeight: "700",
    },

    card: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
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

    clientInfo: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },

    avatar: {
      width: 44,
      height: 44,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.primarySoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight:
        SPACING.sm,
    },

    avatarText: {
      fontSize:
        FONT.body,
      fontWeight: "800",
      color: COLORS.text,
    },

    clientTextBlock: {
      flex: 1,
    },

    clientName: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom: 3,
    },

    phone: {
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

    serviceLabel: {
      fontSize:
        FONT.caption,
      fontWeight: "700",
      letterSpacing: 0.8,
      color:
        COLORS.textMuted,
      marginBottom: 4,
    },

    service: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.md,
    },

    infoRow: {
      flexDirection: "row",
      gap: SPACING.lg,
    },

    infoBlock: {
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
      color: COLORS.text,
    },

    actionsContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop:
        SPACING.lg,
    },

    acceptButton: {
      flex: 1,
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.md,
      paddingVertical: 14,
      alignItems: "center",
    },

    acceptButtonText: {
      color: "#FFFFFF",
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    rejectButton: {
      flex: 1,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.danger,
      borderRadius:
        RADIUS.md,
      paddingVertical: 14,
      alignItems: "center",
    },

    rejectButtonText: {
      color:
        COLORS.danger,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    acceptedActionsSection: {
      marginTop:
        SPACING.lg,
      paddingTop:
        SPACING.md,
      borderTopWidth: 1,
      borderTopColor:
        COLORS.border,
    },

    acceptedActionsTitle: {
      fontSize:
        FONT.small,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    completeButton: {
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.md,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom:
        SPACING.md,
    },

    completeButtonText: {
      color: "#FFFFFF",
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    actionAvailabilityHint: {
      marginBottom: SPACING.md,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.primarySoft,
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      lineHeight: 20,
      fontWeight: "600",
      textAlign: "center",
    },

    adminCancelHint: {
      fontSize:
        FONT.caption,
      lineHeight: 18,
      color:
        COLORS.textSecondary,
      marginBottom:
        SPACING.sm,
    },

    adminCancelButton: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.danger,
      borderRadius:
        RADIUS.md,
      paddingVertical: 13,
      alignItems: "center",
    },

    adminCancelButtonText: {
      color:
        COLORS.danger,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    disabledButton: {
      opacity: 0.5,
    },

    messageCard: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
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
      fontSize:
        FONT.small,
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
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    emptyCard: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.xl,
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
        COLORS.successBackground,
      justifyContent: "center",
      alignItems: "center",
      marginBottom:
        SPACING.md,
    },

    emptyIconText: {
      fontSize: 26,
      color:
        COLORS.success,
      fontWeight: "800",
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
      fontSize:
        FONT.body,
      lineHeight: 23,
      color:
        COLORS.textSecondary,
      textAlign: "center",
    },
  });
