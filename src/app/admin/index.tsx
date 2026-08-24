import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import {
    AdminAppointment,
    AppointmentStatusCounts,
    getAdminAppointments,
    getAdminSchedule,
} from "../../api/admin.api";
import { ApiError } from "../../api/api-client";
import UserMenu from "../../components/UserMenu";
import AppIcon from "../../components/AppIcon";
import { useAuth } from "../../context/AuthContext";
import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";
import { showMessage } from "../../utils/show-message";
import {
    getBusinessTodayIso,
    isAppointmentPast,
} from "../../utils/business-date";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

export default function AdminHomeScreen() {
  const router = useRouter();

  const {
    user,
    token,
    signOut,
  } = useAuth();

  const hasLoadedRef = useRef(false);
  const dashboardRequestRef = useRef(0);
  const [appointments, setAppointments] =
    useState<AdminAppointment[]>([]);
  const [statusCounts, setStatusCounts] =
    useState<AppointmentStatusCounts>({});
  const [acceptedTodayCount, setAcceptedTodayCount] =
    useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);
  const [showWorkflow, setShowWorkflow] =
    useState(false);

  const loadDashboard = useCallback(
    async (mode: "initial" | "refresh" | "silent" = "silent") => {
      if (!token) {
        return;
      }

      const requestId = dashboardRequestRef.current + 1;
      dashboardRequestRef.current = requestId;

      try {
        if (mode === "initial") {
          setLoading(true);
        }

        if (mode === "refresh") {
          setRefreshing(true);
        }

        setError("");

        const today = getBusinessTodayIso();
        const [summaryResult, nextResult, todayResult] = await Promise.all([
          getAdminAppointments(token, {
            page: 1,
            pageSize: 1,
          }),
          getAdminAppointments(token, {
            page: 1,
            pageSize: 1,
            status: "ACCEPTED",
            upcomingOnly: true,
          }),
          getAdminSchedule(token, today, today, {
            page: 1,
            pageSize: 1,
            status: "ACCEPTED",
          }),
        ]);

        if (requestId !== dashboardRequestRef.current) {
          return;
        }

        setAppointments(nextResult.appointments ?? []);
        setStatusCounts(summaryResult.statusCounts ?? {});
        setAcceptedTodayCount(
          todayResult.pagination?.total ??
            todayResult.appointments.filter(
              (appointment) => appointment.status === "ACCEPTED"
            ).length
        );
        setLastUpdated(new Date());
        hasLoadedRef.current = true;
        setHasLoaded(true);
      } catch (loadError) {
        if (requestId !== dashboardRequestRef.current) {
          return;
        }

        if (
          loadError instanceof ApiError &&
          loadError.code === "UNAUTHORIZED"
        ) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "No se pudo actualizar el panel."
        );
      } finally {
        if (requestId === dashboardRequestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      void loadDashboard(
        hasLoadedRef.current ? "silent" : "initial"
      );

      return () => {
        dashboardRequestRef.current += 1;
      };
    }, [loadDashboard])
  );

  async function handleLogout() {
    try {
      await signOut();

      router.replace(
        "/auth/login"
      );
    } catch (error) {
      showMessage(
        "Sesión cerrada con advertencia",
        error instanceof Error
          ? error.message
          : "La sesión se cerró, pero no pudimos confirmar la limpieza local.",
        { kind: "error" }
      );
    }
  }

  const pendingCount =
    statusCounts?.PENDING ??
    appointments.filter(
      (appointment) => appointment.status === "PENDING"
    ).length;

  const nextAppointment = appointments
    .filter(
      (appointment) =>
        appointment.status === "ACCEPTED" &&
        !isAppointmentPast(appointment.date, appointment.time)
    )
    .sort((first, second) =>
      `${first.date} ${first.time}`.localeCompare(
        `${second.date} ${second.time}`
      )
    )[0];

  const updatedLabel = lastUpdated
    ? `Actualizado a las ${lastUpdated.toLocaleTimeString("es-NI", {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "Aún no se ha actualizado";

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadDashboard("refresh")}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.eyebrow}>
            PANEL ADMINISTRATIVO
          </Text>

          <Text style={styles.title}>
            Barbería Cale
          </Text>

          <Text style={styles.subtitle}>
            Hola, {user?.firstName}.
            Administra las solicitudes y
            la agenda de la barbería.
          </Text>
        </View>

        <UserMenu
          name={user?.firstName}
          role="Administrador"
          onLogout={handleLogout}
        />
      </View>

      <View
        style={styles.heroCard}
        accessibilityLiveRegion="polite"
        accessibilityRole="summary"
      >
        <View style={styles.heroTopRow}>
          <View style={styles.heroHeading}>
            <Text style={styles.heroEyebrow}>
              HOY EN LA BARBERÍA
            </Text>

            <Text style={styles.heroTitle}>
              Resumen operativo
            </Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.refreshButton,
              pressed && styles.cardPressed,
            ]}
            onPress={() => void loadDashboard("refresh")}
            disabled={refreshing || loading}
            accessibilityRole="button"
            accessibilityLabel="Actualizar resumen administrativo"
            accessibilityState={{
              disabled: refreshing || loading,
              busy: refreshing || loading,
            }}
          >
            {refreshing ? (
              <ActivityIndicator
                size="small"
                color={COLORS.primary}
              />
            ) : (
              <AppIcon
                name={{
                  ios: "arrow.clockwise",
                  android: "refresh",
                  web: "refresh",
                }}
                size={20}
                color={COLORS.primary}
              />
            )}
          </Pressable>
        </View>

        {loading && !hasLoaded ? (
          <View style={styles.heroLoading}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.heroText}>
              Actualizando el trabajo de hoy…
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>{pendingCount}</Text>
                <Text style={styles.metricLabel}>Pendientes</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricValue}>
                  {acceptedTodayCount}
                </Text>
                <Text style={styles.metricLabel}>
                  Confirmadas hoy
                </Text>
              </View>
            </View>

            <View style={styles.nextAppointmentCard}>
              <View style={styles.nextAppointmentIcon}>
                <AppIcon
                  name={{
                    ios: "clock.fill",
                    android: "schedule",
                    web: "schedule",
                  }}
                  size={20}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.nextAppointmentContent}>
                <Text style={styles.nextAppointmentLabel}>
                  PRÓXIMA CITA CONFIRMADA
                </Text>

                <Text style={styles.nextAppointmentText}>
                  {nextAppointment
                    ? `${formatDisplayDate(nextAppointment.date)}, ${formatDisplayTime(nextAppointment.time)}`
                    : "No hay otra cita confirmada próximamente."}
                </Text>

                {nextAppointment && (
                  <Text style={styles.nextAppointmentClient}>
                    {nextAppointment.firstName} {nextAppointment.lastName}
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        <View style={styles.updateRow}>
          <Text style={styles.updatedText}>{updatedLabel}</Text>

          {error ? (
            <Text style={styles.dashboardError}>
              No se pudo actualizar. Desliza hacia abajo o inténtalo de nuevo.
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Acciones principales
      </Text>

      <Pressable
        style={({ pressed }) => [
          styles.actionCard,
          pressed &&
            styles.cardPressed,
        ]}
        onPress={() =>
          router.push(
            "/admin/appointments"
          )
        }
        accessibilityRole="button"
        accessibilityLabel={`Gestionar citas, ${pendingCount} pendientes`}
      >
        <View style={styles.actionIcon}>
          <AppIcon
            name={{
              ios: "list.clipboard.fill",
              android: "assignment",
              web: "assignment",
            }}
            size={24}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>
            Gestionar citas
          </Text>

          <Text style={styles.actionText}>
            {pendingCount === 0
              ? "No hay solicitudes pendientes."
              : pendingCount === 1
                ? "Hay 1 solicitud pendiente."
                : `Hay ${pendingCount} solicitudes pendientes.`}
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

      <Pressable
        style={({ pressed }) => [
          styles.actionCard,
          pressed &&
            styles.cardPressed,
        ]}
        onPress={() =>
          router.push(
            "/admin/schedule"
          )
        }
        accessibilityRole="button"
        accessibilityLabel={`Ver agenda, ${acceptedTodayCount} citas confirmadas hoy`}
      >
        <View style={styles.actionIcon}>
          <AppIcon
            name={{
              ios: "calendar",
              android: "calendar_month",
              web: "calendar_month",
            }}
            size={24}
            color={COLORS.primary}
          />
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>
            Ver agenda
          </Text>

          <Text style={styles.actionText}>
            Consulta las citas por rango
            de fechas.
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

      <View style={styles.infoCard}>
        <Pressable
          style={styles.workflowToggle}
          onPress={() => setShowWorkflow((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={
            showWorkflow
              ? "Ocultar guía del flujo de trabajo"
              : "Mostrar guía del flujo de trabajo"
          }
          accessibilityState={{ expanded: showWorkflow }}
        >
          <Text style={styles.infoTitle}>
            Guía del flujo de trabajo
          </Text>

          <AppIcon
            name={{
              ios: showWorkflow ? "chevron.up" : "chevron.down",
              android: showWorkflow ? "expand_less" : "expand_more",
              web: showWorkflow ? "expand_less" : "expand_more",
            }}
            size={20}
            color={COLORS.primary}
          />
        </Pressable>

        {showWorkflow && (
          <View style={styles.workflowContent}>
            <View style={styles.infoRow}>
              <View style={styles.infoDot} />

              <Text style={styles.infoText}>
                Las nuevas solicitudes llegan como pendientes.
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoDot} />

              <Text style={styles.infoText}>
                Al aceptar una cita, el horario queda reservado.
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoDot} />

              <Text style={styles.infoText}>
                Las citas rechazadas o canceladas liberan el horario.
              </Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoDot} />

              <Text style={styles.infoText}>
                Una cita confirmada puede completarse cuando llegue su hora.
              </Text>
            </View>
          </View>
        )}
      </View>
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
    alignItems:
      "flex-start",
    gap: SPACING.md,
    marginBottom:
      SPACING.xl,
    zIndex: 20,
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
    maxWidth: 420,
  },

  heroCard: {
    backgroundColor:
      COLORS.primarySoft,
    borderRadius:
      RADIUS.xl,
    padding:
      SPACING.lg,
    marginBottom:
      SPACING.xl,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: SPACING.md,
  },

  heroHeading: {
    flex: 1,
    minWidth: 0,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
  },

  heroEyebrow: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.sm,
  },

  heroTitle: {
    fontSize:
      FONT.heading,
    fontFamily:
      FONT_FAMILY.display,
    fontWeight: "800",
    color:
      COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  heroText: {
    fontSize:
      FONT.body,
    lineHeight: 24,
    color:
      COLORS.textSecondary,
  },

  heroLoading: {
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },

  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },

  metricCard: {
    flexGrow: 1,
    flexBasis: 130,
    minWidth: 0,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },

  metricValue: {
    color: COLORS.primary,
    fontSize: FONT.heading,
    fontFamily: FONT_FAMILY.display,
    fontWeight: "800",
  },

  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    fontWeight: "700",
    marginTop: SPACING.xs,
  },

  nextAppointmentCard: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
  },

  nextAppointmentIcon: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentSoft,
    marginRight: SPACING.sm,
  },

  nextAppointmentContent: {
    flex: 1,
    minWidth: 0,
  },

  nextAppointmentLabel: {
    color: COLORS.primary,
    fontSize: FONT.caption,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 3,
  },

  nextAppointmentText: {
    color: COLORS.text,
    fontSize: FONT.small,
    lineHeight: 20,
    fontWeight: "700",
  },

  nextAppointmentClient: {
    color: COLORS.textSecondary,
    fontSize: FONT.caption,
    marginTop: 3,
  },

  updateRow: {
    marginTop: SPACING.md,
  },

  updatedText: {
    color: COLORS.textMuted,
    fontSize: FONT.caption,
  },

  dashboardError: {
    color: COLORS.danger,
    fontSize: FONT.caption,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: SPACING.xs,
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

  actionCard: {
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
      SPACING.sm,
  },

  cardPressed: {
    opacity: 0.75,
  },

  actionIcon: {
    width: 50,
    height: 50,
    borderRadius:
      RADIUS.md,
    backgroundColor:
      COLORS.primarySoft,
    justifyContent:
      "center",
    alignItems: "center",
    marginRight:
      SPACING.md,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize:
      FONT.body,
    fontWeight: "700",
    color:
      COLORS.text,
    marginBottom: 4,
  },

  actionText: {
    fontSize:
      FONT.small,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
  },

  infoCard: {
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius:
      RADIUS.lg,
    padding:
      SPACING.lg,
    marginTop:
      SPACING.lg,
  },

  infoTitle: {
    fontSize:
      FONT.subheading,
    fontWeight: "700",
    color:
      COLORS.text,
  },

  workflowToggle: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: SPACING.md,
  },

  workflowContent: {
    marginTop: SPACING.md,
  },

  infoRow: {
    flexDirection: "row",
    alignItems:
      "flex-start",
    marginBottom:
      SPACING.sm,
  },

  infoDot: {
    width: 8,
    height: 8,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.primary,
    marginTop: 7,
    marginRight:
      SPACING.sm,
  },

  infoText: {
    flex: 1,
    fontSize:
      FONT.small,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
  },
});
