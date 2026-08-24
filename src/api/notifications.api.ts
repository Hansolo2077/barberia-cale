import { apiRequest } from "./api-client";

export type NotificationDevicePlatform =
  | "android"
  | "ios";

export type NotificationDeviceInput = {
  expoPushToken: string;
  platform: NotificationDevicePlatform;
};

type NotificationDeviceResponse = {
  success: boolean;
  message?: string;
};

export function registerNotificationDevice(
  token: string,
  device: NotificationDeviceInput
) {
  return apiRequest<NotificationDeviceResponse>(
    "/notifications/device",
    {
      method: "PUT",
      token,
      json: device,
    }
  );
}

export function deactivateNotificationDevice(
  token: string,
  device: NotificationDeviceInput
) {
  return apiRequest<NotificationDeviceResponse>(
    "/notifications/device",
    {
      method: "DELETE",
      token,
      json: device,
      notifyOnUnauthorized: false,
    }
  );
}
