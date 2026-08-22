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

import {
    COLORS,
    FONT,
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
    useState<StatusFilter>("ALL");

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
    setStatusFilter("ALL");
    setExpandedAppointmentId(null);
    setShouldScrollResults(true);
    void loadSchedule(formattedStart, formattedEnd);
  }

  function consultCustomRange() {
    setActivePreset("CUSTOM");
    setStatusFilter("ALL");
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
      value: "ALL",
      label: "Todas",
    },
    {
      value: "PENDING",
      label: "Pendientes",
    },
    {
      value: "ACCEPTED",
      label: "Confirmadas",
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
        <Text
          style={
            styles.sectionTitle
          }
        >
          Período
        </Text>

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
          onPress={() => {
            setShowCustomRange((current) => !current);
            setActivePreset("CUSTOM");
          }}
        >
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
          onPress={consultCustomRange}
        >
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
          <View
            style={
              styles.periodBox
            }
          >
            <Text
              style={
                styles.periodLabel
              }
            >
              PERÍODO CONSULTADO
            </Text>

            <Text
              style={
                styles.periodText
              }
            >
              {formatDisplayDate(
  startDateText
)}
{" — "}
{formatDisplayDate(
  endDateText
)}
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <View
              style={
                styles.summaryCard
              }
            >
              <Text
                style={
                  styles.summaryNumber
                }
              >
                {
                  appointments.length
                }
              </Text>

              <Text
                style={
                  styles.summaryText
                }
              >
                Total
              </Text>
            </View>

            <View
              style={
                styles.summaryCard
              }
            >
              <Text
                style={
                  styles.summaryNumber
                }
              >
                {pendingCount}
              </Text>

              <Text
                style={
                  styles.summaryText
                }
              >
                Pendientes
              </Text>
            </View>

            <View
              style={
                styles.summaryCard
              }
            >
              <Text
                style={
                  styles.summaryNumber
                }
              >
                {acceptedCount}
              </Text>

              <Text
                style={
                  styles.summaryText
                }
              >
                Confirmadas
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
                      setStatusFilter(
                        filter.value
                      )
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
                        styles.cardHeader
                      }
                    >
                      <View
                        style={
                          styles.dateTimeContainer
                        }
                      >
                        <Text
                          style={
                            styles.time
                          }
                        >
                          {
                            formatDisplayTime(
  appointment.time
)
                          }
                        </Text>

                        <Text
                          style={
                            styles.date
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

                    <Text
                      style={
                        styles.service
                      }
                    >
                      {
                        appointment.service
                      }
                    </Text>

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

    sectionTitle: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom:
        SPACING.lg,
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
      color: "#FFFFFF",
    },

    customRangeToggle: {
      alignSelf: "flex-start",
      marginTop: SPACING.md,
      paddingVertical: SPACING.xs,
    },

    customRangeToggleText: {
      color: COLORS.text,
      fontSize: FONT.small,
      fontWeight: "700",
      textDecorationLine: "underline",
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
      backgroundColor:
        COLORS.primary,
      paddingVertical: 14,
      borderRadius:
        RADIUS.md,
      alignItems: "center",
      marginTop:
        SPACING.lg,
    },

    searchButtonText: {
      color: "#FFFFFF",
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

    periodBox: {
      marginBottom:
        SPACING.lg,
    },

    periodLabel: {
      fontSize:
        FONT.caption,
      fontWeight: "700",
      letterSpacing: 0.8,
      color:
        COLORS.textMuted,
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

    summaryRow: {
      flexDirection: "row",
      gap: SPACING.sm,
      marginBottom:
        SPACING.xl,
    },

    summaryCard: {
      flex: 1,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.md,
      padding:
        SPACING.md,
      alignItems: "center",
    },

    summaryNumber: {
      fontSize: 24,
      fontWeight: "800",
      color:
        COLORS.text,
      marginBottom: 3,
    },

    summaryText: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textSecondary,
      textAlign: "center",
    },

    filterLabel: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color:
        COLORS.text,
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

    resultsTitle: {
      fontSize:
        FONT.subheading,
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

    cardHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      gap: SPACING.md,
    },

    dateTimeContainer: {
      flex: 1,
    },

    time: {
      fontSize: 24,
      fontWeight: "800",
      color:
        COLORS.text,
    },

    date: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
      marginTop: 3,
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

    clientName: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom: 5,
    },

    service: {
      fontSize:
        FONT.small,
      color:
        COLORS.text,
      marginBottom: 5,
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

    emptyIconText: {
      fontSize: 25,
      fontWeight: "800",
      color:
        COLORS.success,
    },

    emptyTitle: {
      fontSize:
        FONT.heading,
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
