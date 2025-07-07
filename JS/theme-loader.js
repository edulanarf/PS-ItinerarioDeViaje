import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

/**
 * Cargar y aplicar la configuración visual del usuario
 */
function loadUserVisualSettings() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const preferencesRef = doc(db, `users/${user.uid}/recommend-itineraries/preferences`);
        const docSnap = await getDoc(preferencesRef);
        
        if (docSnap.exists()) {
          const preferences = docSnap.data();
          const visualSettings = preferences.visualSettings || {
            theme: 'default',
            font: 'montserrat',
            darkMode: false
          };
          
          applyVisualSettings(visualSettings);
        } else {
          // Configuración por defecto si no existe
          applyVisualSettings({
            theme: 'default',
            font: 'montserrat',
            darkMode: false
          });
        }
      } catch (error) {
        console.error('Error al cargar configuración visual:', error);
        // Aplicar configuración por defecto en caso de error
        applyVisualSettings({
          theme: 'default',
          font: 'montserrat',
          darkMode: false
        });
      }
    } else {
      // Usuario no autenticado - aplicar configuración por defecto
      applyVisualSettings({
        theme: 'default',
        font: 'montserrat',
        darkMode: false
      });
    }
  });
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
  } else {
    document.documentElement.removeAttribute('data-dark');
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
