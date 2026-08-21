import { useRouter } from "expo-router";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import UserMenu from "../../components/UserMenu";

import { useAuth } from "../../context/AuthContext";

import {
    COLORS,
    FONT,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

export default function ClientHomeScreen() {
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
        <View>
          <Text style={styles.brand}>
            Barbería Cale
          </Text>

          <Text style={styles.greeting}>
            Hola, {user?.firstName}
          </Text>
        </View>

        <UserMenu
          name={user?.firstName}
          role="Cliente"
          onLogout={handleLogout}
        />
      </View>

      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>
          TU PRÓXIMO CORTE
        </Text>

        <Text style={styles.heroTitle}>
          Reserva fácil,
          rápido y sin llamadas
        </Text>

        <Text style={styles.heroDescription}>
          Consulta horarios disponibles
          y agenda tu cita en pocos pasos.
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
        >
          <Text
            style={
              styles.heroButtonText
            }
          >
            Reservar ahora
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>
        Servicios
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
      >
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
            50 min · Reserva por hora
          </Text>
        </View>

        <Text style={styles.chevron}>
          ›
        </Text>
      </Pressable>

      <Text style={styles.sectionTitle}>
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
      COLORS.textSecondary,
    fontWeight: "600",
    marginBottom: 4,
  },

  greeting: {
    fontSize:
      FONT.heading,
    fontWeight: "700",
    color:
      COLORS.text,
  },

  hero: {
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.xl,
    padding:
      SPACING.lg,
    marginBottom:
      SPACING.xl,
    borderWidth: 1,
    borderColor:
      COLORS.border,
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
      FONT.title,
    lineHeight: 38,
    fontWeight: "800",
    color:
      COLORS.text,
    marginBottom:
      SPACING.md,
  },

  heroDescription: {
    fontSize:
      FONT.body,
    lineHeight: 24,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.lg,
  },

  heroButton: {
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
  },

  primaryPressed: {
    opacity: 0.8,
  },

  heroButtonText: {
    color: "#FFFFFF",
    fontSize:
      FONT.body,
    fontWeight: "700",
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

  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor:
      COLORS.surface,
    borderRadius:
      RADIUS.lg,
    padding:
      SPACING.md,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    marginBottom:
      SPACING.xl,
  },

  serviceIcon: {
    width: 52,
    height: 52,
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

  chevron: {
    fontSize: 28,
    color:
      COLORS.textMuted,
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
      COLORS.border,
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
      COLORS.primarySoft,
    paddingHorizontal:
      SPACING.md,
    paddingVertical:
      SPACING.sm,
    borderRadius:
      RADIUS.pill,
  },

  appointmentActionText: {
    color:
      COLORS.text,
    fontSize:
      FONT.small,
    fontWeight: "700",
  },

  cardPressed: {
    opacity: 0.75,
  },
});