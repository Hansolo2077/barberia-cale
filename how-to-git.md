# Flujo de trabajo colaborativo

Desde el Segundo Parcial, los cambios se proponen en ramas por funcionalidad
y se integran a `main` mediante Pull Request. El historial anterior conserva
los commits realizados directamente en `main`.

El repositorio de trabajo es `Hansolo2077/barberia-cale` (`origin`).
El remoto `public` es otro repositorio; publicar en él no reemplaza el PR en
el repositorio de trabajo.

## Preparar un cambio

Con el directorio de trabajo limpio, actualizar la base y crear una rama:

```bash
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c fix/nombre-funcionalidad
```

Usar `feat/` para funcionalidades nuevas, `fix/` para correcciones y `docs/`
para documentación. Cada rama debe contener un cambio real y acotado.
Si hay trabajo local pendiente, conservarlo en su rama antes de cambiar de base.

## Verificar y publicar

Para cambios en la app:

```bash
npm run lint
npx tsc --noEmit
git diff --check
git diff
git add ruta/al/archivo
git diff --cached
git commit -m "fix: describir la correccion realizada"
git push -u origin fix/nombre-funcionalidad
```

Agregar solo los archivos del cambio. No incluir credenciales, archivos de cuenta
ni cambios ajenos. Para documentación, comprobar enlaces, imágenes y exactitud;
para cambios del backend, ejecutar también sus pruebas relevantes.

## Revisar e integrar

1. Abrir un PR de la rama hacia `main` en GitHub.
2. Describir el problema, el cambio y las verificaciones realmente ejecutadas.
3. Otro integrante revisa desde su propia cuenta y registra observaciones o aprobación.
4. Resolver observaciones y comprobar que el PR pueda integrarse sin conflictos.
5. Integrar mediante el PR y conservar su enlace como evidencia.

La autoría del commit y la revisión deben corresponder a quienes participaron.
Crear una rama o solicitar una revisión no demuestra por sí solo una contribución
del revisor. Una revisión pendiente debe reportarse como pendiente.

Para la entrega, registrar los enlaces de rama, commits y PR, el estado del merge
y la participación verificable de cada integrante. No presentar este flujo como
si se hubiera usado antes de su adopción.
