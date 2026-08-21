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

import { loginUser } from "../../api/auth.api";
import { useAuth } from "../../context/AuthContext";

import {
    COLORS,
    FONT,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

export default function LoginScreen() {
  const router = useRouter();

  const { signIn } = useAuth();

  const [celular, setCelular] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  async function handleLogin() {
    const celularLimpio =
      celular.trim();

    if (
      !celularLimpio ||
      !password
    ) {
      Alert.alert(
        "Datos incompletos",
        "Ingresa tu número de celular y contraseña."
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

    try {
      setLoading(true);

      const result =
        await loginUser({
          phone:
            celularLimpio,
          password,
        });

      await signIn(
        result.token,
        result.user
      );

      if (
        result.user.role ===
        "ADMIN"
      ) {
        router.replace(
          "/admin"
        );
      } else {
        router.replace(
          "/client"
        );
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

        <Text style={styles.brandSubtitle}>
          Reserva tu próximo corte
          de forma rápida y sencilla.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>
          BIENVENIDO
        </Text>

        <Text style={styles.title}>
          Iniciar sesión
        </Text>

        <Text style={styles.subtitle}>
          Accede para administrar tus
          citas y reservas.
        </Text>

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
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            Contraseña
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa tu contraseña"
            placeholderTextColor={
              COLORS.textMuted
            }
            secureTextEntry
            value={password}
            onChangeText={
              setPassword
            }
          />
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            loading &&
              styles.disabledButton,
          ]}
          onPress={
            handleLogin
          }
          disabled={loading}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {loading
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
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
            styles.registerButton
          }
          onPress={() =>
            router.push(
              "/auth/register"
            )
          }
        >
          <Text
            style={
              styles.registerButtonText
            }
          >
            Crear una cuenta
          </Text>
        </Pressable>
      </View>

     
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
    marginBottom: SPACING.xl,
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
    fontSize: FONT.heading,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom:
      SPACING.xs,
  },

  brandSubtitle: {
    fontSize: FONT.small,
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
    fontSize: FONT.caption,
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

  registerButton: {
    borderWidth: 1,
    borderColor:
      COLORS.primary,
    borderRadius:
      RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },

  registerButtonText: {
    color: COLORS.text,
    fontSize: FONT.body,
    fontWeight: "700",
  },

  

  
});