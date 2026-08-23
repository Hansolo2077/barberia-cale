import { useRouter } from "expo-router";

import {
    useState,
} from "react";

import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import BackButton from "../../components/BackButton";

import { useAuth } from "../../context/AuthContext";

import { showMessage } from "../../utils/show-message";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

export default function RegisterScreen() {
  const router =
    useRouter();

  const {
    signUp,
  } = useAuth();

  const [
    firstName,
    setFirstName,
  ] = useState("");

  const [
    lastName,
    setLastName,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    rememberMe,
    setRememberMe,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  async function handleRegister() {
    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    const cleanPhone =
      phone.trim();

    if (
      !cleanFirstName ||
      !cleanLastName ||
      !cleanPhone ||
      !password ||
      !confirmPassword
    ) {
      showMessage(
        "Datos incompletos",
        "Completa todos los campos para crear tu cuenta."
      );

      return;
    }

    if (
      !/^\d{8}$/.test(
        cleanPhone
      )
    ) {
      showMessage(
        "Número inválido",
        "El número de celular debe contener exactamente 8 dígitos."
      );

      return;
    }

    if (
      password.length < 6
    ) {
      showMessage(
        "Contraseña muy corta",
        "La contraseña debe tener al menos 6 caracteres."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      showMessage(
        "Las contraseñas no coinciden",
        "Verifica que ambas contraseñas sean iguales."
      );

      return;
    }

    try {
      setSubmitting(true);

      const user =
        await signUp({
          firstName:
            cleanFirstName,

          lastName:
            cleanLastName,

          phone:
            cleanPhone,

          password,

          rememberMe,
        });

      showMessage(
        "Cuenta creada",
        "Tu cuenta fue creada correctamente."
      );

      if (
        user.role ===
        "ADMIN"
      ) {
        router.replace(
          "/admin"
        );

        return;
      }

      router.replace(
        "/client"
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear la cuenta.";

      showMessage(
        "No se pudo crear la cuenta",
        message
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={
          false
        }
      >
      <View
        style={
          styles.content
        }
      >
        <View style={styles.brandHeader}>
          <View
            pointerEvents="none"
            style={styles.brandDecoration}
          />

          <View style={styles.brandAccent} />

          <Text
            style={
              styles.eyebrow
            }
          >
            BARBERÍA CALE
          </Text>

          <Text
            style={
              styles.title
            }
          >
            Haz de Cale tu barbería
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Crea tu cuenta y agenda tu próximo corte cuando quieras.
          </Text>
        </View>

        <View
          style={
            styles.form
          }
        >
          <Text
            style={
              styles.label
            }
          >
            Nombre
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              firstName
            }
            onChangeText={
              setFirstName
            }
            placeholder="Tu nombre"
            placeholderTextColor={
              COLORS.textMuted
            }
            autoCapitalize="words"
          />

          <Text
            style={
              styles.label
            }
          >
            Apellido
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              lastName
            }
            onChangeText={
              setLastName
            }
            placeholder="Tu apellido"
            placeholderTextColor={
              COLORS.textMuted
            }
            autoCapitalize="words"
          />

          <Text
            style={
              styles.label
            }
          >
            Número de celular
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              phone
            }
            onChangeText={
              setPhone
            }
            placeholder="88888888"
            placeholderTextColor={
              COLORS.textMuted
            }
            keyboardType="phone-pad"
            maxLength={8}
          />

          <Text
            style={
              styles.label
            }
          >
            Contraseña
          </Text>

          <TextInput
            style={
              styles.input
            }
            value={
              password
            }
            onChangeText={
              setPassword
            }
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={
              COLORS.textMuted
            }
            secureTextEntry
            autoCapitalize="none"
          />

          <Text
            style={
              styles.label
            }
          >
            Confirmar contraseña
          </Text>

          <TextInput
            style={[
              styles.input,

              confirmPassword.length >
                0 &&
              password !==
                confirmPassword &&
              styles.inputError,
            ]}
            value={
              confirmPassword
            }
            onChangeText={
              setConfirmPassword
            }
            placeholder="Escribe la contraseña nuevamente"
            placeholderTextColor={
              COLORS.textMuted
            }
            secureTextEntry
            autoCapitalize="none"
          />

          {confirmPassword.length >
            0 &&
            password !==
              confirmPassword && (
              <Text
                style={
                  styles.passwordError
                }
              >
                Las contraseñas no coinciden.
              </Text>
            )}

          <Pressable
            style={
              styles.rememberRow
            }
            onPress={() =>
              setRememberMe(
                (current) =>
                  !current
              )
            }
          >
            <View
              style={[
                styles.checkbox,

                rememberMe &&
                  styles.checkboxSelected,
              ]}
            >
              {rememberMe && (
                <Text
                  style={
                    styles.checkmark
                  }
                >
                  ✓
                </Text>
              )}
            </View>

            <View
              style={
                styles.rememberContent
              }
            >
              <Text
                style={
                  styles.rememberTitle
                }
              >
                Mantener mi sesión iniciada
              </Text>

              <Text
                style={
                  styles.rememberDescription
                }
              >
                No tendrás que iniciar sesión cada vez que abras la aplicación.
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[
              styles.primaryButton,

              submitting &&
                styles.disabledButton,
            ]}
            disabled={
              submitting
            }
            onPress={
              handleRegister
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {submitting
                ? "Creando cuenta..."
                : "Crear cuenta"}
            </Text>
          </Pressable>

          <View
            style={
              styles.loginRow
            }
          >
            <Text
              style={
                styles.loginText
              }
            >
              ¿Ya tienes una cuenta?
            </Text>

            <Pressable
              onPress={() =>
                router.push(
                  "/auth/login"
                )
              }
            >
              <Text
                style={
                  styles.loginLink
                }
              >
                Iniciar sesión
              </Text>
            </Pressable>
          </View>

          <BackButton />
        </View>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles =
  StyleSheet.create({
    keyboardAvoiding: {
      flex: 1,
    },

    container: {
      flexGrow: 1,

      backgroundColor:
        COLORS.background,

      paddingHorizontal:
        SPACING.lg,

      paddingVertical:
        SPACING.xl,
    },

    content: {
      width: "100%",

      maxWidth: 440,

      alignSelf: "center",
    },

    brandHeader: {
      position: "relative",
      overflow: "hidden",
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.xl,
      padding:
        SPACING.lg,
      marginBottom:
        SPACING.lg,
    },

    brandDecoration: {
      position: "absolute",
      width: 145,
      height: 145,
      borderRadius: 73,
      borderWidth: 1,
      borderColor:
        "rgba(255, 252, 247, 0.15)",
      top: -72,
      right: -42,
    },

    brandAccent: {
      width: 38,
      height: 3,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.accent,
      marginBottom:
        SPACING.md,
    },

    eyebrow: {
      fontSize:
        FONT.caption,

      fontWeight: "700",

      letterSpacing: 1.2,

      color:
        COLORS.accentSoft,

      marginBottom:
        SPACING.sm,
    },

    title: {
      fontSize:
        FONT.title,

      fontFamily:
        FONT_FAMILY.display,

      fontWeight: "800",

      color:
        COLORS.onPrimary,

      marginBottom:
        SPACING.sm,
    },

    subtitle: {
      fontSize:
        FONT.body,

      lineHeight: 24,

      color:
        COLORS.primarySoft,

      marginBottom: 0,
    },

    form: {
      width: "100%",
    },

    label: {
      fontSize:
        FONT.small,

      fontWeight: "700",

      color:
        COLORS.text,

      marginBottom:
        SPACING.xs,

      marginTop:
        SPACING.sm,
    },

    input: {
      width: "100%",

      backgroundColor:
        COLORS.surface,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      borderRadius:
        RADIUS.md,

      paddingHorizontal:
        SPACING.md,

      paddingVertical: 14,

      fontSize:
        FONT.body,

      color:
        COLORS.text,
    },

    inputError: {
      borderColor:
        COLORS.danger,
    },

    passwordError: {
      fontSize:
        FONT.caption,

      color:
        COLORS.danger,

      marginTop:
        SPACING.xs,
    },

    rememberRow: {
      flexDirection: "row",

      alignItems:
        "flex-start",

      marginTop:
        SPACING.lg,

      marginBottom:
        SPACING.lg,
    },

    checkbox: {
      width: 22,

      height: 22,

      borderRadius: 6,

      borderWidth: 1,

      borderColor:
        COLORS.border,

      backgroundColor:
        COLORS.surface,

      justifyContent:
        "center",

      alignItems:
        "center",

      marginRight:
        SPACING.sm,

      marginTop: 1,
    },

    checkboxSelected: {
      backgroundColor:
        COLORS.primary,

      borderColor:
        COLORS.primary,
    },

    checkmark: {
      color: "#FFFFFF",

      fontSize: 14,

      fontWeight: "800",
    },

    rememberContent: {
      flex: 1,
    },

    rememberTitle: {
      fontSize:
        FONT.small,

      fontWeight: "700",

      color:
        COLORS.text,

      marginBottom: 2,
    },

    rememberDescription: {
      fontSize:
        FONT.caption,

      lineHeight: 18,

      color:
        COLORS.textSecondary,
    },

    primaryButton: {
      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.pill,

      paddingVertical: 15,

      alignItems:
        "center",
    },

    primaryButtonText: {
      color: "#FFFFFF",

      fontSize:
        FONT.body,

      fontWeight: "700",
    },

    disabledButton: {
      opacity: 0.55,
    },

    loginRow: {
      flexDirection: "row",

      justifyContent:
        "center",

      alignItems:
        "center",

      flexWrap: "wrap",

      gap: 5,

      marginTop:
        SPACING.lg,
    },

    loginText: {
      fontSize:
        FONT.small,

      color:
        COLORS.textSecondary,
    },

    loginLink: {
      fontSize:
        FONT.small,

      fontWeight: "700",

      color:
        COLORS.primary,
    },
  });
