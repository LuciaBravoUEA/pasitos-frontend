# 007 · Cumplimiento del entorno móvil

**Estado:** propuesta

## Objetivo

Completar y documentar los requisitos de entorno, seguridad de red, Android y evidencias para la aplicación móvil Pasitos Mágicos.

## Alcance

1. Limitar el tráfico HTTP local de Android mediante una configuración de seguridad de red, sin habilitar tráfico claro global.
2. Agregar `platform-tools` del Android SDK al `PATH` del usuario para habilitar `adb`.
3. Documentar versiones, framework, dependencias, API, requisitos, limitaciones, evidencias y uso de IA en README.
4. Documentar el procedimiento manual para hot reload, capturas, extensiones y la alternativa iOS en macOS/CI.

## Criterios de aceptación

- [ ] El manifiesto Android no usa `usesCleartextTraffic="true"` global.
- [ ] Solo el backend local de desarrollo puede usar HTTP; producción requiere HTTPS.
- [ ] `adb version` funciona desde una terminal nueva.
- [ ] README registra versiones instaladas y comandos verificables.
- [ ] README incluye una tabla de evidencias y limitaciones.
- [ ] Se documenta que iOS requiere macOS/Xcode o CI macOS.

## Fuera de alcance

- Instalar Xcode en un equipo Windows.
- Crear capturas manuales por el usuario.
- Publicar la aplicación o desplegar un backend HTTPS.
