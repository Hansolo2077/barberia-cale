import { Platform } from "react-native";

export const COLORS = {
  background: "#F4EFE6",
  surface: "#FFFCF7",

  text: "#261D19",
  textSecondary: "#75665E",
  textMuted: "#7A6961",

  border: "#DED1C5",
  borderStrong: "#947B70",

  primary: "#743B2F",
  primarySoft: "#F1E1D8",
  onPrimary: "#FFFCF7",
  accent: "#C49A45",
  accentSoft: "#F3E4BF",
  accentText: "#8B6218",

  success: "#1F7A4C",
  warning: "#865600",
  danger: "#B42318",

  successBackground: "#EAF7EF",
  warningBackground: "#FFF6E3",
  dangerBackground: "#FDECEC",
};

export const SPACING = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const FONT = {
  title: 32,
  heading: 22,
  subheading: 18,
  body: 16,
  small: 14,
  caption: 12,
};

export const FONT_FAMILY = {
  display: Platform.select({
    ios: "Georgia",
    android: "serif",
    web: "Georgia, 'Times New Roman', serif",
    default: "serif",
  }),
};
