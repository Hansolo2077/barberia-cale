# Alcance del proyecto

## I. Versión 1.0 del alcance del proyecto

## 1. Objetivo

Desarrollar una aplicación móvil y web para Barbería Cale que permita gestionar de forma segura, centralizada y trazable el ciclo de una cita, desde el registro e inicio de sesión del cliente y la consulta de disponibilidad hasta la gestión administrativa, la comunicación asistida y el cierre de la cita.

## 2. Actores

| Actor | Responsabilidades |
| --- | --- |
| Cliente (CLIENT) | Registrarse, iniciar y cerrar sesión, mantener la sesión cuando lo decida, consultar disponibilidad, reservar, revisar próximas citas e historial y cancelar una cita propia cuando la regla lo permita. |
| Administrador (ADMIN) | Consultar y filtrar solicitudes, aceptar o rechazar citas, consultar la agenda, cancelar administrativamente citas confirmadas elegibles, completar servicios y preparar comunicación por WhatsApp. |

## 3. Funcionalidades incluidas

- Registro de clientes con validación de confirmación de contraseña e inicio automático de sesión después de un registro exitoso.

- Inicio de sesión, cierre de sesión y persistencia opcional de sesión.

- Autenticación mediante JWT y autorización por roles CLIENT/ADMIN.

- Consulta de disponibilidad y reserva con un mínimo real de 24 horas de anticipación.

- Horarios de atención en bloques de una hora entre 08:00 y 17:00.

- Creación de citas con estado inicial PENDING y aplicación de reglas de negocio: prevención de doble reserva, máximo una cita activa por cliente en el mismo día y máximo dos citas activas dentro de una ventana móvil de siete días.

- Consulta de próximas citas e historial, con actualización de información al recuperar el foco.

- Cancelación de citas por el cliente con al menos una hora de anticipación y liberación del horario cuando corresponda.

- Gestión administrativa de solicitudes y citas: consultar, filtrar, aceptar, rechazar, cancelar y completar según estado y tiempo.

- Agenda administrativa por rango de fechas y estado.

- Comunicación asistida por WhatsApp después de aceptar o rechazar, con mensaje preparado para revisión y envío manual.

- Persistencia en PostgreSQL/Supabase, API REST desplegada en Render, control de versiones con Git/GitHub y compilación Android mediante EAS.

- Interfaz adaptada a Android y web, incluyendo áreas seguras y navegación del sistema móvil.
