import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pasitosmagicos.app',
  appName: 'Pasitos Mágicos',
  webDir: 'dist',
  server: {
    // Por defecto Android sirve el WebView en https://localhost, y el navegador bloquea por
    // Mixed Content cualquier llamada XHR/fetch a un backend en http:// (aunque sea solo de
    // desarrollo local) — todas las llamadas a la API quedaban bloqueadas en silencio.
    // http:// para el origen local no baja seguridad real (son archivos empaquetados, no
    // tráfico de red) y sigue permitiendo llamar a un backend real en https:// sin problema.
    androidScheme: 'http',
  },
  plugins: {
    Keyboard: {
      resizeOnFullScreen: true,
    },
    // El canal real ("routine-reminders") se crea en tiempo de ejecución, la primera vez que
    // alguien activa un recordatorio — ver services/device/routineReminders.ts. Sin `smallIcon`
    // propio (no hay un drawable dedicado todavía): el plugin usa el ícono por defecto de la app.
    LocalNotifications: {
      iconColor: '#3880ff',
    },
  },
};

export default config;
