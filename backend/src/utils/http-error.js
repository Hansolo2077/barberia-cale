function isPublicStatusCode(value) {
  return (
    Number.isInteger(value) &&
    value >= 400 &&
    value < 500
  );
}

function sendControllerError(
  res,
  error,
  fallbackMessage
) {
  const status = isPublicStatusCode(
    error?.statusCode
  )
    ? error.statusCode
    : 500;

  const message =
    status < 500 &&
    typeof error?.message === "string" &&
    error.message.trim()
      ? error.message
      : fallbackMessage;

  return res.status(status).json({
    success: false,
    message,
  });
}

module.exports = {
  sendControllerError,
};
