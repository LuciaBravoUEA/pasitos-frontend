import { beginSessionChange } from '../../../services/auth/session-generation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Capacitor } from '@capacitor/core';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useHistory, useLocation } from 'react-router-dom';
import { IonSelect, IonSelectOption, IonText } from '@ionic/react';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/forms/AppInput';
import AppPage from '../../../components/layout/AppPage';
import { loginWithPassword, redirectToLogin, registerWithPassword } from '../../../services/api/endpoints/auth';
import {
  AuthenticationError,
  BusinessRuleError,
  getUserErrorMessage,
  ValidationError,
} from '../../../services/api/errorMapper';
import { setSessionToken } from '../../../services/storage/secureToken';
import { logger } from '../../../services/telemetry/logger';
import {
  loginFormSchema,
  registrationFormSchema,
  type LoginFormValues,
  type RegistrationFormValues,
} from '../../../validation/auth';
import AuthShell from '../components/AuthShell';
import { SESSION_QUERY_KEY } from '../hooks/useSession';
import './login-page.css';

// Web/dev (feature 002): sigue siendo el flujo OAuth existente contra Keycloak vía el proxy de
// Vite — nadie pidió cambiar eso, solo cómo se ve el login DENTRO de la app empaquetada.
const WebLogin: React.FC<{ hasAuthError: boolean }> = ({ hasAuthError }) => {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <AuthShell title="Te damos la bienvenida" description="Tu ayuda diaria para crear hábitos positivos y sencillos.">
      {hasAuthError && (
        <IonText className="auth-message auth-message--error" role="alert">
          <p>No se pudo completar el inicio de sesión. Intenta nuevamente.</p>
        </IonText>
      )}
      <AppButton
        expand="block"
        isLoading={isNavigating}
        onClick={() => {
          setIsNavigating(true);
          redirectToLogin();
        }}
      >
        Continuar
      </AppButton>
      <p className="auth-shell__privacy">Tus datos de acceso se procesan de forma segura.</p>
    </AuthShell>
  );
};

// Nativo (feature 003): formulario propio de usuario/contraseña — el backend habla con
// Keycloak por detrás, la app nunca abre un navegador ni una pantalla ajena.
const NativeLoginForm: React.FC<{ onRegister: () => void }> = ({ onRegister }) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { username: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues): Promise<void> => {
    setSubmitError(null);

    try {
      const { sessionToken } = await loginWithPassword(values.username, values.password);
      beginSessionChange();
      await queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
      await setSessionToken(sessionToken);
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    } catch (error) {
      const message =
        error instanceof AuthenticationError
          ? 'Usuario o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Intenta de nuevo.';
      logger.warn('Login nativo falló', { code: error instanceof AuthenticationError ? error.code : 'UNKNOWN' });
      setSubmitError(message);
    }
  };

  return (
    <AuthShell title="Inicia sesión" description="Estudiantes, padres y docentes ingresan aquí con su propia cuenta.">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Controller
          name="username"
          control={control}
          render={({ field, fieldState }) => (
            <AppInput label="Usuario" name="username" type="text" autocomplete="username" value={field.value} disabled={isSubmitting} clearOnEdit={false} error={fieldState.error?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />
          )}
        />

        <Controller name="password" control={control} render={({ field, fieldState }) => <NativePasswordField name="password" autoComplete="current-password" value={field.value} disabled={isSubmitting} error={fieldState.error?.message} onChange={field.onChange} onBlur={field.onBlur} />} />

        {submitError && (
          <IonText className="auth-message auth-message--error" role="alert" aria-live="polite">
            <p>{submitError}</p>
          </IonText>
        )}

        <AppButton expand="block" type="submit" isLoading={isSubmitting}>
          Iniciar sesión
        </AppButton>
      </form>
      <p className="auth-shell__privacy">Nunca compartiremos tus credenciales.</p>
      <AppButton variant="ghost" onClick={onRegister}>
        Crear una cuenta nueva
      </AppButton>
    </AuthShell>
  );
};

interface NativePasswordFieldProps {
  name: string;
  value: string;
  autoComplete: string;
  error?: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

const NativePasswordField: React.FC<NativePasswordFieldProps> = ({ name, value, autoComplete, error, disabled, onChange, onBlur }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="native-login-input">
      <label htmlFor={`auth-${name}`}>Contraseña</label>
      <div className="native-password-input">
        <input id={`auth-${name}`} name={name} type={visible ? 'text' : 'password'} inputMode="text" autoComplete={autoComplete} value={value} disabled={disabled} aria-label="Contraseña" aria-invalid={Boolean(error)} onChange={event => onChange(event.target.value)} onBlur={onBlur} />
        <button type="button" aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setVisible(current => !current)}>{visible ? 'Ocultar' : 'Mostrar'}</button>
      </div>
      {error && <span role="alert">{error}</span>}
    </div>
  );
};

const NativeRegisterForm: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    setError,
    formState: { isSubmitting },
  } = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: { name: '', username: '', email: '', password: '', role: 'estudiante' },
  });

  const onSubmit = async (values: RegistrationFormValues): Promise<void> => {
    setSubmitError(null);

    try {
      const { sessionToken } = await registerWithPassword(values);
      beginSessionChange();
      await queryClient.cancelQueries({ queryKey: SESSION_QUERY_KEY });
      await setSessionToken(sessionToken);
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
    } catch (error) {
      logger.warn('Registro nativo falló', { code: error instanceof Error ? error.name : 'UNKNOWN' });

      if (error instanceof ValidationError) {
        const registrationFields = new Set<keyof RegistrationFormValues>(['name', 'username', 'email', 'password', 'role']);
        error.details?.forEach(detail => {
          if (detail.field && registrationFields.has(detail.field as keyof RegistrationFormValues)) {
            setError(detail.field as keyof RegistrationFormValues, { message: detail.message });
          }
        });
        setSubmitError('Revisa los campos marcados y vuelve a intentarlo.');
        return;
      }

      if (error instanceof BusinessRuleError) {
        setSubmitError('Ese usuario o correo ya está registrado. Usa datos diferentes.');
        return;
      }

      setSubmitError(getUserErrorMessage(error));
    }
  };

  return (
    <AuthShell title="Crea tu cuenta" description="Elige tu perfil para crear rutinas o acompañar a tus estudiantes.">
      <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Controller name="role" control={control} render={({ field, fieldState }) => <>
          <IonSelect label="Tipo de cuenta" labelPlacement="stacked" fill="outline" value={field.value} disabled={isSubmitting} onIonChange={event => field.onChange(event.detail.value)} onIonBlur={field.onBlur} aria-label="Tipo de cuenta">
            <IonSelectOption value="estudiante">Estudiante</IonSelectOption>
            <IonSelectOption value="padre_familia">Padre/madre de familia</IonSelectOption>
            <IonSelectOption value="docente">Docente</IonSelectOption>
          </IonSelect>
          {fieldState.error && <p role="alert">{fieldState.error.message}</p>}
        </>} />
        <p>Padres y docentes podrán ver el progreso cuando el estudiante autorice el vínculo desde «Mis acompañantes».</p>
        <Controller name="name" control={control} render={({ field, fieldState }) => <AppInput label="Nombre" name="name" type="text" autocomplete="name" value={field.value} disabled={isSubmitting} clearOnEdit={false} error={fieldState.error?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />} />
        <Controller name="username" control={control} render={({ field, fieldState }) => <AppInput label="Usuario" name="username" type="text" autocomplete="username" value={field.value} disabled={isSubmitting} clearOnEdit={false} error={fieldState.error?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />} />
        <Controller name="email" control={control} render={({ field, fieldState }) => <AppInput label="Correo" name="email" type="email" autocomplete="email" value={field.value} disabled={isSubmitting} clearOnEdit={false} error={fieldState.error?.message} onIonInput={event => field.onChange(event.detail.value ?? '')} onIonBlur={field.onBlur} />} />
        <Controller name="password" control={control} render={({ field, fieldState }) => <NativePasswordField name="password" autoComplete="new-password" value={field.value} disabled={isSubmitting} error={fieldState.error?.message} onChange={field.onChange} onBlur={field.onBlur} />} />
        {submitError && <IonText className="auth-message auth-message--error" role="alert"><p>{submitError}</p></IonText>}
        <AppButton expand="block" type="submit" isLoading={isSubmitting}>Crear cuenta</AppButton>
      </form>
      <AppButton variant="ghost" onClick={onLogin}>Ya tengo una cuenta</AppButton>
    </AuthShell>
  );
};

const LoginPage: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  const isRegistering = location.pathname === '/registro';
  const hasAuthError = new URLSearchParams(location.search).get('error') === 'auth';

  return (
    <AppPage title="Iniciar sesión en Pasitos Mágicos" showHeader={false}>
      {Capacitor.isNativePlatform() ? (
        isRegistering
           ? <NativeRegisterForm onLogin={() => history.replace(`/login${location.search}`)} />
           : <NativeLoginForm onRegister={() => history.replace(`/registro${location.search}`)} />
      ) : <WebLogin hasAuthError={hasAuthError} />}
    </AppPage>
  );
};

export default LoginPage;
