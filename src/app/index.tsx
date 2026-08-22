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

import {
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from "../constants/app-theme";

export default function HomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
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
        />

        <Text style={styles.brand}>
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
    color: "#C9A227",
    marginLeft: 7,
  },

  brandDivider: {
    width: 42,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#C9A227",
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
    letterSpacing: 1.5,
  },
});
