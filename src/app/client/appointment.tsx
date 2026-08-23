import {
    useFocusEffect,
    useRouter,
} from "expo-router";

import {
    useCallback,
    useRef,
    useState,
} from "react";

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

import DateTimePicker from "@react-native-community/datetimepicker";

import BackButton from "../../components/BackButton";
import AppIcon from "../../components/AppIcon";

import {
    createAppointment,
    getAvailability,
} from "../../api/appointments.api";

import { useAuth } from "../../context/AuthContext";

import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";

import { showMessage } from "../../utils/show-message";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

type TimeSlot = {
  time: string;
  available: boolean;
};

function formatDate(date: Date) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTomorrowDate() {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "America/Managua",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return new Date(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day) + 1,
    12
  );
}

function addDays(date: Date, days: number) {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
}

export default function AppointmentScreen() {
  const { token } =
    useAuth();

  const router =
    useRouter();

  const scrollViewRef =
    useRef<ScrollView>(null);

  const initialDate =
    getTomorrowDate();

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(initialDate);

  const [
    dateText,
    setDateText,
  ] = useState(
    formatDate(initialDate)
  );

  const [
    showDatePicker,
    setShowDatePicker,
  ] = useState(false);

  const [
    times,
    setTimes,
  ] = useState<TimeSlot[]>([]);

  const [
    selectedTime,
    setSelectedTime,
  ] = useState<string | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    recommendationError,
    setRecommendationError,
  ] = useState("");

  const [
    hasRequestedTimes,
    setHasRequestedTimes,
  ] = useState(false);

  const [
    booking,
    setBooking,
  ] = useState(false);

  async function handleSearch(
    customDate?: string
  ) {
    if (!token) {
      showMessage(
        "Sesión no disponible",
        "Debes iniciar sesión para consultar horarios."
      );

      return;
    }

    const date =
      customDate || dateText;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      )
    ) {
      showMessage(
        "Fecha inválida",
        "Ingresa una fecha válida en formato AAAA-MM-DD."
      );

      return;
    }

    try {
      setHasRequestedTimes(true);
      setLoading(true);

      setSelectedTime(
        null
      );
      setTimes([]);

      const result =
        await getAvailability(
          token,
          date
        );

      setTimes(
        result.times
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo consultar la disponibilidad.";

      showMessage(
        "No se pudo consultar",
        message
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadNextAvailableDate() {
    if (!token) {
      return;
    }

    try {
      setHasRequestedTimes(false);
      setLoading(true);
      setRecommendationError("");
      setSelectedTime(null);

      const firstCandidate = getTomorrowDate();

      for (let offset = 0; offset < 60; offset += 1) {
        const candidate = addDays(firstCandidate, offset);
        const formatted = formatDate(candidate);
        let result;

        try {
          result = await getAvailability(token, formatted);
        } catch (error) {
          const status = (
            error as Error & { status?: number }
          ).status;

          if (status === 400) {
            continue;
          }

          throw error;
        }

        if (
          result.times.some(
            (slot: TimeSlot) => slot.available
          )
        ) {
          setSelectedDate(candidate);
          setDateText(formatted);
          setTimes(result.times);
          return;
        }
      }

      setTimes([]);
      setRecommendationError(
        "No encontramos horarios disponibles en los próximos 60 días."
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo buscar la siguiente fecha disponible.";

      setTimes([]);
      setRecommendationError(
        message
      );
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      if (token) {
        void loadNextAvailableDate();
      }
    }, [
      token,
    ])
  );

  function handleDateChange(
    event: unknown,
    date?: Date
  ) {
    setShowDatePicker(
      false
    );

    if (!date) {
      return;
    }

    setSelectedDate(
      date
    );
    setRecommendationError("");
    setHasRequestedTimes(false);
    setTimes([]);
    setSelectedTime(null);

    const formatted =
      formatDate(date);

    setDateText(
      formatted
    );

    void handleSearch(
      formatted
    );
  }

  function handleTimeSelect(time: string) {
    setSelectedTime(time);
  }

  function scrollToSection(y: number) {
    scrollViewRef.current?.scrollTo({
      y: Math.max(y - SPACING.md, 0),
      animated: true,
    });
  }

  async function handleBook() {
    if (!token) {
      showMessage(
        "Sesión no disponible",
        "Debes iniciar sesión para agendar una cita."
      );

      return;
    }

    if (!selectedTime) {
      showMessage(
        "Selecciona una hora",
        "Debes seleccionar un horario disponible."
      );

      return;
    }

    try {
      setBooking(true);

      await createAppointment(
        token,
        {
          service:
            "Corte de cabello",

          date:
            dateText,

          time:
            selectedTime,
        }
      );

      showMessage(
        "Cita solicitada",
        `Tu cita para ${formatDisplayDate(
          dateText
        )} a las ${formatDisplayTime(
          selectedTime
        )} fue registrada y está pendiente de confirmación.`
      );

      router.replace(
        "/client"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo agendar la cita.";

      showMessage(
        "No se pudo agendar",
        message
      );
    } finally {
      setBooking(false);
    }
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
      <View
        style={
          styles.header
        }
      >
        <View style={styles.headerAccent} />

        <Text
          style={
            styles.eyebrow
          }
        >
          NUEVA RESERVA
        </Text>

        <Text
          style={
            styles.title
          }
        >
          Agendar cita
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Elige una fecha y selecciona un horario disponible.
        </Text>
      </View>

      <View
        style={
          styles.serviceCard
        }
      >
        <View
          style={
            styles.serviceIcon
          }
        >
          <AppIcon
            name={{
              ios: "scissors",
              android: "content_cut",
              web: "content_cut",
            }}
            size={25}
            color={COLORS.primary}
          />
        </View>

        <View
          style={
            styles.serviceInfo
          }
        >
          <Text style={styles.serviceEyebrow}>
            SERVICIO ELEGIDO
          </Text>

          <Text
            style={
              styles.serviceName
            }
          >
            Corte de cabello
          </Text>

          <Text
            style={
              styles.serviceMeta
            }
          >
            50 min · Reserva por bloques de 1 hora
          </Text>
        </View>
      </View>

      <View
        style={
          styles.section
        }
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              1
            </Text>
          </View>

          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>
              Elige la fecha
            </Text>

            <Text style={styles.stepDescription}>
              Cuéntanos cuándo quieres visitarnos.
            </Text>
          </View>
        </View>

        {Platform.OS ===
        "web" ? (
          <>
            <TextInput
              style={
                styles.input
              }
              value={
                dateText
              }
              onChangeText={
                setDateText
              }
              placeholder="AAAA-MM-DD"
              maxLength={10}
            />

          </>
        ) : (
          <>
            <Pressable
              style={
                styles.dateButton
              }
              onPress={() =>
                setShowDatePicker(
                  true
                )
              }
            >
              <View>
                <Text
                  style={
                    styles.dateLabel
                  }
                >
                  Fecha seleccionada
                </Text>

                <Text
                  style={
                    styles.dateValue
                  }
                >
                  {formatDisplayDate(dateText)}
                </Text>
              </View>

              <AppIcon
                name={{
                  ios: "calendar",
                  android: "calendar_month",
                  web: "calendar_month",
                }}
                size={22}
                color={COLORS.textMuted}
              />
            </Pressable>

            {showDatePicker && (
              <DateTimePicker
                value={
                  selectedDate
                }
                mode="date"
                display="default"
                minimumDate={
                  getTomorrowDate()
                }
                onChange={
                  handleDateChange
                }
              />
            )}

          </>
        )}

        <View style={styles.helperRow}>
          <AppIcon
            name={{
              ios: "clock",
              android: "schedule",
              web: "schedule",
            }}
            size={17}
            color={COLORS.textSecondary}
          />

          <Text style={styles.helperText}>
            Reserva con al menos 24 horas de anticipación.
          </Text>
        </View>

        {recommendationError ? (
          <Text style={styles.recommendationError}>
            {recommendationError}
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.searchButton,

            loading &&
              styles.disabledButton,
          ]}
          onPress={() =>
            handleSearch()
          }
          disabled={
            loading
          }
        >
          <Text
            style={
              styles.searchButtonText
            }
          >
            {loading
              ? "Consultando..."
              : "Ver horarios disponibles"}
          </Text>
        </Pressable>
      </View>

      {hasRequestedTimes && (loading ? (
        <View
          style={
            styles.loadingContainer
          }
          onLayout={(event) =>
            scrollToSection(
              event.nativeEvent.layout.y
            )
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
            Buscando horarios...
          </Text>
        </View>
      ) : times.length >
        0 ? (
        <View
          style={
            styles.section
          }
          onLayout={(event) =>
            scrollToSection(
              event.nativeEvent.layout.y
            )
          }
        >
          <View style={styles.stepHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                2
              </Text>
            </View>

            <View style={styles.stepContent}>
              <Text style={styles.sectionTitle}>
                Elige la hora
              </Text>

              <Text style={styles.stepDescription}>
                Toca uno de los horarios disponibles.
              </Text>
            </View>
          </View>

          <View
            style={
              styles.timesContainer
            }
          >
            {times.map(
              (slot) => {
                const selected =
                  selectedTime ===
                  slot.time;

                return (
                  <Pressable
                    key={
                      slot.time
                    }
                    disabled={
                      !slot.available
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDisplayTime(
                      slot.time
                    )}, ${
                      slot.available
                        ? "disponible"
                        : "ocupado"
                    }`}
                    accessibilityState={{
                      selected,
                      disabled: !slot.available,
                    }}
                    onPress={() =>
                      handleTimeSelect(
                        slot.time
                      )
                    }
                    style={[
                      styles.timeButton,

                      !slot.available &&
                        styles.unavailableTime,

                      selected &&
                        styles.selectedTime,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeText,

                        !slot.available &&
                          styles.unavailableText,

                        selected &&
                          styles.selectedTimeText,
                      ]}
                    >
                      {formatDisplayTime(
                        slot.time
                      )}
                    </Text>

                    {selected && (
                      <AppIcon
                        name={{
                          ios: "checkmark",
                          android: "check",
                          web: "check",
                        }}
                        size={15}
                        color={COLORS.onPrimary}
                      />
                    )}

                    {!slot.available && (
                      <Text
                        style={
                          styles.unavailableLabel
                        }
                      >
                        Ocupado
                      </Text>
                    )}
                  </Pressable>
                );
              }
            )}
          </View>
        </View>
      ) : (
        <View
          style={styles.emptyTimes}
          onLayout={(event) =>
            scrollToSection(
              event.nativeEvent.layout.y
            )
          }
        >
          <View style={styles.emptyTimesIcon}>
            <AppIcon
              name={{
                ios: "calendar",
                android: "event_busy",
                web: "event_busy",
              }}
              size={25}
              color={COLORS.primary}
            />
          </View>

          <Text style={styles.emptyTimesTitle}>
            Sin horarios para este día
          </Text>

          <Text style={styles.emptyTimesText}>
            Prueba con otra fecha y encontraremos un espacio para ti.
          </Text>
        </View>
      ))}

      {selectedTime && (
        <View
          style={
            styles.summaryCard
          }
          onLayout={(event) =>
            scrollToSection(
              event.nativeEvent.layout.y
            )
          }
        >
          <View style={styles.summaryHeader}>
            <View style={styles.summaryHeading}>
              <Text style={styles.summaryEyebrow}>
                CASI LISTO
              </Text>

              <Text style={styles.summaryTitle}>
                Confirma tu visita
              </Text>
            </View>

            <View
              style={
                styles.pendingBadge
              }
            >
              <Text
                style={
                  styles.pendingBadgeText
                }
              >
                Pendiente
              </Text>
            </View>
          </View>

          <View style={styles.summaryService}>
            <View style={styles.summaryServiceIcon}>
              <AppIcon
                name={{
                  ios: "scissors",
                  android: "content_cut",
                  web: "content_cut",
                }}
                size={22}
                color={COLORS.primary}
              />
            </View>

            <View style={styles.summaryServiceContent}>
              <Text style={styles.summaryLabel}>
                TU SERVICIO
              </Text>

              <Text style={styles.summaryServiceName}>
                Corte de cabello
              </Text>
            </View>
          </View>

          <View style={styles.summaryDetails}>
            <View style={styles.summaryDetail}>
              <AppIcon
                name={{
                  ios: "calendar",
                  android: "calendar_month",
                  web: "calendar_month",
                }}
                size={20}
                color={COLORS.primary}
              />

              <Text style={styles.summaryDetailLabel}>
                Fecha
              </Text>

              <Text style={styles.summaryDetailValue}>
                {formatDisplayDate(dateText)}
              </Text>
            </View>

            <View style={styles.summaryDetail}>
              <AppIcon
                name={{
                  ios: "clock",
                  android: "schedule",
                  web: "schedule",
                }}
                size={20}
                color={COLORS.primary}
              />

              <Text style={styles.summaryDetailLabel}>
                Hora
              </Text>

              <Text style={styles.summaryDetailValue}>
                {formatDisplayTime(selectedTime)}
              </Text>
            </View>
          </View>

          <Pressable
            style={[
              styles.confirmButton,

              booking &&
                styles.disabledButton,
            ]}
            disabled={
              booking
            }
            onPress={
              handleBook
            }
          >
            <Text
              style={
                styles.confirmButtonText
              }
            >
              {booking
                ? "Agendando..."
                : "Confirmar cita"}
            </Text>
          </Pressable>

          <Text
            style={
              styles.confirmationNote
            }
          >
            La barbería deberá aceptar la solicitud antes de que quede confirmada.
          </Text>
        </View>
      )}

      <View style={styles.footerNavigation}>
        <BackButton fallbackHref="/client" />
      </View>
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

    header: {
      marginBottom:
        SPACING.xl,
    },

    headerAccent: {
      width: 42,
      height: 3,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.accent,
      marginBottom:
        SPACING.md,
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
      lineHeight: 24,
      color:
        COLORS.textSecondary,
    },

    serviceCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        COLORS.primarySoft,
      borderWidth: 0,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.md,
      marginBottom:
        SPACING.xl,
    },

    serviceIcon: {
      width: 54,
      height: 54,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.surface,
      justifyContent:
        "center",
      alignItems:
        "center",
      marginRight:
        SPACING.md,
    },

    serviceInfo: {
      flex: 1,
    },

    serviceEyebrow: {
      fontSize:
        FONT.caption,
      fontWeight: "800",
      letterSpacing: 0.8,
      color:
        COLORS.primary,
      marginBottom: 3,
    },

    serviceName: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom: 4,
    },

    serviceMeta: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
    },

    section: {
      marginBottom:
        SPACING.xl,
    },

    stepHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      marginBottom:
        SPACING.md,
    },

    stepBadge: {
      width: 36,
      height: 36,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    stepBadgeText: {
      color:
        COLORS.onPrimary,
      fontSize:
        FONT.small,
      fontWeight: "800",
    },

    stepContent: {
      flex: 1,
    },

    sectionTitle: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom: 2,
    },

    stepDescription: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
    },

    input: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.accentSoft,
      borderRadius:
        RADIUS.md,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 14,
      fontSize:
        FONT.body,
      color:
        COLORS.text,
    },

    dateButton: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.accentSoft,
      borderRadius:
        RADIUS.md,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 14,
    },

    dateLabel: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textSecondary,
      marginBottom: 3,
    },

    dateValue: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    helperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      marginTop:
        SPACING.sm,
    },

    helperText: {
      flex: 1,
      fontSize:
        FONT.small,
      lineHeight: 20,
      color:
        COLORS.textSecondary,
    },

    recommendationError: {
      marginTop: SPACING.sm,
      color: COLORS.danger,
      fontSize: FONT.small,
      lineHeight: 20,
      fontWeight: "600",
    },

    searchButton: {
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 14,
      paddingHorizontal:
        SPACING.lg,
      alignItems:
        "center",
      alignSelf:
        "center",
      marginTop:
        SPACING.md,
    },

    searchButtonText: {
      color: "#FFFFFF",
      fontSize:
        FONT.body,
      fontWeight: "700",
    },

    disabledButton: {
      opacity: 0.55,
    },

    loadingContainer: {
      alignItems:
        "center",
      paddingVertical:
        SPACING.xxl,
    },

    loadingText: {
      marginTop:
        SPACING.sm,
      color:
        COLORS.textSecondary,
    },

    emptyTimes: {
      alignItems: "center",
      backgroundColor:
        COLORS.surface,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.lg,
      marginBottom:
        SPACING.xl,
    },

    emptyTimesIcon: {
      width: 48,
      height: 48,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.primarySoft,
      justifyContent: "center",
      alignItems: "center",
      marginBottom:
        SPACING.sm,
    },

    emptyTimesTitle: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom:
        SPACING.xs,
    },

    emptyTimesText: {
      fontSize:
        FONT.small,
      lineHeight: 20,
      color:
        COLORS.textSecondary,
      textAlign: "center",
      maxWidth: 330,
    },

    timesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
    },

    timeButton: {
      width: "30%",
      minWidth: 92,
      maxWidth: 132,
      minHeight: 54,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.pill,
      justifyContent:
        "center",
      alignItems:
        "center",
    },

    selectedTime: {
      backgroundColor:
        COLORS.primary,
      borderColor:
        COLORS.primary,
    },

    selectedTimeText: {
      color: "#FFFFFF",
    },

    unavailableTime: {
      backgroundColor:
        COLORS.primarySoft,
      borderColor:
        COLORS.border,
      opacity: 0.7,
    },

    timeText: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    unavailableText: {
      color:
        COLORS.textMuted,
    },

    unavailableLabel: {
      marginTop: 3,
      fontSize:
        FONT.caption,
      color:
        COLORS.textMuted,
    },

    summaryCard: {
      backgroundColor:
        COLORS.accentSoft,
      borderRadius:
        RADIUS.xl,
      padding:
        SPACING.lg,
    },

    summaryHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "flex-start",
      gap: SPACING.md,
      marginBottom:
        SPACING.lg,
    },

    summaryHeading: {
      flex: 1,
    },

    summaryEyebrow: {
      fontSize:
        FONT.caption,
      fontWeight: "700",
      letterSpacing: 1,
      color:
        COLORS.primary,
      marginBottom: 3,
    },

    summaryTitle: {
      fontFamily:
        FONT_FAMILY.display,
      fontSize:
        FONT.heading,
      fontWeight: "800",
      color:
        COLORS.text,
    },

    summaryService: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor:
        COLORS.surface,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.md,
      marginBottom:
        SPACING.sm,
    },

    summaryServiceIcon: {
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

    summaryServiceContent: {
      flex: 1,
    },

    summaryLabel: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.7,
      color:
        COLORS.textSecondary,
      marginBottom: 3,
    },

    summaryServiceName: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    summaryDetails: {
      flexDirection: "row",
      gap: SPACING.sm,
    },

    summaryDetail: {
      flex: 1,
      minWidth: 0,
      backgroundColor:
        COLORS.surface,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.md,
    },

    summaryDetailLabel: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textSecondary,
      marginTop:
        SPACING.sm,
      marginBottom: 3,
    },

    summaryDetailValue: {
      fontSize:
        FONT.small,
      lineHeight: 19,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    pendingBadge: {
      backgroundColor:
        COLORS.surface,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 6,
      borderRadius:
        RADIUS.pill,
    },

    pendingBadgeText: {
      color:
        COLORS.warning,
      fontSize:
        FONT.caption,
      fontWeight: "700",
    },

    confirmButton: {
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 15,
      alignItems:
        "center",
      marginTop:
        SPACING.lg,
    },

    confirmButtonText: {
      color: "#FFFFFF",
      fontSize:
        FONT.body,
      fontWeight: "700",
    },

    confirmationNote: {
      fontSize:
        FONT.caption,
      lineHeight: 18,
      color:
        COLORS.warning,
      backgroundColor:
        COLORS.warningBackground,
      borderRadius:
        RADIUS.md,
      padding:
        SPACING.sm,
      textAlign:
        "center",
      marginTop:
        SPACING.sm,
      fontWeight: "600",
    },

    footerNavigation: {
      marginTop:
        SPACING.xl,
      paddingBottom:
        SPACING.lg,
    },
  });
