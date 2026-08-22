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
};

export default function BackButton({
  label = "Volver",
  fallbackHref = "/",
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
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
    >
      <Text style={styles.icon}>
        ‹
      </Text>

      <Text style={styles.text}>
        {label}
      </Text>
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

  icon: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.text,
    marginRight: SPACING.xs,
    lineHeight: 24,
  },

  text: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "700",
  },
});
