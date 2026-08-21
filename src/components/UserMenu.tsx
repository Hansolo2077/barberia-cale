import { useState } from "react";
import {
    Pressable,
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
  const [
    showMenu,
    setShowMenu,
  ] = useState(false);

  const initial =
    name
      ?.charAt(0)
      .toUpperCase() || "?";

  return (
    <View style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.avatar,
          pressed &&
            styles.avatarPressed,
        ]}
        onPress={() =>
          setShowMenu(
            (current) => !current
          )
        }
      >
        <Text style={styles.avatarText}>
          {initial}
        </Text>
      </Pressable>

      {showMenu && (
        <View style={styles.menu}>
          <Text style={styles.userName}>
            {name || "Usuario"}
          </Text>

          <Text style={styles.userRole}>
            {role}
          </Text>

          <View style={styles.divider} />

          <Pressable
            style={({ pressed }) => [
              styles.logoutItem,
              pressed &&
                styles.logoutItemPressed,
            ]}
            onPress={async () => {
              setShowMenu(false);
              await onLogout();
            }}
          >
            <Text
              style={styles.logoutText}
            >
              Cerrar sesión
            </Text>
          </Pressable>
        </View>
      )}
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
    width: 46,
    height: 46,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarPressed: {
    opacity: 0.75,
  },

  avatarText: {
    color: "#FFFFFF",
    fontSize: FONT.body,
    fontWeight: "700",
  },

  menu: {
    position: "absolute",
    top: 54,
    right: 0,
    width: 190,

    backgroundColor:
      COLORS.surface,

    borderWidth: 1,
    borderColor:
      COLORS.border,

    borderRadius:
      RADIUS.md,

    padding:
      SPACING.md,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.12,
    shadowRadius: 12,

    elevation: 8,
  },

  userName: {
    fontSize: FONT.body,
    fontWeight: "700",
    color: COLORS.text,
  },

  userRole: {
    fontSize: FONT.caption,
    color:
      COLORS.textSecondary,
    marginTop: 2,
  },

  divider: {
    height: 1,
    backgroundColor:
      COLORS.border,
    marginVertical:
      SPACING.sm,
  },

  logoutItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius:
      RADIUS.sm,
  },

  logoutItemPressed: {
    backgroundColor:
      COLORS.primarySoft,
  },

  logoutText: {
    fontSize: FONT.small,
    fontWeight: "700",
    color: COLORS.danger,
  },
});