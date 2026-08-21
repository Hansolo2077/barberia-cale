const jwt = require("jsonwebtoken");

const authService = require("../services/auth.service");

function register(req, res) {
  try {
    const {
      firstName,
      lastName,
      phone,
      password,
    } = req.body;

    if (!firstName || !lastName || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios.",
      });
    }

    if (!/^\d{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "El número de celular debe contener 8 dígitos.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres.",
      });
    }

    const user = authService.registerUser({
      firstName,
      lastName,
      phone,
      password,
    });

    return res.status(201).json({
      success: true,
      message: "Usuario registrado correctamente.",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.message || "Ocurrió un error en el servidor.",
    });
  }
}

function login(req, res) {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Número de celular y contraseña son obligatorios.",
      });
    }

    if (!/^\d{8}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "El número de celular debe contener 8 dígitos.",
      });
    }

    const user = authService.findUserByPhone(phone);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Número de celular o contraseña incorrectos.",
      });
    }

    const passwordIsValid = authService.verifyPassword(
      password,
      user.password_hash
    );

    if (!passwordIsValid) {
      return res.status(401).json({
        success: false,
        message: "Número de celular o contraseña incorrectos.",
      });
    }

    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso.",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Ocurrió un error al iniciar sesión.",
    });
  }
}

module.exports = {
  register,
  login,
};