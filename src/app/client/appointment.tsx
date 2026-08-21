import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
    createAppointment,
    getAvailability,
} from "../../api/appointments.api";

import { useAuth } from "../../context/AuthContext";

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
  const router = useRouter();

  const {
    token,
    user,
    loading: authLoading,
  } = useAuth();

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

  // Protección de ruta CLIENT
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/auth/login");
      return;
    }

    if (user.role === "ADMIN") {
      router.replace("/admin");
    }
  }, [
    authLoading,
    user,
    router,
  ]);

  async function handleSearch(
    customDate?: string
  ) {
    if (
      !token ||
      !user ||
      user.role !== "CLIENT"
    ) {
      return;
    }

    const date =
      customDate || dateText;

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(
        date
      )
    ) {
      Alert.alert(
        "Fecha inválida",
        "Ingresa una fecha válida."
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

      setTimes(
        result.times
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo consultar la disponibilidad.";

      Alert.alert(
        "No se pudo consultar",
        message
      );
    } finally {
      setLoading(false);
    }
  }

  function handleDateChange(
    event: any,
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
    if (
      !token ||
      !user ||
      user.role !== "CLIENT"
    ) {
      return;
    }

    if (!selectedTime) {
      Alert.alert(
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

      Alert.alert(
        "Cita solicitada",
        `Tu cita para el ${dateText} a las ${selectedTime} fue registrada y está pendiente de confirmación.`
      );

      setSelectedTime(null);

      const result =
        await getAvailability(
          token,
          dateText
        );

      setTimes(
        result.times
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo agendar la cita.";

      Alert.alert(
        "No se pudo agendar",
        message
      );
    } finally {
      setBooking(false);
    }
  }

  if (authLoading) {
    return (
      <View
        style={
          styles.authLoadingContainer
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
          Cargando sesión...
        </Text>
      </View>
    );
  }

  if (
    !user ||
    user.role !== "CLIENT"
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Agendar cita
      </Text>

      <View style={styles.serviceCard}>
        <Text style={styles.service}>
          Corte de cabello
        </Text>

        <Text style={styles.description}>
          Duración aproximada:
          50 minutos
        </Text>
      </View>

      <Text style={styles.label}>
        Fecha
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
              setShowDatePicker(
                true
              )
            }
          >
            <Text
              style={
                styles.dateButtonText
              }
            >
              {dateText}
            </Text>
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
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

      <Text style={styles.helperText}>
        Las citas deben reservarse
        al menos con un día de
        anticipación.
      </Text>

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
            Consultando horarios...
          </Text>
        </View>
      ) : times.length > 0 ? (
        <>
          <Text
            style={
              styles.sectionTitle
            }
          >
            Horarios disponibles
          </Text>

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
                      {slot.time}
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
              }
            )}
          </View>
        </>
      ) : null}

      {selectedTime && (
        <View
          style={
            styles.confirmation
          }
        >
          <Text
            style={
              styles.summaryTitle
            }
          >
            Resumen
          </Text>

          <Text
            style={
              styles.summary
            }
          >
            Fecha: {dateText}
          </Text>

          <Text
            style={
              styles.summary
            }
          >
            Hora: {selectedTime}
          </Text>

          <Text
            style={
              styles.summary
            }
          >
            Servicio: Corte de
            cabello
          </Text>

          <Pressable
            style={[
              styles.confirmButton,
              booking &&
                styles.disabledButton,
            ]}
            disabled={booking}
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
        </View>
      )}
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      padding: 24,
      backgroundColor:
        "#f5f5f5",
    },

    authLoadingContainer: {
      flex: 1,
      justifyContent:
        "center",
      alignItems: "center",
      backgroundColor:
        "#f5f5f5",
    },

    title: {
      fontSize: 30,
      fontWeight: "bold",
      marginBottom: 22,
    },

    serviceCard: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },

    service: {
      fontSize: 20,
      fontWeight: "600",
    },

    description: {
      fontSize: 14,
      color: "#666",
      marginTop: 4,
    },

    label: {
      fontSize: 15,
      fontWeight: "600",
      marginBottom: 6,
    },

    input: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },

    dateButton: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 14,
    },

    dateButtonText: {
      fontSize: 16,
    },

    helperText: {
      fontSize: 13,
      color: "#666",
      marginTop: 7,
      lineHeight: 18,
    },

    searchButton: {
      backgroundColor: "#111",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 18,
    },

    searchButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 15,
    },

    disabledButton: {
      opacity: 0.6,
    },

    loadingContainer: {
      alignItems: "center",
      paddingVertical: 30,
    },

    loadingText: {
      marginTop: 10,
      color: "#666",
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginTop: 28,
      marginBottom: 12,
    },

    timesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },

    timeButton: {
      width: 90,
      minHeight: 58,
      justifyContent:
        "center",
      borderWidth: 1,
      borderColor: "#333",
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: "#fff",
    },

    selectedTime: {
      backgroundColor: "#111",
    },

    selectedTimeText: {
      color: "#fff",
    },

    unavailableTime: {
      backgroundColor:
        "#e5e5e5",
      borderColor: "#ccc",
    },

    timeText: {
      fontSize: 15,
      fontWeight: "600",
    },

    unavailableText: {
      color: "#999",
    },

    unavailableLabel: {
      fontSize: 10,
      color: "#888",
      marginTop: 2,
    },

    confirmation: {
      backgroundColor: "#fff",
      borderWidth: 1,
      borderColor: "#ddd",
      borderRadius: 12,
      padding: 18,
      marginTop: 28,
    },

    summaryTitle: {
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 10,
    },

    summary: {
      fontSize: 15,
      marginBottom: 5,
      color: "#444",
    },

    confirmButton: {
      backgroundColor: "#111",
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 16,
    },

    confirmButtonText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 15,
    },
  });