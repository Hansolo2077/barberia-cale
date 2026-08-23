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
