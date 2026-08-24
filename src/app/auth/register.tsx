import { useRouter } from "expo-router";

import {
    useRef,
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
import AppIcon from "../../components/AppIcon";
import {
  isValidLocalPhone,
  LOCAL_PHONE_REQUIREMENTS,
} from "../../utils/phone-validation";

import { useAuth } from "../../context/AuthContext";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

type RegisterField =
  | "firstName"
  | "lastName"
  | "phone"
  | "password"
  | "confirmPassword";

type RegisterErrors = Partial<Record<RegisterField | "form", string>>;

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
  ] = useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [errors, setErrors] =
    useState<RegisterErrors>({});

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const firstNameRef = useRef<TextInput>(null);
  const lastNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  function updateField(
    field: RegisterField,
    value: string
  ) {
    const normalized =
      field === "phone"
        ? value.replace(/\D/g, "").slice(0, 8)
        : value;

    switch (field) {
      case "firstName":
        setFirstName(normalized);
        break;
      case "lastName":
        setLastName(normalized);
        break;
      case "phone":
        setPhone(normalized);
        break;
      case "password":
        setPassword(normalized);
        break;
      case "confirmPassword":
        setConfirmPassword(normalized);
        break;
    }

    setErrors((current) => ({
      ...current,
      [field]: undefined,
      ...(field === "password"
        ? { confirmPassword: undefined }
        : null),
      form: undefined,
    }));
  }

  async function handleRegister() {
    const cleanFirstName =
      firstName.trim();

    const cleanLastName =
      lastName.trim();

    const cleanPhone =
      phone.trim();

    const nextErrors: RegisterErrors = {};

    if (!cleanFirstName) {
      nextErrors.firstName = "Ingresa tu nombre.";
    }

    if (!cleanLastName) {
      nextErrors.lastName = "Ingresa tu apellido.";
    }

    if (!cleanPhone) {
      nextErrors.phone = "Ingresa tu número de celular.";
    } else if (!isValidLocalPhone(cleanPhone)) {
      nextErrors.phone =
        "El número debe tener 8 dígitos y comenzar con 8, 7 o 5.";
    }

    if (!password) {
      nextErrors.password = "Crea una contraseña.";
    } else if (password.length < 6) {
      nextErrors.password = "Usa al menos 6 caracteres.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirma tu contraseña.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Las contraseñas no coinciden.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);

      const firstInvalid = (
        [
          ["firstName", firstNameRef],
          ["lastName", lastNameRef],
          ["phone", phoneRef],
          ["password", passwordRef],
          ["confirmPassword", confirmPasswordRef],
        ] as const
      ).find(([field]) => nextErrors[field]);

      firstInvalid?.[1].current?.focus();
      return;
    }

    try {
      setErrors({});
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

      if (
        user.role ===
        "ADMIN"
      ) {
        router.replace(
          "/admin"
        );

        return;
      }

      router.replace({
        pathname: "/client",
        params: {
          account: "created",
        },
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No se pudo crear la cuenta.";

      setErrors({ form: message });
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
            accessibilityRole="header"
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
            ref={firstNameRef}
            style={[
              styles.input,
              errors.firstName && styles.inputError,
            ]}
            value={
              firstName
            }
            onChangeText={
              (value) => updateField("firstName", value)
            }
            placeholder="Tu nombre"
            placeholderTextColor={
              COLORS.textMuted
            }
            autoCapitalize="words"
            autoComplete="given-name"
            returnKeyType="next"
            onSubmitEditing={() => lastNameRef.current?.focus()}
            accessibilityLabel="Nombre"
          />

          {errors.firstName ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite">
              {errors.firstName}
            </Text>
          ) : null}

          <Text
            style={
              styles.label
            }
          >
            Apellido
          </Text>

          <TextInput
            ref={lastNameRef}
            style={[
              styles.input,
              errors.lastName && styles.inputError,
            ]}
            value={
              lastName
            }
            onChangeText={
              (value) => updateField("lastName", value)
            }
            placeholder="Tu apellido"
            placeholderTextColor={
              COLORS.textMuted
            }
            autoCapitalize="words"
            autoComplete="family-name"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            accessibilityLabel="Apellido"
          />

          {errors.lastName ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite">
              {errors.lastName}
            </Text>
          ) : null}

          <Text
            style={
              styles.label
            }
          >
            Número de celular
          </Text>

          <TextInput
            ref={phoneRef}
            style={[
              styles.input,
              errors.phone && styles.inputError,
            ]}
            value={
              phone
            }
            onChangeText={
              (value) => updateField("phone", value)
            }
            placeholder="88888888"
            placeholderTextColor={
              COLORS.textMuted
            }
            keyboardType="phone-pad"
            maxLength={8}
            autoComplete="tel"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            accessibilityLabel="Número de celular"
            accessibilityHint={LOCAL_PHONE_REQUIREMENTS}
          />

          <Text style={styles.fieldHelper}>
            {LOCAL_PHONE_REQUIREMENTS}
          </Text>

          {errors.phone ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite">
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

          <View style={[
            styles.passwordInputRow,
            errors.password && styles.inputError,
          ]}>
            <TextInput
              ref={passwordRef}
              style={styles.passwordInput}
              value={password}
              onChangeText={(value) => updateField("password", value)}
              placeholder="Crea una contraseña"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              accessibilityLabel="Contraseña"
              accessibilityHint="Debe tener al menos 6 caracteres"
            />

            <Pressable
              style={styles.passwordVisibilityButton}
              accessibilityRole="button"
              accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              onPress={() => setShowPassword((current) => !current)}
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

          <Text style={styles.fieldHelper}>
            Usa al menos 6 caracteres. No reutilices una contraseña importante.
          </Text>

          {errors.password ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite">
              {errors.password}
            </Text>
          ) : null}

          <Text
            style={
              styles.label
            }
          >
            Confirmar contraseña
          </Text>

          <View style={[
            styles.passwordInputRow,
            errors.confirmPassword && styles.inputError,
          ]}>
            <TextInput
              ref={confirmPasswordRef}
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={(value) => updateField("confirmPassword", value)}
              placeholder="Escríbela nuevamente"
              placeholderTextColor={COLORS.textMuted}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              returnKeyType="done"
              onSubmitEditing={handleRegister}
              accessibilityLabel="Confirmar contraseña"
            />

            <Pressable
              style={styles.passwordVisibilityButton}
              accessibilityRole="button"
              accessibilityLabel={showConfirmPassword ? "Ocultar confirmación" : "Mostrar confirmación"}
              onPress={() => setShowConfirmPassword((current) => !current)}
            >
              <AppIcon
                name={{
                  ios: showConfirmPassword ? "eye.slash" : "eye",
                  android: showConfirmPassword ? "visibility_off" : "visibility",
                  web: showConfirmPassword ? "visibility_off" : "visibility",
                }}
                size={21}
                color={COLORS.textSecondary}
              />
            </Pressable>
          </View>

          {errors.confirmPassword ? (
            <Text style={styles.fieldError} accessibilityLiveRegion="polite">
              {errors.confirmPassword}
            </Text>
          ) : null}

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
                Actívalo solo si este dispositivo es tuyo. En uno compartido, déjalo desmarcado.
              </Text>
            </View>
          </Pressable>

          <View style={styles.privacyNotice}>
            <Text style={styles.privacyNoticeText}>
              Tu celular identifica tu cuenta y permite gestionar tus citas. Nunca compartiremos tu contraseña con el personal de la barbería.
            </Text>
          </View>

          {errors.form ? (
            <View
              style={styles.formError}
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <Text style={styles.formErrorTitle}>No se pudo crear la cuenta</Text>
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
            accessibilityState={{ disabled: submitting, busy: submitting }}
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
              accessibilityRole="link"
              accessibilityLabel="Ir a iniciar sesión"
              onPress={() =>
                router.replace(
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
      borderColor:
        COLORS.danger,
      borderWidth: 2,
    },

    fieldError: {
      fontSize:
        FONT.caption,

      color:
        COLORS.danger,

      marginTop:
        SPACING.xs,
    },

    fieldHelper: {
      fontSize: FONT.caption,
      lineHeight: 18,
      color: COLORS.textSecondary,
      marginTop: SPACING.xs,
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

    rememberRow: {
      flexDirection: "row",

      alignItems:
        "flex-start",

      marginTop:
        SPACING.lg,

      marginBottom:
        SPACING.lg,

      minHeight: 48,
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

    privacyNotice: {
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },

    privacyNoticeText: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      lineHeight: 19,
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
