import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from "../constants/app-theme";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.brandBlock}>
        <View style={styles.brandIcon}>
          <Text style={styles.brandIconText}>
            ✂
          </Text>
        </View>

        <Text style={styles.brand}>
          Barbería Cale
        </Text>

        <Text style={styles.brandSubtitle}>
          Tu próxima cita, sin llamadas y sin esperar.
        </Text>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>
          RESERVAS SIMPLES
        </Text>

        <Text style={styles.heroTitle}>
          Tu corte,
          cuando te convenga
        </Text>

        <Text style={styles.heroText}>
          Consulta horarios disponibles,
          reserva tu cita y revisa su estado
          desde un solo lugar.
        </Text>

        <Pressable
          style={styles.primaryButton}
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
              Consulta los horarios disponibles para el día que prefieras.
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
              Los horarios ocupados se muestran claramente y no pueden seleccionarse.
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
              Consulta si tu cita está pendiente, confirmada, rechazada o cancelada.
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.footer}>
        Barbería Cale
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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

  brandIcon: {
    width: 72,
    height: 72,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },

  brandIconText: {
    fontSize: 30,
  },

  brand: {
    fontSize: FONT.heading,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: SPACING.xs,
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
  },
});