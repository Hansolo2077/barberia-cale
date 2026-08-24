const jwt = require("jsonwebtoken");

const authService =
  require("../services/auth.service");

const {
  sendControllerError,
} = require("../utils/http-error");
const {
  PHONE_VALIDATION_MESSAGE,
  isValidPhone,
} = require("../utils/phone");

const MAX_NAME_LENGTH = 100;
const MAX_PASSWORD_BYTES = 72;

function getRequestBody(req) {
  return req.body &&
    typeof req.body === "object" &&
    !Array.isArray(req.body)
    ? req.body
    : {};
}

function passwordExceedsBcryptLimit(password) {
  return (
    Buffer.byteLength(password, "utf8") >
    MAX_PASSWORD_BYTES
  );
}

function createToken(user, rememberMe) {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberMe ? "30d" : "8h",
    }
  );
}

async function register(req, res) {
  try {
    const {
      firstName,
      lastName,
      phone,
      password,
      rememberMe = false,
    } = getRequestBody(req);

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios.",
      });
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();

    if (!cleanFirstName || !cleanLastName) {
      return res.status(400).json({
        success: false,
        message:
          "Nombre y apellido no pueden estar vacíos.",
      });
    }

    if (
      cleanFirstName.length > MAX_NAME_LENGTH ||
      cleanLastName.length > MAX_NAME_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Nombre y apellido pueden tener hasta 100 caracteres.",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: PHONE_VALIDATION_MESSAGE,
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    if (passwordExceedsBcryptLimit(password)) {
      return res.status(400).json({
        success: false,
        message:
          "La contraseña no puede superar 72 bytes.",
      });
    }

    if (typeof rememberMe !== "boolean") {
      return res.status(400).json({
        success: false,
        message:
          "La opción de mantener sesión no es válida.",
      });
    }

    const user = await authService.registerUser({
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone,
      password,
    });

    const token = createToken(user, rememberMe);

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente.",
      token,
      user,
    });
  } catch (error) {
    console.error("ERROR REGISTRANDO USUARIO:", error);

    return sendControllerError(
      res,
      error,
      "Ocurrió un error al crear la cuenta."
    );
  }
}

async function login(req, res) {
  try {
    const {
      phone,
      password,
      rememberMe = false,
    } = getRequestBody(req);

    if (
      typeof phone !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Número de celular y contraseña son obligatorios.",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: PHONE_VALIDATION_MESSAGE,
      });
    }

    if (typeof rememberMe !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Los datos de acceso no son válidos.",
      });
    }

    const user = await authService.findUserByPhone(phone);

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Número de celular o contraseña incorrectos.",
      });
    }

    const passwordIsValid = await authService.verifyPassword(
      password,
      user.password_hash
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message:
          "Número de celular o contraseña incorrectos.",
      });
    }

    const publicUser = {
      id: Number(user.id),
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
    };

    const token = createToken(publicUser, rememberMe);

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso.",
      token,
      user: publicUser,
    });
  } catch (error) {
    console.error("ERROR INICIANDO SESIÓN:", error);

    return res.status(500).json({
      success: false,
      message:
        "Ocurrió un error al iniciar sesión.",
    });
  }
}

function me(req, res) {
  return res.json({
    success: true,
    user: req.currentUser,
  });
}

module.exports = {
  register,
  login,
  me,
};
