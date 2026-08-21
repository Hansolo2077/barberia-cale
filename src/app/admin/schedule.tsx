import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

function getSevenDaysLater() {
  const date = new Date();

  date.setDate(
    date.getDate() + 7
  );

  return date;
}

export default function AdminScheduleScreen() {
  const router = useRouter();
  const { token } = useAuth();

  const initialStartDate =
    new Date();

  const initialEndDate =
    getSevenDaysLater();

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
    useState<StatusFilter>("PENDING");

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
          onPress={() =>
            loadSchedule()
          }
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
        <>
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

          <View
            style={
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
                      {
                        filter.label
                      }
                    </Text>
                  </Pressable>
                );
              }
            )}
          </View>

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
              (appointment) => {
                const statusStyle =
                  getStatusStyle(
                    appointment.status
                  );

                return (
                  <View
                    key={
                      appointment.id
                    }
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

                    <Text
                      style={
                        styles.phone
                      }
                    >
                      {
                        appointment.phone
                      }
                    </Text>
                  </View>
                );
              }
            )
          )}
        </>
      )}

      <BackButton />
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
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginBottom:
        SPACING.xl,
    },

    filterButton: {
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

    resultsHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom:
        SPACING.md,
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