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

import DateTimePicker from "@react-native-community/datetimepicker";

import {
    AdminAppointment,
    getAdminSchedule,
} from "../../api/admin.api";

import { useAuth } from "../../context/AuthContext";

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

    setStartDateText(
      formatDate(date)
    );
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
        return "Aceptada";

      case "REJECTED":
        return "Rechazada";

      case "CANCELLED":
        return "Cancelada";

      default:
        return status;
    }
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >
      <Text style={styles.title}>
        Agenda
      </Text>

      <Text style={styles.subtitle}>
        Consulta las citas dentro de
        un rango de fechas.
      </Text>

      <Text style={styles.label}>
        Fecha inicial
      </Text>

      {Platform.OS === "web" ? (
        <>
          <TextInput
            style={styles.input}
            value={startDateText}
            onChangeText={
              setStartDateText
            }
            placeholder="AAAA-MM-DD"
            maxLength={10}
          />

          <Text style={styles.helperText}>
            Formato: AAAA-MM-DD
          </Text>
        </>
      ) : (
        <>
          <Pressable
            style={styles.dateButton}
            onPress={() =>
              setShowStartPicker(true)
            }
          >
            <Text style={styles.dateButtonText}>
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

      {Platform.OS === "web" ? (
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

          <Text style={styles.helperText}>
            Formato: AAAA-MM-DD
          </Text>
        </>
      ) : (
        <>
          <Pressable
            style={styles.dateButton}
            onPress={() =>
              setShowEndPicker(true)
            }
          >
            <Text style={styles.dateButtonText}>
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

      <Text style={styles.helperText}>
        Puedes consultar un solo día
        usando la misma fecha inicial
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
        <Text style={styles.searchButtonText}>
          {loading
            ? "Consultando..."
            : "Consultar agenda"}
        </Text>
      </Pressable>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingText}>
            Cargando agenda...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.messageBox}>
          <Text style={styles.errorText}>
            {error}
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.periodBox}>
            <Text style={styles.periodTitle}>
              Período consultado
            </Text>

            <Text style={styles.periodText}>
              {startDateText}
              {" — "}
              {endDateText}
            </Text>
          </View>

          {appointments.length === 0 ? (
            <View style={styles.messageBox}>
              <Text style={styles.emptyTitle}>
                No hay citas
              </Text>

              <Text style={styles.messageText}>
                No existen citas
                registradas para este
                período.
              </Text>
            </View>
          ) : (
            appointments.map(
              (appointment) => (
                <View
                  key={appointment.id}
                  style={styles.card}
                >
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.time}>
                        {appointment.time}
                      </Text>

                      <Text style={styles.date}>
                        {appointment.date}
                      </Text>
                    </View>

                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>
                        {getStatusText(
                          appointment.status
                        )}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.clientName}>
                    {appointment.firstName}{" "}
                    {appointment.lastName}
                  </Text>

                  <Text style={styles.service}>
                    {appointment.service}
                  </Text>

                  <Text style={styles.phone}>
                    {appointment.phone}
                  </Text>
                </View>
              )
            )
          )}
        </>
      )}

      <Pressable
        style={styles.backButton}
        onPress={() =>
          router.back()
        }
      >
        <Text style={styles.backText}>
          Volver
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 26,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
  },

  endDateLabel: {
    marginTop: 20,
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
    lineHeight: 18,
    marginTop: 7,
  },

  searchButton: {
    backgroundColor: "#111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 22,
    marginBottom: 24,
  },

  searchButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },

  loadingText: {
    color: "#666",
    marginTop: 12,
  },

  periodBox: {
    marginBottom: 18,
  },

  periodTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },

  periodText: {
    color: "#666",
  },

  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  time: {
    fontSize: 22,
    fontWeight: "bold",
  },

  date: {
    color: "#666",
    marginTop: 3,
  },

  statusBadge: {
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 14,
  },

  clientName: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 5,
  },

  service: {
    fontSize: 15,
    marginBottom: 4,
  },

  phone: {
    color: "#666",
  },

  messageBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 20,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },

  messageText: {
    color: "#666",
  },

  errorText: {
    color: "#555",
  },

  backButton: {
    alignItems: "center",
    padding: 14,
    marginTop: 12,
  },

  backText: {
    color: "#555",
  },
});