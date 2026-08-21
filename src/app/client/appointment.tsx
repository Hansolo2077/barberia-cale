import { useState } from "react";
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
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

type TimeSlot = {
  time: string;
  available: boolean;
};

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

function getTomorrowDate() {
  const tomorrow = new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );

  return tomorrow;
}

export default function AppointmentScreen() {
  const { token } = useAuth();

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

  const [times, setTimes] =
    useState<TimeSlot[]>([]);

  const [
    selectedTime,
    setSelectedTime,
  ] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [booking, setBooking] =
    useState(false);

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
      setLoading(true);
      setSelectedTime(null);

      const result =
        await getAvailability(
          token,
          date
        );

      setTimes(result.times);
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

  function handleDateChange(
    event: unknown,
    date?: Date
  ) {
    setShowDatePicker(false);

    if (!date) {
      return;
    }

    setSelectedDate(date);

    const formatted =
      formatDate(date);

    setDateText(formatted);

    handleSearch(formatted);
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
          date: dateText,
          time: selectedTime,
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

      setSelectedTime(null);

      const result =
        await getAvailability(
          token,
          dateText
        );

      setTimes(result.times);
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
      contentContainerStyle={
        styles.container
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>
          NUEVA RESERVA
        </Text>

        <Text style={styles.title}>
          Agendar cita
        </Text>

        <Text style={styles.subtitle}>
          Elige una fecha y selecciona un horario disponible.
        </Text>
      </View>

      <View style={styles.serviceCard}>
        <View style={styles.serviceIcon}>
          <Text
            style={
              styles.serviceIconText
            }
          >
            ✂
          </Text>
        </View>

        <View style={styles.serviceInfo}>
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

      <View style={styles.section}>
        <Text
          style={
            styles.sectionTitle
          }
        >
          1. Elige la fecha
        </Text>

        {Platform.OS === "web" ? (
          <>
            <TextInput
              style={styles.input}
              value={dateText}
              onChangeText={
                setDateText
              }
              placeholder="AAAA-MM-DD"
              maxLength={10}
            />

            <Text
              style={
                styles.helperText
              }
            >
              Debes reservar al menos con un día de anticipación.
            </Text>
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
                  {formatDisplayDate(
                    dateText
                  )}
                </Text>
              </View>

              <Text
                style={
                  styles.dateChevron
                }
              >
                ›
              </Text>
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

            <Text
              style={
                styles.helperText
              }
            >
              Debes reservar al menos con un día de anticipación.
            </Text>
          </>
        )}

        <Pressable
          style={[
            styles.searchButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={() =>
            handleSearch()
          }
          disabled={loading}
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
            Buscando horarios...
          </Text>
        </View>
      ) : times.length > 0 ? (
        <View style={styles.section}>
          <Text
            style={
              styles.sectionTitle
            }
          >
            2. Elige la hora
          </Text>

          <Text
            style={
              styles.sectionSubtitle
            }
          >
            Los horarios ocupados no se pueden seleccionar.
          </Text>

          <View
            style={
              styles.timesContainer
            }
          >
            {times.map((slot) => {
              const selected =
                selectedTime ===
                slot.time;

              return (
                <Pressable
                  key={slot.time}
                  disabled={
                    !slot.available
                  }
                  onPress={() =>
                    setSelectedTime(
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
            })}
          </View>
        </View>
      ) : null}

      {selectedTime && (
        <View
          style={
            styles.summaryCard
          }
        >
          <Text
            style={
              styles.summaryEyebrow
            }
          >
            RESUMEN DE LA RESERVA
          </Text>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Servicio
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              Corte de cabello
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Fecha
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {formatDisplayDate(
                dateText
              )}
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Hora
            </Text>

            <Text
              style={
                styles.summaryValue
              }
            >
              {formatDisplayTime(
                selectedTime
              )}
            </Text>
          </View>

          <View
            style={
              styles.summaryRow
            }
          >
            <Text
              style={
                styles.summaryLabel
              }
            >
              Estado inicial
            </Text>

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

          <Pressable
            style={[
              styles.confirmButton,
              booking &&
                styles.disabledButton,
            ]}
            disabled={booking}
            onPress={handleBook}
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
    paddingTop:
      SPACING.xl,
    paddingBottom:
      SPACING.xxl,
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
    lineHeight: 24,
    color:
      COLORS.textSecondary,
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
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
      RADIUS.md,
    backgroundColor:
      COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight:
      SPACING.md,
  },

  serviceIconText: {
    fontSize: 24,
  },

  serviceInfo: {
    flex: 1,
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

  sectionTitle: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  sectionSubtitle: {
    fontSize:
      FONT.small,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.md,
  },

  input: {
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
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
      COLORS.border,
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

  dateChevron: {
    fontSize: 28,
    color:
      COLORS.textMuted,
  },

  helperText: {
    fontSize:
      FONT.small,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
    marginTop:
      SPACING.sm,
  },

  searchButton: {
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
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
    alignItems: "center",
    paddingVertical:
      SPACING.xxl,
  },

  loadingText: {
    marginTop:
      SPACING.sm,
    color:
      COLORS.textSecondary,
  },

  timesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },

  timeButton: {
    width: "30%",
    minWidth: 92,
    minHeight: 64,
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius:
      RADIUS.md,
    justifyContent: "center",
    alignItems: "center",
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
      COLORS.surface,
    borderRadius:
      RADIUS.xl,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    padding:
      SPACING.lg,
  },

  summaryEyebrow: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
    letterSpacing: 1,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.md,
  },

  summaryRow: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    paddingVertical:
      SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor:
      COLORS.border,
    gap: SPACING.md,
  },

  summaryLabel: {
    fontSize:
      FONT.small,
    color:
      COLORS.textSecondary,
  },

  summaryValue: {
    flex: 1,
    textAlign: "right",
    fontSize:
      FONT.body,
    fontWeight: "700",
    color:
      COLORS.text,
  },

  pendingBadge: {
    backgroundColor:
      COLORS.warningBackground,
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
      RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
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
      COLORS.textSecondary,
    textAlign: "center",
    marginTop:
      SPACING.sm,
  },
});