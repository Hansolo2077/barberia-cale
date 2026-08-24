import { useFocusEffect, useRouter } from "expo-router";
import {
    Fragment,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
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
import {
    addDaysToIso,
    getBusinessTodayIso,
    isValidIsoDate,
} from "../../utils/business-date";

import DateTimePicker from "@react-native-community/datetimepicker";

import {
    AdminAppointment,
    AppointmentStatusCounts,
    getAdminSchedule,
} from "../../api/admin.api";
import type { Pagination } from "../../api/appointments.api";
import { ApiError } from "../../api/api-client";

import BackButton from "../../components/BackButton";
import AppIcon from "../../components/AppIcon";
import WebDateInput from "../../components/WebDateInput";

import {
    COLORS,
    FONT,
    FONT_FAMILY,
    RADIUS,
    SPACING,
} from "../../constants/app-theme";

import { useAuth } from "../../context/AuthContext";

type StatusFilter =
  | "PENDING"
  | "ACCEPTED"
  | "COMPLETED"
  | "CANCELLED"
  | "REJECTED";

const MAX_RANGE_DAYS = 93;
const SCHEDULE_PAGE_SIZE = 50;

type ScheduleQuery = {
  status: StatusFilter;
  search: string;
};

type ScheduleLoadMode =
  | "initial"
  | "query"
  | "refresh"
  | "silent"
  | "loadMore";

type ScheduleRequest = ScheduleQuery & {
  startDate: string;
  endDate: string;
  page: number;
  mode: ScheduleLoadMode;
  preservePages: boolean;
};

function parseValidDate(dateText: string) {
  if (!isValidIsoDate(dateText)) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function validateDateRange(startDateText: string, endDateText: string) {
  const startDate = parseValidDate(startDateText);
  const endDate = parseValidDate(endDateText);

  if (!startDate || !endDate) {
    return "Elige fechas reales en formato AAAA-MM-DD.";
  }

  if (startDate.getTime() > endDate.getTime()) {
    return "La fecha inicial no puede ser posterior a la fecha final.";
  }

  const inclusiveDays =
    Math.floor(
      (Date.UTC(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      ) -
        Date.UTC(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate()
        )) /
        86_400_000
    ) + 1;

  if (inclusiveDays > MAX_RANGE_DAYS) {
    return `Consulta un máximo de ${MAX_RANGE_DAYS} días por vez.`;
  }

  return "";
}

function formatDate(date: Date) {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AdminScheduleScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);
  const hasLoadedRef = useRef(false);

  const initialDateText = getBusinessTodayIso();

  const initialStartDate =
    parseValidDate(initialDateText) ?? new Date();

  const initialEndDate =
    initialStartDate;

  const [
    selectedStartDate,
    setSelectedStartDate,
  ] = useState(initialStartDate);

  const [
    selectedEndDate,
    setSelectedEndDate,
  ] = useState(initialEndDate);

  const [
    startDateText,
    setStartDateText,
  ] = useState(
    initialDateText
  );

  const [
    endDateText,
    setEndDateText,
  ] = useState(
    initialDateText
  );

  const [
    appliedStartDateText,
    setAppliedStartDateText,
  ] = useState(
    initialDateText
  );

  const [
    appliedEndDateText,
    setAppliedEndDateText,
  ] = useState(
    initialDateText
  );

  const [
    showStartPicker,
    setShowStartPicker,
  ] = useState(false);

  const [
    showEndPicker,
    setShowEndPicker,
  ] = useState(false);

  const [
    appointments,
    setAppointments,
  ] =
    useState<AdminAppointment[]>([]);

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("PENDING");

  const [showCustomRange, setShowCustomRange] =
    useState(false);

  const [activePreset, setActivePreset] =
    useState<"TODAY" | "TOMORROW" | "WEEK" | "CUSTOM">("TODAY");

  const [expandedAppointmentId, setExpandedAppointmentId] =
    useState<number | null>(null);

  const [shouldScrollResults, setShouldScrollResults] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [hasLoaded, setHasLoaded] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(() => Date.now());

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [syncWarning, setSyncWarning] =
    useState("");

  const [rangeError, setRangeError] =
    useState("");

  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [appliedSearchQuery, setAppliedSearchQuery] =
    useState("");

  const [statusCounts, setStatusCounts] =
    useState<AppointmentStatusCounts>({});

  const [pagination, setPagination] =
    useState<Pagination | null>(null);

  const [loadingMore, setLoadingMore] =
    useState(false);

  const [contactNotice, setContactNotice] =
    useState("");

  const appliedRangeRef = useRef({
    startDate: initialDateText,
    endDate: initialDateText,
  });

  const appliedQueryRef = useRef<ScheduleQuery>({
    status: "PENDING",
    search: "",
  });

  const desiredQueryRef = useRef<ScheduleQuery>({
    status: "PENDING",
    search: "",
  });

  const desiredRequestRef = useRef<ScheduleRequest>({
    startDate: initialDateText,
    endDate: initialDateText,
    status: "PENDING",
    search: "",
    page: 1,
    mode: "initial",
    preservePages: false,
  });

  const loadedPageRef = useRef(1);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30_000);

    return () => clearInterval(timer);
  }, []);

  const loadSchedule = useCallback(
    async (
      startDate: string,
      endDate: string,
      mode: ScheduleLoadMode = "query",
      options?: {
        page?: number;
        query?: ScheduleQuery;
        preservePages?: boolean;
      }
    ) => {
      if (!token) {
        return false;
      }

      const validationMessage = validateDateRange(startDate, endDate);

      if (validationMessage) {
        setRangeError(validationMessage);
        return false;
      }

      const page = options?.page ?? 1;
      const query = options?.query ?? appliedQueryRef.current;
      const normalizedQuery: ScheduleQuery = {
        status: query.status,
        search: query.search.trim(),
      };
      const sameAppliedRequest =
        hasLoadedRef.current &&
        startDate === appliedRangeRef.current.startDate &&
        endDate === appliedRangeRef.current.endDate &&
        normalizedQuery.status === appliedQueryRef.current.status &&
        normalizedQuery.search === appliedQueryRef.current.search;
      const preservePages =
        options?.preservePages ??
        (mode === "silent" && page === 1 && sameAppliedRequest);
      const pagesToPreserve = preservePages
        ? loadedPageRef.current
        : 1;
      const requestSequence = ++requestSequenceRef.current;

      desiredQueryRef.current = normalizedQuery;

      desiredRequestRef.current = {
        startDate,
        endDate,
        ...normalizedQuery,
        page,
        mode,
        preservePages,
      };

      try {
        if (mode === "initial") {
          setLoading(true);
        }

        if (mode === "query" || mode === "refresh") {
          setRefreshing(true);
        }

        if (mode === "loadMore") {
          setLoadingMore(true);
        }

        setRangeError("");
        setError("");
        setSyncWarning("");

        const firstResult = await getAdminSchedule(
          token,
          startDate,
          endDate,
          {
            page,
            pageSize: SCHEDULE_PAGE_SIZE,
            status: normalizedQuery.status,
            search: normalizedQuery.search,
          }
        );

        const lastPageToPreserve =
          mode !== "loadMore" && page === 1
            ? Math.min(pagesToPreserve, firstResult.pagination.totalPages)
            : page;

        const additionalResults =
          mode !== "loadMore" &&
          page === 1 &&
          lastPageToPreserve > 1
            ? await Promise.all(
                Array.from(
                  { length: lastPageToPreserve - 1 },
                  (_, index) =>
                    getAdminSchedule(token, startDate, endDate, {
                      page: index + 2,
                      pageSize: SCHEDULE_PAGE_SIZE,
                      status: normalizedQuery.status,
                      search: normalizedQuery.search,
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

        if (mode === "loadMore") {
          setAppointments((currentAppointments) => {
            const knownIds = new Set(
              currentAppointments.map((appointment) => appointment.id)
            );

            return [
              ...currentAppointments,
              ...resultAppointments.filter(
                (appointment) => !knownIds.has(appointment.id)
              ),
            ];
          });
        } else {
          setAppointments(resultAppointments);
        }

        setStatusCounts(firstResult.statusCounts ?? {});
        setPagination(resultPagination);
        loadedPageRef.current = resultPagination.page;
        setStatusFilter(normalizedQuery.status);
        setAppliedSearchQuery(normalizedQuery.search);
        appliedQueryRef.current = normalizedQuery;
        setAppliedStartDateText(startDate);
        setAppliedEndDateText(endDate);
        appliedRangeRef.current = { startDate, endDate };
        setLastUpdated(new Date());
        hasLoadedRef.current = true;
        setHasLoaded(true);
        return true;
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "No se pudo cargar la agenda.";

        if (requestSequence !== requestSequenceRef.current) {
          return false;
        }

        if (
          loadError instanceof ApiError &&
          loadError.code === "UNAUTHORIZED"
        ) {
          return false;
        }

        if (mode === "loadMore") {
          setSyncWarning(
            `No se pudieron cargar más registros. ${message}`
          );
        } else if (hasLoadedRef.current) {
          setSyncWarning(
            `Mostramos los últimos datos disponibles. ${message}`
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
        }
      }
    },
    [token]
  );

  useFocusEffect(
    useCallback(() => {
      const appliedRange = appliedRangeRef.current;
      void loadSchedule(
        appliedRange.startDate,
        appliedRange.endDate,
        hasLoadedRef.current ? "silent" : "initial"
      );
    }, [loadSchedule])
  );

  useEffect(() => {
    if (!hasLoadedRef.current) {
      return;
    }

    const normalizedSearch = searchQuery.trim();

    if (normalizedSearch === appliedSearchQuery) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const appliedRange = appliedRangeRef.current;

      void loadSchedule(
        appliedRange.startDate,
        appliedRange.endDate,
        "query",
        {
          page: 1,
          query: {
            status: desiredQueryRef.current.status,
            search: normalizedSearch,
          },
        }
      );
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [appliedSearchQuery, loadSchedule, searchQuery]);

  async function selectStatusFilter(filter: StatusFilter) {
    const desiredSearch = searchQuery.trim();
    const alreadyDesired =
      filter === desiredQueryRef.current.status &&
      desiredSearch === desiredQueryRef.current.search;

    if (alreadyDesired || loading || refreshing || loadingMore) {
      return;
    }

    const appliedRange = appliedRangeRef.current;
    setExpandedAppointmentId(null);

    await loadSchedule(
      appliedRange.startDate,
      appliedRange.endDate,
      "query",
      {
        page: 1,
        query: {
          status: filter,
          search: desiredSearch,
        },
      }
    );
  }

  function retryLastRequest() {
    const request = desiredRequestRef.current;
    const retryMode: ScheduleLoadMode =
      request.mode === "loadMore" ? "loadMore" : "refresh";

    void loadSchedule(
      request.startDate,
      request.endDate,
      retryMode,
      {
        page: request.page,
        query: {
          status: request.status,
          search: request.search,
        },
        preservePages: request.preservePages,
      }
    );
  }

  function loadMoreAppointments() {
    if (
      !pagination?.hasMore ||
      loading ||
      refreshing ||
      loadingMore
    ) {
      return;
    }

    const appliedRange = appliedRangeRef.current;

    void loadSchedule(
      appliedRange.startDate,
      appliedRange.endDate,
      "loadMore",
      {
        page: pagination.page + 1,
        query: appliedQueryRef.current,
      }
    );
  }

  async function selectPreset(
    preset: "TODAY" | "TOMORROW" | "WEEK"
  ) {
    const todayText = getBusinessTodayIso();
    const formattedStart =
      preset === "TOMORROW"
        ? addDaysToIso(todayText, 1)
        : todayText;
    const formattedEnd =
      preset === "WEEK"
        ? addDaysToIso(todayText, 6)
        : formattedStart;
    const start = parseValidDate(formattedStart) ?? new Date();
    const end = parseValidDate(formattedEnd) ?? start;

    setShowCustomRange(false);
    setSelectedStartDate(start);
    setSelectedEndDate(end);
    setStartDateText(formattedStart);
    setEndDateText(formattedEnd);
    setExpandedAppointmentId(null);
    setShouldScrollResults(true);
    const loaded = await loadSchedule(
      formattedStart,
      formattedEnd,
      "query"
    );

    if (loaded) {
      setActivePreset(preset);
    }
  }

  async function consultCustomRange() {
    setExpandedAppointmentId(null);
    setShouldScrollResults(true);
    const loaded = await loadSchedule(
      startDateText,
      endDateText,
      "query"
    );

    if (loaded) {
      setActivePreset("CUSTOM");
    }
  }

  function handleResultsLayout(y: number) {
    if (!shouldScrollResults || loading || refreshing) {
      return;
    }

    setShouldScrollResults(false);
    scrollViewRef.current?.scrollTo({
      y: Math.max(y - SPACING.md, 0),
      animated: true,
    });
  }

  function handleStartDateChange(
    event: any,
    date?: Date
  ) {
    setShowStartPicker(false);

    if (!date) {
      return;
    }

    setSelectedStartDate(date);
    setRangeError("");

    const formattedDate =
      formatDate(date);

    setStartDateText(
      formattedDate
    );

    /*
     * Si la nueva fecha inicial queda
     * después de la fecha final,
     * ajustamos también la fecha final.
     */
    if (
      formattedDate >
      endDateText
    ) {
      setSelectedEndDate(date);
      setEndDateText(
        formattedDate
      );
    }
  }

  function handleEndDateChange(
    event: any,
    date?: Date
  ) {
    setShowEndPicker(false);

    if (!date) {
      return;
    }

    setSelectedEndDate(date);
    setRangeError("");

    setEndDateText(
      formatDate(date)
    );
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
      case "PENDING":
        return {
          background:
            COLORS.warningBackground,
          text:
            "#7A4C00",
        };

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
    {
      value: "COMPLETED",
      label: "Completadas",
    },
    {
      value: "CANCELLED",
      label: "Canceladas",
    },
    {
      value: "REJECTED",
      label: "Rechazadas",
    },
  ];

  const normalizedQuery = appliedSearchQuery
    .trim()
    .toLocaleLowerCase("es-NI");

  const filteredAppointments = appointments
    .filter(
      (appointment) => appointment.status === statusFilter
    )
    .filter((appointment) => {
      if (!normalizedQuery) {
        return true;
      }

      return [
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
        .toLocaleLowerCase("es-NI")
        .includes(normalizedQuery);
    });

  const dayAppointmentCounts =
    filteredAppointments.reduce<Record<string, number>>(
      (counts, appointment) => {
        counts[appointment.date] =
          (counts[appointment.date] ?? 0) + 1;

        return counts;
      },
      {}
    );

  const pendingCount = statusCounts.PENDING ?? 0;

  const acceptedCount = statusCounts.ACCEPTED ?? 0;

  const totalRecordCount = Object.values(statusCounts).reduce(
    (total, count) => total + (count ?? 0),
    0
  );

  const activeCount = pendingCount + acceptedCount;

  const isBusy = loading || refreshing || loadingMore;

  const draftRangeChanged =
    startDateText !== appliedStartDateText ||
    endDateText !== appliedEndDateText;

  const draftSearchChanged =
    searchQuery.trim() !== appliedSearchQuery;

  const updatedLabel = lastUpdated
    ? `Actualizado a las ${lastUpdated.toLocaleTimeString("es-NI", {
        hour: "numeric",
        minute: "2-digit",
      })}`
    : "Aún no se ha actualizado";

  function getRequestAge(createdAt: string) {
    const createdTimestamp = new Date(createdAt).getTime();

    if (!Number.isFinite(createdTimestamp)) {
      return "Fecha de solicitud no disponible";
    }

    const hours = Math.max(
      0,
      Math.floor((currentTime - createdTimestamp) / 3_600_000)
    );

    if (hours < 1) {
      return "Solicitada hace menos de una hora";
    }

    if (hours < 24) {
      return `Solicitada hace ${hours} ${hours === 1 ? "hora" : "horas"}`;
    }

    const days = Math.floor(hours / 24);
    return `Solicitada hace ${days} ${days === 1 ? "día" : "días"}`;
  }

  function getEmptyMessage() {
    if (normalizedQuery) {
      return "No encontramos registros que coincidan con la búsqueda, el período y el estado.";
    }

    return `No existen citas ${getStatusText(statusFilter).toLowerCase()}s en el período consultado.`;
  }

  async function shareOrCopyPhone(phone: string) {
    try {
      if (
        Platform.OS === "web" &&
        typeof navigator !== "undefined" &&
        navigator.clipboard
      ) {
        await navigator.clipboard.writeText(phone);
        setContactNotice("Número copiado al portapapeles.");
        return;
      }

      await Share.share({ message: phone });
    } catch {
      setContactNotice(`No se pudo copiar. Número: ${phone}`);
    }
  }

  async function callClient(phone: string) {
    try {
      await Linking.openURL(`tel:${phone.replace(/\s/g, "")}`);
    } catch {
      setContactNotice(`No se pudo iniciar la llamada. Marca ${phone}.`);
    }
  }

  function openAppointmentInManagement(appointment: AdminAppointment) {
    if (
      appointment.status !== "PENDING" &&
      appointment.status !== "ACCEPTED"
    ) {
      return;
    }

    router.push({
      pathname: "/admin/appointments",
      params: {
        query: `#${appointment.id}`,
        status: appointment.status,
      },
    });
  }

  function getFilterCount(filter: StatusFilter) {
    return statusCounts[filter] ?? 0;
  }

  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={
        styles.container
      }
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            const appliedRange = appliedRangeRef.current;
            void loadSchedule(
              appliedRange.startDate,
              appliedRange.endDate,
              "refresh"
            );
          }}
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
            CALENDARIO
          </Text>

          <Text style={styles.title}>
            Agenda
          </Text>

          <Text style={styles.subtitle}>
            Consulta las citas dentro de
            un rango de fechas y filtra
            los resultados por estado.
          </Text>
        </View>

        <BackButton
          iconOnly
          fallbackHref="/admin"
        />
      </View>

      <View
        style={
          styles.dateSection
        }
      >
        <View style={styles.sectionHeading}>
          <View style={styles.sectionIcon}>
            <AppIcon
              name={{
                ios: "calendar",
                android: "calendar_month",
                web: "calendar_month",
              }}
              size={20}
              color={COLORS.primary}
            />
          </View>

          <View style={styles.sectionHeadingContent}>
            <Text style={styles.sectionTitle}>
              Elige el período
            </Text>

            <Text style={styles.sectionHint}>
              Consulta rápidamente hoy, mañana o los próximos siete días.
            </Text>
          </View>
        </View>

        <View style={styles.presetContainer}>
          {[
            { value: "TODAY" as const, label: "Hoy" },
            { value: "TOMORROW" as const, label: "Mañana" },
            { value: "WEEK" as const, label: "7 días" },
          ].map((preset) => {
            const active = activePreset === preset.value;

            return (
              <Pressable
                key={preset.value}
                style={[
                  styles.presetButton,
                  active && styles.activePresetButton,
                ]}
                disabled={isBusy}
                accessibilityRole="button"
                accessibilityLabel={`Consultar agenda de ${preset.label.toLowerCase()}`}
                accessibilityState={{
                  selected: active,
                  disabled: isBusy,
                }}
                onPress={() => void selectPreset(preset.value)}
              >
                <Text
                  style={[
                    styles.presetButtonText,
                    active && styles.activePresetButtonText,
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.customRangeToggle,
            isBusy && styles.disabledButton,
          ]}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityState={{
            expanded: showCustomRange,
            disabled: isBusy,
          }}
          onPress={() => {
            setShowCustomRange((current) => !current);
          }}
        >
          <AppIcon
            name={{
              ios: showCustomRange ? "chevron.up" : "chevron.down",
              android: showCustomRange ? "expand_less" : "expand_more",
              web: showCustomRange ? "expand_less" : "expand_more",
            }}
            size={18}
            color={COLORS.primary}
          />

          <Text style={styles.customRangeToggleText}>
            {showCustomRange
              ? "Ocultar rango personalizado"
              : "Elegir un rango personalizado"}
          </Text>
        </Pressable>

        {showCustomRange && (
          <View style={styles.customRangeContent}>

        <Text style={styles.label}>
          Fecha inicial
        </Text>

        {Platform.OS ===
        "web" ? (
          <>
            <WebDateInput
              label="Fecha inicial"
              value={startDateText}
              disabled={isBusy}
              hasError={Boolean(rangeError)}
              describedBy={rangeError ? "schedule-range-error" : undefined}
              onChange={(value) => {
                setStartDateText(value);
                setRangeError("");
              }}
            />

            <Text
              style={
                styles.helperText
              }
            >
              Elige una fecha o usa el formato AAAA-MM-DD.
            </Text>
          </>
        ) : (
          <>
            <Pressable
              style={[
                styles.dateButton,
                isBusy && styles.disabledButton,
              ]}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={`Elegir fecha inicial, ${formatDisplayDate(startDateText)}`}
              accessibilityState={{ disabled: isBusy }}
              onPress={() =>
                setShowStartPicker(
                  true
                )
              }
            >
              <Text
                style={
                  styles.dateButtonText
                }
              >
                {formatDisplayDate(startDateText)}
              </Text>
            </Pressable>

            {showStartPicker && (
              <DateTimePicker
                value={
                  selectedStartDate
                }
                mode="date"
                display="default"
                onChange={
                  handleStartDateChange
                }
              />
            )}
          </>
        )}

        <Text
          style={[
            styles.label,
            styles.endDateLabel,
          ]}
        >
          Fecha final
        </Text>

        {Platform.OS ===
        "web" ? (
          <>
            <WebDateInput
              label="Fecha final"
              value={endDateText}
              minimumDate={startDateText || undefined}
              disabled={isBusy}
              hasError={Boolean(rangeError)}
              describedBy={rangeError ? "schedule-range-error" : undefined}
              onChange={(value) => {
                setEndDateText(value);
                setRangeError("");
              }}
            />

            <Text
              style={
                styles.helperText
              }
            >
              Elige una fecha o usa el formato AAAA-MM-DD.
            </Text>
          </>
        ) : (
          <>
            <Pressable
              style={[
                styles.dateButton,
                isBusy && styles.disabledButton,
              ]}
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={`Elegir fecha final, ${formatDisplayDate(endDateText)}`}
              accessibilityState={{ disabled: isBusy }}
              onPress={() =>
                setShowEndPicker(
                  true
                )
              }
            >
              <Text
                style={
                  styles.dateButtonText
                }
              >
                {formatDisplayDate(endDateText)}
              </Text>
            </Pressable>

            {showEndPicker && (
              <DateTimePicker
                value={
                  selectedEndDate
                }
                mode="date"
                display="default"
                minimumDate={
                  selectedStartDate
                }
                onChange={
                  handleEndDateChange
                }
              />
            )}
          </>
        )}

        <Text
          style={
            styles.rangeHelper
          }
        >
          Para un solo día, usa la misma fecha inicial y final. Puedes consultar hasta {MAX_RANGE_DAYS} días.
        </Text>

        {draftRangeChanged && !rangeError ? (
          <Text style={styles.draftRangeNotice} accessibilityLiveRegion="polite">
            Tienes cambios sin aplicar. La lista todavía muestra el último período consultado.
          </Text>
        ) : null}

        {rangeError ? (
          <Text
            nativeID="schedule-range-error"
            style={styles.rangeError}
            accessibilityRole="alert"
            accessibilityLiveRegion="assertive"
          >
            {rangeError}
          </Text>
        ) : null}

        <Pressable
          style={[
            styles.searchButton,
            isBusy &&
              styles.disabledButton,
          ]}
          disabled={isBusy}
          accessibilityRole="button"
          accessibilityLabel="Consultar agenda del rango seleccionado"
          accessibilityState={{
            disabled: isBusy,
            busy: isBusy,
          }}
          onPress={() => void consultCustomRange()}
        >
          <AppIcon
            name={{
              ios: "calendar.badge.checkmark",
              android: "date_range",
              web: "date_range",
            }}
            size={19}
            color={COLORS.onPrimary}
          />

          <Text
            style={
              styles.searchButtonText
            }
          >
            {isBusy
              ? "Consultando..."
              : "Consultar agenda"}
          </Text>
        </Pressable>
          </View>
        )}
      </View>

      <View style={styles.dataStatusRow}>
        <Text style={styles.updatedText}>{updatedLabel}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.refreshButton,
            pressed && styles.buttonPressed,
          ]}
          disabled={isBusy}
          onPress={() => {
            const appliedRange = appliedRangeRef.current;
            void loadSchedule(
              appliedRange.startDate,
              appliedRange.endDate,
              "refresh"
            );
          }}
          accessibilityRole="button"
          accessibilityLabel="Actualizar el período aplicado"
          accessibilityState={{ disabled: isBusy, busy: isBusy }}
        >
          {refreshing ? (
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
          style={[styles.inlineNotice, styles.warningNotice]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <View style={styles.inlineNoticeContent}>
            <Text style={styles.inlineNoticeTitle}>
              No pudimos actualizar la agenda
            </Text>
            <Text style={styles.inlineNoticeText}>{syncWarning}</Text>
          </View>

          <Pressable
            style={styles.inlineNoticeAction}
            onPress={retryLastRequest}
            accessibilityRole="button"
            accessibilityLabel="Reintentar actualización de agenda"
          >
            <Text style={styles.inlineNoticeActionText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {contactNotice ? (
        <View
          style={[styles.inlineNotice, styles.successNotice]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.inlineNoticeText}>{contactNotice}</Text>
          <Pressable
            style={styles.noticeDismiss}
            onPress={() => setContactNotice("")}
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

      {loading && !hasLoaded ? (
        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color={COLORS.primary}
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Cargando agenda...
          </Text>
        </View>
      ) : error ? (
        <View
          style={
            styles.messageBox
          }
        >
          <Text
            style={
              styles.errorTitle
            }
          >
            No pudimos consultar
            la agenda
          </Text>

          <Text
            style={
              styles.errorText
            }
          >
            {error}
          </Text>

          <Pressable
            style={styles.retryButton}
            onPress={() => {
              const appliedRange = appliedRangeRef.current;
              void loadSchedule(
                appliedRange.startDate,
                appliedRange.endDate,
                "initial"
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Intentar consultar la agenda nuevamente"
          >
            <Text style={styles.retryButtonText}>Intentar nuevamente</Text>
          </Pressable>
        </View>
      ) : (
        <View
          onLayout={(event) =>
            handleResultsLayout(
              event.nativeEvent.layout.y
            )
          }
        >
          <View style={styles.periodSummary}>
            <View style={styles.periodSummaryHeader}>
              <View style={styles.periodIcon}>
                <AppIcon
                  name={{
                    ios: "calendar.circle.fill",
                    android: "calendar_month",
                    web: "calendar_month",
                  }}
                  size={24}
                  color={COLORS.primary}
                />
              </View>

              <View style={styles.periodContent}>
                <Text style={styles.periodLabel}>
                  PERÍODO CONSULTADO
                </Text>

                <Text style={styles.periodText}>
                  {formatDisplayDate(appliedStartDateText)}
                  {" — "}
                  {formatDisplayDate(appliedEndDateText)}
                </Text>
              </View>
            </View>

            <Text style={styles.periodNarrative}>
              {totalRecordCount === 0
                ? "No hay registros de citas en este período."
                : totalRecordCount === 1
                  ? `Hay 1 registro; ${activeCount} ${activeCount === 1 ? "cita activa" : "citas activas"}.`
                  : `Hay ${totalRecordCount} registros; ${activeCount} ${activeCount === 1 ? "cita activa" : "citas activas"}.`}
            </Text>

            <View style={styles.summaryMetrics}>
              <View style={styles.summaryMetric}>
                <Text style={styles.summaryMetricValue}>
                  {totalRecordCount}
                </Text>

                <Text style={styles.summaryMetricLabel}>
                  Registros
                </Text>
              </View>

              <View style={styles.summaryMetric}>
                <Text style={styles.summaryMetricValue}>
                  {pendingCount}
                </Text>

                <Text style={styles.summaryMetricLabel}>
                  Pendientes
                </Text>
              </View>

              <View style={styles.summaryMetric}>
                <Text style={styles.summaryMetricValue}>
                  {acceptedCount}
                </Text>

                <Text style={styles.summaryMetricLabel}>
                  Confirmadas
                </Text>
              </View>
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
            contentContainerStyle={styles.filterContainer}
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
                      isBusy && styles.disabledButton,
                    ]}
                    disabled={isBusy}
                    onPress={() => void selectStatusFilter(filter.value)}
                    accessibilityRole="tab"
                    accessibilityLabel={`${filter.label}, ${getFilterCount(filter.value)}`}
                    accessibilityState={{
                      selected: active,
                      disabled: isBusy,
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

          <View style={styles.searchSection}>
            <Text style={styles.searchLabel}>Buscar en este período</Text>

            <View style={styles.searchInputRow}>
              <AppIcon
                name={{
                  ios: "magnifyingglass",
                  android: "search",
                  web: "search",
                }}
                size={19}
                color={COLORS.textMuted}
              />

              <TextInput
                style={styles.appointmentSearchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Nombre, celular, servicio, fecha u hora"
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="off"
                importantForAutofill="no"
                returnKeyType="search"
                editable={!isBusy}
                accessibilityLabel="Buscar dentro de la agenda"
                accessibilityState={{ disabled: isBusy }}
              />

              {searchQuery ? (
                <Pressable
                  style={styles.clearSearchButton}
                  disabled={isBusy}
                  onPress={() => setSearchQuery("")}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar búsqueda"
                  accessibilityState={{ disabled: isBusy }}
                >
                  <AppIcon
                    name={{
                      ios: "xmark.circle.fill",
                      android: "cancel",
                      web: "cancel",
                    }}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </Pressable>
              ) : null}
            </View>

            {draftSearchChanged ? (
              <Text
                style={styles.searchProgressText}
                accessibilityLiveRegion="polite"
              >
                {refreshing
                  ? "Buscando en todos los registros del período..."
                  : "La búsqueda se aplicará automáticamente."}
              </Text>
            ) : null}
          </View>

          <View
            style={
              styles.resultsHeader
            }
            accessibilityLiveRegion="polite"
          >
            <Text
              style={
                styles.resultsTitle
              }
            >
              Citas
            </Text>

            <Text
              style={
                styles.resultsCount
              }
            >
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
                    ios: "calendar.badge.checkmark",
                    android: "event_available",
                    web: "event_available",
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
                No hay citas
              </Text>

              <Text
                style={
                  styles.messageText
                }
              >
                {getEmptyMessage()}
              </Text>
            </View>
          ) : (
            filteredAppointments.map(
              (appointment, index) => {
                const statusStyle =
                  getStatusStyle(
                    appointment.status
                  );

                const startsNewDay =
                  index === 0 ||
                  filteredAppointments[index - 1].date !==
                    appointment.date;

                const expanded =
                  expandedAppointmentId === appointment.id;

                return (
                  <Fragment key={appointment.id}>
                  {startsNewDay && (
                    <View style={styles.dayHeader}>
                      <Text style={styles.dayHeaderText}>
                        {formatDisplayDate(appointment.date)}
                      </Text>

                      <Text style={styles.dayHeaderCount}>
                        {dayAppointmentCounts[appointment.date]}{" "}
                        {dayAppointmentCounts[appointment.date] === 1
                          ? "cita mostrada"
                          : "citas mostradas"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.timelineItem}>
                    <View style={styles.timelineRail}>
                      <Text style={styles.time}>
                        {formatDisplayTime(appointment.time)}
                      </Text>

                      <View style={styles.timelineDot} />
                      <View style={styles.timelineLine} />
                    </View>

                    <View style={styles.card}>
                      <View style={styles.cardHeader}>
                        <View style={styles.clientInfo}>
                          <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                              {appointment.firstName
                                ?.charAt(0)
                                .toUpperCase()}
                            </Text>
                          </View>

                          <View style={styles.clientContent}>
                            <Text style={styles.clientLabel}>
                              CLIENTE
                            </Text>

                            <Text style={styles.clientName}>
                              {appointment.firstName}{" "}
                              {appointment.lastName}
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
                            {getStatusText(appointment.status)}
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
                            size={18}
                            color={COLORS.primary}
                          />
                        </View>

                        <Text style={styles.service}>
                          {appointment.service}
                        </Text>
                      </View>

                      {expanded && (
                        <View style={styles.expandedDetails}>
                          <View style={styles.detailIcon}>
                            <AppIcon
                              name={{
                                ios: "phone.fill",
                                android: "call",
                                web: "call",
                              }}
                              size={17}
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
                                onPress={() => void callClient(appointment.phone)}
                                accessibilityRole="button"
                                accessibilityLabel={`Llamar a ${appointment.firstName}`}
                              >
                                <Text style={styles.phoneActionText}>Llamar</Text>
                              </Pressable>

                              <Pressable
                                style={styles.phoneAction}
                                onPress={() => void shareOrCopyPhone(appointment.phone)}
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
                        accessibilityLabel={
                          expanded
                            ? "Ocultar los detalles de la cita"
                            : "Ver los detalles de la cita"
                        }
                        accessibilityState={{
                          expanded,
                        }}
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

                      {(appointment.status === "PENDING" ||
                        appointment.status === "ACCEPTED") && (
                        <Pressable
                          style={styles.manageAppointmentButton}
                          onPress={() => openAppointmentInManagement(appointment)}
                          accessibilityRole="button"
                          accessibilityLabel={`Gestionar cita de ${appointment.firstName} ${appointment.lastName}`}
                        >
                          <AppIcon
                            name={{
                              ios: "arrow.up.right.square",
                              android: "open_in_new",
                              web: "open_in_new",
                            }}
                            size={18}
                            color={COLORS.primary}
                          />
                          <Text style={styles.manageAppointmentText}>
                            Gestionar cita
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                  </Fragment>
                );
              }
            )
          )}

          {filteredAppointments.length > 0 && pagination?.hasMore ? (
            <View style={styles.loadMoreSection}>
              <Text style={styles.loadMoreText}>
                Mostrando {appointments.length} de {pagination.total} resultados.
              </Text>

              <Pressable
                style={[
                  styles.loadMoreButton,
                  isBusy && styles.disabledButton,
                ]}
                disabled={isBusy}
                onPress={loadMoreAppointments}
                accessibilityRole="button"
                accessibilityLabel={`Cargar más citas. Se muestran ${appointments.length} de ${pagination.total}`}
                accessibilityState={{
                  disabled: isBusy,
                  busy: loadingMore,
                }}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color={COLORS.onPrimary} />
                ) : (
                  <AppIcon
                    name={{
                      ios: "arrow.down.circle",
                      android: "expand_more",
                      web: "expand_more",
                    }}
                    size={19}
                    color={COLORS.onPrimary}
                  />
                )}

                <Text style={styles.loadMoreButtonText}>
                  {loadingMore ? "Cargando..." : "Cargar más"}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      )}

      <BackButton fallbackHref="/admin" />
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,
      paddingHorizontal:
        SPACING.lg,
      paddingTop:
        SPACING.xl,
      paddingBottom:
        SPACING.xxl,
      backgroundColor:
        COLORS.background,
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
      fontSize:
        FONT.title,
      fontFamily:
        FONT_FAMILY.display,
      fontWeight: "800",
      color:
        COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    subtitle: {
      fontSize:
        FONT.body,
      color:
        COLORS.textSecondary,
      lineHeight: 24,
    },

    dateSection: {
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
        SPACING.xl,
    },

    sectionHeading: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: SPACING.lg,
    },

    sectionIcon: {
      width: 42,
      height: 42,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    sectionHeadingContent: {
      flex: 1,
    },

    sectionTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom: 3,
    },

    sectionHint: {
      fontSize: FONT.caption,
      lineHeight: 18,
      color: COLORS.textSecondary,
    },

    presetContainer: {
      flexDirection: "row",
      gap: SPACING.sm,
      width: "100%",
    },

    presetButton: {
      flex: 1,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: SPACING.xs,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: COLORS.border,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.surface,
    },

    activePresetButton: {
      borderColor: COLORS.primary,
      backgroundColor: COLORS.primary,
    },

    presetButtonText: {
      color: COLORS.textSecondary,
      fontSize: FONT.small,
      fontWeight: "700",
      textAlign: "center",
    },

    activePresetButtonText: {
      color: COLORS.onPrimary,
    },

    customRangeToggle: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 44,
      gap: SPACING.xs,
      alignSelf: "flex-start",
      marginTop: SPACING.md,
      paddingHorizontal: SPACING.sm,
      paddingVertical: 8,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
    },

    customRangeToggleText: {
      color: COLORS.text,
      fontSize: FONT.small,
      fontWeight: "700",
    },

    customRangeContent: {
      marginTop: SPACING.md,
    },

    label: {
      fontSize:
        FONT.small,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    endDateLabel: {
      marginTop:
        SPACING.lg,
    },

    input: {
      backgroundColor:
        COLORS.background,
      borderWidth: 1,
      borderColor:
        COLORS.borderStrong,
      borderRadius:
        RADIUS.md,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 13,
      fontSize:
        FONT.body,
      color:
        COLORS.text,
    },

    dateButton: {
      backgroundColor:
        COLORS.background,
      borderWidth: 1,
      borderColor:
        COLORS.borderStrong,
      borderRadius:
        RADIUS.md,
      paddingHorizontal:
        SPACING.md,
      paddingVertical: 14,
    },

    dateButtonText: {
      fontSize:
        FONT.body,
      fontWeight: "600",
      color:
        COLORS.text,
    },

    helperText: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textMuted,
      lineHeight: 18,
      marginTop:
        SPACING.xs,
    },

    rangeHelper: {
      fontSize:
        FONT.caption,
      color:
        COLORS.textSecondary,
      lineHeight: 18,
      marginTop:
        SPACING.lg,
    },

    draftRangeNotice: {
      color: COLORS.primary,
      fontSize: FONT.caption,
      lineHeight: 18,
      fontWeight: "700",
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginTop: SPACING.sm,
    },

    rangeError: {
      color: COLORS.danger,
      fontSize: FONT.small,
      lineHeight: 20,
      fontWeight: "700",
      backgroundColor: COLORS.dangerBackground,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginTop: SPACING.sm,
    },

    searchButton: {
      flexDirection: "row",
      justifyContent: "center",
      gap: SPACING.xs,
      backgroundColor:
        COLORS.primary,
      paddingVertical: 14,
      borderRadius:
        RADIUS.pill,
      alignItems: "center",
      marginTop:
        SPACING.lg,
    },

    searchButtonText: {
      color: COLORS.onPrimary,
      fontWeight: "700",
      fontSize:
        FONT.body,
    },

    disabledButton: {
      opacity: 0.6,
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
      alignItems: "center",
      justifyContent: "center",
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.surface,
      borderWidth: 1,
      borderColor: COLORS.border,
    },

    buttonPressed: {
      opacity: 0.65,
    },

    inlineNotice: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: SPACING.sm,
      borderWidth: 1,
      borderRadius: RADIUS.lg,
      padding: SPACING.md,
      marginBottom: SPACING.md,
    },

    warningNotice: {
      backgroundColor: COLORS.warningBackground,
      borderColor: COLORS.accentSoft,
    },

    successNotice: {
      backgroundColor: COLORS.successBackground,
      borderColor: "#B9DEC9",
    },

    inlineNoticeContent: {
      flex: 1,
      minWidth: 0,
    },

    inlineNoticeTitle: {
      color: COLORS.text,
      fontSize: FONT.small,
      fontWeight: "800",
      marginBottom: 3,
    },

    inlineNoticeText: {
      flex: 1,
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      lineHeight: 18,
    },

    inlineNoticeAction: {
      minHeight: 44,
      justifyContent: "center",
      paddingHorizontal: SPACING.sm,
    },

    inlineNoticeActionText: {
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

    loadingContainer: {
      alignItems: "center",
      paddingVertical: 50,
    },

    loadingText: {
      color:
        COLORS.textSecondary,
      marginTop:
        SPACING.sm,
    },

    periodSummary: {
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      marginBottom: SPACING.xl,
    },

    retryButton: {
      minHeight: 44,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: COLORS.primary,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.lg,
      marginTop: SPACING.lg,
    },

    retryButtonText: {
      color: COLORS.onPrimary,
      fontSize: FONT.small,
      fontWeight: "800",
    },

    periodSummaryHeader: {
      flexDirection: "row",
      alignItems: "center",
    },

    periodIcon: {
      width: 48,
      height: 48,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
    },

    periodContent: {
      flex: 1,
    },

    periodLabel: {
      fontSize:
        FONT.caption,
      fontWeight: "700",
      letterSpacing: 0.8,
      color:
        COLORS.primary,
      marginBottom:
        SPACING.xs,
    },

    periodText: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    periodNarrative: {
      fontSize: FONT.small,
      lineHeight: 20,
      color: COLORS.textSecondary,
      marginTop: SPACING.md,
    },

    summaryMetrics: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: SPACING.sm,
      marginTop: SPACING.md,
    },

    summaryMetric: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.xs,
      minHeight: 34,
      backgroundColor: COLORS.surface,
      borderRadius: RADIUS.pill,
      paddingHorizontal: SPACING.sm,
      paddingVertical: SPACING.xs,
    },

    summaryMetricValue: {
      fontSize: FONT.small,
      fontWeight: "800",
      color: COLORS.primary,
    },

    summaryMetricLabel: {
      fontSize: FONT.caption,
      fontWeight: "600",
      color: COLORS.textSecondary,
    },

    filterLabel: {
      fontSize:
        FONT.subheading,
      lineHeight: 24,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom:
        SPACING.md,
    },

    filterScroll: {
      flexGrow: 0,
      flexShrink: 0,
      height: 46,
      marginBottom: SPACING.sm,
    },

    filterContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: SPACING.sm,
      paddingRight: SPACING.lg,
      paddingVertical: 1,
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

    searchSection: {
      marginBottom: SPACING.xl,
    },

    searchLabel: {
      color: COLORS.text,
      fontSize: FONT.small,
      fontWeight: "800",
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

    appointmentSearchInput: {
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

    searchProgressText: {
      color: COLORS.textMuted,
      fontSize: FONT.caption,
      lineHeight: 18,
      marginTop: SPACING.xs,
    },

    resultsHeader: {
      flexDirection: "row",
      justifyContent:
        "space-between",
      alignItems: "center",
      marginBottom:
        SPACING.md,
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
      width: 34,
      height: 34,
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

    resultsTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    resultsCount: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
    },

    timelineItem: {
      flexDirection: "row",
      alignItems: "stretch",
      gap: SPACING.sm,
    },

    timelineRail: {
      width: 70,
      alignItems: "center",
    },

    timelineDot: {
      width: 9,
      height: 9,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.accent,
      marginTop: SPACING.sm,
    },

    timelineLine: {
      width: 1,
      flex: 1,
      minHeight: SPACING.md,
      backgroundColor: COLORS.accentSoft,
      marginTop: SPACING.xs,
      marginBottom: SPACING.sm,
    },

    card: {
      flex: 1,
      minWidth: 0,
      backgroundColor:
        COLORS.surface,
      borderWidth: 1,
      borderColor:
        COLORS.accentSoft,
      borderRadius:
        RADIUS.lg,
      padding:
        SPACING.md,
      marginBottom:
        SPACING.md,
    },

    cardHeader: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent:
        "space-between",
      alignItems:
        "flex-start",
      columnGap: SPACING.md,
      rowGap: SPACING.sm,
    },

    clientInfo: {
      flexDirection: "row",
      alignItems: "center",
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 160,
      minWidth: 0,
    },

    avatar: {
      width: 40,
      height: 40,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primarySoft,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    avatarText: {
      fontSize: FONT.body,
      fontWeight: "800",
      color: COLORS.primary,
    },

    clientContent: {
      flex: 1,
      minWidth: 0,
    },

    clientLabel: {
      fontSize: FONT.caption,
      fontWeight: "800",
      letterSpacing: 0.7,
      color: COLORS.textMuted,
      marginBottom: 2,
    },

    time: {
      fontSize: FONT.small,
      fontWeight: "800",
      color:
        COLORS.primary,
      textAlign: "center",
      marginTop: SPACING.md,
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

    clientName: {
      fontSize:
        FONT.body,
      fontWeight: "700",
      color:
        COLORS.text,
    },

    requestAge: {
      color: COLORS.textMuted,
      fontSize: FONT.caption,
      lineHeight: 18,
      marginTop: 3,
    },

    serviceRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: COLORS.primarySoft,
      borderRadius: RADIUS.md,
      padding: SPACING.sm,
      marginTop: SPACING.md,
    },

    serviceIcon: {
      width: 32,
      height: 32,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.sm,
    },

    service: {
      flex: 1,
      fontSize:
        FONT.small,
      fontWeight: "700",
      color:
        COLORS.text,
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

    manageAppointmentButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: SPACING.xs,
      borderRadius: RADIUS.pill,
      borderWidth: 1,
      borderColor: COLORS.primary,
      paddingHorizontal: SPACING.md,
      marginTop: SPACING.sm,
    },

    manageAppointmentText: {
      color: COLORS.primary,
      fontSize: FONT.small,
      fontWeight: "800",
    },

    loadMoreSection: {
      alignItems: "center",
      gap: SPACING.sm,
      marginTop: SPACING.lg,
      marginBottom: SPACING.lg,
    },

    loadMoreText: {
      color: COLORS.textSecondary,
      fontSize: FONT.caption,
      textAlign: "center",
    },

    loadMoreButton: {
      minHeight: 44,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: SPACING.xs,
      borderRadius: RADIUS.pill,
      backgroundColor: COLORS.primary,
      paddingHorizontal: SPACING.xl,
      paddingVertical: SPACING.sm,
    },

    loadMoreButtonText: {
      color: COLORS.onPrimary,
      fontSize: FONT.small,
      fontWeight: "800",
    },

    messageBox: {
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

    errorTitle: {
      fontSize:
        FONT.subheading,
      fontFamily: FONT_FAMILY.display,
      fontWeight: "700",
      color:
        COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    errorText: {
      fontSize:
        FONT.small,
      color:
        COLORS.textSecondary,
      lineHeight: 20,
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
      width: 60,
      height: 60,
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
      color:
        COLORS.text,
      marginBottom:
        SPACING.sm,
    },

    messageText: {
      fontSize:
        FONT.body,
      color:
        COLORS.textSecondary,
      lineHeight: 22,
      textAlign: "center",
    },
  });
