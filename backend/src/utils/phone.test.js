const test = require("node:test");
const assert = require("node:assert/strict");

const {
  PHONE_VALIDATION_MESSAGE,
  isValidPhone,
} = require("./phone");

test("accepts eight-digit phone numbers with an allowed prefix", () => {
  for (const phone of [
    "81234567",
    "71234567",
    "51234567",
  ]) {
    assert.equal(isValidPhone(phone), true, phone);
  }
});

test("rejects phones with a disallowed prefix", () => {
  for (const phone of [
    "01234567",
    "11234567",
    "21234567",
    "31234567",
    "41234567",
    "61234567",
    "91234567",
  ]) {
    assert.equal(isValidPhone(phone), false, phone);
  }
});

test("rejects whitespace, punctuation, non-ASCII digits and wrong lengths", () => {
  for (const phone of [
    "8123 4567",
    " 81234567",
    "81234567 ",
    "8123-4567",
    "+50581234567",
    "8123456",
    "812345678",
    "８１２３４５６７",
    "",
    null,
    81234567,
  ]) {
    assert.equal(
      isValidPhone(phone),
      false,
      String(phone)
    );
  }
});

test("exposes a clear validation message", () => {
  assert.equal(
    PHONE_VALIDATION_MESSAGE,
    "El número de celular debe tener exactamente 8 dígitos, sin espacios, y comenzar con 8, 7 o 5."
  );
});
