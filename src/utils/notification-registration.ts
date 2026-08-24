export class NotificationOperationTimeoutError extends Error {
  readonly stage: "device" | "expo";

  constructor(stage: "device" | "expo") {
    super(
      stage === "device"
        ? "Android no entregó el token del dispositivo a tiempo."
        : "Expo no entregó el token de notificaciones a tiempo."
    );
    this.name = "NotificationOperationTimeoutError";
    this.stage = stage;
  }
}

type DevicePushTokenLike = {
  type: string;
  data: unknown;
};

export function getDevicePushTokenKey(token: DevicePushTokenLike) {
  const serializedData =
    typeof token.data === "string"
      ? token.data
      : JSON.stringify(token.data);

  return `${token.type}:${serializedData}`;
}

export function createExpoPushTokenOptions<TDevicePushToken>(
  projectId: string,
  devicePushToken: TDevicePushToken
) {
  return {
    projectId,
    devicePushToken,
  };
}

export async function withNotificationTimeout<T>(
  operation: PromiseLike<T>,
  timeoutMs: number,
  stage: "device" | "expo"
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          reject(new NotificationOperationTimeoutError(stage));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
