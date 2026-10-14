/** Validaciones del formulario "Editar perfil"; las mismas reglas aplica el backend. */
export type ProfileForm = { fullName: string; phone: string; documentNumber: string };
export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>;

export function validateProfile(form: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = form.fullName.trim();
  if (name.length === 0) errors.fullName = 'Ingresa tu nombre.';
  else if (name.length > 120) errors.fullName = 'Máximo 120 caracteres.';
  const phone = form.phone.trim();
  if (phone && !/^9\d{8}$/.test(phone)) errors.phone = 'Debe tener 9 dígitos y empezar con 9.';
  const dni = form.documentNumber.trim();
  if (dni && !/^\d{8}$/.test(dni)) errors.documentNumber = 'El DNI tiene 8 dígitos.';
  return errors;
}

export type PasswordForm = { current: string; next: string; confirm: string };

export function validatePasswordChange(form: PasswordForm): string | null {
  if (!form.current || !form.next || !form.confirm) return 'Completa los tres campos.';
  if (form.next.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres.';
  if (form.next.length > 72) return 'La nueva contraseña puede tener como máximo 72 caracteres.';
  if (form.next !== form.confirm) return 'La confirmación no coincide con la nueva contraseña.';
  if (form.next === form.current) return 'La nueva contraseña debe ser distinta de la actual.';
  return null;
}

/** Celular peruano de 9 dígitos en grupos de tres: 987 654 321. */
export function formatPhone(phone: string): string {
  return /^\d{9}$/.test(phone) ? phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3') : phone;
}
