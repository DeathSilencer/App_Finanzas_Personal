/**
 * Formateador de moneda MXN consistente en toda la aplicación.
 */
export function fmt(value) {
  const n = Number(value || 0);
  return `$${n.toLocaleString('es-MX', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

/**
 * Retorna la fecha de hoy en formato YYYY-MM-DD para inputs tipo date.
 */
export function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Retorna el nombre del día de la semana en español.
 */
export function getDiaSemana(fechaStr) {
  if (!fechaStr) return "Lunes";
  const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const partes = fechaStr.split("-");
  if (partes.length === 3) {
    const d = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
    return dias[d.getDay()];
  }
  return "Lunes";
}
