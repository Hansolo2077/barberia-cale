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

import {
    COLORS,
    FONT,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

import BackButton from "../../components/BackButton";

export default function RegisterScreen() {
  const router = useRouter();

  const [nombre, setNombre] =
    useState("");

  const [apellido, setApellido] =
    useState("");

  const [celular, setCelular] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleRegister() {
    const nombreLimpio =
      nombre.trim();

    const apellidoLimpio =
      apellido.trim();

    const celularLimpio =
      celular.trim();

    if (
      !nombreLimpio ||
      !apellidoLimpio ||
      !celularLimpio ||
      !password
    ) {
      Alert.alert(
        "Datos incompletos",
        "Completa todos los campos antes de continuar."
      );
      return;
    }

    if (
      !/^\d{8}$/.test(
        celularLimpio
      )
    ) {
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
        firstName:
          nombreLimpio,
        lastName:
          apellidoLimpio,
        phone:
          celularLimpio,
        password,
      });

      Alert.alert(
        "Cuenta creada",
        "Tu cuenta fue creada correctamente. Ya puedes iniciar sesión."
      );

      router.replace(
        "/auth/login"
      );
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
  }

  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={
        false
      }
    >
      <View style={styles.brandBlock}>
        <View style={styles.brandIcon}>
          <Text
            style={
              styles.brandIconText
            }
          >
            ✂
          </Text>
        </View>

        <Text style={styles.brand}>
          Barbería Cale
        </Text>

        <Text
          style={
            styles.brandSubtitle
          }
        >
          Crea tu cuenta para reservar
          y administrar tus citas.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>
          NUEVA CUENTA
        </Text>

        <Text style={styles.title}>
          Crear cuenta
        </Text>

        <Text style={styles.subtitle}>
          Completa tus datos para comenzar.
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Nombre
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. Carlos"
            placeholderTextColor={
              COLORS.textMuted
            }
            value={nombre}
            onChangeText={
              setNombre
            }
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Apellido
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. Pérez"
            placeholderTextColor={
              COLORS.textMuted
            }
            value={apellido}
            onChangeText={
              setApellido
            }
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Número de celular
          </Text>

          <TextInput
            style={styles.input}
            placeholder="88888888"
            placeholderTextColor={
              COLORS.textMuted
            }
            keyboardType="phone-pad"
            maxLength={8}
            value={celular}
            onChangeText={
              setCelular
            }
          />

          <Text style={styles.helperText}>
            Usaremos este número para iniciar sesión y recibir confirmaciones.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Contraseña
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={
              COLORS.textMuted
            }
            secureTextEntry
            value={password}
            onChangeText={
              setPassword
            }
          />

          <Text style={styles.helperText}>
            Usa al menos 6 caracteres.
          </Text>
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={
            handleRegister
          }
          disabled={loading}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {loading
              ? "Creando cuenta..."
              : "Crear cuenta"}
          </Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.divider} />

          <Text
            style={
              styles.dividerText
            }
          >
            o
          </Text>

          <View style={styles.divider} />
        </View>

        <Pressable
          style={
            styles.loginButton
          }
          onPress={() =>
            router.push(
              "/auth/login"
            )
          }
        >
          <Text
            style={
              styles.loginButtonText
            }
          >
            Ya tengo una cuenta
          </Text>
        </Pressable>
      </View>

      <BackButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor:
      COLORS.background,
    paddingHorizontal:
      SPACING.lg,
    paddingVertical:
      SPACING.xxl,
  },

  brandBlock: {
    alignItems: "center",
    marginBottom:
      SPACING.xl,
  },

  brandIcon: {
    width: 64,
    height: 64,
    borderRadius:
      RADIUS.pill,
    backgroundColor:
      COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom:
      SPACING.md,
  },

  brandIconText: {
    fontSize: 28,
  },

  brand: {
    fontSize:
      FONT.heading,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom:
      SPACING.xs,
  },

  brandSubtitle: {
    fontSize:
      FONT.small,
    lineHeight: 20,
    color:
      COLORS.textSecondary,
    textAlign: "center",
    maxWidth: 320,
  },

  card: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
    backgroundColor:
      COLORS.surface,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius:
      RADIUS.xl,
    padding:
      SPACING.lg,
  },

  eyebrow: {
    fontSize:
      FONT.caption,
    fontWeight: "700",
    letterSpacing: 1.2,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.xs,
  },

  title: {
    fontSize: FONT.title,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  subtitle: {
    fontSize: FONT.body,
    lineHeight: 23,
    color:
      COLORS.textSecondary,
    marginBottom:
      SPACING.lg,
  },

  formGroup: {
    marginBottom:
      SPACING.md,
  },

  label: {
    fontSize: FONT.small,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom:
      SPACING.sm,
  },

  input: {
    backgroundColor:
      COLORS.background,
    borderWidth: 1,
    borderColor:
      COLORS.border,
    borderRadius:
      RADIUS.md,
    paddingHorizontal:
      SPACING.md,
    paddingVertical: 14,
    fontSize: FONT.body,
    color: COLORS.text,
  },

  helperText: {
    fontSize:
      FONT.caption,
    lineHeight: 18,
    color:
      COLORS.textSecondary,
    marginTop:
      SPACING.xs,
  },

  primaryButton: {
    backgroundColor:
      COLORS.primary,
    borderRadius:
      RADIUS.md,
    paddingVertical: 15,
    alignItems: "center",
    marginTop:
      SPACING.sm,
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: FONT.body,
    fontWeight: "700",
  },

  disabledButton: {
    opacity: 0.55,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical:
      SPACING.lg,
  },

  divider: {
    flex: 1,
    height: 1,
    backgroundColor:
      COLORS.border,
  },

  dividerText: {
    marginHorizontal:
      SPACING.md,
    fontSize: FONT.small,
    color:
      COLORS.textSecondary,
  },

  loginButton: {
    borderWidth: 1,
    borderColor:
      COLORS.primary,
    borderRadius:
      RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },

  loginButtonText: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "700",
  },

 
});