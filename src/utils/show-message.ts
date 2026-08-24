export type MessageKind =
  | "info"
  | "success"
  | "error";

export type AppMessage = {
  id: number;
  title: string;
  message: string;
  kind: MessageKind;
  durationMs: number;
};

type MessageOptions = {
  kind?: MessageKind;
  durationMs?: number;
};

type MessageListener = (
  message: AppMessage
) => void;

const listeners = new Set<MessageListener>();
const pendingMessages: AppMessage[] = [];
let nextMessageId = 1;

function inferKind(title: string): MessageKind {
  const normalized = title.toLocaleLowerCase("es-NI");

  if (
    normalized.includes("no se pudo") ||
    normalized.includes("error") ||
    normalized.includes("expir") ||
    normalized.includes("inválid")
  ) {
    return "error";
  }

  if (
    normalized.includes("creada") ||
    normalized.includes("solicitada") ||
    normalized.includes("confirmada") ||
    normalized.includes("completada") ||
    normalized.includes("cancelada") ||
    normalized.includes("éxito")
  ) {
    return "success";
  }

  return "info";
}

export function subscribeToMessages(
  listener: MessageListener
) {
  listeners.add(listener);

  pendingMessages.splice(0).forEach(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function showMessage(
  title: string,
  message: string,
  options: MessageOptions = {}
) {
  const kind = options.kind ?? inferKind(title);
  const appMessage: AppMessage = {
    id: nextMessageId,
    title,
    message,
    kind,
    durationMs:
      options.durationMs ??
      (kind === "error" ? 7_000 : 5_000),
  };

  nextMessageId += 1;

  if (listeners.size === 0) {
    pendingMessages.push(appMessage);
    return;
  }

  listeners.forEach((listener) => {
    listener(appMessage);
  });
}
