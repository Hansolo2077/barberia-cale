export const LOCAL_PHONE_PATTERN = /^[875][0-9]{7}$/;

export const LOCAL_PHONE_REQUIREMENTS =
  "8 dígitos, sin espacios; debe comenzar con 8, 7 o 5.";

export function isValidLocalPhone(phone: string) {
  return LOCAL_PHONE_PATTERN.test(phone);
}
