import {
    useRouter,
} from "expo-router";

import {
    useCallback,
    useEffect,
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
    View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import BackButton from "../../components/BackButton";
import AppIcon from "../../components/AppIcon";
import WebDateInput from "../../components/WebDateInput";

import {
    createAppointment,
    getAvailability,
    getNextAvailability,
} from "../../api/appointments.api";
import { ApiError } from "../../api/api-client";

import { useAuth } from "../../context/AuthContext";

import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";

import { showMessage } from "../../utils/show-message";
import {
    addDaysToIso,
    getBusinessTodayIso,
    isValidIsoDate,
} from "../../utils/business-date";
import {
    BUSINESS,
    type BookingPolicy,
} from "../../constants/business";

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

function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.code === "UNAUTHORIZED";
}

type BookingEligibility = {
  allowed: boolean;
  reason: string | null;
  activeOnDate: number;
  activeInSevenDays: number;
};

const DEFAULT_POLICY: BookingPolicy =
  BUSINESS.bookingPolicy;

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
  const [year, month, day] = addDaysToIso(
    getBusinessTodayIso(),
    1
  ).split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12
  );
}

function parseDateText(value: string) {
  if (!isValidIsoDate(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function getDateError(value: string) {
  const parsed = parseDateText(value);

  if (!parsed) {
    return "Selecciona una fecha válida.";
  }

  if (value < addDaysToIso(getBusinessTodayIso(), 1)) {
    return "Selecciona una fecha con al menos un día de anticipación.";
  }

  return "";
}

export default function AppointmentScreen() {
  const { token } =
    useAuth();

  const router =
    useRouter();

  const scrollViewRef =
    useRef<ScrollView>(null);

  const availabilityRequestRef =
    useRef(0);

  const initializedRef =
    useRef(false);

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

  const [loadedDate, setLoadedDate] =
    useState<string | null>(null);

  const [dateError, setDateError] =
    useState("");

  const [availabilityError, setAvailabilityError] =
    useState("");

  const [eligibility, setEligibility] =
    useState<BookingEligibility | null>(null);

  const [policy, setPolicy] =
    useState<BookingPolicy>(DEFAULT_POLICY);

  const [showingRecommendation, setShowingRecommendation] =
    useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    hasRequestedTimes,
    setHasRequestedTimes,
  ] = useState(false);

  const [
    booking,
    setBooking,
  ] = useState(false);

  const bookingInFlightRef = useRef(false);

  function invalidateAvailability() {
    availabilityRequestRef.current += 1;
    setLoading(false);
    setLoadedDate(null);
    setTimes([]);
    setSelectedTime(null);
    setEligibility(null);
    setAvailabilityError("");
    setHasRequestedTimes(false);
    setShowingRecommendation(false);
  }

  async function handleSearch(
    customDate = dateText,
    allowWhileBooking = false
  ) {
    if (booking && !allowWhileBooking) {
      return;
    }

    if (!token) {
      showMessage(
        "Sesión no disponible",
        "Debes iniciar sesión para consultar horarios."
      );

      return;
    }

    const validationError = getDateError(customDate);

    if (validationError) {
      setDateError(validationError);
      setHasRequestedTimes(false);
      return;
    }

    const requestId = availabilityRequestRef.current + 1;
    availabilityRequestRef.current = requestId;

    try {
      setDateError("");
      setAvailabilityError("");
      setShowingRecommendation(false);
      setHasRequestedTimes(true);
      setLoading(true);
      setLoadedDate(null);
      setSelectedTime(null);
      setTimes([]);

      const result =
        await getAvailability(
          token,
          customDate
        );

      if (requestId !== availabilityRequestRef.current) {
        return;
      }

      setLoadedDate(customDate);
      setTimes(result.times ?? []);
      setEligibility(result.eligibility ?? null);
      setPolicy(result.policy ?? DEFAULT_POLICY);
    } catch (error) {
      if (requestId !== availabilityRequestRef.current) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo consultar la disponibilidad.";

      setLoadedDate(null);
      setTimes([]);
      setEligibility(null);
      setAvailabilityError(message);
    } finally {
      if (requestId === availabilityRequestRef.current) {
        setLoading(false);
      }
    }
  }

  const loadNextAvailableDate = useCallback(async (
    startDate = formatDate(getTomorrowDate())
  ) => {
    if (bookingInFlightRef.current) {
      return;
    }

    if (!token) {
      return;
    }

    const validationError = getDateError(startDate);

    if (validationError) {
      setDateError(validationError);
      return;
    }

    const requestId = availabilityRequestRef.current + 1;
    availabilityRequestRef.current = requestId;

    try {
      setHasRequestedTimes(true);
      setLoading(true);
      setDateError("");
      setAvailabilityError("");
      setSelectedTime(null);
      setLoadedDate(null);
      setTimes([]);

      const result = await getNextAvailability(token, startDate);

      if (requestId !== availabilityRequestRef.current) {
        return;
      }

      if (!result.date) {
        setAvailabilityError(
          "No encontramos horarios disponibles en los próximos 60 días."
        );
        return;
      }

      const parsed = parseDateText(result.date);

      if (parsed) {
        setSelectedDate(parsed);
      }

      setDateText(result.date);
      setLoadedDate(result.date);
      setTimes(result.times ?? []);
      setEligibility(result.eligibility ?? null);
      setPolicy(result.policy ?? DEFAULT_POLICY);
      setShowingRecommendation(result.date !== startDate);
    } catch (error) {
      if (requestId !== availabilityRequestRef.current) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo buscar la siguiente fecha disponible.";

      setTimes([]);
      setLoadedDate(null);
      setAvailabilityError(message);
    } finally {
      if (requestId === availabilityRequestRef.current) {
        setLoading(false);
      }
    }
  }, [token]);

  useEffect(() => {
    if (token && !initializedRef.current) {
      initializedRef.current = true;
      void loadNextAvailableDate();
    }
  }, [loadNextAvailableDate, token]);

  function handleDateChange(
    event: unknown,
    date?: Date
  ) {
    setShowDatePicker(
      false
    );

    if (!date || booking) {
      return;
    }

    setSelectedDate(
      date
    );
    invalidateAvailability();

    const formatted =
      formatDate(date);

    setDateText(
      formatted
    );

    void handleSearch(
      formatted
    );
  }

  function handleDateTextChange(value: string) {
    if (booking) {
      return;
    }

    const nextValue = value.slice(0, 10);

    setDateText(nextValue);
    setDateError("");
    invalidateAvailability();

    const parsed = parseDateText(nextValue);

    if (parsed) {
      setSelectedDate(parsed);
      void handleSearch(nextValue);
    } else if (nextValue.length === 10) {
      setDateError("Selecciona una fecha válida.");
    }
  }

  function handleNextDay() {
    if (booking) {
      return;
    }

    const baseDate = isValidIsoDate(loadedDate ?? dateText)
      ? (loadedDate ?? dateText)
      : formatDate(getTomorrowDate());
    const nextDate = addDaysToIso(baseDate, 1);

    setDateText(nextDate);
    void loadNextAvailableDate(nextDate);
  }

  function handleTimeSelect(time: string) {
    if (booking) {
      return;
    }

    setSelectedTime(time);
  }

  function scrollToSection(y: number) {
    scrollViewRef.current?.scrollTo({
      y: Math.max(y - SPACING.md, 0),
      animated: true,
    });
  }

  async function handleBook() {
    if (bookingInFlightRef.current) {
      return;
    }

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

    if (!loadedDate || loadedDate !== dateText) {
      setSelectedTime(null);
      showMessage(
        "Actualiza los horarios",
        "La fecha cambió después de consultar. Vuelve a elegir un horario para la fecha actual."
      );
      return;
    }

    if (eligibility?.allowed === false) {
      showMessage(
        "No puedes reservar este día",
        eligibility.reason ?? "Revisa las reglas de reserva."
      );
      return;
    }

    const bookingDate = loadedDate;
    const bookingTime = selectedTime;
    bookingInFlightRef.current = true;

    try {
      setBooking(true);

      await createAppointment(
        token,
        {
          service:
            BUSINESS.service.name,

          date:
            bookingDate,

          time:
            bookingTime,
        }
      );

      router.replace({
        pathname: "/client",
        params: {
          reservation: "success",
          date: bookingDate,
          time: bookingTime,
        },
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        return;
      }

      const message =
        error instanceof Error
          ? error.message
          : "No se pudo agendar la cita.";

      showMessage(
        "No se pudo agendar",
        message
      );

      // La regla pudo cambiar en paralelo y un timeout puede ocurrir después
      // de crear. Reconsultamos siempre para reflejar el estado del servidor.
      setSelectedTime(null);
      void handleSearch(bookingDate, true);
    } finally {
      bookingInFlightRef.current = false;
      setBooking(false);
    }
  }

  const availableCount = times.filter(
    (slot) => slot.available
  ).length;

  const canChooseTime = eligibility?.allowed !== false;

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
          accessibilityRole="header"
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
            {BUSINESS.service.name}
          </Text>

          <Text
            style={
              styles.serviceMeta
            }
          >
            {BUSINESS.service.durationMinutes} min · Reserva por bloques de {BUSINESS.slotMinutes} min
          </Text>
        </View>
      </View>

      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle} accessibilityRole="header">
          Reglas de reserva
        </Text>

        <Text style={styles.ruleText}>
          • Reserva con al menos {policy.minLeadHours} horas reales de anticipación.
        </Text>
        <Text style={styles.ruleText}>
          • Máximo {policy.maxActivePerDay} cita activa por día y {policy.maxActiveInSevenDays} dentro de 7 días.
        </Text>
        <Text style={styles.ruleText}>
          • Puedes cancelar con al menos {policy.cancellationWindowMinutes} minutos de anticipación.
        </Text>
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
          <WebDateInput
            value={dateText}
            label="Fecha de la cita"
            minimumDate={formatDate(getTomorrowDate())}
            disabled={booking}
            hasError={Boolean(dateError)}
            describedBy={dateError ? "appointment-date-error" : undefined}
            onChange={handleDateTextChange}
          />
        ) : (
          <>
            <Pressable
              style={[
                styles.dateButton,
                booking && styles.disabledButton,
              ]}
              disabled={booking}
              onPress={() =>
                setShowDatePicker(
                  true
                )
              }
              accessibilityRole="button"
              accessibilityLabel={`Fecha seleccionada: ${formatDisplayDate(dateText)}`}
              accessibilityHint="Abre el calendario"
              accessibilityState={{ disabled: booking }}
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
            Al elegir una fecha, cargaremos sus horarios automáticamente.
          </Text>
        </View>

        {dateError ? (
          <Text
            nativeID="appointment-date-error"
            style={styles.recommendationError}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite"
          >
            {dateError}
          </Text>
        ) : null}

        {showingRecommendation && loadedDate ? (
          <View
            style={styles.recommendationNotice}
            accessibilityLiveRegion="polite"
          >
            <Text style={styles.recommendationNoticeText}>
              Te mostramos la próxima fecha con espacio: {formatDisplayDate(loadedDate)}.
            </Text>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.searchButton,

            (loading || booking) &&
              styles.disabledButton,
          ]}
          onPress={() =>
            handleSearch()
          }
          disabled={loading || booking}
          accessibilityRole="button"
          accessibilityLabel={
            loadedDate === dateText
              ? "Actualizar horarios disponibles"
              : "Ver horarios disponibles"
          }
          accessibilityState={{
            disabled: loading || booking,
            busy: loading || booking,
          }}
        >
          <Text
            style={
              styles.searchButtonText
            }
          >
            {loading
              ? "Consultando..."
              : loadedDate === dateText
                ? "Actualizar horarios"
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
      ) : availabilityError ? (
        <View
          style={styles.availabilityErrorCard}
          accessibilityRole="alert"
          onLayout={(event) =>
            scrollToSection(event.nativeEvent.layout.y)
          }
        >
          <Text style={styles.availabilityErrorTitle}>
            No pudimos consultar los horarios
          </Text>

          <Text style={styles.availabilityErrorText}>
            {availabilityError}
          </Text>

          <View style={styles.recoveryActions}>
            <Pressable
              style={styles.retryAvailabilityButton}
              accessibilityRole="button"
              onPress={() => void handleSearch(dateText)}
            >
              <Text style={styles.retryAvailabilityText}>
                Reintentar
              </Text>
            </Pressable>

            <Pressable
              style={styles.nextDaySecondaryButton}
              accessibilityRole="button"
              onPress={handleNextDay}
            >
              <Text style={styles.nextDaySecondaryText}>
                Buscar otra fecha
              </Text>
            </Pressable>
          </View>
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
                Horarios para {loadedDate ? formatDisplayDate(loadedDate) : "la fecha elegida"}.
              </Text>
            </View>
          </View>

          {eligibility?.allowed === false && (
            <View style={styles.eligibilityNotice} accessibilityRole="alert">
              <Text style={styles.eligibilityTitle}>
                No puedes reservar esta fecha
              </Text>
              <Text style={styles.eligibilityText}>
                {eligibility.reason}
              </Text>
            </View>
          )}

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

                const selectable =
                  slot.available && canChooseTime && !booking;

                return (
                  <Pressable
                    key={
                      slot.time
                    }
                    disabled={
                      !selectable
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDisplayTime(
                      slot.time
                    )}, ${
                      slot.available
                        ? canChooseTime
                          ? "disponible"
                          : "no elegible para esta fecha"
                        : "ocupado"
                    }`}
                    accessibilityState={{
                      selected,
                      disabled: !selectable,
                    }}
                    onPress={() =>
                      handleTimeSelect(
                        slot.time
                      )
                    }
                    style={[
                      styles.timeButton,

                      !selectable &&
                        styles.unavailableTime,

                      selected &&
                        styles.selectedTime,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeText,

                        !selectable &&
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

          {availableCount === 0 && (
            <View style={styles.noAvailableNotice}>
              <Text style={styles.noAvailableText}>
                Todos los horarios de este día están ocupados.
              </Text>

              <Pressable
                style={styles.nextAvailableButton}
                accessibilityRole="button"
                onPress={handleNextDay}
              >
                <Text style={styles.nextAvailableButtonText}>
                  Buscar la próxima fecha disponible
                </Text>
              </Pressable>
            </View>
          )}
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

          <Pressable
            style={styles.nextAvailableButton}
            accessibilityRole="button"
            onPress={handleNextDay}
          >
            <Text style={styles.nextAvailableButtonText}>
              Buscar la próxima fecha disponible
            </Text>
          </Pressable>
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
                {BUSINESS.service.name}
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
                {loadedDate
                  ? formatDisplayDate(loadedDate)
                  : "Fecha por actualizar"}
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
              booking || !loadedDate || !canChooseTime
            }
            accessibilityRole="button"
            accessibilityLabel={booking ? "Agendando cita" : "Confirmar cita"}
            accessibilityState={{
              disabled: booking || !loadedDate || !canChooseTime,
              busy: booking,
            }}
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

    rulesCard: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.xl,
    },

    rulesTitle: {
      color: COLORS.text,
      fontSize: FONT.body,
      fontWeight: "800",
      marginBottom: SPACING.sm,
    },

    ruleText: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      lineHeight: 21,
      marginBottom: 4,
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

    dateButton: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.borderStrong,
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

    recommendationNotice: {
      backgroundColor: COLORS.successBackground,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginTop: SPACING.sm,
    },

    recommendationNoticeText: {
      color: COLORS.success,
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

    availabilityErrorCard: {
      backgroundColor: COLORS.dangerBackground,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.xl,
    },

    availabilityErrorTitle: {
      color: COLORS.danger,
      fontSize: FONT.body,
      fontWeight: "800",
      marginBottom: SPACING.xs,
    },

    availabilityErrorText: {
      color: COLORS.danger,
      fontSize: FONT.small,
      lineHeight: 20,
    },

    recoveryActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },

    retryAvailabilityButton: {
      minHeight: 44,
      justifyContent: "center",
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.lg,
    },

    retryAvailabilityText: {
      color: COLORS.onPrimary,
      fontSize: FONT.small,
      fontWeight: "800",
    },

    nextDaySecondaryButton: {
      minHeight: 44,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: COLORS.primary,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.lg,
    },

    nextDaySecondaryText: {
      color: COLORS.primary,
      fontSize: FONT.small,
      fontWeight: "800",
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

    eligibilityNotice: {
      backgroundColor: COLORS.warningBackground,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },

    eligibilityTitle: {
      color: COLORS.warning,
      fontSize: FONT.small,
      fontWeight: "800",
      marginBottom: 3,
    },

    eligibilityText: {
      color: COLORS.warning,
      fontSize: FONT.small,
      lineHeight: 20,
    },

    noAvailableNotice: {
      alignItems: "center",
      marginTop: SPACING.md,
    },

    noAvailableText: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      lineHeight: 20,
      textAlign: "center",
    },

    nextAvailableButton: {
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: COLORS.primary,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.md,
    },

    nextAvailableButtonText: {
      color: COLORS.primary,
      fontSize: FONT.small,
      fontWeight: "800",
      textAlign: "center",
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
