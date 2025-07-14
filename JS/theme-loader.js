
/**
 * Cargar y aplicar la configuración visual del usuario desde localStorage
 */
function loadUserVisualSettings() {
  // Intentar cargar de localStorage
  const localPrefs = localStorage.getItem('preferences');
  let visualSettings = {
    theme: 'default',
    font: 'montserrat',
    darkMode: false
  };
  if (localPrefs) {
    try {
      const preferences = JSON.parse(localPrefs);
      if (preferences.visualSettings) {
        visualSettings = {
          ...visualSettings,
          ...preferences.visualSettings
        };
      }
    } catch (e) {
      console.warn('Preferencias visuales locales corruptas, usando por defecto');
    }
  }
  applyVisualSettings(visualSettings);
}

/**
 * Aplicar configuración visual al documento
 */
function applyVisualSettings(settings) {
  // Aplicar tema
  document.documentElement.setAttribute('data-theme', settings.theme);
  
  // Aplicar tipografía
  document.documentElement.setAttribute('data-font', settings.font);
  
  // Aplicar modo oscuro
  if (settings.darkMode) {
    document.documentElement.setAttribute('data-dark', 'true');
  } else {
    document.documentElement.removeAttribute('data-dark');
  }
  
  console.log('Configuración visual aplicada:', settings);
}

/**
 * Obtener configuración visual actual
 */
function getCurrentVisualSettings() {
  return {
    theme: document.documentElement.getAttribute('data-theme') || 'default',
    font: document.documentElement.getAttribute('data-font') || 'montserrat',
    darkMode: document.documentElement.hasAttribute('data-dark')
  };
}

/**
 * Cambiar tema de colores
 */
function changeTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  console.log('Tema cambiado a:', theme);
}

/**
 * Cambiar tipografía
 */
function changeFont(font) {
  document.documentElement.setAttribute('data-font', font);
  console.log('Tipografía cambiada a:', font);
}

/**
 * Cambiar modo oscuro
 */
function toggleDarkMode(enabled) {
  if (enabled) {
    document.documentElement.setAttribute('data-dark', 'true');
    document.documentElement.setAttribute('data-dark-forced', '');
    // Cargar CSS de modo oscuro forzado si no está cargado
    if (!document.getElementById('dark-mode-forced-css')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/CSS/dark-mode-forced.css';
      link.id = 'dark-mode-forced-css';
      document.head.appendChild(link);
    }
  } else {
    document.documentElement.removeAttribute('data-dark');
    document.documentElement.removeAttribute('data-dark-forced');
    // Quitar CSS de modo oscuro forzado si está cargado
    const link = document.getElementById('dark-mode-forced-css');
    if (link) link.remove();
  }
  console.log('Modo oscuro:', enabled ? 'activado' : 'desactivado');
}

// Cargar configuración visual cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadUserVisualSettings);
} else {
  loadUserVisualSettings();
}

// Exportar funciones para uso en otros módulos
export {
    applyVisualSettings, changeFont, changeTheme, getCurrentVisualSettings, loadUserVisualSettings, toggleDarkMode
};
