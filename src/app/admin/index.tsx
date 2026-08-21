import { useRouter } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { useAuth } from "../../context/AuthContext";

import {
    COLORS,
    FONT,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

export default function AdminHomeScreen() {
  const router = useRouter();

  const { user } = useAuth();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>
            PANEL ADMINISTRATIVO
          </Text>

          <Text style={styles.title}>
            Barbería Cale
          </Text>

          <Text style={styles.subtitle}>
            Hola, {user?.firstName}. Administra las
            solicitudes y la agenda de la barbería.
          </Text>
        </View>

        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>
            ADMIN
          </Text>
        </View>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>
          GESTIÓN DIARIA
        </Text>

        <Text style={styles.heroTitle}>
          Mantén la agenda bajo control
        </Text>

        <Text style={styles.heroText}>
          Revisa solicitudes pendientes, acepta o
          rechaza citas y consulta la agenda por
          rango de fechas.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>
        Acciones principales
      </Text>

      <Pressable
        style={styles.actionCard}
        onPress={() =>
          router.push("/admin/appointments")
        }
      >
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>
            ✓
          </Text>
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>
            Gestionar citas
          </Text>

          <Text style={styles.actionText}>
            Revisa solicitudes y cambia su estado.
          </Text>
        </View>

        <Text style={styles.chevron}>
          ›
        </Text>
      </Pressable>

      <Pressable
        style={styles.actionCard}
        onPress={() =>
          router.push("/admin/schedule")
        }
      >
        <View style={styles.actionIcon}>
          <Text style={styles.actionIconText}>
            ◷
          </Text>
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>
            Ver agenda
          </Text>

          <Text style={styles.actionText}>
            Consulta las citas por rango de fechas.
          </Text>
        </View>

        <Text style={styles.chevron}>
          ›
        </Text>
      </Pressable>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>
          Flujo de trabajo
        </Text>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },

  eyebrow: {
    fontSize: FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },

  title: {
    fontSize: FONT.title,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  subtitle: {
    fontSize: FONT.body,
    lineHeight: 24,
    color: COLORS.textSecondary,
    maxWidth: 420,
  },

  adminBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
  },

  adminBadgeText: {
    color: "#FFFFFF",
    fontSize: FONT.caption,
    fontWeight: "800",
    letterSpacing: 0.8,
  },

  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  heroEyebrow: {
    fontSize: FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  heroTitle: {
    fontSize: FONT.heading,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },

  heroText: {
    fontSize: FONT.body,
    lineHeight: 24,
    color: COLORS.textSecondary,
  },

  sectionTitle: {
    fontSize: FONT.subheading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },

  actionIconText: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    fontSize: FONT.body,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  actionText: {
    fontSize: FONT.small,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  chevron: {
    fontSize: 28,
    color: COLORS.textMuted,
  },

  infoCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginTop: SPACING.lg,
  },

  infoTitle: {
    fontSize: FONT.subheading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.sm,
  },

  infoDot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    marginTop: 7,
    marginRight: SPACING.sm,
  },

  infoText: {
    flex: 1,
    fontSize: FONT.small,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },
});