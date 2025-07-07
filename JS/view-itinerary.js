import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { auth } from './firebase-config.js';
import { LocalStorageManager } from './local-storage.js';
import { TemplateManager } from './template-manager.js';

let currentUser = null;
let currentItinerary = null;
let map, infowindow;

// Inicializar la página
document.addEventListener('DOMContentLoaded', async () => {
    await initializePage();
});

async function initializePage() {
    try {
        // Verificar autenticación
        onAuthStateChanged(auth, async (user) => {
            if (!user) {
                window.location.href = 'user-login.html';
                return;
            }
            
            currentUser = user;
            await loadItinerary();
            setupEventListeners();
        });
    } catch (error) {
        console.error('Error al inicializar página de vista:', error);
    }
}

async function loadItinerary() {
    try {
        // Obtener ID del itinerario desde la URL
        const urlParams = new URLSearchParams(window.location.search);
        const itineraryId = urlParams.get('id');
        const isTemplate = urlParams.get('template') === 'true';
        
        if (!itineraryId && !isTemplate) {
            showError('No se especificó un itinerario para mostrar');
            return;
        }

        if (isTemplate) {
            // Cargar plantilla desde sessionStorage
            const templateData = sessionStorage.getItem('viewingTemplate');
            if (templateData) {
                currentItinerary = JSON.parse(templateData);
                sessionStorage.removeItem('viewingTemplate');
            } else {
                showError('No se encontró la plantilla');
                return;
            }
        } else {
            // Cargar itinerario normal
            currentItinerary = LocalStorageManager.getItinerary(currentUser.uid, itineraryId);
        }

        if (!currentItinerary) {
            showError('No se encontró el itinerario');
            return;
        }

        displayItinerary();
        initializeMap();
    } catch (error) {
        console.error('Error al cargar itinerario:', error);
        showError('Error al cargar el itinerario');
    }
}

function displayItinerary() {
    // Mostrar título
    const titleElement = document.getElementById('title');
    if (titleElement) {
        titleElement.querySelector('span').textContent = currentItinerary.title;
    }

    // Mostrar descripción
    const descriptionElement = document.getElementById('description');
    if (descriptionElement) {
        descriptionElement.textContent = currentItinerary.description || 'Sin descripción';
    }

    // Mostrar lugares
    displayPlaces();
}

function displayPlaces() {
    const listElement = document.getElementById('list');
    if (!listElement) return;

    listElement.innerHTML = '';

    currentItinerary.itineraries.forEach((day, dayIndex) => {
        // Crear encabezado del día
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        dayHeader.innerHTML = `
            <h3>${day.name}</h3>
            ${day.date ? `<span class="day-date">${new Date(day.date).toLocaleDateString('es-ES')}</span>` : ''}
        `;
        listElement.appendChild(dayHeader);

        // Mostrar lugares del día
        day.places.forEach((place, placeIndex) => {
            const placeElement = document.createElement('div');
            placeElement.className = 'places-list-item';
            placeElement.innerHTML = `
                <div class="places-list-item-content">
                    <div class="transport-method-icon">
                        ${placeIndex > 0 ? '🚶' : '📍'}
                    </div>
                    <div class="place-brief">
                        <span class="place-name">${place.name}</span>
                        <span class="place-category">${place.category}</span>
                        <span class="time">${place.arrivalTime || 'Sin horario'}</span>
                    </div>
                </div>
            `;
            listElement.appendChild(placeElement);
        });
    });
}

function initializeMap() {
    if (!currentItinerary || !currentItinerary.itineraries.length) return;

    // Obtener el primer lugar para centrar el mapa
    const firstPlace = currentItinerary.itineraries[0].places[0];
    if (!firstPlace) return;

    const defaultLocation = { lat: parseFloat(firstPlace.lat), lng: parseFloat(firstPlace.lng) };
    
    map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 12,
    });

    infowindow = new google.maps.InfoWindow();

    // Agregar marcadores para todos los lugares
    currentItinerary.itineraries.forEach((day, dayIndex) => {
        day.places.forEach((place, placeIndex) => {
            const position = { lat: parseFloat(place.lat), lng: parseFloat(place.lng) };
            
            const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: place.name,
                label: `${dayIndex + 1}.${placeIndex + 1}`
            });

            // Agregar info window
            marker.addListener('click', () => {
                infowindow.setContent(`
                    <div style="padding: 10px;">
                        <h3>${place.name}</h3>
                        <p><strong>Categoría:</strong> ${place.category}</p>
                        <p><strong>Día:</strong> ${day.name}</p>
                        <p><strong>Precio:</strong> ${place.price}€</p>
                        <p><strong>Rating:</strong> ${place.rating || 'N/A'}</p>
                    </div>
                `);
                infowindow.open(map, marker);
            });
        });
    });
}

function setupEventListeners() {
    // Botón de editar
    const editButton = document.getElementById('edit-button');
    if (editButton) {
        editButton.addEventListener('click', () => {
            // Guardar el itinerario actual en sessionStorage para la edición
            sessionStorage.setItem('editingItinerary', JSON.stringify(currentItinerary));
            window.location.href = 'search-places.html';
        });
    }

    // Botón de guardar como plantilla
    const saveTemplateButton = document.getElementById('save-template-button');
    if (saveTemplateButton) {
        saveTemplateButton.addEventListener('click', handleSaveAsTemplate);
        
        // Deshabilitar si es una plantilla
        if (currentItinerary && currentItinerary.isTemplate) {
            saveTemplateButton.disabled = true;
            saveTemplateButton.textContent = 'Ya es una plantilla';
        }
    }
}

async function handleSaveAsTemplate() {
    try {
        if (!currentItinerary) {
            showError('No hay itinerario para guardar como plantilla');
            return;
        }

        const success = TemplateManager.saveAsTemplate(currentUser.uid, currentItinerary);
        
        if (success) {
            showSuccess('Itinerario guardado como plantilla correctamente');
            
            // Deshabilitar el botón
            const saveTemplateButton = document.getElementById('save-template-button');
            if (saveTemplateButton) {
                saveTemplateButton.disabled = true;
                saveTemplateButton.textContent = 'Guardado como plantilla';
            }
        } else {
            showError('Error al guardar como plantilla');
        }
    } catch (error) {
        console.error('Error al guardar como plantilla:', error);
        showError('Error al guardar como plantilla');
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
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
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
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
} 