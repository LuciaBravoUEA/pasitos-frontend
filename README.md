# pasitos-magicos

Aplicación móvil de Pasitos Mágicos (Ionic + React + TypeScript + Capacitor), diseñada para acompañar rutinas diarias de niños con TDAH mediante tareas pequeñas, motivadoras y gamificadas. Ver `spec/constitution/` para la constitución completa del proyecto y `spec/features/` para cada feature con su spec/plan/tasks.

## Cómo correr todo en local

Este proyecto está pensado para ejecutarse como app móvil Ionic con React y Capacitor. En esta etapa, la experiencia principal es la de la app de rutinas gamificadas.

### Frontend — modo navegador

```bash
yarn dev          # http://localhost:5173
```

### Frontend — Android

```bash
# Si el emulador no está corriendo:
$ANDROID_HOME/emulator/emulator -avd Medium_Phone_API_36.0 &

# Build + sync + abrir en Android Studio
yarn android

# — o, para compilar e instalar directo en el emulador/dispositivo sin abrir Android Studio:
yarn android:run
```

### Teclado del emulador Android

Si aparece el panel de escritura a mano en lugar del teclado, ejecuta:

```bash
adb -e shell settings put secure stylus_handwriting_enabled 0
adb -e shell settings put secure show_ime_with_hard_keyboard 1
```

Cierra el panel con Atrás y toca Usuario de nuevo. Estos ajustes persisten solo en ese emulador. Para restaurar escritura a mano: `adb -e shell settings delete secure stylus_handwriting_enabled`.

### Frontend — iOS

```bash
yarn ios          # build + sync + abre Xcode
# — o —
yarn ios:run      # build + sync + corre directo en el simulador
```

### Funcionalidad principal actual

La app incluye una pantalla principal centrada en rutinas gamificadas para niños con TDAH:

- lista de tareas diarias
- seguimiento de progreso
- estrellas y racha de la semana
- marcado de actividades completadas
- experiencia motivadora y accesible

## Objetivo de la aplicación

Pasitos Mágicos ayuda a transformar tareas diarias, escolares y de hábitos en experiencias positivas, reforzando la motivación, la constancia y el desarrollo socioemocional.

## Entorno y requisitos verificados

| Elemento | Versión o estado |
| --- | --- |
| Sistema operativo | Windows 11 Pro x64 |
| Memoria | 16 GB instalados; cerrar aplicaciones antes de iniciar el emulador |
| Almacenamiento disponible | Más de 79 GB durante la última verificación |
| Virtualización | Activa (hipervisor detectado) |
| Node.js | 25.8.0 |
| Java | OpenJDK 21.0.12 LTS |
| Gestor de paquetes | Yarn 3.6.4 |
| Framework | Ionic React 8 + React 19 + TypeScript 5.9 |
| Empaquetado nativo | Capacitor 8.5.0 |
| Android | compile/target SDK 36; min SDK 24 |

Ionic React y Capacitor se eligieron porque permiten mantener una única interfaz TypeScript para Android e iOS, conservando acceso a capacidades nativas mediante plugins. El proyecto usa `@capacitor/keyboard` y almacenamiento seguro con `@aparajita/capacitor-secure-storage`.

### Herramientas Android

El SDK se configura en `android/local.properties`. Deben estar instalados Android SDK Platform, Build Tools, Platform Tools, Emulator y las licencias de Android SDK. El directorio `platform-tools` se agrega al PATH del usuario; abre una terminal nueva y verifica:

```bash
adb version
adb devices
```

El dispositivo virtual disponible es `Pixel_6_Clean_New`. Puedes iniciarlo desde Android Studio o con:

```bash
emulator -avd Pixel_6_Clean_New
```

Para iOS se requiere macOS con Xcode. En Windows se desarrolla y valida Android; la alternativa para iOS es un Mac físico o un pipeline de CI con runner macOS.

### Extensiones recomendadas

Abre el repositorio en VS Code y acepta las recomendaciones: Ionic, ESLint, Prettier y Webnative. Android Studio se utiliza para administrar SDK, AVD y ejecución Android.

## Arquitectura inicial

| Necesidad | Dependencia |
| --- | --- |
| Cliente HTTP | Axios 1.19.0 |
| Navegación | Ionic Router + React Router 5 |
| Almacenamiento seguro nativo | `@aparajita/capacitor-secure-storage` 8.0.0 |
| Estado de servidor | TanStack Query 5.101.4 |

La URL se lee exclusivamente desde variables `VITE_*`. Para Android Emulator, `.env.production` usa `http://10.0.2.2:3001/api`; `10.0.2.2` representa el host de desarrollo desde el emulador. Un dispositivo físico debe usar la IP LAN del equipo y un backend HTTPS cuando no sea un entorno local.

Android permite HTTP únicamente hacia `10.0.2.2` mediante `network_security_config.xml`; no se habilita tráfico claro globalmente. Producción debe usar HTTPS.

## Diagnóstico, ejecución y evidencias

Ejecuta antes de continuar:

```bash
node .yarn/releases/yarn-3.6.4.cjs lint
node .yarn/releases/yarn-3.6.4.cjs typecheck
node .yarn/releases/yarn-3.6.4.cjs test
node .yarn/releases/yarn-3.6.4.cjs build
node node_modules/@capacitor/cli/bin/capacitor doctor
```

Para ejecutar Android y comprobar recarga en caliente, inicia `yarn dev`, abre la app contra el servidor de desarrollo y cambia un texto visible; registra el cambio sin reinstalar la app. Para una APK sincronizada, usa `yarn android:run`.

Guarda evidencia en `docs/evidence/` con este formato:

- `01-capacitor-doctor.png`: diagnóstico sin hallazgos pendientes.
- `02-emulator-running.png`: aplicación ejecutándose en `Pixel_6_Clean_New`.
- `03-hot-reload.png`: cambio visible tras guardar.
- `04-api-response.png`: respuesta de `POST /api/auth/mobile/register` o de salud de API.

## Limitaciones y mitigación

1. El emulador consume memoria: con 16 GB instalados, cerrar navegadores, Docker o IDEs no usados antes de iniciar el AVD.
2. Windows no compila iOS: validar iOS en macOS/Xcode o CI macOS antes de distribuir.
3. El backend local usa HTTP para desarrollo: se limita a `10.0.2.2`; producción debe desplegar HTTPS.

## Uso de inteligencia artificial

Se utilizó Codex para inspeccionar configuración, implementar cambios y ejecutar verificaciones. Consultas principales: diagnóstico de login/emulador, registro local, configuración de teclado, auditoría del SDK Android y endurecimiento de tráfico HTTP. Verificaciones efectuadas: lint, TypeScript, pruebas Vitest, build Vite, Capacitor sync, compilación Android `assembleDebug`, preflight CORS y respuesta `201` del registro local. Toda salida debe validarse manualmente en el emulador antes de una entrega.
# Inicio de sesión después de cerrar el editor

El backend local se ejecuta en Docker, independiente de Visual Studio Code. Mantén Docker Desktop y PostgreSQL activos. Para arrancarlo desde esta carpeta:

```powershell
docker compose -f ../pasitos-backend/docker-compose.yml up -d --no-deps pasitos-backend
```

El puerto del host es `3001`; el emulador usa `http://10.0.2.2:3001/api`. La configuración `restart: unless-stopped` permite recuperar el contenedor al volver a iniciar Docker, salvo que se haya detenido explícitamente. No hace falta dejar una terminal abierta.

Las sesiones nuevas se conservan en PostgreSQL durante 24 horas y sobreviven a reinicios. Tras esta corrección hay que iniciar sesión una vez: los tokens anteriores, que solo existían en memoria, no se migran. El login ya no restablece cuentas ni contraseñas de prueba.

## Entrega de video — 2026-10-01

Guía completa: [docs/guia-video-tutorial.md](docs/guia-video-tutorial.md).

La app guarda rutinas, pasos y cumplimientos en PostgreSQL. Inicio y Seguimiento consultan el mismo progreso real. El detalle permite editar la rutina, añadir pasos y eliminarla con confirmación. Cerrar el IDE no borra archivos ni registros; Docker debe permanecer encendido para servir la API.

## Modo sin conexión

Inicia sesión con internet y abre las rutinas, el progreso propio y las páginas del historial que quieras consultar después. La app guarda esas consultas cifradas en el dispositivo y permite reabrirlas en modo avión mientras la sesión local siga vigente (hasta su expiración real y como máximo 24 horas desde la última validación).

El aviso «Sin conexión» y la última actualización identifican datos descargados. Las páginas no descargadas requieren internet. Crear rutinas puede quedar pendiente en el dispositivo; al reconectar se valida la sesión y se sincroniza. Completar/desmarcar actividades, editar/eliminar rutinas y gestionar acompañantes requieren conexión. Padres y docentes necesitan conexión para consultar estudiantes vinculados.

Cerrar sesión elimina los datos locales incluso sin internet. Si se perdió la respuesta de una creación, revisa el listado antes de confirmar un reintento, porque el servidor podría haberla guardado. Evidencia y límites de plataforma: [docs/evidence/offline-mode.md](docs/evidence/offline-mode.md).

En PowerShell, arrancar servicios existentes con `docker start pasitos-postgres pasitos-backend`. Si Java rechaza certificados TLS del antivirus al compilar, usar `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-android-local.ps1` después de build y cap:sync.
