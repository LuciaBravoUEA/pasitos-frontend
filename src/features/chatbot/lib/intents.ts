export interface ChatbotAction {
  label: string;
  path: string;
}

export interface ChatbotReply {
  text: string;
  action?: ChatbotAction;
}

export interface ChatbotContext {
  userName?: string;
}

interface Intent {
  id: string;
  keywords: string[];
  respond: (context: ChatbotContext) => ChatbotReply;
}

// Chatbot 100% local: coincidencia de palabras clave, sin red ni claves embebidas — ver
// spec/features/010-cliente-http-datos-chatbot/spec.md §9. No sustituye soporte humano, solo
// orienta dentro de las pantallas ya existentes de la app.
const INTENTS: Intent[] = [
  {
    id: 'saludo',
    keywords: ['hola', 'buenas', 'hey', 'holi'],
    respond: context => ({
      text: context.userName
        ? `¡Hola, ${context.userName}! ¿Quieres ver tus rutinas, crear una nueva o entender cómo funcionan las estrellas?`
        : '¡Hola! ¿Quieres ver tus rutinas, crear una nueva o entender cómo funcionan las estrellas?',
    }),
  },
  {
    id: 'ver_rutinas',
    keywords: ['rutina', 'rutinas', 'tarea', 'tareas', 'actividades'],
    respond: () => ({
      text: 'Aquí puedes ver todas tus rutinas guardadas.',
      action: { label: 'Ir a mis rutinas', path: '/rutinas' },
    }),
  },
  {
    id: 'crear_rutina',
    keywords: ['crear', 'nueva', 'agregar', 'añadir', 'sumar'],
    respond: () => ({
      text: 'Vamos a crear una rutina nueva. Elige un título corto y claro.',
      action: { label: 'Crear rutina', path: '/rutinas/nueva' },
    }),
  },
  {
    id: 'puntos',
    keywords: ['punto', 'puntos', 'estrella', 'estrellas', 'premio', 'recompensa'],
    respond: () => ({
      text: 'Cada rutina que completas te da estrellas. Entre más constante seas, más estrellas juntas para celebrar tu esfuerzo.',
    }),
  },
  {
    id: 'inicio',
    keywords: ['inicio', 'home', 'principal'],
    respond: () => ({
      text: 'Te llevo a la pantalla principal.',
      action: { label: 'Ir al inicio', path: '/home' },
    }),
  },
  {
    id: 'ayuda',
    keywords: ['ayuda', 'no entiendo', 'como funciona', 'cómo funciona'],
    respond: () => ({
      text: 'Puedo ayudarte a: ver tus rutinas, crear una rutina nueva, o explicarte cómo funcionan las estrellas. Escribe, por ejemplo, "crear rutina".',
    }),
  },
];

const DEFAULT_REPLY: ChatbotReply = {
  text: 'No estoy seguro de haber entendido. Prueba con "rutinas", "crear rutina" o "puntos".',
};

const normalize = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const getChatbotReply = (message: string, context: ChatbotContext = {}): ChatbotReply => {
  const normalized = normalize(message);
  const matched = INTENTS.find(intent => intent.keywords.some(keyword => normalized.includes(normalize(keyword))));
  return matched ? matched.respond(context) : DEFAULT_REPLY;
};
