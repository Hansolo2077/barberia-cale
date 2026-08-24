import {
  createElement,
  type ChangeEvent,
  type CSSProperties,
} from "react";

import {
  COLORS,
  FONT,
  RADIUS,
  SPACING,
} from "../constants/app-theme";
import type { WebDateInputProps } from "./WebDateInput";

export default function WebDateInput({
  value,
  label,
  onChange,
  minimumDate,
  maximumDate,
  disabled = false,
  hasError = false,
  describedBy,
}: WebDateInputProps) {
  const style: CSSProperties = {
    width: "100%",
    minHeight: 52,
    boxSizing: "border-box",
    border: `${hasError ? 2 : 1}px solid ${
      hasError ? COLORS.danger : COLORS.borderStrong
    }`,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    fontSize: FONT.body,
    padding: `0 ${SPACING.md}px`,
    opacity: disabled ? 0.55 : 1,
    cursor: disabled ? "not-allowed" : "pointer",
    colorScheme: "light",
  };

  return createElement("input", {
    type: "date",
    value,
    min: minimumDate,
    max: maximumDate,
    disabled,
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      onChange(event.currentTarget.value),
    "aria-label": label,
    "aria-describedby": describedBy,
    "aria-invalid": hasError || undefined,
    style,
  });
}
