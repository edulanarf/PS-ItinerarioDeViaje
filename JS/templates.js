import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { auth } from "./firebase-config.js";
import { TemplateManager } from './template-manager.js';

let currentUserId = null;
let selectedTemplateId = null;
let isInitialized = false;
let templateData = {};

// Variables para el autocompletado de ciudades
let cityAutocomplete = null;
let selectedCity = null;

// Hacer las funciones disponibles globalmente INMEDIATAMENTE
window.createSmartTemplate = function() {
    console.log('Creando plantilla inteligente...');
    
    try {
        if (!currentUserId) {
            showError('No hay usuario autenticado');
            return;
        }

        // Recolectar datos del formulario
        templateData = collectTemplateData();
        
        if (!templateData.name || !templateData.city || !templateData.days) {
            showError('Por favor completa todos los campos requeridos');
            return;
        }

        const smartTemplate = generateSmartTemplateStructure(templateData);
        
        if (!smartTemplate) {
            showError('Error al generar la estructura de la plantilla');
            return;
        }
        
        const success = TemplateManager.saveAsTemplate(currentUserId, smartTemplate);
        
        if (success) {
            showSuccess('¡Plantilla inteligente creada exitosamente!');
            closeSmartTemplateModal();
            loadTemplates(); // Recargar la lista
        } else {
            showError('Error al crear la plantilla inteligente');
        }
    } catch (error) {
        console.error('Error al crear plantilla inteligente:', error);
        showError('Error al crear la plantilla inteligente');
    }
};

window.createManualTemplate = async function() {
    try {
        if (!currentUserId) {
            showError('No hay usuario autenticado. Por favor, inicia sesión.');
            return;
        }
        
        // Solicitar número de días al usuario
        const daysInput = prompt('¿Cuántos días va a durar tu viaje? (1-30):');
        if (!daysInput) return;
        
        const days = parseInt(daysInput);
        if (isNaN(days) || days < 1 || days > 30) {
            showError('Por favor ingresa un número válido entre 1 y 30');
            return;
        }
        
        // Solicitar nombre de la plantilla
        const nameInput = prompt('Nombre de la plantilla:');
        if (!nameInput || nameInput.trim() === '') {
            showError('Por favor ingresa un nombre para la plantilla');
            return;
        }
        
        const manualTemplate = {
            id: `manual_template_${Date.now()}`,
            title: nameInput.trim(),
            description: `Plantilla manual de ${days} días`,
            createdAt: new Date().toISOString(),
            isTemplate: true,
            isManualTemplate: true,
            city: "Ciudad a definir",
            itineraries: []
        };

        // Generar días vacíos
        for (let i = 1; i <= days; i++) {
            const dayPlaces = [];
            
            // Solo agregar hotel y aeropuerto en el primer y último día
            if (i === 1) {
                dayPlaces.push({
                    name: "Hotel (a definir)",
                    photo: "https://via.placeholder.com/200",
                    price: 0,
                    rating: "0.0",
                    address: "Dirección a definir",
                    id: `hotel_manual_${Date.now()}_${i}`,
                    category: "Hotel",
                    lat: 0,
                    lng: 0,
                    arrivalTime: null,
                    departureTime: null
                });
                
                dayPlaces.push({
                    name: "Aeropuerto (a definir)",
                    photo: "https://via.placeholder.com/200",
                    price: 0,
                    rating: "0.0",
                    address: "Aeropuerto a definir",
                    id: `airport_manual_${Date.now()}_${i}`,
                    category: "Aeropuerto",
                    lat: 0,
                    lng: 0,
                    arrivalTime: null,
                    departureTime: null
                });
            } else if (i === days) {
                dayPlaces.push({
                    name: "Aeropuerto (a definir)",
                    photo: "https://via.placeholder.com/200",
                    price: 0,
                    rating: "0.0",
                    address: "Aeropuerto a definir",
                    id: `airport_manual_${Date.now()}_${i}`,
                    category: "Aeropuerto",
                    lat: 0,
                    lng: 0,
                    arrivalTime: null,
                    departureTime: null
                });
            }
            
            manualTemplate.itineraries.push({
                name: `Día ${i}`,
                date: null,
                places: dayPlaces
            });
        }

        const success = TemplateManager.saveAsTemplate(currentUserId, manualTemplate);
        
        if (success) {
            showSuccess('Plantilla manual creada correctamente');
            await loadTemplates(); // Recargar la lista
        } else {
            showError('Error al crear la plantilla manual');
        }
    } catch (error) {
        console.error('Error al crear plantilla manual:', error);
        showError('Error al crear la plantilla manual');
    }
};

// Función global para crear plantilla de prueba (debe estar antes de setupEventListeners)
window.createTestTemplate = async function() {
    try {
        if (!currentUserId) {
            showError('No hay usuario autenticado. Por favor, inicia sesión.');
            return;
        }
        
        const testTemplate = {
            id: `template_${Date.now()}`,
            title: "Plantilla de Viaje (7 días)",
            description: "Plantilla de ejemplo para un viaje de 7 días",
            createdAt: new Date().toISOString(),
            isTemplate: true,
            city: "Madrid", // Ciudad de ejemplo
            itineraries: [
                {
                    name: "Día 1",
                    date: null,
                    places: [
                        {
                            name: "Hotel en Madrid",
                            photo: "https://via.placeholder.com/200",
                            price: 0,
                            rating: "4.5",
                            address: "Madrid",
                            id: `hotel_${Date.now()}_1`,
                            category: "Hotel",
                            lat: 0,
                            lng: 0,
                            arrivalTime: null,
                            departureTime: null
                        },
                        {
                            name: "Aeropuerto de Madrid",
                            photo: "https://via.placeholder.com/200",
                            price: 0,
                            rating: "4.0",
                            address: "Madrid",
                            id: `airport_${Date.now()}_1`,
                            category: "Aeropuerto",
                            lat: 0,
                            lng: 0,
                            arrivalTime: null,
                            departureTime: null
                        }
                    ]
                },
                {
                    name: "Día 2",
                    date: null,
                    places: []
                },
                {
                    name: "Día 3",
                    date: null,
                    places: []
                },
                {
                    name: "Día 4",
                    date: null,
                    places: []
                },
                {
                    name: "Día 5",
                    date: null,
                    places: []
                },
                {
                    name: "Día 6",
                    date: null,
                    places: []
                },
                {
                    name: "Día 7",
                    date: null,
                    places: [
                        {
                            name: "Aeropuerto de Madrid",
                            photo: "https://via.placeholder.com/200",
                            price: 0,
                            rating: "4.0",
                            address: "Madrid",
                            id: `airport_${Date.now()}_7`,
                            category: "Aeropuerto",
                            lat: 0,
                            lng: 0,
                            arrivalTime: null,
                            departureTime: null
                        }
                    ]
                }
            ]
        };

        const success = TemplateManager.saveAsTemplate(currentUserId, testTemplate);
        
        if (success) {
            showSuccess('Plantilla de prueba creada correctamente');
            await loadTemplates(); // Recargar la lista
        } else {
            showError('Error al crear la plantilla de prueba');
        }
    } catch (error) {
        console.error('Error al crear plantilla de prueba:', error);
        showError('Error al crear la plantilla de prueba');
    }
};

// Inicializar la página
document.addEventListener('DOMContentLoaded', () => {
    initializeAuthListener();
});

function initializeAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        try {
            if (user) {
                currentUserId = user.uid;
                console.log('Usuario autenticado:', user.email);
                
                if (!isInitialized) {
                    await initializePage();
                }
            } else {
                console.log('Usuario no autenticado');
                currentUserId = null;
                
                // Redirigir al login si no está autenticado
                if (window.location.pathname.includes('templates.html')) {
                    window.location.href = 'user-login.html';
                }
            }
        } catch (error) {
            // Solo mostrar error si no es un problema de conexión de Firebase
            if (error.code !== 'unavailable' && error.code !== 'failed-precondition' && !error.message.includes('offline')) {
                console.error('Error en el listener de autenticación:', error);
                showError('Error al verificar la autenticación');
            } else {
                console.warn('Firebase offline - no se pudo verificar la autenticación');
            }
        }
    });
}

async function initializePage() {
    try {
        if (!currentUserId) {
            console.log('No hay usuario autenticado, no se puede inicializar la página');
            return;
        }
        
        await loadTemplates();
        setupEventListeners();
        isInitialized = true;
        console.log('Página de plantillas inicializada correctamente');
    } catch (error) {
        // Solo mostrar error si no es un problema de conexión de Firebase
        if (error.code !== 'unavailable' && error.code !== 'failed-precondition' && !error.message.includes('offline')) {
            console.error('Error al inicializar la página:', error);
            showError('Error al cargar las plantillas');
        } else {
            console.warn('Firebase offline - las plantillas se cargarán cuando se restablezca la conexión');
        }
    }
}

async function loadTemplates() {
    try {
        if (!currentUserId) {
            console.log('No hay usuario autenticado, no se pueden cargar plantillas');
            return;
        }

        const templates = TemplateManager.getTemplates(currentUserId);
        displayTemplates(templates);
        console.log(`Plantillas cargadas: ${templates.length}`);
    } catch (error) {
        // Solo mostrar error si no es un problema de conexión de Firebase
        if (error.code !== 'unavailable' && error.code !== 'failed-precondition' && !error.message.includes('offline')) {
            console.error('Error al cargar plantillas:', error);
            showError('Error al cargar las plantillas');
        } else {
            console.warn('Firebase offline - no se pudieron cargar las plantillas');
            // Mostrar mensaje informativo al usuario
            const container = document.getElementById('templates-container');
            if (container) {
                container.innerHTML = `
                    <div class="offline-message">
                        <p>🔌 Sin conexión a internet</p>
                        <p>Las plantillas se cargarán cuando se restablezca la conexión</p>
                    </div>
                `;
            }
        }
    }
}

function displayTemplates(templates) {
    const container = document.getElementById('templates-container');
    if (!container) {
        console.error('No se encontró el contenedor de plantillas');
        return;
    }
    
    if (!templates || templates.length === 0) {
        container.innerHTML = `
            <div class="no-templates">
                <p>No tienes plantillas guardadas</p>
                <p>Crea tu primera plantilla para empezar</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = templates.map(template => createTemplateCard(template)).join('');
    console.log(`Mostrando ${templates.length} plantillas`);
}

function createTemplateCard(template) {
    if (!template) {
        console.error('Template es null o undefined');
        return '';
    }
    
    const totalPlaces = template.itineraries ? template.itineraries.reduce((total, day) => {
        return total + (day.places ? day.places.length : 0);
    }, 0) : 0;
    
    const totalDays = template.itineraries ? template.itineraries.length : 0;
    const createdDate = template.createdAt ? new Date(template.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }) : 'Fecha desconocida';

    const templateId = template.id || 'unknown';
    const templateTitle = template.title || 'Sin título';
    const templateDescription = template.description || 'Sin descripción';

    return `
        <div class="template-card" data-template-id="${templateId}">
            <div class="template-header">
                <div>
                    <h3 class="template-title">${templateTitle}</h3>
                    <p class="template-date">Creada el ${createdDate}</p>
                </div>
            </div>
            
            <p class="template-description">${templateDescription}</p>
            
            <div class="template-stats">
                <div class="stat">
                    <span>📅 ${totalDays} días</span>
                </div>
                <div class="stat">
                    <span>📍 ${totalPlaces} lugares</span>
                </div>
            </div>
            
            <div class="template-actions">
                <button class="btn btn-primary" onclick="createFromTemplate('${templateId}')">
                    Usar Plantilla
                </button>
                <button class="btn btn-secondary" onclick="viewTemplate('${templateId}')">
                    Ver Detalles
                </button>
                <button class="btn btn-danger" onclick="deleteTemplate('${templateId}')">
                    Eliminar
                </button>
            </div>
        </div>
    `;
}

function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Botón para crear plantilla inteligente
    const createSmartTemplateBtn = document.getElementById('create-smart-template');
    if (createSmartTemplateBtn) {
        createSmartTemplateBtn.addEventListener('click', openSmartTemplateModal);
        console.log('Event listener agregado para crear plantilla inteligente');
    } else {
        console.warn('No se encontró el botón de crear plantilla inteligente');
    }

    // Botón para cerrar modal de plantilla inteligente
    const closeModalBtn = document.querySelector('#smartTemplateModal .close');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeSmartTemplateModal);
        console.log('Event listener agregado para cerrar modal de plantilla inteligente');
    } else {
        console.warn('No se encontró el botón de cerrar modal de plantilla inteligente');
    }

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('smartTemplateModal');
        if (event.target === modal) {
            closeSmartTemplateModal();
        }
    });

    // Inicializar autocompletado de ciudades
    initializeCityAutocomplete();

    // Event listeners para crear itinerario desde plantilla
    const createForm = document.getElementById('createForm');
    if (createForm) {
        createForm.addEventListener('submit', handleCreateFromTemplate);
        console.log('Event listener agregado para crear itinerario desde plantilla');
    } else {
        console.warn('No se encontró el formulario de crear itinerario');
    }

    // Botones para cerrar modales
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
    
    console.log('Event listeners configurados correctamente');
}

// Funciones globales para los botones
window.createFromTemplate = function(templateId) {
    if (!currentUserId) {
        showError('No hay usuario autenticado. Por favor, inicia sesión.');
        return;
    }
    
    if (!templateId || templateId === 'unknown') {
        showError('ID de plantilla inválido');
        return;
    }
    
    // Obtener la plantilla
    const template = TemplateManager.getTemplate(currentUserId, templateId);
    if (!template) {
        showError('No se encontró la plantilla');
        return;
    }
    
    // Guardar la plantilla en sessionStorage para usar en la creación
    sessionStorage.setItem('usingTemplate', JSON.stringify(template));
    
    // Redirigir directamente a la página de creación de itinerarios
    window.location.href = 'search-places.html?template=true';
};

window.viewTemplate = function(templateId) {
    if (!currentUserId) {
        showError('No hay usuario autenticado. Por favor, inicia sesión.');
        return;
    }
    
    if (!templateId || templateId === 'unknown') {
        showError('ID de plantilla inválido');
        return;
    }
    
    const template = TemplateManager.getTemplate(currentUserId, templateId);
    if (template) {
        // Guardar la plantilla en sessionStorage para la vista
        sessionStorage.setItem('viewingTemplate', JSON.stringify(template));
        window.location.href = 'view.html?template=true';
    } else {
        showError('No se encontró la plantilla');
    }
};

window.deleteTemplate = function(templateId) {
    if (!currentUserId) {
        showError('No hay usuario autenticado. Por favor, inicia sesión.');
        return;
    }
    
    if (!templateId || templateId === 'unknown') {
        showError('ID de plantilla inválido');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer.')) {
        const success = TemplateManager.deleteTemplate(currentUserId, templateId);
        if (success) {
            showSuccess('Plantilla eliminada correctamente');
            loadTemplates(); // Recargar la lista
        } else {
            showError('Error al eliminar la plantilla');
        }
    }
};

window.closeModal = function() {
    const modal = document.getElementById('createModal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error('No se encontró el modal de crear itinerario');
    }
    
    selectedTemplateId = null;
    
    // Limpiar formulario
    const form = document.getElementById('createForm');
    if (form) {
        form.reset();
    }
};

async function handleCreateFromTemplate(event) {
    event.preventDefault();
    
    if (!currentUserId) {
        showError('No hay usuario autenticado. Por favor, inicia sesión.');
        return;
    }
    
    const newTitleInput = document.getElementById('newTitle');
    const startDateInput = document.getElementById('startDate');
    
    if (!newTitleInput || !startDateInput) {
        showError('No se encontraron los campos del formulario');
        return;
    }
    
    const newTitle = newTitleInput.value.trim();
    const startDate = startDateInput.value;
    
    if (!newTitle || !startDate) {
        showError('Por favor completa todos los campos');
        return;
    }
    
    try {
        const startDateObj = new Date(startDate);
        const newItinerary = TemplateManager.createFromTemplate(
            currentUserId,
            selectedTemplateId,
            newTitle,
            startDateObj
        );
        
        if (newItinerary) {
            showSuccess('Itinerario creado correctamente desde la plantilla');
            closeModal();
            
            // Redirigir al nuevo itinerario
            setTimeout(() => {
                window.location.href = `view.html?id=${newItinerary.id}`;
            }, 1500);
        } else {
            showError('Error al crear el itinerario desde la plantilla');
        }
    } catch (error) {
        console.error('Error al crear itinerario desde plantilla:', error);
        showError('Error al crear el itinerario');
    }
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #28a745;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    notification.textContent = message;
    
    if (document.body) {
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

function showError(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #dc3545;
        color: white;
        padding: 15px 20px;
        border-radius: 6px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    notification.textContent = message;
    
    if (document.body) {
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// ===== FUNCIONES PARA PLANTILLAS INTELIGENTES =====

// Variables globales para el wizard
let currentStep = 1;

// Funciones globales para el wizard
window.openSmartTemplateModal = function() {
    const modal = document.getElementById('smartTemplateModal');
    if (modal) {
        modal.style.display = 'block';
        resetWizard();
        selectedCity = null; // Asegurar que se limpia la ciudad seleccionada
        // Inicializar el autocompletado después de un pequeño delay para asegurar que el DOM esté listo
        setTimeout(() => {
            initializeCityAutocomplete();
        }, 100);
    } else {
        console.error('No se encontró el modal de plantilla inteligente');
    }
};

window.closeSmartTemplateModal = function() {
    const modal = document.getElementById('smartTemplateModal');
    if (modal) {
        modal.style.display = 'none';
        resetWizard();
        selectedCity = null; // Asegurar que se limpia la ciudad seleccionada
    } else {
        console.error('No se encontró el modal de plantilla inteligente');
    }
};

window.nextStep = function(step) {
    if (validateCurrentStep()) {
        hideStep(currentStep);
        currentStep = step;
        showStep(currentStep);
    }
};

window.prevStep = function(step) {
    hideStep(currentStep);
    currentStep = step;
    showStep(currentStep);
};

// Función para inicializar el autocompletado de ciudades
function initializeCityAutocomplete() {
    const cityInput = document.getElementById('templateCity');
    const suggestionsContainer = document.getElementById('city-suggestions');
    
    if (!cityInput || !suggestionsContainer) {
        console.warn('No se encontraron los elementos necesarios para el autocompletado de ciudades');
        return;
    }
    
    console.log('Inicializando autocompletado de ciudades...');
    
    // Lista de ciudades españolas principales
    const spanishCities = [
        'Madrid, España',
        'Barcelona, España', 
        'Valencia, España',
        'Sevilla, España',
        'Zaragoza, España',
        'Málaga, España',
        'Murcia, España',
        'Palma de Mallorca, España',
        'Las Palmas de Gran Canaria, España',
        'Bilbao, España',
        'Alicante, España',
        'Córdoba, España',
        'Valladolid, España',
        'Vigo, España',
        'Gijón, España',
        'L\'Hospitalet de Llobregat, España',
        'A Coruña, España',
        'Vitoria-Gasteiz, España',
        'Granada, España',
        'Elche, España',
        'Tarrasa, España',
        'Badalona, España',
        'Oviedo, España',
        'Cartagena, España',
        'Jerez de la Frontera, España',
        'Sabadell, España',
        'Móstoles, España',
        'Alcalá de Henares, España',
        'Pamplona, España',
        'Fuenlabrada, España',
        'Almería, España',
        'San Sebastián, España',
        'Leganés, España',
        'Santander, España',
        'Castellón de la Plana, España',
        'Burgos, España',
        'Albacete, España',
        'Alcorcón, España',
        'Getafe, España',
        'Salamanca, España',
        'Logroño, España',
        'Huelva, España',
        'Marbella, España',
        'Lleida, España',
        'Tarragona, España',
        'León, España',
        'Cádiz, España',
        'Jaén, España',
        'Girona, España',
        'Lugo, España',
        'Cáceres, España',
        'Toledo, España',
        'Ceuta, España',
        'Melilla, España'
    ];
    
    let currentSuggestions = [];
    let selectedIndex = -1;
    
    // Función para mostrar sugerencias
    function showSuggestions(query) {
        if (!query || query.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        const filteredCities = spanishCities.filter(city => 
            city.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8); // Máximo 8 sugerencias
        
        currentSuggestions = filteredCities;
        selectedIndex = -1;
        
        if (filteredCities.length === 0) {
            suggestionsContainer.style.display = 'none';
            return;
        }
        
        suggestionsContainer.innerHTML = filteredCities.map(city => `
            <div class="city-suggestion" data-city="${city}">
                <div class="city-name">${city.split(',')[0]}</div>
                <div class="city-country">${city.split(',')[1]}</div>
            </div>
        `).join('');
        
        suggestionsContainer.style.display = 'block';
        
        // Agregar event listeners a las sugerencias
        const suggestions = suggestionsContainer.querySelectorAll('.city-suggestion');
        suggestions.forEach((suggestion, index) => {
            suggestion.addEventListener('click', () => {
                selectCity(suggestion.dataset.city);
            });
            
            suggestion.addEventListener('mouseenter', () => {
                suggestions.forEach(s => s.classList.remove('selected'));
                suggestion.classList.add('selected');
                selectedIndex = index;
            });
        });
    }
    
    // Función para seleccionar una ciudad
    function selectCity(city) {
        cityInput.value = city.split(',')[0]; // Solo el nombre de la ciudad
        selectedCity = city;
        suggestionsContainer.style.display = 'none';
        cityInput.focus();
        console.log('Ciudad seleccionada:', city);
    }
    
    // Event listener para el input
    cityInput.addEventListener('input', (e) => {
        showSuggestions(e.target.value);
    });
    
    // Event listener para navegación con teclado
    cityInput.addEventListener('keydown', (e) => {
        if (suggestionsContainer.style.display === 'block') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, currentSuggestions.length - 1);
                updateSelectedSuggestion();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, -1);
                updateSelectedSuggestion();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && currentSuggestions[selectedIndex]) {
                    selectCity(currentSuggestions[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                suggestionsContainer.style.display = 'none';
                selectedIndex = -1;
            }
        }
    });
    
    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!cityInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
            selectedIndex = -1;
        }
    });
    
    function updateSelectedSuggestion() {
        const suggestions = suggestionsContainer.querySelectorAll('.city-suggestion');
        suggestions.forEach((suggestion, index) => {
            if (index === selectedIndex) {
                suggestion.classList.add('selected');
            } else {
                suggestion.classList.remove('selected');
            }
        });
    }
    
    console.log('Autocompletado de ciudades inicializado correctamente');
}

// Actualizar la función validateCityAndNext
window.validateCityAndNext = function() {
    const cityInput = document.getElementById('templateCity');
    if (cityInput && selectedCity) {
        showSuccess(`¡Perfecto! Ciudad seleccionada: ${selectedCity.split(',')[0]}`);
        nextStep(3);
    } else {
        showError('Por favor selecciona una ciudad válida de la lista de sugerencias');
        // Enfocar el input para que el usuario pueda escribir
        if (cityInput) {
            cityInput.focus();
        }
    }
};

function validateCurrentStep() {
    console.log(`Validando paso ${currentStep}...`);
    
    switch (currentStep) {
        case 1:
            const nameInput = document.getElementById('templateName');
            const name = nameInput ? nameInput.value.trim() : '';
            if (!name) {
                showError('Por favor ingresa un nombre para la plantilla');
                return false;
            }
            console.log('Paso 1 válido');
            return true;
            
        case 2:
            const cityInput = document.getElementById('templateCity');
            const city = cityInput ? cityInput.value.trim() : '';
            if (!city) {
                showError('Por favor ingresa el nombre de la ciudad');
                return false;
            }
            // Verificar que se seleccionó una ciudad de la lista
            if (!selectedCity) {
                showError('Por favor selecciona una ciudad de la lista de sugerencias');
                return false;
            }
            console.log('Paso 2 válido');
            return true;
            
        case 3:
            const daysInput = document.getElementById('templateDays');
            const days = daysInput ? parseInt(daysInput.value) : 0;
            if (!days || days < 1 || days > 30) {
                showError('Por favor ingresa un número válido de días (entre 1 y 30)');
                return false;
            }
            console.log('Paso 3 válido');
            return true;
            
        case 4:
            const activities = document.querySelectorAll('input[type="checkbox"]:checked');
            if (activities.length === 0) {
                showError('Por favor selecciona al menos una actividad');
                return false;
            }
            console.log('Paso 4 válido');
            return true;
            
        case 5:
            const pace = document.querySelector('input[name="pace"]:checked');
            if (!pace) {
                showError('Por favor selecciona el ritmo del viaje');
                return false;
            }
            console.log('Paso 5 válido');
            return true;
            
        case 6:
            const budget = document.querySelector('input[name="budget"]:checked');
            if (!budget) {
                showError('Por favor selecciona el presupuesto');
                return false;
            }
            console.log('Paso 6 válido');
            return true;
            
        default:
            console.log('Paso válido por defecto');
            return true;
    }
}

function collectTemplateData() {
    console.log('Recolectando datos del formulario...');
    
    const nameInput = document.getElementById('templateName');
    const descriptionInput = document.getElementById('templateDescription');
    const cityInput = document.getElementById('templateCity');
    const daysInput = document.getElementById('templateDays');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const description = descriptionInput ? descriptionInput.value.trim() : '';
    const city = selectedCity ? selectedCity.split(',')[0] : (cityInput ? cityInput.value.trim() : '');
    const days = daysInput ? parseInt(daysInput.value) : 0;
    
    const activities = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'))
        .map(checkbox => checkbox.value);
    
    const paceElement = document.querySelector('input[name="pace"]:checked');
    const budgetElement = document.querySelector('input[name="budget"]:checked');
    
    const pace = paceElement ? paceElement.value : 'moderado'; // Valor por defecto
    const budget = budgetElement ? budgetElement.value : 'medio'; // Valor por defecto
    
    const data = {
        name,
        description,
        city,
        days,
        activities,
        pace,
        budget
    };
    
    console.log('Datos recolectados:', data);
    return data;
}

function resetWizard() {
    console.log('Reseteando wizard...');
    
    currentStep = 1;
    templateData = {};
    selectedCity = null; // Limpiar la ciudad seleccionada
    
    // Resetear formularios
    const nameInput = document.getElementById('templateName');
    const descriptionInput = document.getElementById('templateDescription');
    const cityInput = document.getElementById('templateCity');
    const daysInput = document.getElementById('templateDays');
    
    if (nameInput) nameInput.value = '';
    if (descriptionInput) descriptionInput.value = '';
    if (cityInput) cityInput.value = '';
    if (daysInput) daysInput.value = '';
    
    // Limpiar selecciones
    document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
    
    // Ocultar sugerencias de ciudades
    const suggestionsContainer = document.getElementById('city-suggestions');
    if (suggestionsContainer) {
        suggestionsContainer.style.display = 'none';
    }
    
    // Mostrar primer paso
    hideAllSteps();
    showStep(1);
    
    console.log('Wizard reseteado correctamente');
}

function hideAllSteps() {
    console.log('Ocultando todos los pasos...');
    
    for (let i = 1; i <= 6; i++) {
        const stepElement = document.getElementById(`step${i}`);
        if (stepElement) {
            stepElement.style.display = 'none';
        } else {
            console.warn(`No se encontró el elemento step${i}`);
        }
    }
    
    console.log('Todos los pasos ocultados');
}

function hideStep(step) {
    const stepElement = document.getElementById(`step${step}`);
    if (stepElement) {
        stepElement.style.display = 'none';
        console.log(`Paso ${step} ocultado`);
    } else {
        console.error(`No se encontró el elemento step${step}`);
    }
}

function showStep(step) {
    const stepElement = document.getElementById(`step${step}`);
    if (stepElement) {
        stepElement.style.display = 'block';
        console.log(`Paso ${step} mostrado`);
    } else {
        console.error(`No se encontró el elemento step${step}`);
    }
}

function generateSmartTemplateStructure(data) {
    console.log('Generando estructura de plantilla inteligente...');
    
    if (!data) {
        console.error('No se proporcionaron datos para generar la plantilla');
        return null;
    }
    
    const days = data.days; // Usar el número exacto de días ingresado por el usuario
    const city = data.city; // Usar la ciudad específica ingresada por el usuario
    const activities = data.activities;
    const budget = data.budget;
    const pace = data.pace;
    
    if (!days || !city || !activities || !budget || !pace) {
        console.error('Faltan datos requeridos para generar la plantilla:', { days, city, activities, budget, pace });
        return null;
    }
    
    const template = {
        id: `smart_template_${Date.now()}`,
        title: data.name,
        description: data.description,
        createdAt: new Date().toISOString(),
        isTemplate: true,
        isSmartTemplate: true,
        templateData: data, // Guardar todos los datos para generar lugares inteligentes
        city: city,
        itineraries: []
    };

    // Calcular lugares por día basado en el ritmo y actividades
    const placesPerDay = getPlacesPerDay(pace, activities);
    console.log(`Generando plantilla para ${city} con ${days} días, ${placesPerDay} lugares por día`);

    // Generar días consecutivos con lugares inteligentes
    for (let i = 1; i <= days; i++) {
        const dayPlaces = [];
        
        // Condición 1: Primer día debe tener hotel y aeropuerto
        if (i === 1) {
            dayPlaces.push({
                name: `Hotel en ${city}`,
                photo: "https://via.placeholder.com/200",
                price: 0,
                rating: "4.5",
                address: `${city}`,
                id: `hotel_${Date.now()}_${i}`,
                category: "Hotel",
                lat: 0,
                lng: 0,
                arrivalTime: null,
                departureTime: null
            });
            
            dayPlaces.push({
                name: `Aeropuerto de ${city}`,
                photo: "https://via.placeholder.com/200",
                price: 0,
                rating: "4.0",
                address: `${city}`,
                id: `airport_${Date.now()}_${i}`,
                category: "Aeropuerto",
                lat: 0,
                lng: 0,
                arrivalTime: null,
                departureTime: null
            });
            
            // Generar lugares inteligentes para el primer día (menos hotel y aeropuerto)
            const smartPlaces = generateDayPlaces(activities, placesPerDay - 2, budget, i, days, city);
            dayPlaces.push(...smartPlaces);
        }
        // Condición 2: Último día debe tener aeropuerto
        else if (i === days) {
            dayPlaces.push({
                name: `Aeropuerto de ${city}`,
                photo: "https://via.placeholder.com/200",
                price: 0,
                rating: "4.0",
                address: `${city}`,
                id: `airport_${Date.now()}_${i}`,
                category: "Aeropuerto",
                lat: 0,
                lng: 0,
                arrivalTime: null,
                departureTime: null
            });
            
            // Generar lugares inteligentes para el último día (menos aeropuerto)
            const smartPlaces = generateDayPlaces(activities, placesPerDay - 1, budget, i, days, city);
            dayPlaces.push(...smartPlaces);
        }
        // Días intermedios: generar lugares inteligentes normales
        else {
            const smartPlaces = generateDayPlaces(activities, placesPerDay, budget, i, days, city);
            dayPlaces.push(...smartPlaces);
        }
        
        template.itineraries.push({
            name: `Día ${i}`,
            date: null,
            places: dayPlaces
        });
    }

    console.log(`Plantilla inteligente generada para ${city} con ${days} días:`, template.itineraries.map(day => ({
        name: day.name,
        places: day.places.map(place => `${place.name} (${place.category})`)
    })));
    
    return template;
}

function getDaysFromDuration(duration) {
    // Esta función ya no se usa, pero la mantengo por compatibilidad
    const durationMap = {
        '1-3': 3,
        '4-7': 7,
        '8-14': 14,
        '15+': 21
    };
    return durationMap[duration] || 3;
}

function getPlacesPerDay(pace, activities) {
    const basePlaces = activities.length;
    const paceMultiplier = {
        'relajado': 0.7,
        'moderado': 1.0,
        'intenso': 1.5
    };
    return Math.max(2, Math.round(basePlaces * (paceMultiplier[pace] || 1.0)));
}

function generateDayPlaces(activities, placesPerDay, budget, dayNumber, totalDays, currentCity) {
    const places = [];
    const activityCategories = {
        'museos': 'Museo',
        'restaurantes': 'Restaurante',
        'naturaleza': 'Parque',
        'shopping': 'Centro comercial',
        'noche': 'Restaurante',
        'deportes': 'Parque'
    };

    // Agregar hotel el primer día
    if (dayNumber === 1) {
        places.push(generateRandomPlace('Hotel', budget, 1, currentCity));
    }

    // Agregar aeropuerto el último día
    if (dayNumber === totalDays) {
        places.push(generateRandomPlace('Aeropuerto', budget, placesPerDay + 1, currentCity));
    }

    // Mezclar actividades para variedad
    const shuffledActivities = [...activities].sort(() => Math.random() - 0.5);
    
    // Calcular cuántos lugares de actividades agregar (restando hotel/aeropuerto)
    const activityPlacesCount = dayNumber === 1 || dayNumber === totalDays ? placesPerDay - 1 : placesPerDay;
    
    for (let i = 0; i < activityPlacesCount; i++) {
        const activity = shuffledActivities[i % shuffledActivities.length];
        const category = activityCategories[activity];
        
        if (category) {
            places.push(generateRandomPlace(category, budget, i + 2, currentCity)); // +2 para evitar conflicto con hotel/aeropuerto
        }
    }

    return places;
}

function generateRandomPlace(category, budget, placeNumber, currentCity) {
    const budgetRanges = {
        'bajo': { min: 0, max: 50 },
        'medio': { min: 20, max: 150 },
        'alto': { min: 50, max: 500 }
    };

    const budgetRange = budgetRanges[budget] || budgetRanges['medio'];
    const price = Math.floor(Math.random() * (budgetRange.max - budgetRange.min + 1)) + budgetRange.min;
    
    const placeNames = getPlaceNamesByCategory(category);
    const randomName = placeNames[Math.floor(Math.random() * placeNames.length)];
    
    // Coordenadas base según la ciudad (puedes expandir esto)
    const cityCoordinates = {
        'Madrid': { lat: 40.4168, lng: -3.7038 },
        'Barcelona': { lat: 41.3851, lng: 2.1734 },
        'Valencia': { lat: 39.4699, lng: -0.3763 },
        'Sevilla': { lat: 37.3891, lng: -5.9845 },
        'Bilbao': { lat: 43.2627, lng: -2.9253 },
        'Granada': { lat: 37.1765, lng: -3.5976 },
        'Málaga': { lat: 36.7213, lng: -4.4217 },
        'Zaragoza': { lat: 41.6488, lng: -0.8891 },
        'Alicante': { lat: 38.3452, lng: -0.4815 },
        'Córdoba': { lat: 37.8882, lng: -4.7794 }
    };
    
    const baseCoords = cityCoordinates[currentCity] || cityCoordinates['Madrid'];
    
    return {
        name: randomName,
        photo: "https://via.placeholder.com/200",
        price: price,
        rating: (Math.random() * 2 + 3).toFixed(1), // Rating entre 3.0 y 5.0
        address: `Dirección ${placeNumber}, ${currentCity}`,
        id: `place_${Date.now()}_${placeNumber}`,
        category: category,
        lat: baseCoords.lat + (Math.random() - 0.5) * 0.1, // Coordenadas aleatorias cerca de la ciudad actual
        lng: baseCoords.lng + (Math.random() - 0.5) * 0.1,
        arrivalTime: null,
        departureTime: null
    };
}

function getPlaceNamesByCategory(category) {
    const placeNames = {
        'Museo': [
            'Museo Nacional de Arte',
            'Museo de Historia Natural',
            'Museo de Ciencias',
            'Galería de Arte Moderno',
            'Museo Arqueológico',
            'Museo de Bellas Artes'
        ],
        'Restaurante': [
            'Restaurante El Gourmet',
            'Café Central',
            'Bistró Francés',
            'Trattoria Italiana',
            'Restaurante Marisquería',
            'Cafetería Artesanal'
        ],
        'Parque': [
            'Parque Central',
            'Jardín Botánico',
            'Parque de la Ciudad',
            'Reserva Natural',
            'Parque Recreativo',
            'Jardín Histórico'
        ],
        'Centro comercial': [
            'Centro Comercial Plaza Mayor',
            'Galería de Compras',
            'Mall Central',
            'Centro Comercial Moderno',
            'Plaza de Compras',
            'Centro Comercial Premium'
        ],
        'Hotel': [
            'Hotel Central',
            'Hotel Boutique',
            'Hotel de Lujo',
            'Hotel Familiar',
            'Hotel Ejecutivo',
            'Hotel Resort',
            'Hotel Plaza Mayor',
            'Hotel Gran Vía',
            'Hotel Puerta del Sol'
        ],
        'Aeropuerto': [
            'Aeropuerto Internacional',
            'Aeropuerto Central',
            'Aeropuerto de la Ciudad',
            'Terminal Aérea Principal',
            'Aeropuerto Regional',
            'Aeropuerto de Tránsito'
        ],
        'Cafetería': [
            'Café del Arte',
            'Cafetería Vintage',
            'Café Literario',
            'Cafetería Moderna',
            'Café Tradicional',
            'Cafetería Gourmet'
        ]
    };
    
    return placeNames[category] || ['Lugar de Interés'];
}

// Hacer las funciones disponibles globalmente
window.createSmartTemplate = createSmartTemplate;
window.createManualTemplate = createManualTemplate;
window.openSmartTemplateModal = openSmartTemplateModal;
window.closeSmartTemplateModal = closeSmartTemplateModal;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.validateCityAndNext = validateCityAndNext;

 