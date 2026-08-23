import { useRouter } from "expo-router";
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
    signOut,
  } = useAuth();

  async function handleLogout() {
    try {
      await signOut();

      router.replace(
        "/auth/login"
      );
    } catch (error) {
      console.error(
        "Error cerrando sesión:",
        error
      );
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

      <View style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>
          GESTIÓN DIARIA
        </Text>

        <Text style={styles.heroTitle}>
          Mantén la agenda bajo control
        </Text>

        <Text style={styles.heroText}>
          Revisa solicitudes pendientes,
          acepta o rechaza citas y
          consulta la agenda por rango
          de fechas.
        </Text>
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
            Revisa solicitudes y cambia
            su estado.
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
        <Text style={styles.infoTitle}>
          Flujo de trabajo
        </Text>

        <View style={styles.infoRow}>
          <View style={styles.infoDot} />

          <Text style={styles.infoText}>
            Las nuevas solicitudes llegan
            como pendientes.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoDot} />

          <Text style={styles.infoText}>
            Al aceptar una cita, el
            horario queda reservado.
          </Text>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoDot} />

          <Text style={styles.infoText}>
            Las citas rechazadas o
            canceladas liberan el horario.
          </Text>
        </View>
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
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius:
      RADIUS.xl,
    padding:
      SPACING.lg,
    marginBottom:
      SPACING.xl,
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
    marginBottom:
      SPACING.md,
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
