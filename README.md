# Barbería Cale

Aplicación móvil y web para reservar cortes de cabello y administrar el ciclo completo de las citas de Barbería Cale.

La [preparación final de Implementación y Validación](proyecto/docs/ivs-final/README.md) reúne instalación desde cero, manuales, capacitación, recuperación, criterios de aceptación y resultados verificables del corte del 7/11/2026. La versión para evaluación conserva las limitaciones declaradas del piloto.

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

La [documentación vigente](proyecto/docs/README.md) reúne alcance, requisitos RF-01 a RF-22, arquitectura y trazabilidad. Las [versiones archivadas](docs/documentacion-archivada/README.md) se conservan como antecedentes y no describen el estado actual completo. Las [evidencias de ejecución](docs/README.md) conservan la fecha y los límites de cada prueba. Los comandos habituales de Git y EAS están guardados en `how-to-git.md` y `how-to-eas.md`.

El [paquete de preparación del Parcial III](proyecto/docs/calidad-final/README.md) centraliza los registros finales de calidad. `npm run quality:checks` guarda los controles y devuelve un fallo si alguna comprobación o auditoría no cumple. `npm run quality:integration` ejecuta la campaña HTTP/PostgreSQL en esquemas temporales, usando una conexión configurada fuera de Git. Los resultados locales no certifican el despliegue ni sustituyen las pruebas de interfaz.
