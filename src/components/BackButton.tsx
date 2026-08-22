import { Href, useRouter } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
} from "react-native";

import {
    COLORS,
    FONT,
    RADIUS,
    SPACING,
} from "../constants/app-theme";

type BackButtonProps = {
  label?: string;
  fallbackHref?: Href;
  iconOnly?: boolean;
};

export default function BackButton({
  label = "Volver",
  fallbackHref = "/",
  iconOnly = false,
}: BackButtonProps) {
  const router = useRouter();

  function handlePress() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallbackHref);
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        iconOnly && styles.iconOnlyButton,
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text
        style={[
          styles.icon,
          iconOnly && styles.iconOnly,
        ]}
      >
        ‹
      </Text>

      {!iconOnly && (
        <Text style={styles.text}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    backgroundColor: COLORS.surface,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,

    paddingVertical: 14,
    paddingHorizontal: SPACING.md,

    marginTop: SPACING.md,
  },

  pressed: {
    opacity: 0.65,
  },

  iconOnlyButton: {
    width: 40,
    height: 40,
    maxWidth: 40,
    alignSelf: "auto",
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 0,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.primarySoft,
  },

  icon: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.text,
    marginRight: SPACING.xs,
    lineHeight: 24,
  },

  iconOnly: {
    marginRight: 0,
    lineHeight: 28,
  },

  text: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "700",
  },
});
