import { useRouter } from "expo-router";
import { Fragment, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
    AdminAppointment,
    getAdminSchedule,
} from "../../api/admin.api";

import BackButton from "../../components/BackButton";
import AppIcon from "../../components/AppIcon";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

import { useAuth } from "../../context/AuthContext";

type StatusFilter =
  | "ALL"
  | "PENDING"
  | "ACCEPTED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED";

function formatDate(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function AdminScheduleScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const initialStartDate =
    new Date();

  const initialEndDate =
    initialStartDate;

  const [
    selectedStartDate,
    setSelectedStartDate,
  ] = useState(initialStartDate);

  const [
    selectedEndDate,
    setSelectedEndDate,
  ] = useState(initialEndDate);

  const [
    startDateText,
    setStartDateText,
  ] = useState(
    formatDate(initialStartDate)
  );

  const [
    endDateText,
    setEndDateText,
  ] = useState(
    formatDate(initialEndDate)
  );

  const [
    appliedStartDateText,
    setAppliedStartDateText,
  ] = useState(
    formatDate(initialStartDate)
  );

  const [
    appliedEndDateText,
    setAppliedEndDateText,
  ] = useState(
    formatDate(initialEndDate)
  );

  const [
    showStartPicker,
    setShowStartPicker,
  ] = useState(false);

  const [
    showEndPicker,
    setShowEndPicker,
  ] = useState(false);

  const [
    appointments,
    setAppointments,
  ] =
    useState<AdminAppointment[]>([]);

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("PENDING");

  const [showCustomRange, setShowCustomRange] =
    useState(false);

  const [activePreset, setActivePreset] =
    useState<"TODAY" | "TOMORROW" | "WEEK" | "CUSTOM">("TODAY");

  const [expandedAppointmentId, setExpandedAppointmentId] =
    useState<number | null>(null);

  const [shouldScrollResults, setShouldScrollResults] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (token) {
      loadSchedule();
    }
  }, [token]);

  async function loadSchedule(
    customStartDate?: string,
    customEndDate?: string
  ) {
    if (!token) {
      return;
    }

    const startDate =
      customStartDate ||
      startDateText;

    const endDate =
      customEndDate ||
      endDateText;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        startDate
      ) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        endDate
      )
    ) {
      setError(
        "Ingresa fechas válidas en formato AAAA-MM-DD."
      );

      setLoading(false);
      return;
    }

    if (startDate > endDate) {
      setError(
        "La fecha inicial no puede ser posterior a la fecha final."
      );

      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result =
        await getAdminSchedule(
          token,
          startDate,
          endDate
        );

      setAppointments(
        result.appointments
      );

      setAppliedStartDateText(startDate);
      setAppliedEndDateText(endDate);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la agenda."
      );
    } finally {
      setLoading(false);
    }
  }

  function selectPreset(
    preset: "TODAY" | "TOMORROW" | "WEEK"
  ) {
    const today = new Date();
    const start =
      preset === "TOMORROW"
        ? addDays(today, 1)
        : today;
    const end =
      preset === "WEEK"
        ? addDays(today, 6)
        : start;
    const formattedStart = formatDate(start);
    const formattedEnd = formatDate(end);

    setActivePreset(preset);
    setShowCustomRange(false);
    setSelectedStartDate(start);
    setSelectedEndDate(end);
    setStartDateText(formattedStart);
    setEndDateText(formattedEnd);
    setStatusFilter("PENDING");
    setExpandedAppointmentId(null);
    setShouldScrollResults(true);
    void loadSchedule(formattedStart, formattedEnd);
  }

  function consultCustomRange() {
    setActivePreset("CUSTOM");
    setStatusFilter("PENDING");
    setExpandedAppointmentId(null);
    setShouldScrollResults(true);
    void loadSchedule();
  }

  function handleResultsLayout(y: number) {
    if (!shouldScrollResults || loading) {
      return;
    }

    setShouldScrollResults(false);
    scrollViewRef.current?.scrollTo({
      y: Math.max(y - SPACING.md, 0),
      animated: true,
    });
  }

  function handleStartDateChange(
    event: any,
    date?: Date
  ) {
    setShowStartPicker(false);

    if (!date) {
      return;
    }

    setSelectedStartDate(date);

    const formattedDate =
      formatDate(date);

    setStartDateText(
      formattedDate
    );

    /*
     * Si la nueva fecha inicial queda
     * después de la fecha final,
     * ajustamos también la fecha final.
     */
    if (
      formattedDate >
      endDateText
    ) {
      setSelectedEndDate(date);
      setEndDateText(
        formattedDate
      );
    }
  }

  function handleEndDateChange(
    event: any,
    date?: Date
  ) {
    setShowEndPicker(false);

    if (!date) {
      return;
    }

    setSelectedEndDate(date);

    setEndDateText(
      formatDate(date)
    );
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
      case "PENDING":
        return {
          background:
            COLORS.warningBackground,
          text:
            COLORS.warning,
        };

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

  const filteredAppointments =
    statusFilter === "ALL"
      ? appointments
      : appointments.filter(
          (appointment) =>
            appointment.status ===
            statusFilter
        );

  const dayAppointmentCounts =
    filteredAppointments.reduce<Record<string, number>>(
      (counts, appointment) => {
        counts[appointment.date] =
          (counts[appointment.date] ?? 0) + 1;

        return counts;
      },
      {}
    );

  const pendingCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "PENDING"
    ).length;

  const acceptedCount =
    appointments.filter(
      (appointment) =>
        appointment.status ===
        "ACCEPTED"
    ).length;

  function getFilterCount(filter: StatusFilter) {
    if (filter === "ALL") {
      return appointments.length;
    }

    return appointments.filter(
      (appointment) => appointment.status === filter
    ).length;
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
            CALENDARIO
          </Text>

          <Text style={styles.title}>
            Agenda
          </Text>

          <Text style={styles.subtitle}>
            Consulta las citas dentro de
            un rango de fechas y filtra
            los resultados por estado.
          </Text>
        </View>

        <BackButton
          iconOnly
          fallbackHref="/admin"
        />
      </View>

      <View
        style={
          styles.dateSection
        }
      >
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <AppIcon
              name={{
                ios: "calendar",
                android: "calendar_month",
                web: "calendar_month",
              }}
              size={20}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.sectionHeadingContent}>
            <Text style={styles.sectionTitle}>
              Elige el período
            </Text>

            <Text style={styles.sectionHint}>
              Consulta rápidamente hoy, mañana o los próximos siete días.
            </Text>
          </View>
        </View>

        <View style={styles.presetContainer}>
          {[
            { value: "TODAY" as const, label: "Hoy" },
            { value: "TOMORROW" as const, label: "Mañana" },
            { value: "WEEK" as const, label: "7 días" },
          ].map((preset) => {
            const active = activePreset === preset.value;

            return (
              <Pressable
                key={preset.value}
                style={[
                  styles.presetButton,
                  active && styles.activePresetButton,
                ]}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel={`Consultar agenda de ${preset.label.toLowerCase()}`}
                accessibilityState={{
                  selected: active,
                  disabled: loading,
                }}
                onPress={() => selectPreset(preset.value)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    active && styles.activePresetButtonText,
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={styles.customRangeToggle}
          accessibilityRole="button"
          accessibilityState={{
            expanded: showCustomRange,
          }}
          onPress={() => {
            setShowCustomRange((current) => !current);
            setActivePreset("CUSTOM");
          }}
        >
          <AppIcon
            name={{
              ios: showCustomRange ? "chevron.up" : "chevron.down",
              android: showCustomRange ? "expand_less" : "expand_more",
              web: showCustomRange ? "expand_less" : "expand_more",
            }}
            size={18}
            color={COLORS.primary}
          />

          <Text style={styles.customRangeToggleText}>
            {showCustomRange
              ? "Ocultar rango personalizado"
              : "Elegir un rango personalizado"}
          </Text>
        </Pressable>

        {showCustomRange && (
          <View style={styles.customRangeContent}>

        <Text style={styles.label}>
          Fecha inicial
        </Text>

        {Platform.OS ===
        "web" ? (
          <>
            <TextInput
              style={styles.input}
              accessibilityLabel="Fecha inicial"
              value={
                startDateText
              }
              onChangeText={
                setStartDateText
              }
              placeholder="AAAA-MM-DD"
              maxLength={10}
            />

            <Text
              style={
                styles.helperText
              }
            >
              Formato: AAAA-MM-DD
            </Text>
          </>
        ) : (
          <>
            <Pressable
              style={
                styles.dateButton
              }
              accessibilityRole="button"
              accessibilityLabel={`Elegir fecha inicial, ${formatDisplayDate(startDateText)}`}
              onPress={() =>
                setShowStartPicker(
                  true
                )
              }
            >
              <Text
                style={
                  styles.dateButtonText
                }
              >
                {startDateText}
              </Text>
            </Pressable>

            {showStartPicker && (
              <DateTimePicker
                value={
                  selectedStartDate
                }
                mode="date"
                display="default"
                onChange={
                  handleStartDateChange
                }
              />
            )}
          </>
        )}

        <Text
          style={[
            styles.label,
            styles.endDateLabel,
          ]}
        >
          Fecha final
        </Text>

        {Platform.OS ===
        "web" ? (
          <>
            <TextInput
              style={styles.input}
              accessibilityLabel="Fecha final"
              value={endDateText}
              onChangeText={
                setEndDateText
              }
              placeholder="AAAA-MM-DD"
              maxLength={10}
            />

            <Text
              style={
                styles.helperText
              }
            >
              Formato: AAAA-MM-DD
            </Text>
          </>
        ) : (
          <>
            <Pressable
              style={
                styles.dateButton
              }
              accessibilityRole="button"
              accessibilityLabel={`Elegir fecha final, ${formatDisplayDate(endDateText)}`}
              onPress={() =>
                setShowEndPicker(
                  true
                )
              }
            >
              <Text
                style={
                  styles.dateButtonText
                }
              >
                {endDateText}
              </Text>
            </Pressable>

            {showEndPicker && (
              <DateTimePicker
                value={
                  selectedEndDate
                }
                mode="date"
                display="default"
                minimumDate={
                  selectedStartDate
                }
                onChange={
                  handleEndDateChange
                }
              />
            )}
          </>
        )}

        <Text
          style={
            styles.rangeHelper
          }
        >
          Para consultar un solo día,
          utiliza la misma fecha inicial
          y final.
        </Text>

        <Pressable
          style={[
            styles.searchButton,
            loading &&
              styles.disabledButton,
          ]}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Consultar agenda del rango seleccionado"
          accessibilityState={{
            disabled: loading,
          }}
          onPress={consultCustomRange}
        >
          <AppIcon
            name={{
              ios: "calendar.badge.checkmark",
              android: "date_range",
              web: "date_range",
            }}
            size={19}
            color={COLORS.onPrimary}
          />

          <Text
            style={
              styles.searchButtonText
            }
          >
            {loading
              ? "Consultando..."
              : "Consultar agenda"}
          </Text>
        </Pressable>
          </View>
        )}
      </View>

      {loading ? (
        <View
          style={
            styles.loadingContainer
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
            Cargando agenda...
          </Text>
        </View>
      ) : error ? (
        <View
          style={
            styles.messageBox
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            No pudimos consultar
            la agenda
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>
        </View>
      ) : (
        <View
          onLayout={(event) =>
            handleResultsLayout(
              event.nativeEvent.layout.y
            )
          }
        >
          <View style={styles.periodSummary}>
            <View style={styles.periodSummaryHeader}>
              <View style={styles.periodIcon}>
                <AppIcon
                  name={{
                    ios: "calendar.circle.fill",
                    android: "calendar_month",
                    web: "calendar_month",
                  }}
                  size={24}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.periodContent}>
                <Text style={styles.periodLabel}>
                  PERÍODO CONSULTADO
                </Text>

                <Text style={styles.periodText}>
                  {formatDisplayDate(appliedStartDateText)}
                  {" — "}
                  {formatDisplayDate(appliedEndDateText)}
                </Text>
              </View>
            </View>

            <Text style={styles.periodNarrative}>
              {appointments.length === 0
                ? "La agenda está despejada para este período."
                : appointments.length === 1
                  ? "Hay una cita programada en este período."
                  : `Hay ${appointments.length} citas programadas en este período.`}
            </Text>

            <View style={styles.summaryMetrics}>
              <View style={styles.summaryMetric}>
                <Text style={styles.summaryMetricValue}>
                  {appointments.length}
                </Text>

                <Text style={styles.summaryMetricLabel}>
                  Total
                </Text>
              </View>

              <View style={styles.summaryMetric}>
                <Text style={styles.summaryMetricValue}>
                  {pendingCount}
                </Text>

                <Text style={styles.summaryMetricLabel}>
                  Pendientes
                </Text>
              </View>

              <View style={styles.summaryMetric}>
                <Text style={styles.summaryMetricValue}>
                  {acceptedCount}
                </Text>

                <Text style={styles.summaryMetricLabel}>
                  Confirmadas
                </Text>
              </View>
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
                      setStatusFilter(
                        filter.value
                      )
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

          <View
            style={
              styles.resultsHeader
            }
          >
            <Text
              style={
                styles.resultsTitle
              }
            >
              Citas
            </Text>

            <Text
              style={
                styles.resultsCount
              }
            >
              {
                filteredAppointments.length
              }{" "}
              {filteredAppointments.length ===
              1
                ? "resultado"
                : "resultados"}
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
                    ios: "calendar.badge.checkmark",
                    android: "event_available",
                    web: "event_available",
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
                No hay citas
              </Text>

              <Text
                style={
                  styles.messageText
                }
              >
                No existen citas que
                coincidan con este
                período y estado.
              </Text>
            </View>
          ) : (
            filteredAppointments.map(
              (appointment, index) => {
                const statusStyle =
                  getStatusStyle(
                    appointment.status
                  );

                const startsNewDay =
                  index === 0 ||
                  filteredAppointments[index - 1].date !==
                    appointment.date;

                const expanded =
                  expandedAppointmentId === appointment.id;

                return (
                  <Fragment key={appointment.id}>
                  {startsNewDay && (
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayHeaderText}>
                        {formatDisplayDate(appointment.date)}
                      </Text>

                      <Text style={styles.dayHeaderCount}>
                        {dayAppointmentCounts[appointment.date]}{" "}
                        citas
                      </Text>
                    </View>
                  )}

                  <View style={styles.timelineItem}>
                    <View style={styles.timelineRail}>
                      <Text style={styles.time}>
                        {formatDisplayTime(appointment.time)}
                      </Text>

                      <View style={styles.timelineDot} />
                      <View style={styles.timelineLine} />
                    </View>

                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.clientInfo}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {appointment.firstName
                                ?.charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.clientContent}>
                            <Text style={styles.clientLabel}>
                              CLIENTE
                            </Text>

                            <Text style={styles.clientName}>
                              {appointment.firstName}{" "}
                              {appointment.lastName}
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
                            {getStatusText(appointment.status)}
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
                            size={18}
                            color={COLORS.primary}
                          />
                        </View>

                        <Text style={styles.service}>
                          {appointment.service}
                        </Text>
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
                              size={17}
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
                        accessibilityLabel={
                          expanded
                            ? "Ocultar los detalles de la cita"
                            : "Ver los detalles de la cita"
                        }
                        accessibilityState={{
                          expanded,
                        }}
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
                    </View>
                  </View>
                  </Fragment>
                );
              }
            )
          )}
        </View>
      )}

      <BackButton fallbackHref="/admin" />
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingHorizontal:
        SPACING.lg,
      paddingTop:
        SPACING.xl,
      paddingBottom:
        SPACING.xxl,
      backgroundColor:
        COLORS.background,
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
      fontSize:
        FONT.title,
      fontFamily:
        FONT_FAMILY.display,
      fontWeight: "800",
      color:
        COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    subtitle: {
      fontSize:
        FONT.body,
      color:
        COLORS.textSecondary,
      lineHeight: 24,
    },

    dateSection: {
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

    sectionHeading: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.lg,
    },

    sectionIcon: {
      width: 42,
      height: 42,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    sectionHeadingContent: {
      flex: 1,
    },

    sectionTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom: 3,
    },

    sectionHint: {
      fontSize: FONT.caption,
      lineHeight: 18,
      color: COLORS.textSecondary,
    },

    presetContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
      width: "100%",
    },

    presetButton: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xs,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.surface,
    },

    activePresetButton: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary,
    },

    presetButtonText: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      fontWeight: "700",
      textAlign: "center",
    },

    activePresetButtonText: {
      color: COLORS.onPrimary,
    },

    customRangeToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      alignSelf: "flex-start",
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 8,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
    },

    customRangeToggleText: {
      color: COLORS.text,
      fontSize: FONT.small,
      fontWeight: "700",
    },

    customRangeContent: {
      marginTop: SPACING.md,
    },

    label: {
      fontSize:
        FONT.small,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    endDateLabel: {
      marginTop:
        SPACING.lg,
    },

    input: {
      backgroundColor:
        COLORS.background,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.md,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 13,
      fontSize:
        FONT.body,
      color:
        COLORS.text,
    },

    dateButton: {
      backgroundColor:
        COLORS.background,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.md,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 14,
    },

    dateButtonText: {
      fontSize:
        FONT.body,
      fontWeight: "600",
      color:
        COLORS.text,
    },

    helperText: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textMuted,
      lineHeight: 18,
      marginTop:
        SPACING.xs,
    },

    rangeHelper: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textSecondary,
      lineHeight: 18,
      marginTop:
        SPACING.lg,
    },

    searchButton: {
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.primary,
      paddingVertical: 14,
      borderRadius:
        RADIUS.pill,
      alignItems: "center",
      marginTop:
        SPACING.lg,
    },

    searchButtonText: {
      color: COLORS.onPrimary,
      fontWeight: "700",
      fontSize:
        FONT.body,
    },

    disabledButton: {
      opacity: 0.6,
    },

    loadingContainer: {
      alignItems: "center",
      paddingVertical: 50,
    },

    loadingText: {
      color:
        COLORS.textSecondary,
      marginTop:
        SPACING.sm,
    },

    periodSummary: {
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.xl,
    },

    periodSummaryHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    periodIcon: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
    },

    periodContent: {
      flex: 1,
    },

    periodLabel: {
      fontSize:
        FONT.caption,
      fontWeight: "700",
      letterSpacing: 0.8,
      color:
        COLORS.primary,
      marginBottom:
        SPACING.xs,
    },

    periodText: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    periodNarrative: {
      fontSize: FONT.small,
      lineHeight: 20,
      color: COLORS.textSecondary,
      marginTop: SPACING.md,
    },

    summaryMetrics: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },

    summaryMetric: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      minHeight: 34,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
    },

    summaryMetricValue: {
      fontSize: FONT.small,
      fontWeight: "800",
      color: COLORS.primary,
    },

    summaryMetricLabel: {
      fontSize: FONT.caption,
      fontWeight: "600",
      color: COLORS.textSecondary,
    },

    filterLabel: {
      fontSize:
        FONT.subheading,
      lineHeight: 24,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom:
        SPACING.md,
    },

    filterScroll: {
      flexGrow: 0,
      flexShrink: 0,
      height: 44,
      marginBottom: SPACING.xl,
    },

    filterContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingRight: SPACING.lg,
      paddingVertical: 1,
    },

    filterButton: {
      height: 42,
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

    resultsHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
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
      width: 34,
      height: 34,
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

    resultsTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    resultsCount: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
    },

    timelineItem: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: SPACING.sm,
    },

    timelineRail: {
      width: 70,
      alignItems: "center",
    },

    timelineDot: {
      width: 9,
      height: 9,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.accent,
      marginTop: SPACING.sm,
    },

    timelineLine: {
      width: 1,
      flex: 1,
      minHeight: SPACING.md,
      backgroundColor: COLORS.accentSoft,
      marginTop: SPACING.xs,
      marginBottom: SPACING.sm,
    },

    card: {
      flex: 1,
      minWidth: 0,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.accentSoft,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.md,
      marginBottom:
        SPACING.md,
    },

    cardHeader: {
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
      minWidth: 0,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    avatarText: {
      fontSize: FONT.body,
      fontWeight: "800",
      color: COLORS.primary,
    },

    clientContent: {
      flex: 1,
      minWidth: 0,
    },

    clientLabel: {
      fontSize: FONT.caption,
      fontWeight: "800",
      letterSpacing: 0.7,
      color: COLORS.textMuted,
      marginBottom: 2,
    },

    time: {
      fontSize: FONT.small,
      fontWeight: "800",
      color:
        COLORS.primary,
      textAlign: "center",
      marginTop: SPACING.md,
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

    clientName: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginTop: SPACING.md,
    },

    serviceIcon: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    service: {
      flex: 1,
      fontSize:
        FONT.small,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    phone: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
    },

    messageBox: {
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

    errorTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    errorText: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
      lineHeight: 20,
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
      width: 60,
      height: 60,
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
      color:
        COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    messageText: {
      fontSize:
        FONT.body,
      color:
        COLORS.textSecondary,
      lineHeight: 22,
      textAlign: "center",
    },
  });
