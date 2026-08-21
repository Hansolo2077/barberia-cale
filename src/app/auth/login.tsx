import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { loginUser } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";


export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [celular, setCelular] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  
const handleLogin = async () => {
  const celularLimpio = celular.trim();

  if (!celularLimpio || !password) {
    Alert.alert(
      "Datos incompletos",
      "Ingresa tu número de celular y contraseña."
    );
    return;
  }

  if (!/^\d{8}$/.test(celularLimpio)) {
    Alert.alert(
      "Número inválido",
      "El número de celular debe contener 8 dígitos."
    );
    return;
  }

  try {
    setLoading(true);

    const result = await loginUser({
      phone: celularLimpio,
      password,
    });

    await signIn(
  result.token,
  result.user
);

if (result.user.role === "ADMIN") {
  router.replace("/admin");
} else {
  router.replace("/client");
}
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudo iniciar sesión.";

    Alert.alert(
      "No se pudo iniciar sesión",
      message
    );
  } finally {
    setLoading(false);
  }
};
  

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Bienvenido</Text>

        <Text style={styles.subtitle}>
          Inicia sesión para administrar tus citas.
        </Text>

        <Text style={styles.label}>Número de celular</Text>

        <TextInput
          style={styles.input}
          placeholder="88888888"
          keyboardType="phone-pad"
          maxLength={8}
          value={celular}
          onChangeText={setCelular}
        />

        <Text style={styles.label}>Contraseña</Text>

        <TextInput
          style={styles.input}
          placeholder="Ingresa tu contraseña"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
  style={[
    styles.primaryButton,
    loading && styles.disabledButton,
  ]}
  onPress={handleLogin}
  disabled={loading}
>
  <Text style={styles.primaryButtonText}>
    {loading ? "Iniciando sesión..." : "Iniciar sesión"}
  </Text>
</Pressable>

        <Pressable
          onPress={() => router.push("/auth/register")}
        >
          <Text style={styles.secondaryAction}>
            ¿No tienes cuenta? Crear cuenta
          </Text>
        </Pressable>

        <Pressable onPress={() => router.back()}>
          <Text style={styles.backAction}>
            Volver
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
  },

  disabledButton: {
  opacity: 0.6,
},

  form: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 28,
  },

  label: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 6,
    marginTop: 14,
  },

  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cccccc",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },

  primaryButton: {
    backgroundColor: "#111111",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 26,
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  secondaryAction: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 15,
    color: "#333333",
    fontWeight: "600",
  },

  backAction: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
    color: "#666666",
  },
});