import { useRouter } from "expo-router";
import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import { registerUser } from "../../api/auth.api";

export default function RegisterScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [celular, setCelular] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const nombreLimpio = nombre.trim();
    const apellidoLimpio = apellido.trim();
    const celularLimpio = celular.trim();

    if (
      !nombreLimpio ||
      !apellidoLimpio ||
      !celularLimpio ||
      !password
    ) {
      Alert.alert(
        "Datos incompletos",
        "Por favor completa todos los campos antes de continuar."
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

    if (password.length < 6) {
      Alert.alert(
        "Contraseña muy corta",
        "La contraseña debe tener al menos 6 caracteres."
      );
      return;
    }

    try {
      setLoading(true);

      await registerUser({
        firstName: nombreLimpio,
        lastName: apellidoLimpio,
        phone: celularLimpio,
        password,
      });

      Alert.alert(
        "Cuenta creada",
        "Tu cuenta fue creada correctamente. Ya puedes iniciar sesión."
      );

      router.replace("/auth/login");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear la cuenta.";

      Alert.alert(
        "No se pudo crear la cuenta",
        message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Crear cuenta</Text>

      <Text style={styles.subtitle}>
        Regístrate para reservar tu cita en Barbería Cale.
      </Text>

      <View style={styles.form}>
        <Text style={styles.label}>Nombre</Text>

        <TextInput
          style={styles.input}
          placeholder="Ej. Carlos"
          value={nombre}
          onChangeText={setNombre}
        />

        <Text style={styles.label}>Apellido</Text>

        <TextInput
          style={styles.input}
          placeholder="Ej. Pérez"
          value={apellido}
          onChangeText={setApellido}
        />

        <Text style={styles.label}>Número de celular</Text>

        <TextInput
          style={styles.input}
          placeholder="88888888"
          keyboardType="phone-pad"
          maxLength={8}
          value={celular}
          onChangeText={setCelular}
        />

        <Text style={styles.helperText}>
          Utilizaremos este número para iniciar sesión y recibir confirmaciones.
        </Text>

        <Text style={styles.label}>Contraseña</Text>

        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <Pressable
          style={[
            styles.primaryButton,
            loading && styles.disabledButton,
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/auth/login")}
        >
          <Text style={styles.secondaryAction}>
            ¿Ya tienes cuenta? Iniciar sesión
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
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

  form: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
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

  helperText: {
    fontSize: 13,
    color: "#666",
    marginTop: 6,
  },

  primaryButton: {
    backgroundColor: "#111111",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 26,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },

  secondaryAction: {
    textAlign: "center",
    marginTop: 18,
    fontSize: 15,
    color: "#333333",
  },
});