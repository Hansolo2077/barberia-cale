import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from "../constants/app-theme";

type UserMenuProps = {
  name?: string;
  role: string;
  onLogout: () => void | Promise<void>;
};

export default function UserMenu({
  name,
  role,
  onLogout,
}: UserMenuProps) {
  const insets = useSafeAreaInsets();
  const avatarRef = useRef<any>(null);
  const logoutRef = useRef<any>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const initial =
    name?.charAt(0).toUpperCase() || "?";

  useEffect(() => {
    if (!showMenu || Platform.OS !== "web") {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMenu(false);
        avatarRef.current?.focus?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const timeout = setTimeout(
      () => logoutRef.current?.focus?.(),
      0
    );

    return () => {
      clearTimeout(timeout);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showMenu]);

  function closeMenu() {
    if (loggingOut) {
      return;
    }

    setShowMenu(false);
    setTimeout(() => avatarRef.current?.focus?.(), 0);
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await onLogout();
      setShowMenu(false);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        ref={avatarRef}
        style={({ pressed }) => [
          styles.avatar,
          pressed && styles.avatarPressed,
        ]}
        onPress={() => setShowMenu(true)}
        accessibilityRole="button"
        accessibilityLabel={`Menú de ${name || "usuario"}`}
        accessibilityHint="Abre las opciones de la cuenta"
        accessibilityState={{ expanded: showMenu }}
      >
        <Text style={styles.avatarText}>{initial}</Text>
      </Pressable>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeMenu}
      >
        <View style={styles.modalRoot}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú de usuario"
          />

          <View
            style={[
              styles.menu,
              { top: Math.max(insets.top, SPACING.sm) + 58 },
            ]}
            accessibilityViewIsModal
            accessibilityLabel={`Menú de ${name || "usuario"}`}
            onAccessibilityEscape={closeMenu}
          >
            <Text style={styles.userName} accessibilityRole="header">
              {name || "Usuario"}
            </Text>

            <Text style={styles.userRole}>{role}</Text>

            <View style={styles.divider} />

            <Pressable
              ref={logoutRef}
              style={({ pressed }) => [
                styles.logoutItem,
                pressed && styles.logoutItemPressed,
              ]}
              onPress={() => void handleLogout()}
              disabled={loggingOut}
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              accessibilityState={{
                disabled: loggingOut,
                busy: loggingOut,
              }}
            >
              {loggingOut ? (
                <ActivityIndicator
                  size="small"
                  color={COLORS.danger}
                />
              ) : null}

              <Text style={styles.logoutText}>
                {loggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    alignItems: "flex-end",
    zIndex: 30,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarPressed: {
    opacity: 0.75,
  },
  avatarText: {
    color: COLORS.onPrimary,
    fontSize: FONT.body,
    fontWeight: "700",
  },
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(38, 29, 25, 0.12)",
  },
  menu: {
    position: "absolute",
    right: SPACING.md,
    width: 210,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 9,
  },
  userName: {
    fontSize: FONT.body,
    fontWeight: "700",
    color: COLORS.text,
  },
  userRole: {
    fontSize: FONT.caption,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  logoutItem: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  logoutItemPressed: {
    backgroundColor: COLORS.primarySoft,
  },
  logoutText: {
    fontSize: FONT.small,
    fontWeight: "700",
    color: COLORS.danger,
  },
});
