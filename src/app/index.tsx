import { Redirect, useRouter } from "expo-router";

import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "../context/AuthContext";
import { BUSINESS } from "../constants/business";

import {
  COLORS,
  FONT,
  FONT_FAMILY,
  RADIUS,
  SPACING,
} from "../constants/app-theme";

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={styles.loadingContainer}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel="Cargando Barbería Cale"
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (user) {
    return (
      <Redirect href={user.role === "ADMIN" ? "/admin" : "/client"} />
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "right", "bottom", "left"]}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.brandBlock}>
        <Image
          source={require(
            "../../assets/images/logo-cale.png"
          )}
          style={styles.brandLogo}
          resizeMode="contain"
          accessible
          accessibilityLabel="Logotipo de Barbería Cale"
        />

        <Text style={styles.brand} accessibilityRole="header">
          BARBERÍA
        </Text>

        <Text style={styles.brandName}>
          CALE
        </Text>

        <View style={styles.brandDivider} />

        <Text style={styles.brandSubtitle}>
          Tu próxima cita, sin llamadas y sin esperar.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>
          RESERVAS SIMPLES
        </Text>

        <Text style={styles.heroTitle}>
          Tu corte, cuando te convenga
        </Text>

        <Text style={styles.heroText}>
          Consulta horarios disponibles,
          reserva tu cita y revisa su estado
          desde un solo lugar.
        </Text>

        <Pressable
          style={styles.primaryButton}
          accessibilityRole="button"
          accessibilityLabel="Crear una cuenta de cliente"
          accessibilityHint="Abre el formulario de registro"
          onPress={() =>
            router.push("/auth/register")
          }
        >
          <Text style={styles.primaryButtonText}>
            Crear cuenta
          </Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión"
          accessibilityHint="Abre el formulario de acceso"
          onPress={() =>
            router.push("/auth/login")
          }
        >
          <Text style={styles.secondaryButtonText}>
            Iniciar sesión
          </Text>
        </Pressable>
      </View>

      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>
          Reserva en pocos pasos
        </Text>

        <View style={styles.featureCard}>
          <View style={styles.featureNumber}>
            <Text style={styles.featureNumberText}>
              1
            </Text>
          </View>

          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Elige tu fecha
            </Text>

            <Text style={styles.featureText}>
              Consulta los horarios disponibles para el
              día que prefieras.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureNumber}>
            <Text style={styles.featureNumberText}>
              2
            </Text>
          </View>

          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Selecciona una hora
            </Text>

            <Text style={styles.featureText}>
              Los horarios ocupados se muestran claramente
              y no pueden seleccionarse.
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <View style={styles.featureNumber}>
            <Text style={styles.featureNumberText}>
              3
            </Text>
          </View>

          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>
              Revisa tu reserva
            </Text>

            <Text style={styles.featureText}>
              Consulta si tu cita está pendiente,
              confirmada, rechazada o cancelada.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.practicalSection}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          Antes de reservar
        </Text>

        <View style={styles.practicalCard}>
          <View style={styles.practicalItem}>
            <Text style={styles.practicalLabel}>HORARIO</Text>
            <Text style={styles.practicalValue}>
              Atendemos de 8:00 a. m. a 5:00 p. m.
            </Text>
          </View>

          <View style={styles.practicalDivider} />

          <View style={styles.practicalItem}>
            <Text style={styles.practicalLabel}>SERVICIO</Text>
            <Text style={styles.practicalValue}>
              {BUSINESS.service.name} de {BUSINESS.service.durationMinutes} minutos,
              reservado en un bloque de {BUSINESS.slotMinutes} minutos.
            </Text>
          </View>

          <View style={styles.practicalDivider} />

          <View style={styles.practicalItem}>
            <Text style={styles.practicalLabel}>CONFIRMACIÓN</Text>
            <Text style={styles.practicalValue}>
              Solicita con {BUSINESS.bookingPolicy.minLeadHours} horas de anticipación.
              La barbería confirmará tu cita.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.privacyCard}>
        <Text style={styles.privacyTitle} accessibilityRole="header">
          Tu cuenta, bajo tu control
        </Text>

        <Text style={styles.privacyText}>
          Usamos tu número de celular para identificar tu cuenta y gestionar tus citas.
          Tú decides si deseas mantener la sesión iniciada; evita hacerlo en dispositivos compartidos.
        </Text>
      </View>

      <Text style={styles.footer}>
        BARBERÍA CALE
      </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
  },

  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxl,
  },

  brandBlock: {
    alignItems: "center",
    marginBottom: SPACING.xl,
  },

  brandLogo: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: SPACING.md,
  },

  brand: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 5,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },

  brandName: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    letterSpacing: 7,
    color: COLORS.accentText,
    marginLeft: 7,
  },

  brandDivider: {
    width: 42,
    height: 2,
    borderRadius: 1,
    backgroundColor: COLORS.accent,
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },

  brandSubtitle: {
    fontSize: FONT.small,
    lineHeight: 20,
    color: COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 320,
  },

  heroCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
  },

  eyebrow: {
    fontSize: FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  heroTitle: {
    fontSize: FONT.title,
    fontFamily: FONT_FAMILY.display,
    lineHeight: 39,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  heroText: {
    fontSize: FONT.body,
    lineHeight: 24,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },

  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: SPACING.sm,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: FONT.body,
    fontWeight: "700",
  },

  secondaryButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "700",
  },

  featuresSection: {
    marginBottom: SPACING.xl,
  },

  practicalSection: {
    marginBottom: SPACING.xl,
  },

  practicalCard: {
    backgroundColor: COLORS.primarySoft,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
  },

  practicalItem: {
    paddingVertical: SPACING.md,
  },

  practicalLabel: {
    color: COLORS.primary,
    fontSize: FONT.caption,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginBottom: 4,
  },

  practicalValue: {
    color: COLORS.text,
    fontSize: FONT.small,
    lineHeight: 21,
  },

  practicalDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  privacyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    marginBottom: SPACING.xl,
  },

  privacyTitle: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "700",
    marginBottom: SPACING.xs,
  },

  privacyText: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    lineHeight: 21,
  },

  sectionTitle: {
    fontSize: FONT.subheading,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  featureCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },

  featureNumber: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primarySoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },

  featureNumberText: {
    fontSize: FONT.small,
    fontWeight: "800",
    color: COLORS.text,
  },

  featureContent: {
    flex: 1,
  },

  featureTitle: {
    fontSize: FONT.body,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },

  featureText: {
    fontSize: FONT.small,
    lineHeight: 20,
    color: COLORS.textSecondary,
  },

  footer: {
    textAlign: "center",
    color: COLORS.textMuted,
    fontSize: FONT.caption,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
});
