import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  type AppMessage,
  subscribeToMessages,
} from "../utils/show-message";
import {
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from "../constants/app-theme";

export default function FeedbackProvider({
  children,
}: {
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] =
    useState<AppMessage | null>(null);
  const queueRef = useRef<AppMessage[]>([]);

  useEffect(
    () =>
      subscribeToMessages((incoming) => {
        setCurrent((visible) => {
          if (visible) {
            queueRef.current.push(incoming);
            return visible;
          }

          return incoming;
        });
      }),
    []
  );

  useEffect(() => {
    if (!current) {
      return;
    }

    if (Platform.OS === "ios") {
      void AccessibilityInfo.announceForAccessibility(
        `${current.title}. ${current.message}`
      );
    }

    const timeout = setTimeout(() => {
      setCurrent(queueRef.current.shift() ?? null);
    }, current.durationMs);

    return () => clearTimeout(timeout);
  }, [current]);

  function dismiss() {
    setCurrent(queueRef.current.shift() ?? null);
  }

  return (
    <View style={styles.root}>
      {children}

      {current ? (
        <View
          pointerEvents="box-none"
          style={[
            styles.overlay,
            { top: Math.max(insets.top, SPACING.sm) + SPACING.sm },
          ]}
        >
          <View
            style={[
              styles.toast,
              current.kind === "error" && styles.errorToast,
              current.kind === "success" && styles.successToast,
            ]}
          >
            <View
              style={styles.copy}
              accessibilityLiveRegion={
                current.kind === "error" ? "assertive" : "polite"
              }
            >
              <Text style={styles.title}>{current.title}</Text>
              <Text style={styles.message}>{current.message}</Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.dismissButton,
                pressed && styles.pressed,
              ]}
              onPress={dismiss}
              accessibilityRole="button"
              accessibilityLabel="Cerrar mensaje"
              hitSlop={8}
            >
              <Text style={styles.dismissText}>×</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    left: SPACING.md,
    right: SPACING.md,
    zIndex: 1000,
    alignItems: "center",
  },
  toast: {
    width: "100%",
    maxWidth: 520,
    minHeight: 64,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.surface,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 9,
  },
  errorToast: {
    borderColor: COLORS.danger,
    backgroundColor: COLORS.dangerBackground,
  },
  successToast: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.successBackground,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "800",
  },
  message: {
    color: COLORS.textSecondary,
    fontSize: FONT.small,
    lineHeight: 20,
  },
  dismissButton: {
    width: 44,
    height: 44,
    marginTop: -8,
    marginRight: -8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIUS.pill,
  },
  dismissText: {
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 30,
  },
  pressed: {
    opacity: 0.6,
  },
});
