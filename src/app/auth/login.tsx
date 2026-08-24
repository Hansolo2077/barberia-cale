import { useRouter } from "expo-router";

import {
    useRef,
    useState,
} from "react";

import {
    Image,
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
import AppIcon from "../../components/AppIcon";
import {
  isValidLocalPhone,
  LOCAL_PHONE_REQUIREMENTS,
} from "../../utils/phone-validation";

import { useAuth } from "../../context/AuthContext";

import { showMessage } from "../../utils/show-message";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

type LoginErrors = {
  phone?: string;
  password?: string;
  form?: string;
};

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
  ] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    errors,
    setErrors,
  ] = useState<LoginErrors>({});

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const phoneInputRef =
    useRef<TextInput>(null);

  const passwordInputRef =
    useRef<TextInput>(null);

  function handlePhoneChange(value: string) {
    setPhone(
      value.replace(/\D/g, "").slice(0, 8)
    );

    setErrors((current) => ({
      ...current,
      phone: undefined,
      form: undefined,
    }));
  }

  function handlePasswordChange(value: string) {
    setPassword(value);

    setErrors((current) => ({
      ...current,
      password: undefined,
      form: undefined,
    }));
  }

  async function handleLogin() {
    const cleanPhone =
      phone.trim();

    const nextErrors: LoginErrors = {};

    if (!cleanPhone) {
      nextErrors.phone = "Ingresa tu número de celular.";
    } else if (!isValidLocalPhone(cleanPhone)) {
      nextErrors.phone =
        "El número debe tener 8 dígitos y comenzar con 8, 7 o 5.";
    }

    if (!password) {
      nextErrors.password = "Ingresa tu contraseña.";
    }

    if (nextErrors.phone || nextErrors.password) {
      setErrors(nextErrors);

      if (nextErrors.phone) {
        phoneInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }

      return;
    }

    try {
      setErrors({});
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

      setErrors({
        form: message,
      });
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
        <View
          style={
            styles.brandBlock
          }
        >
          <View
            pointerEvents="none"
            style={styles.brandDecorationLarge}
          />

          <View
            pointerEvents="none"
            style={styles.brandDecorationSmall}
          />

          <Image
            source={require(
              "../../../assets/images/logo-cale.png"
            )}
            style={
              styles.logo
            }
            resizeMode="contain"
            accessible
            accessibilityLabel="Logotipo de Barbería Cale"
          />

          <Text
            style={
              styles.brandEyebrow
            }
          >
            BARBERÍA
          </Text>

          <Text
            style={
              styles.brandName
            }
          >
            CALE
          </Text>

          <View
            style={
              styles.brandDivider
            }
          />

          <Text
            style={
              styles.title
            }
            accessibilityRole="header"
          >
            Tu silla te espera
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Entra para reservar tu próximo corte y revisar tus citas.
          </Text>
        </View>

        <Text
          style={
            styles.label
          }
        >
          Número de celular
        </Text>

        <TextInput
          ref={phoneInputRef}
          style={[
            styles.input,
            errors.phone && styles.inputError,
          ]}
          value={
            phone
          }
          onChangeText={
            handlePhoneChange
          }
          placeholder="88888888"
          placeholderTextColor={
            COLORS.textMuted
          }
          keyboardType="phone-pad"
          maxLength={8}
          autoComplete="tel"
          returnKeyType="next"
          onSubmitEditing={() =>
            passwordInputRef.current?.focus()
          }
          accessibilityLabel="Número de celular"
          accessibilityHint={LOCAL_PHONE_REQUIREMENTS}
        />

        <Text style={styles.fieldHelper}>
          {LOCAL_PHONE_REQUIREMENTS}
        </Text>

        {errors.phone ? (
          <Text
            style={styles.errorText}
            accessibilityLiveRegion="polite"
          >
            {errors.phone}
          </Text>
        ) : null}

        <Text
          style={
            styles.label
          }
        >
          Contraseña
        </Text>

        <View
          style={[
            styles.passwordInputRow,
            errors.password && styles.inputError,
          ]}
        >
          <TextInput
            ref={passwordInputRef}
            style={styles.passwordInput}
            value={password}
            onChangeText={handlePasswordChange}
            placeholder="Tu contraseña"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            returnKeyType="done"
            onSubmitEditing={handleLogin}
            accessibilityLabel="Contraseña"
          />

          <Pressable
            style={styles.passwordVisibilityButton}
            accessibilityRole="button"
            accessibilityLabel={
              showPassword
                ? "Ocultar contraseña"
                : "Mostrar contraseña"
            }
            accessibilityState={{ expanded: showPassword }}
            onPress={() =>
              setShowPassword((current) => !current)
            }
          >
            <AppIcon
              name={{
                ios: showPassword ? "eye.slash" : "eye",
                android: showPassword ? "visibility_off" : "visibility",
                web: showPassword ? "visibility_off" : "visibility",
              }}
              size={21}
              color={COLORS.textSecondary}
            />
          </Pressable>
        </View>

        {errors.password ? (
          <Text
            style={styles.errorText}
            accessibilityLiveRegion="polite"
          >
            {errors.password}
          </Text>
        ) : null}

        <Pressable
          style={styles.helpButton}
          accessibilityRole="button"
          accessibilityLabel="Ayuda para recuperar el acceso"
          onPress={() =>
            showMessage(
              "Ayuda para entrar",
              "Comunícate directamente con Barbería Cale y solicita que revisen tu acceso. Por seguridad, nunca compartas tu contraseña."
            )
          }
        >
          <Text style={styles.helpButtonText}>
            ¿Problemas para entrar?
          </Text>
        </Pressable>

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
          accessibilityRole="checkbox"
          accessibilityLabel="Mantener mi sesión iniciada"
          accessibilityHint="No se recomienda en dispositivos compartidos"
          accessibilityState={{ checked: rememberMe }}
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

        <Text style={styles.sessionAdvice}>
          Actívalo solo si este dispositivo es tuyo.
        </Text>

        {errors.form ? (
          <View
            style={styles.formError}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            <Text style={styles.formErrorTitle}>
              No se pudo iniciar sesión
            </Text>
            <Text style={styles.formErrorText}>{errors.form}</Text>
          </View>
        ) : null}

        <Pressable
          style={[
            styles.primaryButton,

            submitting &&
              styles.disabledButton,
          ]}
          disabled={
            submitting
          }
          accessibilityRole="button"
          accessibilityLabel={
            submitting ? "Iniciando sesión" : "Iniciar sesión"
          }
          accessibilityState={{
            disabled: submitting,
            busy: submitting,
          }}
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
            accessibilityRole="link"
            accessibilityLabel="Crear una cuenta"
            onPress={() =>
              router.replace(
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

      justifyContent:
        "center",
    },

    content: {
      width: "100%",

      maxWidth: 440,

      alignSelf: "center",
    },

    brandBlock: {
      alignItems: "center",

      position: "relative",

      overflow: "hidden",

      backgroundColor:
        COLORS.primary,

      borderRadius:
        RADIUS.xl,

      paddingHorizontal:
        SPACING.lg,

      paddingVertical:
        SPACING.xl,

      marginBottom:
        SPACING.xl,
    },

    brandDecorationLarge: {
      position: "absolute",
      width: 170,
      height: 170,
      borderRadius: 85,
      borderWidth: 1,
      borderColor:
        "rgba(255, 252, 247, 0.15)",
      top: -90,
      right: -55,
    },

    brandDecorationSmall: {
      position: "absolute",
      width: 90,
      height: 90,
      borderRadius: 45,
      backgroundColor:
        "rgba(196, 154, 69, 0.15)",
      bottom: -48,
      left: -20,
    },

    logo: {
      width: 82,

      height: 82,

      borderRadius: 41,

      marginBottom:
        SPACING.sm,
    },

    brandEyebrow: {
      fontSize: 13,

      fontWeight: "600",

      letterSpacing: 5,

      color:
        COLORS.accentSoft,

      marginBottom: 2,
    },

    brandName: {
      fontSize: 32,

      lineHeight: 38,

      fontWeight: "800",

      letterSpacing: 7,

      color: COLORS.accent,

      marginLeft: 7,
    },

    brandDivider: {
      width: 42,

      height: 2,

      borderRadius: 1,

      backgroundColor:
        COLORS.accent,

      marginTop:
        SPACING.sm,

      marginBottom:
        SPACING.md,
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

      textAlign: "center",
    },

    subtitle: {
      fontSize:
        FONT.body,

      lineHeight: 24,

      color:
        COLORS.primarySoft,

      textAlign: "center",

      maxWidth: 340,
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
        COLORS.borderStrong,

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
      borderColor: COLORS.danger,
      borderWidth: 2,
    },

    passwordInputRow: {
      width: "100%",
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.borderStrong,
      borderRadius: RADIUS.md,
      paddingLeft: SPACING.md,
    },

    passwordInput: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 14,
      fontSize: FONT.body,
      color: COLORS.text,
    },

    passwordVisibilityButton: {
      width: 48,
      minHeight: 48,
      justifyContent: "center",
      alignItems: "center",
    },

    fieldHelper: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      lineHeight: 18,
      marginTop: SPACING.xs,
    },

    errorText: {
      color: COLORS.danger,
      fontSize: FONT.caption,
      lineHeight: 18,
      fontWeight: "600",
      marginTop: SPACING.xs,
    },

    helpButton: {
      minHeight: 44,
      alignSelf: "flex-end",
      justifyContent: "center",
    },

    helpButtonText: {
      color: COLORS.primary,
      fontSize: FONT.small,
      fontWeight: "700",
    },

    rememberRow: {
      flexDirection: "row",

      alignItems: "center",

      marginTop:
        SPACING.lg,

      minHeight: 44,
    },

    checkbox: {
      width: 22,

      height: 22,

      borderRadius: 6,

      borderWidth: 1,

      borderColor:
        COLORS.borderStrong,

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

    sessionAdvice: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      lineHeight: 18,
      marginLeft: 30,
      marginBottom: SPACING.lg,
    },

    formError: {
      backgroundColor: COLORS.dangerBackground,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },

    formErrorTitle: {
      color: COLORS.danger,
      fontSize: FONT.small,
      fontWeight: "800",
      marginBottom: 3,
    },

    formErrorText: {
      color: COLORS.danger,
      fontSize: FONT.small,
      lineHeight: 20,
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
        COLORS.primary,
    },
  });
