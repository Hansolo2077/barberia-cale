# Barbería Cale — Cambios de la versión final

## Alcance de este documento

Este documento compara la versión beta original del repositorio (`6ade921`, 20 de agosto de 2026) con la versión final actual (`0e7f3f5` más la integración de WhatsApp pendiente de commit).

La versión final conserva el flujo principal de la beta —registro, inicio de sesión, reserva y administración de citas— pero mejora su seguridad, persistencia, reglas de negocio, navegación, presentación y experiencia de uso en dispositivos móviles y web.

## Resumen ejecutivo

| Área | Versión original | Versión final |
| --- | --- | --- |
| Autenticación | Sesión básica y protección distribuida | Sesión persistente, restauración al iniciar y protección centralizada por rol |
| Navegación | Retroceso y barras con comportamientos inconsistentes | Navegación segura, botón Volver corregido y barras adaptadas a áreas seguras |
| Reserva del cliente | Formulario completo visible desde el inicio | Flujo progresivo con siguiente fecha disponible, consulta de horarios y desplazamiento automático |
| Reglas de anticipación | Validación poco clara | Mínimo real de 24 horas usando la hora de Nicaragua |
| Cancelaciones | Errores y acciones poco explícitas | Confirmación funcional y estado claro cuando el tiempo de cancelación expiró |
| Agenda administrativa | Pantalla extensa y controles desalineados | Filtros jerarquizados, periodos alineados, agrupación y orden operativo |
| Gestión de citas | Acciones con errores y poca jerarquía visual | Aceptar, rechazar, completar y cancelar con confirmaciones, estados y mensajes claros |
| Notificaciones | Sin contacto contextual | WhatsApp abre el chat del cliente con un mensaje preparado tras aceptar o rechazar |
| Diseño | Estilos dispersos y marca genérica | Tema compartido, logo oficial y componentes reutilizables |
| Producción | Configuración principalmente local | API de producción, CORS web, EAS y configuración de despliegue |

## 1. Identidad, diseño y consistencia visual

- Se incorporó el logo oficial de Barbería Cale y se actualizó la identidad visual en las pantallas de entrada y autenticación.
- Se creó un sistema de diseño compartido con colores, tipografía, espaciado, radios y superficies reutilizables.
- Se unificaron tarjetas, botones, etiquetas de estado, mensajes de error y estados vacíos.
- Se creó un menú reutilizable para la cuenta del usuario.
- Se agregaron utilidades comunes para mostrar mensajes y formatear fechas y horas.
- La interfaz administrativa fue reorganizada para dar prioridad a las decisiones y acciones más frecuentes.

Archivos principales:

- `assets/images/logo-cale.png`
- `src/constants/app-theme.ts`
- `src/components/UserMenu.tsx`
- `src/utils/date-format.ts`
- `src/utils/show-message.ts`

## 2. Áreas seguras y barras de navegación

- Se corrigió el solapamiento del contenido con la barra superior del sistema en todas las pantallas relevantes.
- Se corrigió el solapamiento de la barra inferior en el inicio del cliente.
- Los layouts ahora consideran los márgenes seguros del dispositivo y el espacio real de la navegación inferior.
- Se ajustó el layout raíz para evitar márgenes duplicados o inconsistentes.

Resultado: el contenido y los controles permanecen visibles en dispositivos con notch, barra gestual o botones digitales.

Archivos principales:

- `src/app/_layout.tsx`
- `src/app/client/_layout.tsx`
- `src/app/admin/_layout.tsx`

## 3. Autenticación, sesión y roles

- Se añadió persistencia de sesión para que un usuario que eligió permanecer conectado no tenga que iniciar sesión nuevamente al abrir la aplicación.
- La aplicación restaura el token y los datos del usuario antes de decidir a qué pantalla navegar.
- Se centralizó la protección de rutas para cliente y administrador mediante layouts dedicados.
- Se evita que un cliente acceda a vistas administrativas y viceversa.
- Se actualizaron el registro, inicio de sesión y API de autenticación para trabajar con el modelo persistente.
- Se mejoró la creación y administración de usuarios administradores en el backend.

Archivos principales:

- `src/context/AuthContext.tsx`
- `src/app/auth/_layout.tsx`
- `src/app/client/_layout.tsx`
- `src/app/admin/_layout.tsx`
- `src/api/auth.api.ts`
- `backend/src/controllers/auth.controller.js`
- `backend/src/services/auth.service.js`

## 4. Inicio de sesión y registro

- Se corrigió el botón **Volver** cuando no existe una pantalla previa en el historial del navegador.
- Se creó un componente de retroceso reutilizable con una ruta alternativa segura.
- Los formularios ahora se adaptan al teclado para impedir que este cubra los campos.
- Se mejoraron jerarquía visual, espaciado, textos, validaciones y estados de carga.
- Se alineó la experiencia visual de autenticación con la nueva marca.

Archivos principales:

- `src/components/BackButton.tsx`
- `src/app/auth/login.tsx`
- `src/app/auth/register.tsx`
- `src/app/index.tsx`

## 5. Flujo de agendar cita

### Selección inteligente de fecha

- La fecha sugerida ya no es simplemente el día siguiente.
- La aplicación busca la siguiente fecha que realmente pueda ofrecer horarios válidos.
- La regla de anticipación se interpreta como **24 horas reales**, no como un cambio de fecha calendario.
- Los cálculos usan la hora de Nicaragua para evitar resultados incorrectos por la zona horaria del dispositivo o servidor.
- No se muestra prematuramente un error de consulta mientras el sistema todavía busca la siguiente fecha disponible.
- Se conserva la posibilidad de cambiar manualmente la fecha con el calendario.
- El texto se actualizó a **“Debes reservar al menos con 24 horas de anticipación”**.
- La presentación de esta advertencia se mantuvo integrada con el diseño original, evitando una tarjeta visualmente pesada.

Ejemplo: si son las 10:00 p. m. del 21 de agosto, una cita de la mañana del 22 no cumple las 24 horas; el sistema puede sugerir el 23 si existe disponibilidad.

### Divulgación progresiva y enfoque automático

- La sección para elegir hora permanece oculta hasta presionar **Ver horarios disponibles**.
- Cuando termina la consulta, la pantalla se desplaza automáticamente hacia los horarios.
- Al seleccionar un horario, la pantalla avanza automáticamente al resumen de la reserva.
- El usuario conserva libertad para desplazarse hacia arriba y modificar servicio, fecha u hora.
- No se añadieron pantallas innecesarias; todo el proceso se mantiene en una sola vista.
- Los cambios previos invalidan correctamente los pasos posteriores para evitar confirmar datos desactualizados.

Archivos principales:

- `src/app/client/appointment.tsx`
- `src/api/appointments.api.ts`
- `backend/src/controllers/appointment.controller.js`
- `backend/src/services/appointment.service.js`

## 6. Citas del cliente

- Se corrigió el error `undefined is not a function` al cancelar una cita.
- La cancelación solicita confirmación antes de modificar el estado.
- Los errores del backend se presentan con mensajes comprensibles.
- Cuando la ventana permitida ya terminó, la interfaz indica que la cita ya no se puede cancelar porque el tiempo de cancelación expiró.
- Se mejoraron las tarjetas, etiquetas de estado, orden de la información y acciones disponibles.
- Las fechas y horas se muestran con un formato consistente.

Archivos principales:

- `src/app/client/my-appointments.tsx`
- `src/api/appointments.api.ts`
- `backend/src/controllers/appointment.controller.js`
- `backend/src/services/appointment.service.js`

## 7. Agenda administrativa

- Se reorganizó la pantalla con una jerarquía de lectura más clara.
- Los controles de periodo se agruparon y alinearon consistentemente.
- El filtro por estado se separó visualmente de los controles temporales para distinguir ambas decisiones.
- Al seleccionar **Filtrar por estado**, la pantalla se desplaza hacia los resultados.
- Se incorporaron resúmenes y estados vacíos que explican el resultado del filtro.
- Se mejoraron la distribución de tarjetas, densidad de información y acciones administrativas.
- La agenda permite filtrar y consultar los estados relevantes sin perder contexto.

Archivo principal:

- `src/app/admin/schedule.tsx`

## 8. Gestión administrativa de citas

- Se rediseñó la pantalla para priorizar las solicitudes pendientes y las citas próximas.
- Los filtros por estado están alineados y utilizan una presentación consistente.
- Al cambiar el estado del filtro, la pantalla se desplaza automáticamente al comienzo de los resultados.
- Las citas **pendientes** y **confirmadas** se ordenan desde la fecha y hora más cercana hasta la más lejana.
- La vista operativa agrupa citas por día para facilitar la revisión diaria.
- Las tarjetas permiten expandir detalles como el teléfono sin saturar la vista inicial.
- Se añadieron estados y reglas explícitas para:
  - aceptar una solicitud;
  - rechazar una solicitud;
  - completar una cita atendida;
  - cancelar administrativamente una cita confirmada.
- Las acciones destructivas solicitan confirmación.
- Se corrigieron los errores que impedían aceptar, rechazar o cancelar correctamente.
- Los permisos calculados por el backend determinan cuándo una cita se puede completar o cancelar.

Archivos principales:

- `src/app/admin/appointments.tsx`
- `src/api/admin.api.ts`
- `backend/src/controllers/admin.controller.js`
- `backend/src/routes/admin.routes.js`
- `backend/src/services/appointment.service.js`

## 9. Mensajes preparados por WhatsApp

Después de aceptar o rechazar una solicitud desde **Gestión de citas**:

1. La aplicación guarda primero el nuevo estado en el backend.
2. Conserva los datos de la cita seleccionada.
3. Normaliza un teléfono nicaragüense de ocho dígitos al formato internacional `505########`.
4. Abre WhatsApp con el chat del cliente y un mensaje contextual preparado.
5. El administrador revisa el texto y presiona **Enviar**.

El mensaje incluye nombre, servicio, fecha, hora y el resultado de la gestión. Existen textos diferentes para confirmación y rechazo.

Esta integración:

- funciona en móvil mediante `Linking`;
- funciona en web mediante navegación a `wa.me` sin depender de una ventana emergente;
- usa la cuenta de WhatsApp activa en el dispositivo del administrador;
- no necesita API de Meta, token, plantilla aprobada ni costo por mensaje;
- no envía el mensaje automáticamente: la confirmación final siempre la realiza el administrador;
- no revierte el cambio de estado si WhatsApp no puede abrirse;
- muestra el número del cliente como alternativa cuando falla la apertura.

Archivo principal:

- `src/app/admin/appointments.tsx`

## 10. Backend y reglas de negocio

- Se reforzó la validación de disponibilidad antes de crear o modificar una cita.
- Se centralizaron reglas temporales para anticipación, cancelación y finalización.
- Las respuestas administrativas incluyen capacidades calculadas como `canComplete` y `canAdminCancel`.
- Se añadieron rutas administrativas necesarias para completar citas y gestionar estados.
- Se actualizaron controladores y servicios para devolver errores utilizables por la interfaz.
- Se creó un esquema SQL explícito y una utilidad de comprobación de base de datos.
- Se fortalecieron los procesos de autenticación y creación de administradores.

Archivos principales:

- `backend/src/services/appointment.service.js`
- `backend/src/controllers/appointment.controller.js`
- `backend/src/controllers/admin.controller.js`
- `backend/src/routes/admin.routes.js`
- `backend/src/database/schema.sql`
- `backend/src/database/test-db.js`

## 11. Producción y compatibilidad web

- Las APIs del frontend apuntan al backend desplegado en producción.
- Se configuró CORS para admitir correctamente el cliente Expo web.
- Se añadió configuración EAS para compilaciones y distribución.
- Se actualizaron metadatos y configuración de Expo.
- Se añadieron dependencias necesarias para persistencia y comportamiento multiplataforma.

Archivos principales:

- `src/api/admin.api.ts`
- `src/api/appointments.api.ts`
- `src/api/auth.api.ts`
- `backend/src/server.js`
- `app.json`
- `eas.json`
- `package.json`

## 12. Criterios heurísticos aplicados

- **Visibilidad del estado:** indicadores de carga, mensajes, estados vacíos y etiquetas claras.
- **Correspondencia con el mundo real:** fechas, horas y textos en español comprensible.
- **Control y libertad:** el usuario puede regresar, desplazarse y modificar elecciones anteriores.
- **Prevención de errores:** confirmaciones antes de rechazar o cancelar y acciones deshabilitadas durante el procesamiento.
- **Divulgación progresiva:** los horarios y el resumen aparecen cuando son relevantes.
- **Reconocimiento antes que memoria:** la información de la cita permanece visible durante las decisiones.
- **Consistencia:** tema, componentes, formatos y acciones compartidos entre cliente y administración.
- **Recuperación ante fallos:** el estado guardado no depende de que WhatsApp pueda abrirse.

## 13. Validación realizada

Durante el desarrollo se utilizaron las siguientes comprobaciones según el cambio:

- compilación estática con `npx tsc --noEmit`;
- validación sintáctica de servicios y controladores de Node con `node --check`;
- revisión de espacios y conflictos mediante `git diff --check`;
- comprobación de rutas, respuestas de API y propiedades calculadas;
- revisión específica de flujos nativos y web.

La integración final de WhatsApp pasa la comprobación de TypeScript y `git diff --check`.

## 14. Consideraciones finales

- WhatsApp prepara el mensaje, pero no lo envía sin la acción del administrador.
- El dispositivo administrativo debe tener WhatsApp instalado o una sesión de WhatsApp Web disponible.
- Los números locales deben corresponder a teléfonos válidos de Nicaragua; la aplicación agrega `505` cuando recibe exactamente ocho dígitos.
- Los cambios de estado siempre se guardan antes de intentar abrir WhatsApp.
- Si en el futuro se requiere envío totalmente automático, será necesario integrar WhatsApp Business Platform o un proveedor equivalente desde el backend.

## Historial de evolución

| Revisión | Objetivo principal |
| --- | --- |
| `6ade921` | Beta funcional original |
| `856664d` | Protección de rutas centralizada por rol |
| `b9e306e` | Finalización de citas y filtros administrativos |
| `8c5b0a1` | Mejoras de experiencia para cliente y administrador |
| `954f873` | Sesión persistente, límites de reserva e identidad visual |
| `622a497` | Ajustes de marca y autenticación |
| `14f46d9` | Compatibilidad CORS para Expo web |
| `bac592f` | API de producción y configuración de despliegue |
| `0e7f3f5` | Correcciones de botones, márgenes y flujo de reserva |
| Cambio actual | Mensajes preparados por WhatsApp al aceptar o rechazar |
