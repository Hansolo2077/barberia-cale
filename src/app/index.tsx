import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Barbería Cale</Text>

      <Text style={styles.subtitle}>
        Agenda tu próxima cita de forma rápida y sencilla.
      </Text>

      <Pressable
        style={styles.primaryButton}
        onPress={() => router.push("/auth/register")}
      >
        <Text style={styles.primaryButtonText}>
          Crear cuenta
        </Text>
      </Pressable>

      <Pressable
  style={styles.secondaryButton}
  onPress={() => router.push("/auth/login")}
>
  <Text style={styles.secondaryButtonText}>
    Iniciar sesión
  </Text>
</Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 17,
    color: "#555",
    textAlign: "center",
    marginBottom: 32,
    maxWidth: 380,
  },

  primaryButton: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#111111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 12,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  secondaryButton: {
    width: "100%",
    maxWidth: 360,
    borderWidth: 1,
    borderColor: "#111111",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "600",
  },
});