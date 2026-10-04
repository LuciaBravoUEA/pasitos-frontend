import { z } from 'zod';

// Solo mejora UX (feedback inmediato) — el backend es quien realmente valida las credenciales.
export const loginFormSchema = z.object({
  username: z.string().min(1, 'El usuario es obligatorio'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registrationFormSchema = z.object({
  role: z.enum(['estudiante', 'padre_familia', 'docente'], { error: 'Elige un perfil válido' }).optional(),
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  username: z.string().trim().min(1, 'El usuario es obligatorio'),
  email: z.string().trim().email('Ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export type RegistrationFormValues = z.infer<typeof registrationFormSchema>;
