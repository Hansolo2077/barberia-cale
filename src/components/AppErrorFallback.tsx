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
  FONT_FAMILY,
  RADIUS,
  SPACING,
} from "../constants/app-theme";

export default function AppErrorFallback({
  title,
  message,
  onRetry,
  onGoHome,
}: {
  title: string;
  message: string;
  onRetry?: () => void | Promise<void>;
  onGoHome?: () => void;
}) {
  const router = useRouter();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.screenContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>BARBERÍA CALE</Text>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text
          style={styles.message}
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          {message}
        </Text>

        {onRetry ? (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            onPress={() => void onRetry()}
            accessibilityRole="button"
            accessibilityLabel="Intentar nuevamente"
          >
            <Text style={styles.primaryText}>Intentar nuevamente</Text>
          </Pressable>
        ) : null}

        <Pressable
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.pressed,
          ]}
          onPress={() => {
            if (onGoHome) {
              onGoHome();
              return;
            }

            router.replace("/");
          }}
          accessibilityRole="button"
          accessibilityLabel="Ir al inicio"
        >
          <Text style={styles.secondaryText}>Ir al inicio</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  screenContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  },
  card: {
    width: "100%",
    maxWidth: 500,
    padding: SPACING.xl,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  eyebrow: {
    color: COLORS.accentText,
    fontSize: FONT.caption,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  title: {
    marginTop: SPACING.sm,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.display,
    fontSize: FONT.title,
    fontWeight: "700",
  },
  message: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    color: COLORS.textSecondary,
    fontSize: FONT.body,
    lineHeight: 24,
  },
  primaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  primaryText: {
    color: COLORS.onPrimary,
    fontSize: FONT.body,
    fontWeight: "800",
  },
  secondaryButton: {
    minHeight: 48,
    marginTop: SPACING.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },
  secondaryText: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.7,
  },
});
