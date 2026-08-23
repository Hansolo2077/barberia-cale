import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
import { SymbolView } from "expo-symbols";

type AppIconProps = {
  name: ComponentProps<typeof SymbolView>["name"];
  size?: number;
  color?: ColorValue;
};

export default function AppIcon({
  name,
  size = 24,
  color,
}: AppIconProps) {
  return (
    <SymbolView
      name={name}
      size={size}
      tintColor={color}
    />
  );
}
