import { IonIcon, IonInput } from '@ionic/react';
import { chatbubbleEllipsesOutline, closeOutline, sendOutline } from 'ionicons/icons';
import { useId, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import AppButton from '../../../components/common/AppButton';
import { getChatbotReply } from '../lib/intents';
import './chatbot.css';

interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  text: string;
  action?: { label: string; path: string };
}

interface ChatbotWidgetProps {
  userName?: string;
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  text: 'Hola, soy tu asistente de Pasitos Mágicos. Pregúntame por tus rutinas, cómo crear una nueva, o cómo funcionan las estrellas.',
};

// Chatbot funcional local (sin backend de IA, sin claves): coincidencia de intenciones sobre
// texto — ver features/chatbot/lib/intents.ts. Habla exclusivamente de lo que la app ya sabe
// hacer (navegación a rutinas, explicación de puntos), nunca inventa datos del backend.
const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({ userName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const history = useHistory();
  const inputId = useId();
  const logId = useId();
  const inputRef = useRef<HTMLIonInputElement>(null);

  const sendMessage = (): void => {
    const text = draft.trim();
    if (!text) return;
    const userMessage: ChatMessage = { id: crypto.randomUUID(), role: 'user', text };
    const reply = getChatbotReply(text, { userName });
    const botMessage: ChatMessage = { id: crypto.randomUUID(), role: 'bot', text: reply.text, action: reply.action };
    setMessages(current => [...current, userMessage, botMessage]);
    setDraft('');
  };

  const handleSubmit = (event: React.FormEvent): void => {
    event.preventDefault();
    sendMessage();
  };

  const handleAction = (path: string): void => {
    setIsOpen(false);
    history.push(path);
  };

  return (
    <div className="chatbot">
      <AppButton
        className="chatbot__toggle"
        accessibleLabel={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
        aria-controls={logId}
      >
        <IonIcon icon={isOpen ? closeOutline : chatbubbleEllipsesOutline} aria-hidden="true" />
      </AppButton>

      {isOpen && (
        <section className="chatbot__panel" role="dialog" aria-label="Asistente de Pasitos Mágicos">
          <ul id={logId} className="chatbot__log" role="log" aria-live="polite">
            {messages.map(message => (
              <li key={message.id} className={`chatbot__message chatbot__message--${message.role}`}>
                <p>{message.text}</p>
                {message.action && (
                  <AppButton variant="secondary" onClick={() => handleAction(message.action!.path)}>
                    {message.action.label}
                  </AppButton>
                )}
              </li>
            ))}
          </ul>

          <form className="chatbot__form" onSubmit={handleSubmit}>
            <label htmlFor={inputId} className="ion-hide">Escribe tu pregunta</label>
            <IonInput
              id={inputId}
              ref={inputRef}
              value={draft}
              placeholder="Escribe tu pregunta..."
              onIonInput={event => setDraft(event.detail.value ?? '')}
              aria-label="Escribe tu pregunta"
            />
            <AppButton type="submit" accessibleLabel="Enviar mensaje">
              <IonIcon icon={sendOutline} aria-hidden="true" />
            </AppButton>
          </form>
        </section>
      )}
    </div>
  );
};

export default ChatbotWidget;
