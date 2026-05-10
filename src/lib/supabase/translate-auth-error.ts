/**
 * Maps Supabase auth-ui error/info messages (English) to Spanish.
 * Used by the login page MutationObserver to localize and re-style messages
 * the Auth UI component renders directly from the auth API response.
 */

export type AuthMessageKind = 'error' | 'info';

export interface TranslatedAuthMessage {
    text: string;
    kind: AuthMessageKind;
}

const ERROR_EXACT: Record<string, string> = {
    'Invalid login credentials': 'Correo o contraseña incorrectos',
    'Invalid email or password': 'Correo o contraseña incorrectos',
    'Email not confirmed': 'Correo no confirmado. Revisa tu bandeja de entrada',
    'User already registered': 'Este correo ya tiene una cuenta',
    'A user with this email address has already been registered': 'Este correo ya tiene una cuenta',
    'User not found': 'Usuario no encontrado',
    'Signups not allowed for this instance': 'Registro deshabilitado',
    'Email rate limit exceeded': 'Demasiados intentos. Espera unos minutos antes de reintentar',
    'Unable to validate email address: invalid format': 'Formato de correo inválido',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
    'Password should be at least 8 characters': 'La contraseña debe tener al menos 8 caracteres',
    'New password should be different from the old password':
        'La nueva contraseña debe ser distinta a la anterior',
    'Token has expired or is invalid': 'El enlace expiró o no es válido',
    'Auth session missing!': 'Tu sesión expiró. Inicia sesión de nuevo',
    'Network error': 'Error de red. Verifica tu conexión',
    'Failed to fetch': 'Error de red. Verifica tu conexión',
};

const INFO_EXACT: Record<string, string> = {
    'Check your email for the login link!': 'Revisa tu correo para el enlace de acceso',
    'Check your email for the password reset link':
        'Revisa tu correo para restablecer la contraseña',
    'Check your email for the confirmation link': 'Revisa tu correo para confirmar tu cuenta',
    'Your password has been updated': 'Tu contraseña fue actualizada',
};

const ERROR_PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [
        /^For security purposes, you can only request this after (\d+) seconds?\.?$/i,
        (m) => `Por seguridad, espera ${m[1]} segundos antes de reintentar`,
    ],
    [
        /^Password should be at least (\d+) characters?\.?$/i,
        (m) => `La contraseña debe tener al menos ${m[1]} caracteres`,
    ],
    [
        /^Email rate limit exceeded.*$/i,
        () => 'Demasiados intentos. Espera unos minutos antes de reintentar',
    ],
    [/.*invalid.*credentials.*/i, () => 'Correo o contraseña incorrectos'],
    [/.*email.*not.*confirmed.*/i, () => 'Correo no confirmado. Revisa tu bandeja de entrada'],
    [/.*already.*registered.*/i, () => 'Este correo ya tiene una cuenta'],
    [/.*rate limit.*/i, () => 'Demasiados intentos. Espera unos minutos antes de reintentar'],
];

const INFO_PATTERNS: Array<[RegExp, (m: RegExpMatchArray) => string]> = [
    [/check your email/i, () => 'Revisa tu correo para continuar'],
];

export function translateAuthMessage(message: string): TranslatedAuthMessage | null {
    const trimmed = message.trim();
    if (!trimmed) return null;

    if (ERROR_EXACT[trimmed]) return { text: ERROR_EXACT[trimmed], kind: 'error' };
    if (INFO_EXACT[trimmed]) return { text: INFO_EXACT[trimmed], kind: 'info' };

    for (const [pattern, build] of ERROR_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) return { text: build(match), kind: 'error' };
    }
    for (const [pattern, build] of INFO_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) return { text: build(match), kind: 'info' };
    }

    return null;
}

/**
 * Heuristic: anything that looks like an auth message (short, sentence-like, in the
 * form's message slot) but didn't match a known mapping. We still want to flag it as
 * an error so the brutalist styling applies — even untranslated.
 */
export function classifyUnknownMessage(message: string): AuthMessageKind {
    return /check your email|revisa tu correo|sent|enviado/i.test(message) ? 'info' : 'error';
}
