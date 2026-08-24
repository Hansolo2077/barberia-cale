import {
    Fragment,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    useFocusEffect,
    useLocalSearchParams,
} from "expo-router";
import {
    ActivityIndicator,
    Alert,
    Linking,
    Platform,
    Pressable,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    formatDisplayDate,
    formatDisplayTime,
} from "../../utils/date-format";
import { isAppointmentPast as isPastInBusinessTime } from "../../utils/business-date";
import { BUSINESS } from "../../constants/business";

import {
    acceptAdminAppointment,
    AdminAppointment,
    AppointmentStatusCounts,
    cancelAdminAppointment,
    completeAdminAppointment,
    getAdminAppointments,
    rejectAdminAppointment,
} from "../../api/admin.api";
import type { Pagination } from "../../api/appointments.api";
import { ApiError } from "../../api/api-client";

import { useAuth } from "../../context/AuthContext";

import BackButton from "../../components/BackButton";
import AppIcon from "../../components/AppIcon";
import AttendanceBadge from "../../components/AttendanceBadge";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";



type StatusFilter = "PENDING" | "ACCEPTED";

type OperationNotice = {
  kind: "success" | "error";
  title: string;
  message: string;
};

type WhatsAppDraft = {
  appointment: AdminAppointment;
  status: "ACCEPTED" | "REJECTED";
};

type AppointmentsQuery = {
  status: StatusFilter;
  search: string;
};

function isUnauthorizedError(error: unknown) {
  return error instanceof ApiError && error.code === "UNAUTHORIZED";
}

function shouldReconcileMutation(error: unknown) {
  return (
    error instanceof ApiError &&
    [
      "ABORTED",
      "CONFLICT",
      "INVALID_RESPONSE",
      "NETWORK",
      "SERVER",
      "TIMEOUT",
      "UNKNOWN",
    ].includes(error.code)
  );
}

function normalizeWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 8) {
    return `${BUSINESS.countryCallingCode}${digits}`;
  }

  if (digits.startsWith("00")) {
    return digits.slice(2);
  }

  return digits;
}

function getWhatsAppMessage(
  appointment: AdminAppointment,
  status: "ACCEPTED" | "REJECTED"
) {
  const clientName = appointment.firstName.trim();
  const greeting = clientName ? `Hola, ${clientName}.` : "Hola.";
  const appointmentDetails = `${appointment.service} para el ${formatDisplayDate(
    appointment.date
  )} a las ${formatDisplayTime(appointment.time)}`;

  if (status === "ACCEPTED") {
    return `${greeting} Tu cita de ${appointmentDetails} ha sido confirmada. ¡Te esperamos en Barbería Cale!`;
  }

  return `${greeting} No pudimos confirmar tu cita de ${appointmentDetails}. Puedes ingresar a la aplicación para elegir otro horario.`;
}

async function openWhatsAppNotification(
  appointment: AdminAppointment,
  status: "ACCEPTED" | "REJECTED"
) {
  const phone = normalizeWhatsAppPhone(appointment.phone);

  if (!phone) {
    throw new Error("El cliente no tiene un número de teléfono válido.");
  }

  const message = getWhatsAppMessage(appointment, status);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  if (Platform.OS === "web" && typeof window !== "undefined") {
    const openedWindow = window.open(
      whatsappUrl,
      "_blank"
    );

    if (!openedWindow) {
      throw new Error(
        "El navegador bloqueó la nueva pestaña de WhatsApp."
      );
    }

    openedWindow.opener = null;

    return;
  }

  await Linking.openURL(whatsappUrl);
}

export default function AdminAppointmentsScreen() {
  const { token } = useAuth();
  const params = useLocalSearchParams<{
    query?: string | string[];
    status?: string | string[];
  }>();
  const scrollViewRef = useRef<ScrollView>(null);
  const resultsOffsetRef = useRef(0);
  const hasLoadedRef = useRef(false);

  const initialQuery = Array.isArray(params.query)
    ? params.query[0] ?? ""
    : params.query ?? "";

  const requestedStatus = Array.isArray(params.status)
    ? params.status[0]
    : params.status;

  const initialStatusFilter: StatusFilter =
    requestedStatus === "ACCEPTED" ? "ACCEPTED" : "PENDING";

  const [appointments, setAppointments] =
    useState<AdminAppointment[]>([]);

  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>(initialStatusFilter);

  const [searchQuery, setSearchQuery] =
    useState(initialQuery);

  const [appliedSearch, setAppliedSearch] =
    useState(initialQuery);

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [statusCounts, setStatusCounts] =
    useState<AppointmentStatusCounts>({});

  const [loading, setLoading] =
    useState(true);

  const [hasLoaded, setHasLoaded] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(() => Date.now());

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [querying, setQuerying] =
    useState(false);

  const [processingIds, setProcessingIds] =
    useState<Set<number>>(() => new Set());

  const [error, setError] =
    useState("");

  const [syncWarning, setSyncWarning] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [operationNotice, setOperationNotice] =
    useState<OperationNotice | null>(null);

  const [whatsAppDraft, setWhatsAppDraft] =
    useState<WhatsAppDraft | null>(null);

  const [expandedAppointmentId, setExpandedAppointmentId] =
    useState<number | null>(null);

  const [loadedQuery, setLoadedQuery] =
    useState<AppointmentsQuery>({
      status: initialStatusFilter,
      search: initialQuery,
    });

  const loadedQueryRef = useRef<AppointmentsQuery>({
    status: initialStatusFilter,
    search: initialQuery,
  });

  const loadedPageRef = useRef(1);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30_000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery.trim() !== loadedQueryRef.current.search) {
        setQuerying(true);
      }

      setAppliedSearch(searchQuery.trim());
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const loadAppointments = useCallback(
    async (
      mode: "initial" | "refresh" | "silent" = "silent",
      page = 1,
      append = false
    ) => {
      if (!token) {
        return false;
      }

      const requestQuery: AppointmentsQuery = {
        status: statusFilter,
        search: appliedSearch.trim(),
      };
      const queryChanged =
        requestQuery.status !== loadedQueryRef.current.status ||
        requestQuery.search !== loadedQueryRef.current.search;
      const pagesToPreserve =
        !append && !queryChanged && hasLoadedRef.current
          ? loadedPageRef.current
          : 1;
      const requestSequence = ++requestSequenceRef.current;

      try {
        if (mode === "initial") {
          setLoading(true);
        }

        if (mode === "refresh") {
          setRefreshing(true);
        }

        if (append) {
          setLoadingMore(true);
        }

        if (
          queryChanged ||
          (mode === "silent" && hasLoadedRef.current && !append)
        ) {
          setQuerying(true);
        }

        setError("");
        setSyncWarning("");

        const firstResult = await getAdminAppointments(token, {
          page,
          pageSize: 50,
          status: requestQuery.status,
          search: requestQuery.search,
        });

        const lastPageToPreserve =
          !append && page === 1
            ? Math.min(pagesToPreserve, firstResult.pagination.totalPages)
            : page;

        const additionalResults =
          !append && page === 1 && lastPageToPreserve > 1
            ? await Promise.all(
                Array.from(
                  { length: lastPageToPreserve - 1 },
                  (_, index) =>
                    getAdminAppointments(token, {
                      page: index + 2,
                      pageSize: 50,
                      status: requestQuery.status,
                      search: requestQuery.search,
                    })
                )
              )
            : [];

        if (requestSequence !== requestSequenceRef.current) {
          return false;
        }

        const pageResults = [firstResult, ...additionalResults];
        const resultPagination =
          pageResults[pageResults.length - 1].pagination;
        const knownResultIds = new Set<number>();
        const resultAppointments = pageResults
          .flatMap((result) => result.appointments)
          .filter((appointment) => {
            if (knownResultIds.has(appointment.id)) {
              return false;
            }

            knownResultIds.add(appointment.id);
            return true;
          });

        setAppointments((current) => {
          if (!append) {
            return resultAppointments;
          }

          const existingIds = new Set(
            current.map((appointment) => appointment.id)
          );

          return [
            ...current,
            ...resultAppointments.filter(
              (appointment) => !existingIds.has(appointment.id)
            ),
          ];
        });
        setPagination(resultPagination);
        setStatusCounts(firstResult.statusCounts ?? {});
        setLoadedQuery(requestQuery);
        loadedQueryRef.current = requestQuery;
        loadedPageRef.current = resultPagination.page;
        setLastUpdated(new Date());
        hasLoadedRef.current = true;
        setHasLoaded(true);
        return true;
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "No se pudieron cargar las citas.";

        if (requestSequence !== requestSequenceRef.current) {
          return false;
        }

        if (isUnauthorizedError(loadError)) {
          return false;
        }

        if (hasLoadedRef.current) {
          setSyncWarning(
            `Mostramos la última información disponible. ${message}`
          );
        } else {
          setError(message);
        }

        return false;
      } finally {
        if (requestSequence === requestSequenceRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          setQuerying(false);
        }
      }
    },
    [appliedSearch, statusFilter, token]
  );

  useFocusEffect(
    useCallback(() => {
      void loadAppointments(
        hasLoadedRef.current ? "silent" : "initial"
      );
    }, [loadAppointments])
  );

  function setAppointmentProcessing(
    appointmentId: number,
    processing: boolean
  ) {
    setProcessingIds((current) => {
      const next = new Set(current);

      if (processing) {
        next.add(appointmentId);
      } else {
        next.delete(appointmentId);
      }

      return next;
    });
  }

  function getAppointmentSummary(appointment: AdminAppointment) {
    return `${appointment.firstName} ${appointment.lastName}\n${formatDisplayDate(
      appointment.date
    )} · ${formatDisplayTime(appointment.time)}\n${appointment.service}`;
  }

  function isPastAppointment(appointment: AdminAppointment) {
    const enhancedAppointment = appointment as AdminAppointment & {
      isPast?: boolean;
      canAccept?: boolean;
    };

    const locallyPast = isPastInBusinessTime(
      appointment.date,
      appointment.time,
      new Date(currentTime)
    );

    return enhancedAppointment.isPast === true || locallyPast;
  }

  function canAcceptAppointment(appointment: AdminAppointment) {
    const enhancedAppointment = appointment as AdminAppointment & {
      canAccept?: boolean;
    };

    return (
      enhancedAppointment.canAccept !== false &&
      !isPastAppointment(appointment)
    );
  }

  function confirmAction({
    title,
    message,
    confirmText,
    destructive = false,
    onConfirm,
  }: {
    title: string;
    message: string;
    confirmText: string;
    destructive?: boolean;
    onConfirm: () => void;
  }) {
    if (Platform.OS !== "web") {
      Alert.alert(title, message, [
        {
          text: "Volver",
          style: "cancel",
        },
        {
          text: confirmText,
          style: destructive ? "destructive" : "default",
          onPress: onConfirm,
        },
      ]);
      return;
    }

    if (
      typeof window.confirm === "function" &&
      window.confirm(`${title}\n\n${message}`)
    ) {
      onConfirm();
    }
  }

  function updateLocalStatus(
    appointmentId: number,
    previousStatus: AdminAppointment["status"],
    status: AdminAppointment["status"]
  ) {
    const loadedStatus = loadedQueryRef.current.status;

    setAppointments((current) => {
      if (loadedStatus !== status) {
        return current.filter(
          (appointment) => appointment.id !== appointmentId
        );
      }

      return current.map((appointment) =>
        appointment.id === appointmentId
          ? { ...appointment, status }
          : appointment
      );
    });

    if (previousStatus !== status) {
      setStatusCounts((current) => ({
        ...current,
        [previousStatus]: Math.max(
          0,
          (current[previousStatus] ?? 0) - 1
        ),
        [status]: (current[status] ?? 0) + 1,
      }));

      setPagination((current) => {
        if (!current) {
          return current;
        }

        const matchedBefore =
          loadedStatus === previousStatus;
        const matchesAfter =
          loadedStatus === status;
        const total = Math.max(
          0,
          current.total + Number(matchesAfter) - Number(matchedBefore)
        );
        const totalPages = Math.max(
          1,
          Math.ceil(total / current.pageSize)
        );

        return {
          ...current,
          total,
          totalPages,
          hasMore: current.page < totalPages,
        };
      });
    }

    setLastUpdated(new Date());
  }

  function handleMutationFailure(
    actionError: unknown,
    title: string,
    fallbackMessage: string
  ) {
    if (isUnauthorizedError(actionError)) {
      return;
    }

    if (shouldReconcileMutation(actionError)) {
      setOperationNotice({
        kind: "error",
        title: "Confirmando el estado de la cita",
        message:
          "No recibimos una confirmación definitiva. Estamos actualizando la lista antes de que vuelvas a intentarlo.",
      });
      void loadAppointments("silent");
      return;
    }

    setOperationNotice({
      kind: "error",
      title,
      message:
        actionError instanceof Error
          ? actionError.message
          : fallbackMessage,
    });

  }

  function handleAccept(appointment: AdminAppointment) {
    if (!canAcceptAppointment(appointment)) {
      setOperationNotice({
        kind: "error",
        title: "Solicitud vencida",
        message:
          "La hora de esta solicitud ya pasó. Recházala para cerrar el registro sin crear una confirmación retroactiva.",
      });
      return;
    }

    confirmAction({
      title: "Aceptar cita",
      message: `${getAppointmentSummary(
        appointment
      )}\n\nLa cita quedará confirmada. Después podrás decidir si abres WhatsApp.`,
      confirmText: "Sí, aceptar",
      onConfirm: () => void executeAccept(appointment),
    });
  }

  async function executeAccept(appointment: AdminAppointment) {
    if (!token) {
      return;
    }

    try {
      setAppointmentProcessing(appointment.id, true);
      setOperationNotice(null);

      await acceptAdminAppointment(token, appointment.id);
      updateLocalStatus(
        appointment.id,
        appointment.status,
        "ACCEPTED"
      );
      setWhatsAppDraft({ appointment, status: "ACCEPTED" });
      setOperationNotice({
        kind: "success",
        title: "Cita confirmada",
        message:
          "El horario quedó confirmado. WhatsApp no se abrirá hasta que tú lo elijas.",
      });
      void loadAppointments("silent");
    } catch (actionError) {
      handleMutationFailure(
        actionError,
        "No se pudo aceptar",
        "No se pudo aceptar la cita."
      );
    } finally {
      setAppointmentProcessing(appointment.id, false);
    }
  }

  function handleReject(appointment: AdminAppointment) {
    confirmAction({
      title: "Rechazar cita",
      message: `${getAppointmentSummary(
        appointment
      )}\n\nEl horario quedará disponible para otros clientes.`,
      confirmText: "Sí, rechazar",
      destructive: true,
      onConfirm: () => void executeReject(appointment),
    });
  }

  async function executeReject(appointment: AdminAppointment) {
    if (!token) {
      return;
    }

    try {
      setAppointmentProcessing(appointment.id, true);
      setOperationNotice(null);

      await rejectAdminAppointment(token, appointment.id);
      updateLocalStatus(
        appointment.id,
        appointment.status,
        "REJECTED"
      );
      setWhatsAppDraft({ appointment, status: "REJECTED" });
      setOperationNotice({
        kind: "success",
        title: "Cita rechazada",
        message:
          "La solicitud se cerró y el horario volvió a estar disponible.",
      });
      void loadAppointments("silent");
    } catch (actionError) {
      handleMutationFailure(
        actionError,
        "No se pudo rechazar",
        "No se pudo rechazar la cita."
      );
    } finally {
      setAppointmentProcessing(appointment.id, false);
    }
  }

  function handleComplete(appointment: AdminAppointment) {
    confirmAction({
      title: "Completar cita",
      message: `${getAppointmentSummary(
        appointment
      )}\n\nConfirma que el servicio ya fue atendido.`,
      confirmText: "Sí, completar",
      onConfirm: () => void executeComplete(appointment),
    });
  }

  async function executeComplete(appointment: AdminAppointment) {
    if (!token) {
      return;
    }

    try {
      setAppointmentProcessing(appointment.id, true);
      setOperationNotice(null);

      await completeAdminAppointment(token, appointment.id);
      updateLocalStatus(
        appointment.id,
        appointment.status,
        "COMPLETED"
      );
      setOperationNotice({
        kind: "success",
        title: "Cita completada",
        message: "La cita fue marcada como completada.",
      });
      void loadAppointments("silent");
    } catch (actionError) {
      handleMutationFailure(
        actionError,
        "No se pudo completar",
        "No se pudo completar la cita."
      );
    } finally {
      setAppointmentProcessing(appointment.id, false);
    }
  }

  function confirmAdminCancel(appointment: AdminAppointment) {
    confirmAction({
      title: "Cancelar cita",
      message: `${getAppointmentSummary(
        appointment
      )}\n\nEl horario volverá a quedar disponible para otros clientes.`,
      confirmText: "Sí, cancelar",
      destructive: true,
      onConfirm: () => void executeAdminCancel(appointment),
    });
  }

  async function executeAdminCancel(appointment: AdminAppointment) {
    if (!token) {
      return;
    }

    try {
      setAppointmentProcessing(appointment.id, true);
      setOperationNotice(null);

      await cancelAdminAppointment(token, appointment.id);
      updateLocalStatus(
        appointment.id,
        appointment.status,
        "CANCELLED"
      );
      setOperationNotice({
        kind: "success",
        title: "Cita cancelada",
        message:
          "La cita fue cancelada administrativamente y el horario quedó disponible.",
      });
      void loadAppointments("silent");
    } catch (actionError) {
      handleMutationFailure(
        actionError,
        "No se pudo cancelar",
        "No se pudo cancelar la cita."
      );
    } finally {
      setAppointmentProcessing(appointment.id, false);
    }
  }

  async function shareOrCopyText(
    text: string,
    successMessage: string
  ) {
    if (
      Platform.OS === "web" &&
      typeof navigator !== "undefined" &&
      navigator.clipboard
    ) {
      await navigator.clipboard.writeText(text);
      setOperationNotice({
        kind: "success",
        title: "Copiado",
        message: successMessage,
      });
      return;
    }

    await Share.share({ message: text });
  }

  async function handleOpenWhatsApp() {
    if (!whatsAppDraft) {
      return;
    }

    try {
      await openWhatsAppNotification(
        whatsAppDraft.appointment,
        whatsAppDraft.status
      );
    } catch (whatsAppError) {
      setOperationNotice({
        kind: "error",
        title: "No se pudo abrir WhatsApp",
        message:
          whatsAppError instanceof Error
            ? whatsAppError.message
            : "Puedes copiar el mensaje y contactar al cliente manualmente.",
      });
    }
  }

  async function handleCopyWhatsAppMessage() {
    if (!whatsAppDraft) {
      return;
    }

    try {
      await shareOrCopyText(
        getWhatsAppMessage(
          whatsAppDraft.appointment,
          whatsAppDraft.status
        ),
        "El mensaje de WhatsApp quedó en el portapapeles."
      );
    } catch {
      setOperationNotice({
        kind: "error",
        title: "No se pudo copiar",
        message: "El mensaje sigue visible para que puedas revisarlo.",
      });
    }
  }

  async function handleCall(phone: string) {
    try {
      await Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
    } catch {
      setOperationNotice({
        kind: "error",
        title: "No se pudo iniciar la llamada",
        message: `Puedes marcar manualmente al ${phone}.`,
      });
    }
  }

  async function handleCopyPhone(phone: string) {
    try {
      await shareOrCopyText(
        phone,
        "El número del cliente quedó en el portapapeles."
      );
    } catch {
      setOperationNotice({
        kind: "error",
        title: "No se pudo copiar el número",
        message: `Puedes anotarlo manualmente: ${phone}.`,
      });
    }
  }

  function getStatusText(
    status: AdminAppointment["status"]
  ) {
    switch (status) {
      case "PENDING":
        return "Pendiente";

      case "ACCEPTED":
        return "Confirmada";

      case "COMPLETED":
        return "Completada";

      case "REJECTED":
        return "Rechazada";

      case "CANCELLED":
        return "Cancelada";

      default:
        return status;
    }
  }

  function getStatusStyle(
    status: AdminAppointment["status"]
  ) {
    switch (status) {
      case "ACCEPTED":
        return {
          background:
            COLORS.successBackground,
          text:
            COLORS.success,
        };

      case "COMPLETED":
        return {
          background:
            COLORS.primarySoft,
          text:
            COLORS.text,
        };

      case "PENDING":
        return {
          background:
            COLORS.warningBackground,
          text:
            "#7A4C00",
        };

      case "REJECTED":
      case "CANCELLED":
        return {
          background:
            COLORS.dangerBackground,
          text:
            COLORS.danger,
        };

      default:
        return {
          background:
            COLORS.primarySoft,
          text:
            COLORS.textSecondary,
        };
    }
  }

  const pendingCount =
    statusCounts.PENDING ??
    appointments.filter(
      (appointment) => appointment.status === "PENDING"
    ).length;

  const expiredPendingCount = appointments.filter(
    (appointment) =>
      appointment.status === "PENDING" &&
      isPastAppointment(appointment)
  ).length;

  function getRequestAge(createdAt: string) {
    const createdTimestamp = new Date(createdAt).getTime();

    if (!Number.isFinite(createdTimestamp)) {
      return "Fecha de solicitud no disponible";
    }

    const elapsedMinutes = Math.max(
      0,
      Math.floor((currentTime - createdTimestamp) / 60_000)
    );

    if (elapsedMinutes < 1) {
      return "Solicitada hace menos de un minuto";
    }

    if (elapsedMinutes < 60) {
      return `Solicitada hace ${elapsedMinutes} min`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
      return `Solicitada hace ${elapsedHours} ${
        elapsedHours === 1 ? "hora" : "horas"
      }`;
    }

    const elapsedDays = Math.floor(elapsedHours / 24);
    return `Solicitada hace ${elapsedDays} ${
      elapsedDays === 1 ? "día" : "días"
    }`;
  }

  const normalizedQuery = loadedQuery.search
    .trim()
    .toLocaleLowerCase("es-NI");

  const filteredAppointments = appointments
    .filter(
      (appointment) =>
        appointment.status === loadedQuery.status
    )
    .filter((appointment) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchableText = [
        `#${appointment.id}`,
        appointment.firstName,
        appointment.lastName,
        appointment.phone,
        appointment.service,
        appointment.date,
        appointment.time,
        formatDisplayDate(appointment.date),
        formatDisplayTime(appointment.time),
      ]
        .join(" ")
        .toLocaleLowerCase("es-NI");

      return searchableText.includes(normalizedQuery);
    })
    .slice();

  if (
    loadedQuery.status === "PENDING" ||
    loadedQuery.status === "ACCEPTED"
  ) {
    filteredAppointments.sort(
      (first, second) =>
        `${first.date} ${first.time}`.localeCompare(
          `${second.date} ${second.time}`
        )
    );
  }

  const filters: {
    value: StatusFilter;
    label: string;
  }[] = [
    {
      value: "PENDING",
      label: "Pendientes",
    },
    {
      value: "ACCEPTED",
      label: "Confirmadas",
    },
  ];

  function getFilterCount(filter: StatusFilter) {
    return statusCounts[filter] ??
      appointments.filter(
        (appointment) => appointment.status === filter
      ).length;
  }

  function handleFilterPress(filter: StatusFilter) {
    if (filter === statusFilter) {
      return;
    }

    setQuerying(true);
    setStatusFilter(filter);
    setExpandedAppointmentId(null);

    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(
          resultsOffsetRef.current - SPACING.md,
          0
        ),
        animated: true,
      });
    });
  }

  function getSectionTitle(filter = loadedQuery.status) {
    return filter === "PENDING"
      ? "Pendientes de gestión"
      : "Citas confirmadas";
  }

  function getEmptyMessage() {
    if (normalizedQuery) {
      return "No encontramos registros que coincidan con tu búsqueda y el estado seleccionado.";
    }

    return loadedQuery.status === "PENDING"
      ? "No hay solicitudes esperando respuesta."
      : "No hay citas confirmadas actualmente.";
  }

  const updatedLabel = lastUpdated
    ? `Actualizado a las ${lastUpdated.toLocaleTimeString("es-NI", {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "Aún no se ha actualizado";

  const displayingPreviousData =
    hasLoaded &&
    (statusFilter !== loadedQuery.status ||
      searchQuery.trim() !== loadedQuery.search);

  const networkBusy =
    loading || refreshing || loadingMore || querying;

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={
        styles.container
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void loadAppointments("refresh")}
          colors={[COLORS.primary]}
          tintColor={COLORS.primary}
        />
      }
      showsVerticalScrollIndicator={
      false
      }
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerAccent} />

          <Text style={styles.eyebrow}>
            SOLICITUDES
          </Text>

          <Text style={styles.title}>
            Gestión de citas
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Gestiona las solicitudes
            pendientes y consulta citas
            por estado.
          </Text>
        </View>

        <BackButton
          iconOnly
          fallbackHref="/admin"
        />
      </View>

      <View
        style={
          styles.summaryCard
        }
      >
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>
            TRABAJO PENDIENTE
          </Text>

          <Text style={styles.summaryTitle}>
            {loading && !hasLoaded
              ? "Actualizando solicitudes…"
              : pendingCount === 0
              ? "Todo está al día"
              : pendingCount === 1
                ? "1 solicitud por revisar"
                : `${pendingCount} solicitudes por revisar`}
          </Text>

          <Text style={styles.summaryHint}>
            {expiredPendingCount > 0
              ? `${expiredPendingCount} ${
                  expiredPendingCount === 1
                    ? "solicitud tiene"
                    : "solicitudes tienen"
                } un horario vencido y necesita cierre.`
              : pendingCount === 0
              ? "No hay nuevas solicitudes esperando respuesta."
              : "Acepta o rechaza las solicitudes para mantener la agenda al día."}
          </Text>
        </View>

        <View
          style={
            styles.summaryIcon
          }
        >
          <AppIcon
            name={{
              ios: "bell.fill",
              android: "notifications",
              web: "notifications",
            }}
            size={23}
            color={COLORS.primary}
          />
        </View>
      </View>

      <View style={styles.dataStatusRow}>
        <Text style={styles.updatedText}>{updatedLabel}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => void loadAppointments("refresh")}
          disabled={networkBusy}
          accessibilityRole="button"
          accessibilityLabel="Actualizar citas"
          accessibilityState={{
            disabled: networkBusy,
            busy: networkBusy,
          }}
        >
          {refreshing || querying ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <AppIcon
              name={{
                ios: "arrow.clockwise",
                android: "refresh",
                web: "refresh",
              }}
              size={19}
              color={COLORS.primary}
            />
          )}
        </Pressable>
      </View>

      {syncWarning ? (
        <View
          style={[styles.noticeCard, styles.warningNotice]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              No pudimos actualizar la lista
            </Text>
            <Text style={styles.noticeText}>{syncWarning}</Text>
          </View>

          <Pressable
            style={styles.noticeAction}
            onPress={() => void loadAppointments("refresh")}
            accessibilityRole="button"
            accessibilityLabel="Reintentar actualización de citas"
          >
            <Text style={styles.noticeActionText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {operationNotice ? (
        <View
          style={[
            styles.noticeCard,
            operationNotice.kind === "error"
              ? styles.errorNotice
              : styles.successNotice,
          ]}
          accessibilityRole={
            operationNotice.kind === "error" ? "alert" : "summary"
          }
          accessibilityLiveRegion="polite"
        >
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              {operationNotice.title}
            </Text>
            <Text style={styles.noticeText}>
              {operationNotice.message}
            </Text>
          </View>

          <Pressable
            style={styles.noticeDismiss}
            onPress={() => setOperationNotice(null)}
            accessibilityRole="button"
            accessibilityLabel="Cerrar mensaje"
          >
            <AppIcon
              name={{ ios: "xmark", android: "close", web: "close" }}
              size={18}
              color={COLORS.textSecondary}
            />
          </Pressable>
        </View>
      ) : null}

      {whatsAppDraft ? (
        <View
          style={styles.whatsAppCard}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.whatsAppHeading}>
            <View style={styles.whatsAppIcon}>
              <AppIcon
                name={{
                  ios: "message.fill",
                  android: "chat",
                  web: "chat",
                }}
                size={20}
                color={COLORS.success}
              />
            </View>

            <View style={styles.whatsAppHeadingContent}>
              <Text style={styles.whatsAppTitle}>
                Mensaje preparado para {whatsAppDraft.appointment.firstName}
              </Text>
              <Text style={styles.whatsAppHint}>
                Revísalo antes de abrir WhatsApp. Enviar sigue siendo manual.
              </Text>
            </View>
          </View>

          <Text style={styles.whatsAppPreview} selectable>
            {getWhatsAppMessage(
              whatsAppDraft.appointment,
              whatsAppDraft.status
            )}
          </Text>

          <View style={styles.whatsAppActions}>
            <Pressable
              style={styles.whatsAppPrimaryButton}
              onPress={() => void handleOpenWhatsApp()}
              accessibilityRole="button"
              accessibilityLabel="Abrir mensaje preparado en WhatsApp"
            >
              <Text style={styles.whatsAppPrimaryText}>Abrir WhatsApp</Text>
            </Pressable>

            <Pressable
              style={styles.whatsAppSecondaryButton}
              onPress={() => void handleCopyWhatsAppMessage()}
              accessibilityRole="button"
              accessibilityLabel={
                Platform.OS === "web"
                  ? "Copiar mensaje de WhatsApp"
                  : "Compartir o copiar mensaje de WhatsApp"
              }
            >
              <Text style={styles.whatsAppSecondaryText}>
                {Platform.OS === "web" ? "Copiar mensaje" : "Copiar o compartir"}
              </Text>
            </Pressable>

            <Pressable
              style={styles.whatsAppSkipButton}
              onPress={() => setWhatsAppDraft(null)}
              accessibilityRole="button"
              accessibilityLabel="Cerrar mensaje y continuar sin WhatsApp"
            >
              <Text style={styles.whatsAppSkipText}>Ahora no</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View style={styles.searchSection}>
        <Text style={styles.searchLabel}>Buscar una cita</Text>
        <View style={styles.searchInputRow}>
          <AppIcon
            name={{ ios: "magnifyingglass", android: "search", web: "search" }}
            size={19}
            color={COLORS.textMuted}
          />

          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Nombre, celular, fecha, hora o #ID"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            importantForAutofill="no"
            returnKeyType="search"
            accessibilityLabel="Buscar citas"
            accessibilityHint="Busca por nombre, celular, fecha, hora, servicio o identificador"
            accessibilityState={{ busy: querying }}
          />

          {searchQuery ? (
            <Pressable
              style={styles.clearSearchButton}
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Limpiar búsqueda"
            >
              <AppIcon
                name={{ ios: "xmark.circle.fill", android: "cancel", web: "cancel" }}
                size={20}
                color={COLORS.textMuted}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <Text
        style={
          styles.filterLabel
        }
      >
        Filtrar por estado
      </Text>

      <ScrollView
        horizontal
        style={styles.filterScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={
          styles.filterContainer
        }
      >
        {filters.map(
          (filter) => {
            const active =
              statusFilter ===
              filter.value;

            return (
              <Pressable
                key={
                  filter.value
                }
                style={[
                  styles.filterButton,
                  active &&
                    styles.activeFilterButton,
                  networkBusy && styles.disabledButton,
                ]}
                disabled={networkBusy}
                onPress={() =>
                  handleFilterPress(filter.value)
                }
                accessibilityRole="tab"
                accessibilityLabel={`${filter.label}, ${getFilterCount(filter.value)}`}
                accessibilityState={{
                  selected: active,
                  disabled: networkBusy,
                }}
                hitSlop={4}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    active &&
                      styles.activeFilterButtonText,
                  ]}
                >
                  {filter.label}
                </Text>

                <View
                  style={[
                    styles.filterCountBadge,
                    active && styles.activeFilterCountBadge,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterCountText,
                      active && styles.activeFilterCountText,
                    ]}
                  >
                    {getFilterCount(filter.value)}
                  </Text>
                </View>
              </Pressable>
            );
          }
        )}
      </ScrollView>

      {displayingPreviousData && !syncWarning ? (
        <View
          style={[styles.noticeCard, styles.warningNotice]}
          accessibilityLiveRegion="polite"
        >
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>
              Actualizando la vista
            </Text>
            <Text style={styles.noticeText}>
              La lista todavía muestra {getSectionTitle().toLowerCase()} de la consulta anterior.
            </Text>
          </View>

          {querying ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : null}
        </View>
      ) : null}

      {loading && !hasLoaded ? (
        <View style={styles.loadingCard} accessibilityLiveRegion="polite">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Cargando citas…</Text>
        </View>
      ) : error ? (
        <View
          style={
            styles.messageCard
          }
        >
          <Text
            style={
              styles.messageTitle
            }
          >
            No pudimos cargar las citas
          </Text>

          <Text
            style={
              styles.messageText
            }
          >
            {error}
          </Text>

          <Pressable
            style={
              styles.retryButton
            }
            accessibilityRole="button"
            accessibilityLabel="Intentar cargar las citas nuevamente"
            onPress={() => void loadAppointments("initial")}
          >
            <Text
              style={
                styles.retryButtonText
              }
            >
              Intentar nuevamente
            </Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View
            onLayout={(event) => {
              resultsOffsetRef.current =
                event.nativeEvent.layout.y;
            }}
            style={styles.resultsHeading}
            accessibilityLiveRegion="polite"
          >
          <Text
            style={
              styles.sectionTitle
            }
          >
            {getSectionTitle()}
          </Text>

          <Text style={styles.resultsCount}>
            {pagination?.total ?? filteredAppointments.length}{" "}
            {(pagination?.total ?? filteredAppointments.length) === 1
              ? "resultado"
              : "resultados"}
          </Text>
          </View>

          {filteredAppointments
            .length === 0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <View
                style={
                  styles.emptyIcon
                }
              >
                <AppIcon
                  name={{
                    ios: "checkmark.circle.fill",
                    android: "check_circle",
                    web: "check_circle",
                  }}
                  size={28}
                  color={COLORS.success}
                />
              </View>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                {normalizedQuery ? "Sin coincidencias" : "Nada por aquí"}
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                {getEmptyMessage()}
              </Text>
            </View>
          ) : (
            filteredAppointments.map(
              (appointment, index) => {
                const processing =
                  processingIds.has(appointment.id);

                const actionsDisabled =
                  processing || networkBusy || displayingPreviousData;

                const statusStyle =
                  getStatusStyle(
                    appointment.status
                  );

                const operationalView =
                  loadedQuery.status === "PENDING" ||
                  loadedQuery.status === "ACCEPTED";

                const startsNewDay =
                  operationalView &&
                  (index === 0 ||
                    filteredAppointments[index - 1].date !==
                      appointment.date);

                const dayAppointmentCount = startsNewDay
                  ? filteredAppointments.filter(
                      (item) => item.date === appointment.date
                    ).length
                  : 0;

                const expanded =
                  expandedAppointmentId === appointment.id;

                const appointmentIsPast =
                  isPastAppointment(appointment);

                const canComplete =
                  appointment.canComplete === true ||
                  appointmentIsPast;

                const canAdminCancel =
                  appointment.canAdminCancel !== false &&
                  !appointmentIsPast;

                const pendingExpired =
                  appointment.status === "PENDING" &&
                  !canAcceptAppointment(appointment);

                return (
                  <Fragment key={appointment.id}>
                  {startsNewDay && (
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayHeaderText}>
                        {formatDisplayDate(appointment.date)}
                      </Text>

                      <Text style={styles.dayHeaderCount}>
                        {dayAppointmentCount}{" "}
                        {dayAppointmentCount === 1 ? "cita" : "citas"}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.card,
                      operationalView &&
                        styles.operationalCard,
                    ]}
                  >
                    <View
                      style={
                        styles.cardTopRow
                      }
                    >
                      <View
                        style={
                          styles.clientInfo
                        }
                      >
                        <View
                          style={
                            styles.avatar
                          }
                        >
                          <Text
                            style={
                              styles.avatarText
                            }
                          >
                            {appointment.firstName
                              ?.charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>

                        <View
                          style={
                            styles.clientTextBlock
                          }
                        >
                          <Text
                            style={
                              styles.clientName
                            }
                          >
                            {
                              appointment.firstName
                            }{" "}
                            {
                              appointment.lastName
                            }
                          </Text>

                          <Text style={styles.requestAge}>
                            {getRequestAge(appointment.createdAt)} · #{appointment.id}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              statusStyle.background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                statusStyle.text,
                            },
                          ]}
                        >
                          {getStatusText(
                            appointment.status
                          )}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.serviceRow}>
                      <View style={styles.serviceIcon}>
                        <AppIcon
                          name={{
                            ios: "scissors",
                            android: "content_cut",
                            web: "content_cut",
                          }}
                          size={20}
                          color={COLORS.primary}
                        />
                      </View>

                      <View style={styles.serviceContent}>
                        <Text style={styles.serviceLabel}>
                          SERVICIO
                        </Text>

                        <Text style={styles.service}>
                          {appointment.service}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.infoRow
                      }
                    >
                      <View
                        style={
                          styles.infoBlock
                        }
                      >
                        <AppIcon
                          name={{
                            ios: "calendar",
                            android: "calendar_month",
                            web: "calendar_month",
                          }}
                          size={19}
                          color={COLORS.primary}
                        />

                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Fecha
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {
                            formatDisplayDate(
  appointment.date
)
                          }
                        </Text>
                      </View>

                      <View
                        style={
                          styles.infoBlock
                        }
                      >
                        <AppIcon
                          name={{
                            ios: "clock",
                            android: "schedule",
                            web: "schedule",
                          }}
                          size={19}
                          color={COLORS.primary}
                        />

                        <Text
                          style={
                            styles.infoLabel
                          }
                        >
                          Hora
                        </Text>

                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {
                            formatDisplayTime(
  appointment.time
)
                          }
                        </Text>
                      </View>
                    </View>

                    {appointment.attendanceStatus &&
                      appointment.attendanceStatus !== "NOT_APPLICABLE" && (
                        <View style={styles.attendanceBadgeRow}>
                          <AttendanceBadge
                            status={appointment.attendanceStatus}
                          />
                        </View>
                      )}

                    {expanded && (
                      <View style={styles.expandedDetails}>
                        <View style={styles.detailIcon}>
                          <AppIcon
                            name={{
                              ios: "phone.fill",
                              android: "call",
                              web: "call",
                            }}
                            size={18}
                            color={COLORS.primary}
                          />
                        </View>

                        <View style={styles.detailContent}>
                          <Text style={styles.detailLabel}>
                            TELÉFONO
                          </Text>

                          <Text style={styles.phone}>
                            {appointment.phone}
                          </Text>

                          <View style={styles.phoneActions}>
                            <Pressable
                              style={styles.phoneAction}
                              onPress={() => void handleCall(appointment.phone)}
                              accessibilityRole="button"
                              accessibilityLabel={`Llamar a ${appointment.firstName}`}
                            >
                              <Text style={styles.phoneActionText}>Llamar</Text>
                            </Pressable>

                            <Pressable
                              style={styles.phoneAction}
                              onPress={() => void handleCopyPhone(appointment.phone)}
                              accessibilityRole="button"
                              accessibilityLabel={
                                Platform.OS === "web"
                                  ? "Copiar número del cliente"
                                  : "Compartir o copiar número del cliente"
                              }
                            >
                              <Text style={styles.phoneActionText}>
                                {Platform.OS === "web"
                                  ? "Copiar"
                                  : "Copiar o compartir"}
                              </Text>
                            </Pressable>
                          </View>
                        </View>
                      </View>
                    )}

                    <Pressable
                      style={styles.detailsButton}
                      accessibilityRole="button"
                      accessibilityState={{
                        expanded,
                      }}
                      accessibilityLabel={
                        expanded
                          ? "Ocultar los detalles de la cita"
                          : "Ver los detalles de la cita"
                      }
                      onPress={() =>
                        setExpandedAppointmentId(
                          expanded ? null : appointment.id
                        )
                      }
                    >
                      <AppIcon
                        name={{
                          ios: expanded
                            ? "chevron.up"
                            : "chevron.down",
                          android: expanded
                            ? "expand_less"
                            : "expand_more",
                          web: expanded
                            ? "expand_less"
                            : "expand_more",
                        }}
                        size={18}
                        color={COLORS.primary}
                      />

                      <Text style={styles.detailsButtonText}>
                        {expanded
                          ? "Ocultar detalles"
                          : "Ver detalles"}
                      </Text>
                    </Pressable>

                    {appointment.status === "PENDING" && (
                      <>
                        {pendingExpired ? (
                          <View
                            style={styles.expiredRequest}
                            accessibilityRole="alert"
                          >
                            <AppIcon
                              name={{
                                ios: "exclamationmark.triangle.fill",
                                android: "warning",
                                web: "warning",
                              }}
                              size={19}
                              color={COLORS.danger}
                            />

                            <View style={styles.expiredRequestContent}>
                              <Text style={styles.expiredRequestTitle}>
                                Solicitud vencida
                              </Text>
                              <Text style={styles.expiredRequestText}>
                                La hora ya pasó. No se puede aceptar; recházala para cerrar el registro.
                              </Text>
                            </View>
                          </View>
                        ) : null}

                        <View
                          style={[
                            styles.actionsContainer,
                            Platform.OS === "web" &&
                              styles.webActionsContainer,
                          ]}
                        >
                          {!pendingExpired ? (
                            <Pressable
                              style={[
                                styles.acceptButton,
                                Platform.OS === "web" &&
                                  styles.webRequestButton,
                                actionsDisabled && styles.disabledButton,
                              ]}
                              disabled={actionsDisabled}
                              accessibilityRole="button"
                              accessibilityLabel={`Aceptar cita de ${appointment.firstName} ${appointment.lastName}`}
                              accessibilityState={{
                                disabled: actionsDisabled,
                                busy: processing,
                              }}
                              onPress={() => handleAccept(appointment)}
                            >
                              <AppIcon
                                name={{
                                  ios: "checkmark",
                                  android: "check",
                                  web: "check",
                                }}
                                size={18}
                                color={COLORS.onPrimary}
                              />

                              <Text style={styles.acceptButtonText}>
                                {processing ? "Procesando..." : "Aceptar"}
                              </Text>
                            </Pressable>
                          ) : null}

                          <Pressable
                            style={[
                              styles.rejectButton,
                              Platform.OS === "web" &&
                                styles.webRequestButton,
                              pendingExpired && styles.expiredRejectButton,
                              actionsDisabled && styles.disabledButton,
                            ]}
                            disabled={actionsDisabled}
                            accessibilityRole="button"
                            accessibilityLabel={`Rechazar cita de ${appointment.firstName} ${appointment.lastName}`}
                            accessibilityState={{
                              disabled: actionsDisabled,
                              busy: processing,
                            }}
                            onPress={() => handleReject(appointment)}
                          >
                            <AppIcon
                              name={{
                                ios: "xmark",
                                android: "close",
                                web: "close",
                              }}
                              size={18}
                              color={COLORS.danger}
                            />

                            <Text style={styles.rejectButtonText}>
                              {processing ? "Procesando..." : "Rechazar"}
                            </Text>
                          </Pressable>
                        </View>
                      </>
                    )}

                    {appointment.status ===
                      "ACCEPTED" && (
                      <View
                        style={
                          styles.acceptedActionsSection
                        }
                      >
                        <Text
                          style={
                            styles.acceptedActionsTitle
                          }
                        >
                          Gestión de la cita
                        </Text>

                        {canComplete ? (
                          <Pressable
                            style={[
                              styles.completeButton,
                              Platform.OS === "web" &&
                                styles.webManagementButton,
                              actionsDisabled && styles.disabledButton,
                            ]}
                            disabled={actionsDisabled}
                            accessibilityRole="button"
                            accessibilityLabel="Marcar cita como completada"
                            accessibilityState={{
                              disabled: actionsDisabled,
                              busy: processing,
                            }}
                            onPress={() =>
                              handleComplete(appointment)
                            }
                          >
                            <AppIcon
                              name={{
                                ios: "checkmark.circle.fill",
                                android: "task_alt",
                                web: "task_alt",
                              }}
                              size={18}
                              color={COLORS.onPrimary}
                            />

                            <Text style={styles.completeButtonText}>
                              {processing
                                ? "Procesando..."
                                : "Marcar como completada"}
                            </Text>
                          </Pressable>
                        ) : (
                          <Text style={styles.actionAvailabilityHint}>
                            Podrás completar esta cita después de la hora programada.
                          </Text>
                        )}

                        {canAdminCancel && (
                          <>
                            <Text style={styles.adminCancelHint}>
                              Si surge una situación de fuerza mayor antes de la cita, puedes cancelarla y liberar el horario.
                            </Text>

                            <Pressable
                              style={[
                                styles.adminCancelButton,
                                Platform.OS === "web" &&
                                  styles.webManagementButton,
                                actionsDisabled && styles.disabledButton,
                              ]}
                              disabled={actionsDisabled}
                              accessibilityRole="button"
                              accessibilityLabel="Cancelar cita administrativamente"
                              accessibilityState={{
                                disabled: actionsDisabled,
                                busy: processing,
                              }}
                              onPress={() =>
                                confirmAdminCancel(appointment)
                              }
                            >
                              <AppIcon
                                name={{
                                  ios: "xmark.circle",
                                  android: "event_busy",
                                  web: "event_busy",
                                }}
                                size={18}
                                color={COLORS.danger}
                              />

                              <Text style={styles.adminCancelButtonText}>
                                {processing
                                  ? "Procesando..."
                                  : "Cancelar cita"}
                              </Text>
                            </Pressable>
                          </>
                        )}
                      </View>
                    )}
                  </View>
                  </Fragment>
                );
              }
            )
          )}
        </>
      )}

      {pagination?.hasMore && !displayingPreviousData ? (
        <Pressable
          style={({ pressed }) => [
            styles.loadMoreButton,
            pressed && styles.buttonPressed,
            networkBusy && styles.disabledButton,
          ]}
          onPress={() =>
            void loadAppointments(
              "silent",
              pagination.page + 1,
              true
            )
          }
          disabled={networkBusy}
          accessibilityRole="button"
          accessibilityLabel="Cargar más citas"
          accessibilityState={{
            disabled: networkBusy,
            busy: loadingMore,
          }}
        >
          {loadingMore ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
            />
          ) : null}
          <Text style={styles.loadMoreButtonText}>
            {loadingMore ? "Cargando…" : "Cargar más"}
          </Text>
        </Pressable>
      ) : null}

      <BackButton fallbackHref="/admin" />
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,
      backgroundColor:
        COLORS.background,
      paddingHorizontal:
        SPACING.lg,
      paddingTop:
        SPACING.xl,
      paddingBottom:
        SPACING.xxl,
    },

    loadMoreButton: {
      minHeight: 48,
      width: "100%",
      maxWidth: 460,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.sm,
      marginTop: SPACING.lg,
      paddingHorizontal: SPACING.md,
      borderWidth: 1,
      borderColor: COLORS.borderStrong,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.surface,
    },

    loadMoreButtonText: {
      color: COLORS.text,
      fontSize: FONT.body,
      fontWeight: "800",
    },

    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor:
        COLORS.background,
    },

    loadingText: {
      marginTop:
        SPACING.sm,
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
    },

    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.md,
      marginBottom:
        SPACING.xl,
    },

    headerContent: {
      flex: 1,
    },

    headerAccent: {
      width: 42,
      height: 3,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.accent,
      marginBottom: SPACING.md,
    },

    eyebrow: {
      fontSize:
        FONT.caption,
      fontWeight: "700",
      letterSpacing: 1.2,
      color:
        COLORS.textSecondary,
      marginBottom:
        SPACING.xs,
    },

    title: {
      fontSize: FONT.title,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "800",
      color: COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    subtitle: {
      fontSize: FONT.body,
      lineHeight: 24,
      color:
        COLORS.textSecondary,
    },

    summaryCard: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      backgroundColor:
        COLORS.primarySoft,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.lg,
      marginBottom:
        SPACING.xl,
    },

    summaryContent: {
      flex: 1,
      paddingRight: SPACING.md,
    },

    summaryLabel: {
      fontSize:
        FONT.caption,
      fontWeight: "800",
      letterSpacing: 0.9,
      color:
        COLORS.primary,
      marginBottom: SPACING.xs,
    },

    summaryTitle: {
      fontSize: FONT.heading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "800",
      color: COLORS.text,
      marginBottom: SPACING.xs,
    },

    summaryHint: {
      fontSize:
        FONT.small,
      lineHeight: 20,
      color:
        COLORS.textMuted,
    },

    summaryIcon: {
      width: 48,
      height: 48,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.surface,
      justifyContent: "center",
      alignItems: "center",
    },

    dataStatusRow: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.md,
      marginTop: -SPACING.md,
      marginBottom: SPACING.lg,
    },

    updatedText: {
      flex: 1,
      color: COLORS.textMuted,
      fontSize: FONT.caption,
    },

    refreshButton: {
      width: 44,
      height: 44,
      borderRadius: RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    buttonPressed: {
      opacity: 0.65,
    },

    noticeCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.sm,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
      borderWidth: 1,
    },

    successNotice: {
      backgroundColor: COLORS.successBackground,
      borderColor: "#B9DEC9",
    },

    errorNotice: {
      backgroundColor: COLORS.dangerBackground,
      borderColor: "#F0C7C2",
    },

    warningNotice: {
      backgroundColor: COLORS.warningBackground,
      borderColor: COLORS.accentSoft,
    },

    noticeContent: {
      flex: 1,
      minWidth: 0,
    },

    noticeTitle: {
      color: COLORS.text,
      fontSize: FONT.small,
      fontWeight: "800",
      marginBottom: 3,
    },

    noticeText: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      lineHeight: 18,
    },

    noticeAction: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: SPACING.sm,
    },

    noticeActionText: {
      color: COLORS.primary,
      fontSize: FONT.small,
      fontWeight: "800",
    },

    noticeDismiss: {
      width: 44,
      height: 44,
      marginTop: -SPACING.sm,
      marginRight: -SPACING.sm,
      alignItems: "center",
      justifyContent: "center",
    },

    whatsAppCard: {
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: "#B9DEC9",
      borderRadius: RADIUS.xl,
      padding: SPACING.lg,
      marginBottom: SPACING.xl,
    },

    whatsAppHeading: {
      flexDirection: "row",
      alignItems: "center",
    },

    whatsAppIcon: {
      width: 42,
      height: 42,
      borderRadius: RADIUS.pill,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.successBackground,
      marginRight: SPACING.sm,
    },

    whatsAppHeadingContent: {
      flex: 1,
      minWidth: 0,
    },

    whatsAppTitle: {
      color: COLORS.text,
      fontSize: FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "800",
    },

    whatsAppHint: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      lineHeight: 18,
      marginTop: 3,
    },

    whatsAppPreview: {
      color: COLORS.text,
      fontSize: FONT.small,
      lineHeight: 21,
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginTop: SPACING.md,
    },

    whatsAppActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },

    whatsAppPrimaryButton: {
      minHeight: 44,
      justifyContent: "center",
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primary,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },

    whatsAppPrimaryText: {
      color: COLORS.onPrimary,
      fontSize: FONT.small,
      fontWeight: "800",
    },

    whatsAppSecondaryButton: {
      minHeight: 44,
      justifyContent: "center",
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: COLORS.primary,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
    },

    whatsAppSecondaryText: {
      color: COLORS.primary,
      fontSize: FONT.small,
      fontWeight: "800",
    },

    whatsAppSkipButton: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: SPACING.sm,
    },

    whatsAppSkipText: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      fontWeight: "700",
    },

    searchSection: {
      marginBottom: SPACING.lg,
    },

    searchLabel: {
      color: COLORS.text,
      fontSize: FONT.subheading,
      fontWeight: "700",
      marginBottom: SPACING.sm,
    },

    searchInputRow: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.borderStrong,
      borderRadius: RADIUS.pill,
      paddingLeft: SPACING.md,
      paddingRight: SPACING.xs,
    },

    searchInput: {
      flex: 1,
      minWidth: 0,
      color: COLORS.text,
      fontSize: FONT.body,
      paddingVertical: SPACING.sm,
    },

    clearSearchButton: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.pill,
    },

    filterLabel: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.md,
    },

    filterScroll: {
      flexGrow: 0,
      flexShrink: 0,
      height: 44,
      marginBottom: SPACING.sm,
    },

    filterContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
      paddingRight: SPACING.lg,
    },

    filterButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.pill,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 9,
    },

    activeFilterButton: {
      backgroundColor:
        COLORS.primary,
      borderColor:
        COLORS.primary,
    },

    filterButtonText: {
      color:
        COLORS.textSecondary,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    activeFilterButtonText: {
      color: COLORS.onPrimary,
    },

    filterCountBadge: {
      minWidth: 24,
      height: 24,
      paddingHorizontal: SPACING.xs,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
    },

    activeFilterCountBadge: {
      backgroundColor: "rgba(255, 255, 255, 0.2)",
    },

    filterCountText: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      fontWeight: "800",
    },

    activeFilterCountText: {
      color: COLORS.onPrimary,
    },

    resultsHeading: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: SPACING.md,
      marginBottom: SPACING.md,
    },

    sectionTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color: COLORS.text,
      flex: 1,
      minWidth: 0,
    },

    resultsCount: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
    },

    dayHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: SPACING.lg,
      marginBottom: SPACING.sm,
      paddingBottom: SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.accentSoft,
    },

    dayHeaderText: {
      color: COLORS.text,
      fontSize: FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "800",
    },

    dayHeaderCount: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      fontWeight: "600",
    },

    expandedDetails: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.md,
      paddingTop: SPACING.md,
      borderTopWidth: 1,
      borderTopColor: COLORS.border,
    },

    detailIcon: {
      width: 36,
      height: 36,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    detailContent: {
      flex: 1,
      minWidth: 0,
    },

    detailLabel: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      fontWeight: "700",
      marginBottom: SPACING.xs,
    },

    detailsButton: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      minHeight: 44,
      gap: SPACING.xs,
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.md,
      paddingVertical: 9,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
    },

    detailsButtonText: {
      color: COLORS.text,
      fontSize: FONT.small,
      fontWeight: "700",
    },

    card: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.lg,
      marginBottom:
        SPACING.md,
    },

    operationalCard: {
      borderColor: COLORS.accentSoft,
    },

    cardTopRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      gap: SPACING.md,
    },

    clientInfo: {
      flexDirection: "row",
      alignItems: "center",
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 180,
      minWidth: 0,
    },

    avatar: {
      width: 44,
      height: 44,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.primarySoft,
      justifyContent: "center",
      alignItems: "center",
      marginRight:
        SPACING.sm,
    },

    avatarText: {
      fontSize:
        FONT.body,
      fontWeight: "800",
      color: COLORS.text,
    },

    clientTextBlock: {
      flex: 1,
      minWidth: 0,
    },

    clientName: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom: 3,
    },

    requestAge: {
      color: COLORS.textMuted,
      fontSize: FONT.caption,
      lineHeight: 18,
    },

    phone: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
    },

    phoneActions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.xs,
      marginTop: SPACING.sm,
    },

    phoneAction: {
      minHeight: 44,
      justifyContent: "center",
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      paddingHorizontal: SPACING.md,
    },

    phoneActionText: {
      color: COLORS.primary,
      fontSize: FONT.caption,
      fontWeight: "800",
    },

    statusBadge: {
      flexShrink: 0,
      marginLeft: "auto",
      borderRadius:
        RADIUS.pill,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 7,
    },

    statusText: {
      fontSize:
        FONT.caption,
      fontWeight: "700",
    },

    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: SPACING.lg,
      marginBottom: SPACING.md,
    },

    serviceIcon: {
      width: 42,
      height: 42,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    serviceContent: {
      flex: 1,
      minWidth: 0,
    },

    serviceLabel: {
      fontSize:
        FONT.caption,
      fontWeight: "700",
      letterSpacing: 0.8,
      color:
        COLORS.textMuted,
      marginBottom: 4,
    },

    service: {
      fontSize:
        FONT.subheading,
      fontWeight: "700",
      color: COLORS.text,
    },

    infoRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.lg,
    },

    attendanceBadgeRow: {
      marginTop: SPACING.sm,
    },

    infoBlock: {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 130,
      minWidth: 0,
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
    },

    infoLabel: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textSecondary,
      marginTop: SPACING.sm,
      marginBottom: 5,
    },

    infoValue: {
      fontSize:
        FONT.small,
      lineHeight: 20,
      fontWeight: "700",
      color: COLORS.text,
    },

    actionsContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginTop:
        SPACING.lg,
    },

    expiredRequest: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.sm,
      backgroundColor: COLORS.dangerBackground,
      borderRadius: RADIUS.md,
      padding: SPACING.md,
      marginTop: SPACING.lg,
    },

    expiredRequestContent: {
      flex: 1,
      minWidth: 0,
    },

    expiredRequestTitle: {
      color: COLORS.danger,
      fontSize: FONT.small,
      fontWeight: "800",
    },

    expiredRequestText: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      lineHeight: 18,
      marginTop: 3,
    },

    expiredRejectButton: {
      flexGrow: 0,
      flexBasis: "auto",
      minWidth: 150,
    },

    webActionsContainer: {
      justifyContent: "center",
      gap: SPACING.xl,
    },

    acceptButton: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 14,
      alignItems: "center",
    },

    acceptButtonText: {
      color: COLORS.onPrimary,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    rejectButton: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.danger,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 14,
      alignItems: "center",
    },

    rejectButtonText: {
      color:
        COLORS.danger,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    webRequestButton: {
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: "auto",
      minWidth: 110,
      minHeight: 44,
      justifyContent: "center",
      borderRadius:
        RADIUS.pill,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 9,
    },

    loadingCard: {
      minHeight: 180,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.lg,
      padding: SPACING.xl,
    },

    acceptedActionsSection: {
      marginTop:
        SPACING.lg,
      padding: SPACING.md,
      borderRadius: RADIUS.lg,
      backgroundColor: COLORS.primarySoft,
    },

    acceptedActionsTitle: {
      fontSize:
        FONT.small,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    completeButton: {
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom:
        SPACING.md,
    },

    completeButtonText: {
      color: COLORS.onPrimary,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    actionAvailabilityHint: {
      marginBottom: SPACING.md,
      padding: SPACING.md,
      borderRadius: RADIUS.md,
      backgroundColor: COLORS.primarySoft,
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      lineHeight: 20,
      fontWeight: "600",
      textAlign: "center",
    },

    adminCancelHint: {
      fontSize:
        FONT.caption,
      lineHeight: 18,
      color:
        COLORS.textSecondary,
      marginBottom:
        SPACING.sm,
    },

    adminCancelButton: {
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.danger,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 13,
      alignItems: "center",
    },

    adminCancelButtonText: {
      color:
        COLORS.danger,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    webManagementButton: {
      width: 220,
      maxWidth: "100%",
      alignSelf: "flex-start",
      paddingHorizontal:
        SPACING.md,
    },

    disabledButton: {
      opacity: 0.5,
    },

    messageCard: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.lg,
    },

    messageTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    messageText: {
      fontSize:
        FONT.small,
      lineHeight: 20,
      color:
        COLORS.textSecondary,
    },

    retryButton: {
      backgroundColor:
        COLORS.primary,
      borderRadius:
        RADIUS.pill,
      paddingVertical: 14,
      alignItems: "center",
      marginTop:
        SPACING.lg,
    },

    retryButtonText: {
      color: COLORS.onPrimary,
      fontSize:
        FONT.small,
      fontWeight: "700",
    },

    emptyCard: {
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.border,
      borderRadius:
        RADIUS.xl,
      padding:
        SPACING.xl,
      alignItems: "center",
    },

    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius:
        RADIUS.pill,
      backgroundColor:
        COLORS.successBackground,
      justifyContent: "center",
      alignItems: "center",
      marginBottom:
        SPACING.md,
    },

    emptyTitle: {
      fontSize:
        FONT.heading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color: COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    emptyText: {
      fontSize:
        FONT.body,
      lineHeight: 23,
      color:
        COLORS.textSecondary,
      textAlign: "center",
    },
  });
