# 018 · Modo sin conexión — Plan

## Enfoque

Extender la base de 010 al arranque nativo y a consultas propias de seguimiento/historial. Mantener al backend como autoridad y no calcular cumplimientos ni recompensas localmente. Alcance confirmado por el usuario; implementación y validación Android completadas; recorrido iOS pendiente en macOS/Xcode.

## Implementación

1. Contrastar sesión, expiración y consultas con código del backend en lectura; definir vigencia local y política de almacenamiento de datos educativos.
2. Revisar `services/storage/secureToken.ts` y crear un servicio cifrado de snapshot de identidad sin almacenar contraseñas. Evaluar almacenamiento cifrado adecuado para caché educativa según volumen; no reutilizar IndexedDB en claro para datos sensibles.
3. Ajustar orquestación de sesión en `features/auth/hooks/useSession.ts` y guards: distinguir arranque offline con snapshot vigente, falta de credenciales y rechazo remoto. No conceder permisos nuevos desde datos locales.
4. Centralizar conectividad en un servicio transversal; evaluar señal nativa de Capacitor para Android/iOS. La disponibilidad de red no garantiza que el API sea accesible: contemplar NetworkError/TimeoutError y cancelar requests.
5. Extender servicios locales/repositorios para progreso propio e historial paginado. Claves por cuenta, fecha, página y filtros; Zod, versión, retención y fecha de descarga. Conservar metadatos reales de rutinas.
6. Conectar hooks de seguimiento con repositorios y mostrar estado offline/última actualización en Home, Rutinas e Historial; bloquear operaciones fuera del alcance.
7. Validar sesión al reconectar y coordinar la cola existente con limpieza de logout/cambio de cuenta. Revisar carreras, límites y respuesta perdida de POST sin asumir idempotencia no documentada.
8. Actualizar inventario de almacenamiento y evidencia de modo avión. Ejecutar checks obligatorios y pruebas nativas; actualizar roadmap al completar.

## Decisiones

- Vigencia: mínimo entre `exp * 1000` recibido de `/auth/session` y 24 horas desde la validación remota. Snapshot enlazado a la credencial exacta en SecureStorage; un token nuevo no reutiliza identidad anterior.
- Cada sesión perdida cambia la revisión de su query y retira consultas de negocio/identidad anteriores desde el ciclo global de la app. Logout retira primero las credenciales y cancela solicitudes antes de anunciar la salida; evita que páginas conservadas por Ionic restauren datos antiguos desde memoria.
- Caché nativa: IndexedDB con valores AES-GCM, nonce aleatorio por escritura y clave de 256 bits en SecureStorage. Identificador de cuenta/recurso como datos autenticados; migración cifrada de los registros existentes sin reasignarlos. No se migran preferencias antiguas sin dueño a cuentas nativas.
- Conectividad: eventos online/offline del WebView, validados en emulador, junto con errores NetworkError/TimeoutError y ciclo nativo App. No se añade una dependencia de red solo para duplicar señales disponibles. La sesión se consulta al reconectar/reanudar antes de sincronizar.
- Respuestas perdidas de creación: se conserva una marca de resultado incierto y se detienen los reenvíos automáticos; el reintento manual advierte del riesgo de duplicado y requiere confirmación en la app.

- Consulta propia offline en la primera etapa: permisos de adultos pueden revocarse mientras no hay conexión; exigir acceso remoto para consultar estudiantes vinculados.
- Sin cola nueva de cumplimientos: el historial actual registra transiciones efectivas con hora del servidor; enviar operaciones tardías exige definir conflictos antes de prometer ese comportamiento.
- Sesión local limitada: una revocación remota no puede detectarse en modo avión; documentar la ventana de acceso y exigir validación al reconectar.

## Riesgos

- Datos sensibles en dispositivo: almacenamiento cifrado, retención limitada y eliminación al salir.
- Respuesta perdida al crear: el API no documenta clave de idempotencia; no reintentar ciegamente ni prometer ausencia de duplicados.
- Datos obsoletos: etiquetas visibles y sin recalcular progreso del servidor.
