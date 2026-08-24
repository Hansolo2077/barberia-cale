const EXPO_PUSH_TOKEN_PATTERN =
  /^(?:Expo|Exponent)PushToken\[[^\]\s]{1,400}\]$/;

function normalizeExpoPushToken(value) {
  if (typeof value !== "string") {
    return null;
  }

  const token = value.trim();

  return EXPO_PUSH_TOKEN_PATTERN.test(token)
    ? token
    : null;
}

module.exports = {
  normalizeExpoPushToken,
};
