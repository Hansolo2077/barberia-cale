# Barbería Cale

Aplicación móvil y web para reservar cortes de cabello y administrar el ciclo completo de las citas de Barbería Cale.

## Funcionalidades

- Registro, inicio de sesión y persistencia opcional de la sesión.
- Consulta de disponibilidad y reserva con reglas de anticipación y frecuencia.
- Próximas citas, historial y cancelación dentro del plazo permitido.
- Panel ADMIN para aceptar, rechazar, cancelar y completar citas.
- Agenda por rango, estado y búsqueda, con comunicación asistida por WhatsApp.

## Tecnologías

- Expo SDK 57, Expo Router, React Native y React Native Web.
- API REST con Express.
- PostgreSQL/Supabase.
- Render para la API, Netlify para web y EAS para Android.

## Ejecutar la aplicación

Instala las dependencias y levanta Expo:

```bash
npm install
npx expo start
```

La aplicación usa por defecto la API publicada. Para apuntar a otra instancia, define `EXPO_PUBLIC_API_URL` con la URL completa que termina en `/api`.

## Ejecutar el backend

Desde `backend`, instala sus dependencias y configura estas variables de entorno:

- `DATABASE_URL`: conexión de PostgreSQL.
- `JWT_SECRET`: secreto robusto para firmar sesiones.
- `CORS_ORIGINS`: orígenes web permitidos, separados por comas.
- `PORT`: opcional; por defecto se usa `4000`.

Luego inicia el servidor:

```bash
node src/server.js
```

La estructura inicial de la base está en `backend/src/database/schema.sql`.

## Verificación

```bash
npm run lint
npx tsc --noEmit
cd backend
npm test
```

Los requisitos y el alcance están en `proyecto/docs`. Los comandos habituales de Git y EAS están guardados en `how-to-git.md` y `how-to-eas.md`.
