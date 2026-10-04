# 007 · Cumplimiento del entorno móvil — Plan

1. Crear `network_security_config.xml` que habilite HTTP solo para `10.0.2.2`, usado por el emulador Android para llegar al host.
2. Asociar esa configuración al manifiesto y eliminar la habilitación global de tráfico claro.
3. Usar `setx` para agregar `platform-tools` al PATH del usuario; la nueva terminal validará `adb`.
4. Actualizar README con el stack, versiones detectadas, comandos, rutas de API, seguridad, limitaciones, evidencias y declaración de IA.
5. Verificar build Android y Capacitor sync.
