import { Fragment, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Linking,
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
import AppIcon from "../../components/AppIcon";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
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

function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 8) {
    return `505${digits}`;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  return digits;
}

function getWhatsAppMessage(
  appointment: AdminAppointment,
  status: "ACCEPTED" | "REJECTED"
) {
  const clientName = appointment.firstName.trim();
  const greeting = clientName ? `Hola, ${clientName}.` : "Hola.";
  const appointmentDetails = `${appointment.service} para el ${formatDisplayDate(
    appointment.date
  )} a las ${formatDisplayTime(appointment.time)}`;

  if (status === "ACCEPTED") {
    return `${greeting} Tu cita de ${appointmentDetails} ha sido confirmada. ¡Te esperamos en Barbería Cale!`;
  }

  return `${greeting} No pudimos confirmar tu cita de ${appointmentDetails}. Puedes ingresar a la aplicación para elegir otro horario.`;
}

async function openWhatsAppNotification(
  appointment: AdminAppointment,
  status: "ACCEPTED" | "REJECTED"
) {
  const phone = normalizeWhatsAppPhone(appointment.phone);

  if (!phone) {
    throw new Error("El cliente no tiene un número de teléfono válido.");
  }

  const message = getWhatsAppMessage(appointment, status);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.location.assign(whatsappUrl);
    return;
  }

  await Linking.openURL(whatsappUrl);
}

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

  const appointment = appointments.find(
    (item) => item.id === appointmentId
  );

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

    if (appointment) {
      try {
        await openWhatsAppNotification(appointment, "ACCEPTED");
      } catch {
        showMessage(
          "Cita confirmada",
          `La cita fue confirmada, pero no se pudo abrir WhatsApp. Puedes contactar al cliente al ${appointment.phone}.`
        );
      }
    } else {
      showMessage(
        "Cita confirmada",
        "La solicitud fue aceptada correctamente."
      );
    }
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

  const appointment = appointments.find(
    (item) => item.id === appointmentId
  );

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

    if (appointment) {
      try {
        await openWhatsAppNotification(appointment, "REJECTED");
      } catch {
        showMessage(
          "Cita rechazada",
          `La cita fue rechazada, pero no se pudo abrir WhatsApp. Puedes contactar al cliente al ${appointment.phone}.`
        );
      }
    } else {
      showMessage(
        "Cita rechazada",
        "La solicitud fue rechazada correctamente."
      );
    }
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
          color={COLORS.primary}
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
        <View style={styles.headerContent}>
          <View style={styles.headerAccent} />

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

        <BackButton
          iconOnly
          fallbackHref="/admin"
        />
      </View>

      <View
        style={
          styles.summaryCard
        }
      >
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>
            TRABAJO PENDIENTE
          </Text>

          <Text style={styles.summaryTitle}>
            {pendingCount === 0
              ? "Todo está al día"
              : pendingCount === 1
                ? "1 solicitud por revisar"
                : `${pendingCount} solicitudes por revisar`}
          </Text>

          <Text style={styles.summaryHint}>
            {pendingCount === 0
              ? "No hay nuevas solicitudes esperando respuesta."
              : "Acepta o rechaza las solicitudes para mantener la agenda al día."}
          </Text>
        </View>

        <View
          style={
            styles.summaryIcon
          }
        >
          <AppIcon
            name={{
              ios: "bell.fill",
              android: "notifications",
              web: "notifications",
            }}
            size={23}
            color={COLORS.primary}
          />
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
        style={styles.filterScroll}
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
                accessibilityRole="tab"
                accessibilityLabel={`${filter.label}, ${getFilterCount(filter.value)}`}
                accessibilityState={{
                  selected: active,
                }}
                hitSlop={4}
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
            accessibilityRole="button"
            accessibilityLabel="Intentar cargar las citas nuevamente"
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
                <AppIcon
                  name={{
                    ios: "checkmark.circle.fill",
                    android: "check_circle",
                    web: "check_circle",
                  }}
                  size={28}
                  color={COLORS.success}
                />
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
                    style={[
                      styles.card,
                      operationalView &&
                        styles.operationalCard,
                    ]}
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

                    <View style={styles.serviceRow}>
                      <View style={styles.serviceIcon}>
                        <AppIcon
                          name={{
                            ios: "scissors",
                            android: "content_cut",
                            web: "content_cut",
                          }}
                          size={20}
                          color={COLORS.primary}
                        />
                      </View>

                      <View style={styles.serviceContent}>
                        <Text style={styles.serviceLabel}>
                          SERVICIO
                        </Text>

                        <Text style={styles.service}>
                          {appointment.service}
                        </Text>
                      </View>
                    </View>

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
                        <AppIcon
                          name={{
                            ios: "calendar",
                            android: "calendar_month",
                            web: "calendar_month",
                          }}
                          size={19}
                          color={COLORS.primary}
                        />

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
                        <AppIcon
                          name={{
                            ios: "clock",
                            android: "schedule",
                            web: "schedule",
                          }}
                          size={19}
                          color={COLORS.primary}
                        />

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
                        <View style={styles.detailIcon}>
                          <AppIcon
                            name={{
                              ios: "phone.fill",
                              android: "call",
                              web: "call",
                            }}
                            size={18}
                            color={COLORS.primary}
                          />
                        </View>

                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>
                            TELÉFONO
                          </Text>

                          <Text style={styles.phone}>
                            {appointment.phone}
                          </Text>
                        </View>
                      </View>
                    )}

                    <Pressable
                      style={styles.detailsButton}
                      accessibilityRole="button"
                      accessibilityState={{
                        expanded,
                      }}
                      accessibilityLabel={
                        expanded
                          ? "Ocultar los detalles de la cita"
                          : "Ver los detalles de la cita"
                      }
                      onPress={() =>
                        setExpandedAppointmentId(
                          expanded ? null : appointment.id
                        )
                      }
                    >
                      <AppIcon
                        name={{
                          ios: expanded
                            ? "chevron.up"
                            : "chevron.down",
                          android: expanded
                            ? "expand_less"
                            : "expand_more",
                          web: expanded
                            ? "expand_less"
                            : "expand_more",
                        }}
                        size={18}
                        color={COLORS.primary}
                      />

                      <Text style={styles.detailsButtonText}>
                        {expanded
                          ? "Ocultar detalles"
                          : "Ver detalles"}
                      </Text>
                    </Pressable>

                    {appointment.status ===
                      "PENDING" && (
                      <View
                        style={[
                          styles.actionsContainer,
                          Platform.OS === "web" &&
                            styles.webActionsContainer,
                        ]}
                      >
                        <Pressable
                          style={[
                            styles.acceptButton,
                            Platform.OS === "web" &&
                              styles.webRequestButton,
                            processing &&
                              styles.disabledButton,
                          ]}
                          disabled={
                            processing
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Aceptar cita"
                          accessibilityState={{
                            disabled: processing,
                          }}
                          onPress={() =>
                            handleAccept(
                              appointment.id
                            )
                          }
                        >
                          <AppIcon
                            name={{
                              ios: "checkmark",
                              android: "check",
                              web: "check",
                            }}
                            size={18}
                            color={COLORS.onPrimary}
                          />

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
                            Platform.OS === "web" &&
                              styles.webRequestButton,
                            processing &&
                              styles.disabledButton,
                          ]}
                          disabled={
                            processing
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Rechazar cita"
                          accessibilityState={{
                            disabled: processing,
                          }}
                          onPress={() =>
                            handleReject(
                              appointment.id
                            )
                          }
                        >
                          <AppIcon
                            name={{
                              ios: "xmark",
                              android: "close",
                              web: "close",
                            }}
                            size={18}
                            color={COLORS.danger}
                          />

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
                              Platform.OS === "web" &&
                                styles.webManagementButton,
                              processing && styles.disabledButton,
                            ]}
                            disabled={processing}
                            accessibilityRole="button"
                            accessibilityLabel="Marcar cita como completada"
                            accessibilityState={{
                              disabled: processing,
                            }}
                            onPress={() =>
                              handleComplete(appointment.id)
                            }
                          >
                            <AppIcon
                              name={{
                                ios: "checkmark.circle.fill",
                                android: "task_alt",
                                web: "task_alt",
                              }}
                              size={18}
                              color={COLORS.onPrimary}
                            />

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
                                Platform.OS === "web" &&
                                  styles.webManagementButton,
                                processing && styles.disabledButton,
                              ]}
                              disabled={processing}
                              accessibilityRole="button"
                              accessibilityLabel="Cancelar cita administrativamente"
                              accessibilityState={{
                                disabled: processing,
                              }}
                              onPress={() =>
                                confirmAdminCancel(appointment.id)
                              }
                            >
                              <AppIcon
                                name={{
                                  ios: "xmark.circle",
                                  android: "event_busy",
                                  web: "event_busy",
                                }}
                                size={18}
                                color={COLORS.danger}
                              />

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
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.md,
      marginBottom:
        SPACING.xl,
    },

    headerContent: {
      flex: 1,
    },

    headerAccent: {
      width: 42,
      height: 3,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.accent,
      marginBottom: SPACING.md,
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
      fontFamily: FONT_FAMILY.display,
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
        COLORS.primarySoft,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.lg,
      marginBottom:
        SPACING.xl,
    },

    summaryContent: {
      flex: 1,
      paddingRight: SPACING.md,
    },

    summaryLabel: {
      fontSize:
        FONT.caption,
      fontWeight: "800",
      letterSpacing: 0.9,
      color:
        COLORS.primary,
      marginBottom: SPACING.xs,
    },

    summaryTitle: {
      fontSize: FONT.heading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "800",
      color: COLORS.text,
      marginBottom: SPACING.xs,
    },

    summaryHint: {
      fontSize:
        FONT.small,
      lineHeight: 20,
      color:
        COLORS.textMuted,
    },

    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.surface,
      justifyContent: "center",
      alignItems: "center",
    },

    filterLabel: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.md,
    },

    filterScroll: {
      flexGrow: 0,
      flexShrink: 0,
      height: 42,
      marginBottom:
        SPACING.xl,
    },

    filterContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
      paddingRight: SPACING.lg,
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
      color: COLORS.onPrimary,
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
      color: COLORS.onPrimary,
    },

    sectionTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
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
      paddingBottom: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.accentSoft,
    },

    dayHeaderText: {
      color: COLORS.text,
      fontSize: FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "800",
    },

    dayHeaderCount: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      fontWeight: "600",
    },

    expandedDetails: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },

    detailIcon: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    detailContent: {
      flex: 1,
    },

    detailLabel: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      fontWeight: "700",
      marginBottom: SPACING.xs,
    },

    detailsButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: SPACING.xs,
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 9,
      borderRadius: RADIUS.pill,
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

    operationalCard: {
      borderColor: COLORS.accentSoft,
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
      flexShrink: 0,
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

    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.lg,
      marginBottom: SPACING.md,
    },

    serviceIcon: {
      width: 42,
      height: 42,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    serviceContent: {
      flex: 1,
      minWidth: 0,
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
    },

    infoRow: {
      flexDirection: "row",
      gap: SPACING.lg,
    },

    infoBlock: {
      flex: 1,
      minWidth: 0,
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    },

    infoLabel: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textSecondary,
      marginTop: SPACING.sm,
      marginBottom: 5,
    },

    infoValue: {
      fontSize:
        FONT.small,
      lineHeight: 20,
      fontWeight: "700",
      color: COLORS.text,
    },

    actionsContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginTop:
        SPACING.lg,
    },

    webActionsContainer: {
      justifyContent: "center",
      gap: SPACING.xl,
    },

    acceptButton: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 14,
      alignItems: "center",
    },

    acceptButtonText: {
      color: COLORS.onPrimary,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    rejectButton: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.danger,
      borderRadius:
        RADIUS.pill,
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

    webRequestButton: {
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: "auto",
      minWidth: 110,
      minHeight: 42,
      justifyContent: "center",
      borderRadius:
        RADIUS.pill,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 9,
    },

    acceptedActionsSection: {
      marginTop:
        SPACING.lg,
      padding: SPACING.md,
      borderRadius: RADIUS.lg,
      backgroundColor: COLORS.primarySoft,
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
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom:
        SPACING.md,
    },

    completeButtonText: {
      color: COLORS.onPrimary,
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
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.danger,
      borderRadius:
        RADIUS.pill,
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

    webManagementButton: {
      width: 220,
      maxWidth: "100%",
      alignSelf: "flex-start",
      paddingHorizontal:
        SPACING.md,
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
      fontFamily: FONT_FAMILY.display,
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
        RADIUS.pill,
      paddingVertical: 14,
      alignItems: "center",
      marginTop:
        SPACING.lg,
    },

    retryButtonText: {
      color: COLORS.onPrimary,
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

    emptyTitle: {
      fontSize:
        FONT.heading,
      fontFamily: FONT_FAMILY.display,
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
