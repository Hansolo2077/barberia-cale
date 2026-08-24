import AppErrorFallback from "../components/AppErrorFallback";

export default function NotFoundScreen() {
  return (
    <AppErrorFallback
      title="Esta página no existe"
      message="El enlace puede estar incompleto o pertenecer a una versión anterior de Cale."
    />
  );
}
