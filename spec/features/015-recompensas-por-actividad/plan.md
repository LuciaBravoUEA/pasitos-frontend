# Plan

1. Servicio Web Audio reutilizable: preparar el contexto desde el gesto del usuario y reproducir solo tras éxito remoto. Sin archivos externos ni nuevas dependencias. Capturar errores de audio.
2. Preferencia de sonido mediante Preferences para datos no sensibles, compartida con Zustand y carga protegida frente a cambios del usuario.
3. Hook y componente comunes para feedback de tareas. Mensaje visual con estrella, animación breve sin bucles y alternativa para movimiento reducido. Cerrar al salir de la vista Ionic.
4. Integrar en los dos puntos actuales de cumplimiento; conservar la mutación y sus invalidaciones.
5. Tests de éxito/error/desmarcado/silencio y persistencia. Actualizar guía y roadmap, construir e instalar sin borrar datos.
