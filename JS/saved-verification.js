export let saved = false;

// Función para actualizar el estado de 'saved'
export function setSaved(value) {
  saved = value;
}

// Función para obtener el estado de 'saved'
export function getSaved() {
  return saved;
}