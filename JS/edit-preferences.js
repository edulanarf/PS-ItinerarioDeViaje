import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

let currentUser, geocoder;
// Inicializar preferences con valores por defecto inmediatamente
let preferences = {
  categories: ["Restaurante", "Cafetería"],
  duration: {
    from: 1,
    to: 3
  },
  cost: {
    from: 0,
    to: 1000
  },
  cities: [
    {
      name: "Madrid, España",
      place_id: "ChIJgTwKgJcpQg0RaSKMYcHeNsQ",
      lat: 40.41672790000001,
      lng: -3.7032905,
    },
    {
      name: "Barcelona, España",
      place_id: "ChIJ5TCOcRaYpBIRCmZHTz37sEQ",
      lat: 41.3873974,
      lng: 2.168568,
    },
  ],
  // Configuración de personalización visual por defecto
  visualSettings: {
    theme: 'default',
    font: 'montserrat',
    darkMode: false
  }
};

// Variable para rastrear si el DOM está listo
let domReady = false;
let authReady = false;

// Función para inicializar cuando tanto el DOM como la autenticación estén listos
function initializeWhenReady() {
  if (domReady && authReady) {
    console.log('Both DOM and auth ready, initializing...');
    initializeVisualCustomization();
    setupFormEvents();
  }
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    try {
      await loadPreferences(user);
      fillPreferencesForm();
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Usar valores por defecto si hay error
      fillPreferencesForm();
    }
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
  authReady = true;
  initializeWhenReady();
});

// Usar DOMContentLoaded en lugar de load
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready');
  domReady = true;
  initializeWhenReady();
});

function loadPreferences(user) {
  return new Promise((resolve, reject) => {
    let preferencesRef = doc(db, `users/${user.uid}/recommend-itineraries/preferences`);
    getDoc(preferencesRef).then(docSnap => {
      if (docSnap.exists()) {
        const loadedPreferences = docSnap.data();
        // Fusionar con valores por defecto para asegurar que todas las propiedades existan
        preferences = {
          ...preferences,
          ...loadedPreferences,
          visualSettings: {
            ...preferences.visualSettings,
            ...(loadedPreferences.visualSettings || {})
          }
        };
      }
      // Si no existe, usar los valores por defecto ya inicializados
      resolve(preferences);
    }).catch(error => {
      console.error('Error loading preferences from Firebase:', error);
      
      // Manejar errores específicos
      if (error.code === 'failed-precondition') {
        console.warn('Firebase client is offline, using default preferences');
      } else if (error.code === 'unavailable') {
        console.warn('Firebase service unavailable, using default preferences');
      } else {
        console.error('Unexpected error loading preferences:', error);
      }
      
      // En caso de error, usar valores por defecto
      resolve(preferences);
    });
  });
}

function fillPreferencesForm() {
  if (!preferences) {
    console.warn('Preferences not loaded yet');
    return;
  }
  
  // Verificar que las propiedades existan antes de usarlas
  if (preferences.categories && Array.isArray(preferences.categories)) {
    preferences.categories.forEach(category => {
      const checkbox = document.querySelector(`#edit-preferences-form .categories input[value="${category}"]`);
      if (checkbox) checkbox.checked = true;
    });
  }
  
  if (preferences.duration) {
    const fromDuration = document.querySelector('#edit-preferences-form [name="from-duration"]');
    const toDuration = document.querySelector('#edit-preferences-form [name="to-duration"]');
    if (fromDuration) fromDuration.value = preferences.duration.from || 1;
    if (toDuration) toDuration.value = preferences.duration.to || 3;
  }
  
  if (preferences.cost) {
    const fromCost = document.querySelector('#edit-preferences-form [name="from-cost"]');
    const toCost = document.querySelector('#edit-preferences-form [name="to-cost"]');
    if (fromCost) fromCost.value = preferences.cost.from || 0;
    if (toCost) toCost.value = preferences.cost.to || 1000;
  }
  
  refreshSelectedLocations();
  
  // Aplicar configuración visual
  applyVisualSettings();
}

function refreshSelectedLocations() {
  if (!preferences || !preferences.cities) {
    console.warn('Preferences or cities not loaded yet');
    return;
  }
  
  let selectedLocations = document.querySelector('.selected-locations');
  if (!selectedLocations) return;
  
  selectedLocations.innerHTML = '';
  preferences.cities.forEach(city => {
    let el = document.createElement('div');
    el.innerHTML = `<span>${city.name}</span><a href="#" data-place_id="${city.place_id}" data-lat="${city.lat}" data-lng="${city.lng}" data-name="${city.name}"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"></path></svg></a>`;
    selectedLocations.append(el);
  });
}

function setupFormEvents() {
  document.querySelector('#edit-preferences-form').addEventListener('submit',e=>{
    e.preventDefault();
    e.stopPropagation();
    
    if (!preferences) {
      console.error('Preferences not loaded yet');
      alert('Error: Las preferencias no se han cargado correctamente. Por favor, recarga la página.');
      return false;
    }
    
    preferences.categories = Array.from(
      document.querySelectorAll("#edit-preferences-form .categories input"),
    )
      .filter((el) => el.checked)
      .map((el) => el.value);
    preferences.duration = {
      from: document.querySelector('#edit-preferences-form [name="from-duration"]').value,
      to: document.querySelector('#edit-preferences-form [name="to-duration"]').value,
    }
    preferences.cost = {
      from: document.querySelector('#edit-preferences-form [name="from-cost"]').value,
      to: document.querySelector('#edit-preferences-form [name="to-cost"]').value,
    }
    
    if (currentUser) {
      let preferencesRef = doc(db, `users/${currentUser.uid}/recommend-itineraries/preferences`);
      setDoc(preferencesRef, preferences).then(() => alert('Preferences updated.')).catch(error => {
        console.error('Error saving preferences:', error);
        alert('Error al guardar las preferencias. Por favor, intenta de nuevo.');
      });
    } else {
      alert('Error: Usuario no autenticado');
    }
    return false;
  });
  geocoder = new google.maps.Geocoder();
  let timeout;
  document
    .querySelector("#locations-search")
    .addEventListener("keyup", function (_) {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        timeout = undefined;
        geocoder.geocode({ address: this.value }, (results, status) => {
          if (status === "OK") {
            results = results.filter(result => result.types.includes('locality'));
            setFoundLocations(
              results.map((result) => ({
                name: result.formatted_address,
                place_id: result.place_id,
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              })),
            );
          }
        });
      }, 500);
    });
  document.querySelector('.locations-list').addEventListener('click',e=>{
    if (e.target.tagName !== 'A') return;
    if (!preferences || !preferences.cities) {
      console.warn('Preferences or cities not loaded yet');
      return;
    }
    if(preferences.cities.find(city => city.place_id === e.target.dataset.place_id)) return;
    preferences.cities.push({
      place_id: e.target.dataset.place_id,
      name: e.target.dataset.name,
      lat: e.target.dataset.lat,
      lng: e.target.dataset.lng
    });
    refreshSelectedLocations();
  });
  document.querySelector('.selected-locations').addEventListener('click',e=>{
    let a = e.target.tagName === 'A' ? e.target : e.target.closest('a');
    if (a.tagName !== 'A') return;
    if (!preferences || !preferences.cities) {
      console.warn('Preferences or cities not loaded yet');
      return;
    }
    preferences.cities = preferences.cities.filter(city => city.place_id !== a.dataset.place_id);
    refreshSelectedLocations();
  });
}

function setFoundLocations(results) {
  let html = "";
  let template = `
  <a href="#" data-place_id="{place_id}" data-lat="{lat}" data-lng="{lng}" data-name="{placename}">{placename}</a>
  `;
  results.forEach((result) => {
    html += template
      .replace("{place_id}", result.place_id)
      .replace(/{placename}/g, result.name)
      .replace(/{lat}/g, result.lat)
      .replace(/{lng}/g, result.lng);
  });
  let list = document.querySelector(".locations-list");
  list.innerHTML = html;
  if (list.children.length > 0) {
    list.classList.remove('hidden');
  } else {
    list.classList.add('hidden');
  }
}

// ===== FUNCIONES DE PERSONALIZACIÓN VISUAL =====

/**
 * Aplicar configuración visual guardada
 */
function applyVisualSettings() {
  if (!preferences) {
    console.warn('Preferences not loaded yet');
    return;
  }
  
  const settings = preferences.visualSettings || {
    theme: 'default',
    font: 'montserrat',
    darkMode: false
  };
  
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
  
  // Actualizar UI
  updateVisualUI(settings);
}

/**
 * Actualizar la interfaz de usuario de personalización
 */
function updateVisualUI(settings) {
  // Actualizar selector de colores
  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.theme === settings.theme) {
      option.classList.add('selected');
    }
  });
  
  // Actualizar selector de tipografía
  const typographyOptions = document.querySelectorAll('.typography-option');
  typographyOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.dataset.font === settings.font) {
      option.classList.add('selected');
    }
  });
  
  // Actualizar toggle de modo oscuro
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.checked = settings.darkMode;
  }
}

/**
 * Cambiar tema de colores
 */
function changeTheme(theme) {
  if (!preferences || !preferences.visualSettings) {
    console.warn('Preferences or visualSettings not loaded yet');
    return;
  }
  
  document.documentElement.setAttribute('data-theme', theme);
  preferences.visualSettings.theme = theme;
  saveVisualSettings();
}

/**
 * Cambiar tipografía
 */
function changeFont(font) {
  if (!preferences || !preferences.visualSettings) {
    console.warn('Preferences or visualSettings not loaded yet');
    return;
  }
  
  document.documentElement.setAttribute('data-font', font);
  preferences.visualSettings.font = font;
  saveVisualSettings();
}

/**
 * Cambiar modo oscuro
 */
function toggleDarkMode(enabled) {
  if (!preferences || !preferences.visualSettings) {
    console.warn('Preferences or visualSettings not loaded yet');
    return;
  }
  
  if (enabled) {
    document.documentElement.setAttribute('data-dark', 'true');
  } else {
    document.documentElement.removeAttribute('data-dark');
  }
  preferences.visualSettings.darkMode = enabled;
  saveVisualSettings();
}

/**
 * Guardar configuración visual en Firebase
 */
function saveVisualSettings() {
  if (!currentUser) {
    console.warn('No user authenticated');
    return;
  }
  
  if (!preferences) {
    console.warn('Preferences not loaded yet');
    return;
  }
  
  const preferencesRef = doc(db, `users/${currentUser.uid}/recommend-itineraries/preferences`);
  setDoc(preferencesRef, preferences, { merge: true }).then(() => {
    console.log('Configuración visual guardada');
  }).catch(error => {
    console.error('Error al guardar configuración visual:', error);
    
    // Manejar errores específicos
    if (error.code === 'failed-precondition') {
      console.warn('Firebase client is offline, configuration will be saved when connection is restored');
    } else if (error.code === 'unavailable') {
      console.warn('Firebase service unavailable, configuration will be saved when service is available');
    } else {
      console.error('Unexpected error saving visual settings:', error);
    }
  });
}

/**
 * Inicializar eventos de personalización visual
 */
function initializeVisualCustomization() {
  // Eventos para selector de colores
  const colorOptions = document.querySelectorAll('.color-option');
  colorOptions.forEach(option => {
    option.addEventListener('click', () => {
      const theme = option.dataset.theme;
      changeTheme(theme);
      
      // Actualizar UI
      colorOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
    });
  });
  
  // Eventos para selector de tipografía
  const typographyOptions = document.querySelectorAll('.typography-option');
  typographyOptions.forEach(option => {
    option.addEventListener('click', () => {
      const font = option.dataset.font;
      changeFont(font);
      
      // Actualizar UI
      typographyOptions.forEach(opt => opt.classList.remove('selected'));
      option.classList.add('selected');
    });
  });
  
  // Evento para toggle de modo oscuro
  const darkModeToggle = document.getElementById('dark-mode-toggle');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', (e) => {
      toggleDarkMode(e.target.checked);
    });
  }
}