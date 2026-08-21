import { useRouter } from "expo-router";

import {
    useState,
} from "react";

import {
    Image,
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
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

export default function LoginScreen() {
  const router =
    useRouter();

  const {
    signIn,
  } = useAuth();

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    rememberMe,
    setRememberMe,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  async function handleLogin() {
    const cleanPhone =
      phone.trim();

    if (
      !cleanPhone ||
      !password
    ) {
      showMessage(
        "Datos incompletos",
        "Ingresa tu número de celular y contraseña."
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

    try {
      setSubmitting(true);

      const user =
        await signIn({
          phone:
            cleanPhone,

          password,

          rememberMe,
        });

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
          : "No se pudo iniciar sesión.";

      showMessage(
        "No se pudo iniciar sesión",
        message
      );
    } finally {
      setSubmitting(false);
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
      <View
        style={
          styles.content
        }
      >
        <View
          style={
            styles.logoContainer
          }
        >
          <Image
            source={require(
              "../../../assets/images/logo-cale.png"
            )}
            style={
              styles.logo
            }
            resizeMode="contain"
          />
        </View>

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
          Bienvenido
        </Text>

        <Text
          style={
            styles.subtitle
          }
        >
          Inicia sesión para gestionar tus reservas.
        </Text>

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
          placeholder="Tu contraseña"
          placeholderTextColor={
            COLORS.textMuted
          }
          secureTextEntry
          autoCapitalize="none"
        />

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

          <Text
            style={
              styles.rememberText
            }
          >
            Mantener mi sesión iniciada
          </Text>
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
            handleLogin
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {submitting
              ? "Ingresando..."
              : "Iniciar sesión"}
          </Text>
        </Pressable>

        <View
          style={
            styles.registerRow
          }
        >
          <Text
            style={
              styles.registerText
            }
          >
            ¿No tienes una cuenta?
          </Text>

          <Pressable
            onPress={() =>
              router.push(
                "/auth/register"
              )
            }
          >
            <Text
              style={
                styles.registerLink
              }
            >
              Crear cuenta
            </Text>
          </Pressable>
        </View>

        <BackButton />
      </View>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,

      backgroundColor:
        COLORS.background,

      paddingHorizontal:
        SPACING.lg,

      paddingVertical:
        SPACING.xl,

      justifyContent:
        "center",
    },

    content: {
      width: "100%",

      maxWidth: 440,

      alignSelf: "center",
    },

    logoContainer: {
      alignItems: "center",
      

      justifyContent:
        "center",

      marginBottom:
        SPACING.lg,
    },

    logo: {
  width: 82,
  height: 82,
  borderRadius: 41,
},

    eyebrow: {
      fontSize:
        FONT.caption,

      fontWeight: "700",

      letterSpacing: 1.2,

      color:
        COLORS.textSecondary,

      marginBottom:
        SPACING.sm,

      textAlign: "center",
    },

    title: {
      fontSize:
        FONT.title,

      fontWeight: "800",

      color:
        COLORS.text,

      marginBottom:
        SPACING.sm,

      textAlign: "center",
    },

    subtitle: {
      fontSize:
        FONT.body,

      lineHeight: 24,

      color:
        COLORS.textSecondary,

      marginBottom:
        SPACING.xl,

      textAlign: "center",
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

    rememberRow: {
      flexDirection: "row",

      alignItems: "center",

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

    rememberText: {
      fontSize:
        FONT.small,

      color:
        COLORS.text,
    },

    primaryButton: {
      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.md,

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

    registerRow: {
      flexDirection: "row",

      justifyContent:
        "center",

      flexWrap: "wrap",

      gap: 5,

      marginTop:
        SPACING.lg,
    },

    registerText: {
      fontSize:
        FONT.small,

      color:
        COLORS.textSecondary,
    },

    registerLink: {
      fontSize:
        FONT.small,

      fontWeight: "700",

      color:
        COLORS.text,
    },
  });