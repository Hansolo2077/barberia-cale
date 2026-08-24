import { Href, useRouter } from "expo-router";
import {
    Pressable,
    StyleSheet,
    Text,
} from "react-native";

import AppIcon from "./AppIcon";

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
      accessibilityHint="Regresa a la pantalla anterior"
      hitSlop={iconOnly ? 4 : 0}
    >
      <AppIcon
        name={{
          ios: "chevron.left",
          android: "arrow_back_ios_new",
          web: "arrow_back_ios_new",
        }}
        size={iconOnly ? 20 : 18}
        color={COLORS.text}
      />

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
    width: 44,
    height: 44,
    maxWidth: 44,
    alignSelf: "auto",
    paddingVertical: 0,
    paddingHorizontal: 0,
    marginTop: 0,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.primarySoft,
  },

  text: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "700",
    marginLeft: SPACING.xs,
  },
});
