import { StyleSheet, Text, View } from "react-native";

import type { AttendanceStatus } from "../api/appointments.api";
import {
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from "../constants/app-theme";
import AppIcon from "./AppIcon";

type AttendanceBadgeProps = {
  status: AttendanceStatus | null | undefined;
};

const BADGE_CONTENT = {
  CONFIRMED: {
    label: "Confirmó asistencia",
    backgroundColor: COLORS.successBackground,
    color: COLORS.success,
    icon: {
      ios: "checkmark.seal.fill",
      android: "verified",
      web: "verified",
    },
  },
  AWAITING: {
    label: "Por confirmar",
    backgroundColor: COLORS.warningBackground,
    color: COLORS.warning,
    icon: {
      ios: "clock",
      android: "schedule",
      web: "schedule",
    },
  },
  NO_RESPONSE: {
    label: "Sin respuesta",
    backgroundColor: COLORS.surface,
    color: COLORS.textSecondary,
    icon: {
      ios: "minus.circle",
      android: "remove_circle_outline",
      web: "remove_circle_outline",
    },
  },
} as const;

export default function AttendanceBadge({
  status,
}: AttendanceBadgeProps) {
  if (!status || status === "NOT_APPLICABLE") {
    return null;
  }

  const content = BADGE_CONTENT[status];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: content.backgroundColor,
          borderColor:
            status === "NO_RESPONSE" ? COLORS.border : "transparent",
        },
      ]}
      accessible
      accessibilityLabel={`Asistencia: ${content.label}`}
    >
      <AppIcon
        name={content.icon}
        size={16}
        color={content.color}
      />
      <Text
        style={[styles.label, { color: content.color }]}
        numberOfLines={1}
      >
        {content.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
  },
  label: {
    flexShrink: 1,
    fontSize: FONT.caption,
    fontWeight: "800",
  },
});
