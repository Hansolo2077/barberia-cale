import {
  type ErrorBoundaryProps,
  Stack,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";

import "../global.css";

import {
  SafeAreaProvider,
} from "react-native-safe-area-context";

import { AuthProvider } from "../context/AuthContext";
import FeedbackProvider from "../components/FeedbackProvider";
import AppErrorFallback from "../components/AppErrorFallback";

export function ErrorBoundary({
  retry,
}: ErrorBoundaryProps) {
  const router = useRouter();

  return (
    <AppErrorFallback
      title="Algo salió mal"
      message="La aplicación encontró un problema inesperado. Puedes reintentar sin perder tu cuenta."
      onRetry={retry}
      onGoHome={() => {
        retry();
        router.replace("/");
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <FeedbackProvider>
          <StatusBar style="dark" />

          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </FeedbackProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
