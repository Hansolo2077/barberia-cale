import {
    useFocusEffect,
    useLocalSearchParams,
    useRouter,
} from "expo-router";
import {
    useCallback,
    useRef,
    useState,
} from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import UserMenu from "../../components/UserMenu";
import AppIcon from "../../components/AppIcon";

import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";

import { getMyAppointments } from "../../api/appointments.api";
import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";
import { showMessage } from "../../utils/show-message";
import { isAppointmentPast } from "../../utils/business-date";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

type AppointmentSummary = {
  id: number;
  service: string;
  date: string;
  time: string;
  status: "PENDING" | "ACCEPTED" | string;
  isPast?: boolean;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isUpcomingAppointment(appointment: AppointmentSummary) {
  return (
    (appointment.status === "PENDING" ||
      appointment.status === "ACCEPTED") &&
    appointment.isPast !== true &&
    !isAppointmentPast(appointment.date, appointment.time)
  );
}

export default function ClientHomeScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    account?: string | string[];
    reservation?: string | string[];
    date?: string | string[];
    time?: string | string[];
  }>();

  const {
    user,
    token,
    signOut,
  } = useAuth();
  const {
    permissionStatus,
    registrationStatus,
    isSupported: notificationsSupported,
    isRegistering: registeringNotifications,
    enableNotifications,
  } = useNotifications();

  const [nextAppointment, setNextAppointment] =
    useState<AppointmentSummary | null>(null);

  const [pendingCount, setPendingCount] =
    useState(0);

  const [summaryLoading, setSummaryLoading] =
    useState(true);

  const [summaryError, setSummaryError] =
    useState("");

  const summaryRequestRef = useRef(0);

  const accountCreated = firstParam(params.account) === "created";
  const reservationCreated = firstParam(params.reservation) === "success";
  const reservedDate = firstParam(params.date);
  const reservedTime = firstParam(params.time);

  const loadSummary = useCallback(async () => {
    if (!token) {
      return;
    }

    const requestId = summaryRequestRef.current + 1;
    summaryRequestRef.current = requestId;

    try {
      setSummaryLoading(true);
      setSummaryError("");

      const active: AppointmentSummary[] = [];
      let page = 1;

      // El backend ordena primero todas las citas activas futuras. Solo
      // avanzamos otra página si la página completa todavía pertenece a ese
      // bloque; así el contador no queda limitado a los primeros 50 registros.
      while (true) {
        const result = await getMyAppointments(token, {
          page,
          pageSize: 100,
        });

        if (requestId !== summaryRequestRef.current) {
          return;
        }

        const appointments =
          (result.appointments ?? []) as AppointmentSummary[];
        const activeOnPage = appointments.filter(isUpcomingAppointment);
        active.push(...activeOnPage);

        const reachedNonActiveAppointments =
          activeOnPage.length < appointments.length;

        if (
          appointments.length === 0 ||
          !result.pagination?.hasMore ||
          reachedNonActiveAppointments
        ) {
          break;
        }

        page += 1;
      }

      const sortedActive = [
        ...new Map(
          active.map((appointment) => [appointment.id, appointment])
        ).values(),
      ].sort((a, b) =>
        `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
      );

      if (requestId !== summaryRequestRef.current) {
        return;
      }

      setPendingCount(
        sortedActive.filter((appointment) => appointment.status === "PENDING")
          .length
      );
      setNextAppointment(sortedActive[0] ?? null);
    } catch (error) {
      if (requestId !== summaryRequestRef.current) {
        return;
      }

      setSummaryError(
        error instanceof Error
          ? error.message
          : "No pudimos actualizar el resumen."
      );
    } finally {
      if (requestId === summaryRequestRef.current) {
        setSummaryLoading(false);
      }
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadSummary();

      return () => {
        summaryRequestRef.current += 1;
      };
    }, [loadSummary])
  );

  async function handleLogout() {
    try {
      await signOut();

      router.replace(
        "/auth/login"
      );
    } catch (error) {
      router.replace("/auth/login");

      showMessage(
        "Sesión cerrada con advertencia",
        error instanceof Error
          ? error.message
          : "La sesión se cerró, pero no pudimos confirmar la limpieza local.",
        { kind: "error" }
      );
    }
  }

  async function handleEnableReminders() {
    if (!notificationsSupported || registeringNotifications) {
      return;
    }

    const enabled = await enableNotifications();

    if (enabled) {
      showMessage(
        "Recordatorios activados",
        "Te avisaremos cuando sea momento de confirmar tu asistencia.",
        { kind: "success" }
      );
      return;
    }

    showMessage(
      "No pudimos activar los recordatorios",
      permissionStatus === "denied"
        ? "Permite las notificaciones desde los ajustes de tu dispositivo e inténtalo nuevamente."
        : "Revisa tu conexión e inténtalo nuevamente. Tu cita sigue guardada.",
      { kind: "info" }
    );
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
        <View>
          <Text style={styles.brand}>
            Barbería Cale
          </Text>

          <Text style={styles.greeting} accessibilityRole="header">
            Hola, {user?.firstName}
          </Text>
        </View>

        <UserMenu
          name={user?.firstName}
          role="Cliente"
          onLogout={handleLogout}
        />
      </View>

      {(accountCreated || reservationCreated) && (
        <View
          style={styles.successBanner}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <AppIcon
            name={{
              ios: "checkmark.circle.fill",
              android: "check_circle",
              web: "check_circle",
            }}
            size={23}
            color={COLORS.success}
          />

          <View style={styles.successContent}>
            <Text style={styles.successTitle}>
              {accountCreated ? "Tu cuenta está lista" : "Cita solicitada"}
            </Text>

            <Text style={styles.successText}>
              {accountCreated
                ? "Ya puedes reservar y consultar tus citas desde aquí."
                : reservedDate && reservedTime
                  ? `${formatDisplayDate(reservedDate)}, ${formatDisplayTime(reservedTime)}. Está pendiente de confirmación.`
                  : "La solicitud quedó pendiente de confirmación."}
            </Text>

            {reservationCreated && (
              <View style={styles.successActions}>
                <Pressable
                  style={styles.successAction}
                  accessibilityRole="button"
                  accessibilityLabel="Ver mis citas"
                  onPress={() => router.replace("/client/my-appointments")}
                >
                  <Text style={styles.successActionText}>Ver mis citas</Text>
                </Pressable>

                {notificationsSupported &&
                  registrationStatus !== "registered" && (
                    <Pressable
                      style={[
                        styles.reminderSuccessAction,
                        registeringNotifications && styles.disabledAction,
                      ]}
                      disabled={registeringNotifications}
                      accessibilityRole="button"
                      accessibilityLabel="Activar recordatorios para la cita"
                      accessibilityState={{
                        disabled: registeringNotifications,
                        busy: registeringNotifications,
                      }}
                      onPress={() => void handleEnableReminders()}
                    >
                      <AppIcon
                        name={{
                          ios: "bell",
                          android: "notifications_none",
                          web: "notifications_none",
                        }}
                        size={17}
                        color={COLORS.primary}
                      />
                      <Text style={styles.reminderSuccessActionText}>
                        {registeringNotifications
                          ? "Activando..."
                          : registrationStatus === "failed"
                            ? "Reintentar recordatorios"
                            : "Activar recordatorios"}
                      </Text>
                    </Pressable>
                  )}
              </View>
            )}

            {reservationCreated &&
              notificationsSupported &&
              registrationStatus === "registered" && (
                <View style={styles.remindersReadyRow}>
                  <AppIcon
                    name={{
                      ios: "bell.fill",
                      android: "notifications_active",
                      web: "notifications_active",
                    }}
                    size={16}
                    color={COLORS.success}
                  />
                  <Text style={styles.remindersReadyText}>
                    Recordatorios activados para este dispositivo.
                  </Text>
                </View>
              )}
          </View>

          <Pressable
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar confirmación"
            onPress={() => router.replace("/client")}
          >
            <AppIcon
              name={{
                ios: "xmark",
                android: "close",
                web: "close",
              }}
              size={19}
              color={COLORS.textSecondary}
            />
          </Pressable>
        </View>
      )}

      <View style={styles.hero}>
        <View
          pointerEvents="none"
          style={styles.heroDecorationLarge}
        />

        <View
          pointerEvents="none"
          style={styles.heroDecorationSmall}
        />

        <View style={styles.heroAccent} />

        <Text style={styles.heroEyebrow}>
          TU MOMENTO, TU ESTILO
        </Text>

        <Text style={styles.heroTitle}>
          Tu próximo corte
          empieza aquí
        </Text>

        <Text style={styles.heroDescription}>
          Elige tu horario y nosotros
          tendremos la silla lista para ti.
        </Text>

        <Pressable
          style={({ pressed }) => [
            styles.heroButton,
            pressed &&
              styles.primaryPressed,
          ]}
          onPress={() =>
            router.push(
              "/client/appointment"
            )
          }
          accessibilityRole="button"
          accessibilityLabel="Agendar mi cita"
          accessibilityHint="Abre la selección de fecha y hora"
        >
          <Text
            style={
              styles.heroButtonText
            }
          >
            Agendar mi cita
          </Text>

          <View style={styles.heroButtonIcon}>
            <AppIcon
              name={{
                ios: "arrow.right",
                android: "arrow_forward",
                web: "arrow_forward",
              }}
              size={18}
              color={COLORS.primary}
            />
          </View>
        </Pressable>
      </View>

      <View style={styles.summaryHeader}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Tu próxima visita
        </Text>

        <Pressable
          style={styles.refreshSummaryButton}
          disabled={summaryLoading}
          accessibilityRole="button"
          accessibilityLabel="Actualizar resumen de citas"
          accessibilityState={{ disabled: summaryLoading, busy: summaryLoading }}
          onPress={() => void loadSummary()}
        >
          <AppIcon
            name={{
              ios: "arrow.clockwise",
              android: "refresh",
              web: "refresh",
            }}
            size={19}
            color={COLORS.primary}
          />
        </Pressable>
      </View>

      {summaryError && nextAppointment ? (
        <View style={styles.summaryInlineError} accessibilityRole="alert">
          <Text style={styles.summaryInlineErrorText}>
            No pudimos actualizar el resumen. Mostramos la última información disponible.
          </Text>
        </View>
      ) : null}

      {summaryLoading && !nextAppointment ? (
        <View
          style={styles.summaryCard}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Actualizando tus citas"
        >
          <Text style={styles.summaryMutedText}>Actualizando tus citas…</Text>
        </View>
      ) : summaryError && !nextAppointment ? (
        <View style={styles.summaryErrorCard} accessibilityRole="alert">
          <Text style={styles.summaryErrorText}>{summaryError}</Text>
          <Pressable
            style={styles.summaryRetryButton}
            accessibilityRole="button"
            onPress={() => void loadSummary()}
          >
            <Text style={styles.summaryRetryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : nextAppointment ? (
        <Pressable
          style={styles.summaryCard}
          accessibilityRole="button"
          accessibilityLabel={`Próxima cita: ${formatDisplayDate(nextAppointment.date)} a las ${formatDisplayTime(nextAppointment.time)}, ${nextAppointment.status === "PENDING" ? "pendiente" : "confirmada"}`}
          accessibilityHint="Abre Mis citas"
          onPress={() => router.push("/client/my-appointments")}
        >
          <View style={styles.summaryMain}>
            <Text style={styles.summaryDate}>
              {formatDisplayDate(nextAppointment.date)}
            </Text>
            <Text style={styles.summaryTime}>
              {formatDisplayTime(nextAppointment.time)} · {nextAppointment.service}
            </Text>
          </View>

          <View style={styles.summaryBadges}>
            <View
              style={[
                styles.summaryStatus,
                nextAppointment.status === "ACCEPTED" && styles.summaryStatusAccepted,
              ]}
            >
              <Text
                style={[
                  styles.summaryStatusText,
                  nextAppointment.status === "ACCEPTED" && styles.summaryStatusAcceptedText,
                ]}
              >
                {nextAppointment.status === "PENDING" ? "Pendiente" : "Confirmada"}
              </Text>
            </View>

            {pendingCount > 0 && (
              <Text style={styles.pendingSummaryText}>
                {pendingCount} {pendingCount === 1 ? "solicitud pendiente" : "solicitudes pendientes"}
              </Text>
            )}
          </View>
        </Pressable>
      ) : (
        <Pressable
          style={styles.summaryCard}
          accessibilityRole="button"
          accessibilityLabel="No tienes próximas citas. Agendar una cita"
          onPress={() => router.push("/client/appointment")}
        >
          <Text style={styles.summaryDate}>Aún no tienes una cita próxima</Text>
          <Text style={styles.summaryMutedText}>Toca aquí cuando quieras reservar tu corte.</Text>
        </Pressable>
      )}

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Servicio
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.serviceCard,
          pressed &&
            styles.cardPressed,
        ]}
        onPress={() =>
          router.push(
            "/client/appointment"
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Corte de cabello, 50 minutos"
        accessibilityHint="Abre la agenda para reservar"
      >
        <View style={styles.serviceIcon}>
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
            50 min · Reserva por hora
          </Text>
        </View>

        <AppIcon
          name={{
            ios: "chevron.right",
            android: "chevron_right",
            web: "chevron_right",
          }}
          size={22}
          color={COLORS.textMuted}
        />
      </Pressable>

      <Text style={styles.sectionTitle} accessibilityRole="header">
        Tus citas
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.appointmentCard,
          pressed &&
            styles.cardPressed,
        ]}
        onPress={() =>
          router.push(
            "/client/my-appointments"
          )
        }
        accessibilityRole="button"
        accessibilityLabel="Revisar mis citas"
        accessibilityHint="Consulta estados, horarios y cancelaciones"
      >
        <View style={styles.appointmentContent}>
          <Text
            style={
              styles.appointmentTitle
            }
          >
            Revisar mis citas
          </Text>

          <Text
            style={
              styles.appointmentText
            }
          >
            Consulta estados,
            horarios y cancelaciones.
          </Text>
        </View>

        <View
          style={
            styles.appointmentAction
          }
        >
          <Text
            style={
              styles.appointmentActionText
            }
          >
            Ver
          </Text>
        </View>
      </Pressable>
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
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    marginBottom:
      SPACING.xl,
    zIndex: 20,
  },

  brand: {
    fontSize:
      FONT.small,
    color:
      COLORS.primary,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  greeting: {
    fontSize:
      FONT.heading,
    fontFamily:
      FONT_FAMILY.display,
    fontWeight: "700",
    color:
      COLORS.text,
  },

  hero: {
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.xl,
    padding:
      SPACING.lg,
    marginBottom:
      SPACING.xl,
    overflow: "hidden",
    position: "relative",
  },

  successBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    backgroundColor: COLORS.successBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },

  successContent: {
    flex: 1,
    minWidth: 0,
  },

  successTitle: {
    color: COLORS.success,
    fontSize: FONT.body,
    fontWeight: "800",
    marginBottom: 3,
  },

  successText: {
    color: COLORS.text,
    fontSize: FONT.small,
    lineHeight: 20,
  },

  successAction: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },

  successActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },

  successActionText: {
    color: COLORS.primary,
    fontSize: FONT.small,
    fontWeight: "800",
  },

  reminderSuccessAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
  },

  reminderSuccessActionText: {
    color: COLORS.primary,
    fontSize: FONT.small,
    fontWeight: "800",
  },

  disabledAction: {
    opacity: 0.55,
  },

  remindersReadyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    marginTop: SPACING.xs,
  },

  remindersReadyText: {
    flex: 1,
    color: COLORS.success,
    fontSize: FONT.caption,
    lineHeight: 18,
    fontWeight: "700",
  },

  dismissButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -10,
    marginRight: -10,
  },

  heroDecorationLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor:
      "rgba(255, 252, 247, 0.16)",
    top: -85,
    right: -55,
  },

  heroDecorationSmall: {
    position: "absolute",
    width: 105,
    height: 105,
    borderRadius: 53,
    backgroundColor:
      "rgba(196, 154, 69, 0.16)",
    right: 18,
    bottom: -58,
  },

  heroAccent: {
    width: 42,
    height: 3,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.accent,
    marginBottom:
      SPACING.md,
  },

  heroEyebrow: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color:
      COLORS.accentSoft,
    marginBottom:
      SPACING.sm,
  },

  heroTitle: {
    fontSize:
      FONT.title,
    fontFamily:
      FONT_FAMILY.display,
    lineHeight: 38,
    fontWeight: "800",
    color:
      COLORS.onPrimary,
    marginBottom:
      SPACING.md,
  },

  heroDescription: {
    fontSize:
      FONT.body,
    lineHeight: 24,
    color:
      COLORS.primarySoft,
    marginBottom:
      SPACING.lg,
  },

  heroButton: {
    backgroundColor:
      COLORS.onPrimary,
    borderRadius:
      RADIUS.pill,
    paddingVertical: 13,
    paddingHorizontal:
      SPACING.lg,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },

  primaryPressed: {
    opacity: 0.8,
  },

  heroButtonText: {
    color: COLORS.primary,
    fontSize:
      FONT.body,
    fontWeight: "700",
  },

  heroButtonIcon: {
    marginLeft:
      SPACING.sm,
  },

  sectionTitle: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom:
      SPACING.md,
  },

  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  refreshSummaryButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -12,
  },

  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.accentSoft,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },

  summaryMain: {
    minWidth: 0,
  },

  summaryDate: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "800",
    marginBottom: 4,
  },

  summaryTime: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    lineHeight: 20,
  },

  summaryMutedText: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    lineHeight: 20,
  },

  summaryBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },

  summaryStatus: {
    backgroundColor: COLORS.warningBackground,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },

  summaryStatusAccepted: {
    backgroundColor: COLORS.successBackground,
  },

  summaryStatusText: {
    color: COLORS.warning,
    fontSize: FONT.caption,
    fontWeight: "800",
  },

  summaryStatusAcceptedText: {
    color: COLORS.success,
  },

  pendingSummaryText: {
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    fontWeight: "600",
  },

  summaryErrorCard: {
    backgroundColor: COLORS.dangerBackground,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },

  summaryInlineError: {
    backgroundColor: COLORS.dangerBackground,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },

  summaryInlineErrorText: {
    color: COLORS.danger,
    fontSize: FONT.caption,
    lineHeight: 18,
  },

  summaryErrorText: {
    color: COLORS.danger,
    fontSize: FONT.small,
    lineHeight: 20,
  },

  summaryRetryButton: {
    minHeight: 44,
    alignSelf: "flex-start",
    justifyContent: "center",
  },

  summaryRetryText: {
    color: COLORS.primary,
    fontSize: FONT.small,
    fontWeight: "800",
  },

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.primarySoft,
    borderRadius:
      RADIUS.lg,
    padding:
      SPACING.md,
    borderWidth: 0,
    marginBottom:
      SPACING.xl,
  },

  serviceIcon: {
    width: 52,
    height: 52,
    borderRadius:
      RADIUS.md,
    backgroundColor:
      COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight:
      SPACING.md,
  },

  serviceInfo: {
    flex: 1,
  },

  serviceName: {
    fontSize:
      FONT.body,
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

  appointmentCard: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    alignItems: "center",
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.lg,
    padding:
      SPACING.lg,
    borderWidth: 1,
    borderColor:
      COLORS.accentSoft,
  },

  appointmentContent: {
    flex: 1,
    paddingRight:
      SPACING.md,
  },

  appointmentTitle: {
    fontSize:
      FONT.body,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom: 5,
  },

  appointmentText: {
    fontSize:
      FONT.small,
    color:
      COLORS.textSecondary,
    lineHeight: 20,
  },

  appointmentAction: {
    backgroundColor:
      COLORS.primary,
    paddingHorizontal:
      SPACING.md,
    paddingVertical:
      SPACING.sm,
    borderRadius:
      RADIUS.pill,
  },

  appointmentActionText: {
    color:
      COLORS.onPrimary,
    fontSize:
      FONT.small,
    fontWeight: "700",
  },

  cardPressed: {
    opacity: 0.75,
  },
});
