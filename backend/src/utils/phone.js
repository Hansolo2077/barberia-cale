const PHONE_VALIDATION_MESSAGE =
  "El número de celular debe tener exactamente 8 dígitos, sin espacios, y comenzar con 8, 7 o 5.";

const PHONE_PATTERN = /^[875][0-9]{7}$/;

function isValidPhone(phone) {
  return (
    typeof phone === "string" &&
    PHONE_PATTERN.test(phone)
  );
}

module.exports = {
  PHONE_VALIDATION_MESSAGE,
  isValidPhone,
};
