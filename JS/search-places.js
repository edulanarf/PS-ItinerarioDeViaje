// noinspection JSUnresolvedReference

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { auth } from './firebase-config.js';
import { setSaved } from './saved-verification.js';
import { TemplateManager } from './template-manager.js';
import { Itinerary, ItineraryPlan, Place } from './types.js';


let map, service, infowindow, circle;
let routeMap, routeService, routeDirectionsRenderer; // Variables para el minimapa de ruta
let directionsService, routeRenderer; // Variables para el servicio de direcciones
let routeMinimap; // Variable para el minimapa de rutas
let markers = [];
let selectedCategory = "Hotel";
let price;
let priceString;
let counterDay = 1;
let radius = 2000;
let isUsingTemplate = false;
let templateMaxDays = 0;
let currentUserId = null;

// Variables para el clima
let currentCity = '';
let currentDate = new Date();
let weatherCache = new Map(); // Cache para evitar llamadas repetidas a la API
let selectedDate = new Date(); // Fecha seleccionada por el usuario
let selectedTime = '12:00'; // Hora seleccionada por el usuario
/**
 * @type {ItineraryPlan}
 */
export let plan = new ItineraryPlan("","","",[]);
/**
 * @type {Place[]}
 */
let listPlaces = []
const day = document.getElementById("day")

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../HTML/user-login.html"
  }
})


// Info para el itinerario

let counter = 0;

const placesList = document.getElementById("itinerary-list");

function initMap() {
  const defaultLocation = { lat: 28.1235, lng: -15.4363 };
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
  });

  service = new google.maps.places.PlacesService(map);
  infowindow = new google.maps.InfoWindow();

  const input = document.getElementById("search-input");
  const searchBox = new google.maps.places.SearchBox(input);

  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();
    if (!places.length) return;

    markers.forEach((m) => m.setMap(null));
    const place = places[0];
    map.setCenter(place.geometry.location);
    map.setZoom(14);
    const marker = new google.maps.Marker({ map, position: place.geometry.location });
    markers.push(marker);
    infowindow.setContent(place.name);
    infowindow.open(map, marker);
    createCircle(place.geometry.location);
    fetchNearbyPlaces(place.geometry.location);
  });

  const reloadBtn = document.getElementById("reload-button");
  reloadBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const places = searchBox.getPlaces();
    if (!places.length) return;
    fetchNearbyPlaces(places[0].geometry.location);
  });
  document.getElementById("select-container").addEventListener('change', function(event) {
    event.preventDefault();
    const places = searchBox.getPlaces();
    if (!places.length) return;
    fetchNearbyPlaces(places[0].geometry.location);
  })

  //Añado area base en el mapa
  circle = new google.maps.Circle({
    map: map,
    center: defaultLocation,
    radius: radius,
    fillColor: "#4285F4",
    fillOpacity: 0.3,
    strokeColor: "#4285F4",
    strokeOpacity: 0.8,
    strokeWeight: 2
  });


}

// ======== FUNCIONES DEL CLIMA ========

/**
 * Obtener y mostrar el clima para el día actual
 * @param {string} cityName - Nombre de la ciudad
 * @param {Date} date - Fecha para la cual obtener el clima
 */
async function loadWeatherForDay(cityName, date) {
  console.log('Cargando clima para:', cityName, date);
  
  if (!cityName || !date) {
    console.log('Información insuficiente para cargar clima');
    showWeatherError('Información insuficiente');
    return;
  }

  const cacheKey = `${cityName}-${date.toDateString()}`;
  
  // Verificar cache
  if (weatherCache.has(cacheKey)) {
    console.log('Usando clima del cache');
    displayWeather(weatherCache.get(cacheKey));
    return;
  }

  showWeatherLoading();

  try {
    // Usar datos mock para desarrollo (sin depender de weatherService)
    const weatherData = getMockWeatherData(date, cityName);
    
    // Guardar en cache
    weatherCache.set(cacheKey, weatherData);
    
    // Mostrar el clima
    displayWeather(weatherData);
    console.log('Clima cargado exitosamente:', weatherData);
    
  } catch (error) {
    console.error('Error al cargar el clima:', error);
    showWeatherError('Error al cargar el clima');
  }
}

/**
 * Generar datos mock del clima para desarrollo
 * @param {Date} date - Fecha
 * @param {string} cityName - Nombre de la ciudad
 * @returns {Object} - Datos mock del clima
 */
function getMockWeatherData(date, cityName) {
  const today = new Date();
  const isFutureDate = date > today;
  const isHistoricalData = isFutureDate || date.getTime() < today.getTime() - (7 * 24 * 60 * 60 * 1000); // Más de 7 días atrás
  
  // Datos históricos promedio por mes y ciudad
  const historicalData = {
    'Madrid': {
      1: { temp: 8, desc: 'nublado', icon: '04d' }, // Enero
      2: { temp: 10, desc: 'nublado', icon: '04d' }, // Febrero
      3: { temp: 13, desc: 'pocas nubes', icon: '02d' }, // Marzo
      4: { temp: 16, desc: 'cielo despejado', icon: '01d' }, // Abril
      5: { temp: 20, desc: 'cielo despejado', icon: '01d' }, // Mayo
      6: { temp: 25, desc: 'cielo despejado', icon: '01d' }, // Junio
      7: { temp: 29, desc: 'cielo despejado', icon: '01d' }, // Julio
      8: { temp: 29, desc: 'cielo despejado', icon: '01d' }, // Agosto
      9: { temp: 24, desc: 'pocas nubes', icon: '02d' }, // Septiembre
      10: { temp: 18, desc: 'nubes dispersas', icon: '03d' }, // Octubre
      11: { temp: 12, desc: 'nublado', icon: '04d' }, // Noviembre
      12: { temp: 9, desc: 'nublado', icon: '04d' } // Diciembre
    },
    'Barcelona': {
      1: { temp: 10, desc: 'nublado', icon: '04d' },
      2: { temp: 11, desc: 'nublado', icon: '04d' },
      3: { temp: 13, desc: 'pocas nubes', icon: '02d' },
      4: { temp: 15, desc: 'cielo despejado', icon: '01d' },
      5: { temp: 19, desc: 'cielo despejado', icon: '01d' },
      6: { temp: 23, desc: 'cielo despejado', icon: '01d' },
      7: { temp: 26, desc: 'cielo despejado', icon: '01d' },
      8: { temp: 26, desc: 'cielo despejado', icon: '01d' },
      9: { temp: 23, desc: 'pocas nubes', icon: '02d' },
      10: { temp: 19, desc: 'nubes dispersas', icon: '03d' },
      11: { temp: 14, desc: 'nublado', icon: '04d' },
      12: { temp: 11, desc: 'nublado', icon: '04d' }
    },
    'Valencia': {
      1: { temp: 12, desc: 'nublado', icon: '04d' },
      2: { temp: 13, desc: 'nublado', icon: '04d' },
      3: { temp: 15, desc: 'pocas nubes', icon: '02d' },
      4: { temp: 17, desc: 'cielo despejado', icon: '01d' },
      5: { temp: 21, desc: 'cielo despejado', icon: '01d' },
      6: { temp: 25, desc: 'cielo despejado', icon: '01d' },
      7: { temp: 28, desc: 'cielo despejado', icon: '01d' },
      8: { temp: 28, desc: 'cielo despejado', icon: '01d' },
      9: { temp: 25, desc: 'pocas nubes', icon: '02d' },
      10: { temp: 21, desc: 'nubes dispersas', icon: '03d' },
      11: { temp: 16, desc: 'nublado', icon: '04d' },
      12: { temp: 13, desc: 'nublado', icon: '04d' }
    }
  };
  
  const month = date.getMonth() + 1; // getMonth() devuelve 0-11
  const cityKey = Object.keys(historicalData).find(city => 
    cityName.toLowerCase().includes(city.toLowerCase())
  ) || 'Madrid';
  
  let weatherData;
  
  if (isHistoricalData) {
    // Usar datos históricos promedio
    const historical = historicalData[cityKey][month];
    const variation = Math.floor(Math.random() * 6) - 3; // ±3 grados de variación
    
    weatherData = {
      temperature: historical.temp + variation,
      feelsLike: historical.temp + variation + Math.floor(Math.random() * 3) - 1,
      humidity: 50 + Math.floor(Math.random() * 30),
      description: historical.desc,
      icon: historical.icon,
      windSpeed: 5 + Math.floor(Math.random() * 15),
      date: date,
      city: cityName,
      country: 'España',
      isHistorical: true,
      note: isFutureDate ? 
        'Estos datos no son exactos ya que no hay datos reales en este instante, pero esto es la media de los demás años en esta fecha' :
        'Datos históricos promedio para esta fecha'
    };
  } else {
    // Usar datos actuales simulados
    const temperatures = [22, 25, 28, 20, 23, 26, 24, 27];
    const descriptions = [
      'cielo despejado',
      'pocas nubes',
      'nubes dispersas',
      'nublado',
      'lluvia ligera',
      'lluvia moderada'
    ];
    const icons = ['01d', '02d', '03d', '04d', '10d', '09d'];
    
    const randomIndex = Math.floor(Math.random() * temperatures.length);
    const descIndex = Math.floor(Math.random() * descriptions.length);
    
    weatherData = {
      temperature: temperatures[randomIndex],
      feelsLike: temperatures[randomIndex] + Math.floor(Math.random() * 3) - 1,
      humidity: 60 + Math.floor(Math.random() * 30),
      description: descriptions[descIndex],
      icon: icons[descIndex],
      windSpeed: 5 + Math.floor(Math.random() * 15),
      date: date,
      city: cityName,
      country: 'España',
      isHistorical: false,
      note: 'Datos simulados para desarrollo'
    };
  }
  
  return weatherData;
}

/**
 * Mostrar estado de carga del clima
 */
function showWeatherLoading() {
  const loadingEl = document.querySelector('.weather-loading');
  const infoEl = document.querySelector('.weather-info');
  const errorEl = document.querySelector('.weather-error');
  
  loadingEl.style.display = 'flex';
  infoEl.style.display = 'none';
  errorEl.style.display = 'none';
}

/**
 * Mostrar información del clima
 * @param {Object} weatherData - Datos del clima
 */
function displayWeather(weatherData) {
  const loadingEl = document.querySelector('.weather-loading');
  const infoEl = document.querySelector('.weather-info');
  const errorEl = document.querySelector('.weather-error');
  
  loadingEl.style.display = 'none';
  errorEl.style.display = 'none';
  infoEl.style.display = 'flex';
  
  const tempEl = document.getElementById('weather-temp');
  const locationEl = document.getElementById('weather-location');
  
  tempEl.textContent = `${weatherData.temperature}°C`;
  locationEl.textContent = weatherData.city || 'Ubicación no disponible';
}

/**
 * Mostrar error del clima
 * @param {string} message - Mensaje de error
 */
function showWeatherError(message) {
  const loadingEl = document.querySelector('.weather-loading');
  const infoEl = document.querySelector('.weather-info');
  const errorEl = document.querySelector('.weather-error');
  
  loadingEl.style.display = 'none';
  infoEl.style.display = 'none';
  errorEl.style.display = 'block';
  
  errorEl.querySelector('span').textContent = message;
}

/**
 * Actualizar el clima cuando cambia la ciudad o fecha
 * @param {string} cityName - Nombre de la ciudad
 * @param {Date} date - Fecha
 */
function updateWeather(cityName, date) {
  currentCity = cityName;
  currentDate = date;
  
  if (cityName && date) {
    loadWeatherForDay(cityName, date);
  }
}

//sí se actualiza el radio del círculo
document.getElementById("km-range").addEventListener("input", function () {
  radius = parseInt(this.value); // Convertir km a metros
  document.getElementById("km-value").textContent = this.value;
  updateCircleRadius(radius);
});

function updateCircleRadius(radius) {
  if (circle) {
    circle.setRadius(radius);
  }
}

function createCircle(center) {
  if (circle) {
    circle.setMap(null); // Elimina el círculo anterior si ya existe
  }

  // Crear un nuevo círculo con el nuevo centro
  circle = new google.maps.Circle({
    map: map,
    center: center,
    radius: radius,
    fillColor: "#4285F4",
    fillOpacity: 0.3,
    strokeColor: "#4285F4",
    strokeOpacity: 0.8,
    strokeWeight: 2
  });
}

function fetchNearbyPlaces(location) {
  const req = { location, radius: radius, keyword: selectedCategory };
  service.nearbySearch(req, (results, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK) return;

    const sortedResults = results.filter(p => p.rating && p.photos).sort((a, b) => b.rating - a.rating);
    const container = document.getElementById("places-list");
    container.innerHTML = '';

    // Obtener información de la ciudad para el clima
    let cityName = '';
    if (results.length > 0) {
      const firstPlace = results[0];
      if (firstPlace.vicinity) {
        // Extraer ciudad del vicinity (formato: "Dirección, Ciudad, País")
        const addressParts = firstPlace.vicinity.split(',');
        if (addressParts.length >= 2) {
          currentCity = addressParts[1].trim();
          cityName = currentCity;
          // Actualizar el clima para el día actual
          updateWeatherForCurrentDay();
        }
      }
    }

    // Verificar si hay una plantilla activa y generar lugares inteligentes
    const activeTemplate = sessionStorage.getItem('activeTemplate');
    let smartPlaces = [];
    
    if (activeTemplate && cityName) {
      try {
        const templateData = JSON.parse(activeTemplate);
        console.log('Plantilla activa encontrada:', templateData);
        console.log('Ciudad detectada:', cityName);
        
        smartPlaces = generateSmartPlacesForCity(cityName, templateData);
        console.log('Lugares inteligentes generados:', smartPlaces);
        
        // Mostrar lugares inteligentes primero
        if (smartPlaces.length > 0) {
          const smartSection = document.createElement('div');
          smartSection.innerHTML = '<h3>💡 Lugares Recomendados para tu Plantilla</h3>';
          container.appendChild(smartSection);
          
          smartPlaces.forEach((place) => {
            const li = document.createElement("li");
            li.style.border = '2px solid #4CAF50';
            li.style.backgroundColor = '#f0f8f0';
            
            li.innerHTML = `
              <img src="${place.photo}" alt="${place.name}" class="place-image" style="width: 50%; height: auto;">
              <div><strong>${place.name}</strong> <span style="color: #4CAF50;">✨ Recomendado</span></div>
              <div>${place.price}€</div>
              <div>Rating: ${place.rating}</div>
            `;

            const imgElement = li.querySelector('.place-image');
            imgElement.addEventListener('click', () => {
              showPlaceInfo(place);
            });

            const addBtn = document.createElement("button");
            addBtn.textContent = "Añadir";
            addBtn.className = "add-button";
            addBtn.style.backgroundColor = '#4CAF50';
            addBtn.addEventListener('click', () => {
              addToItinerary(place);
            });

            li.appendChild(addBtn);
            container.appendChild(li);
          });
          
          // Separador
          const separator = document.createElement('div');
          separator.innerHTML = '<h3>🔍 Otros Lugares Encontrados</h3>';
          container.appendChild(separator);
        } else {
          console.log('No se generaron lugares inteligentes');
        }
      } catch (error) {
        console.error('Error al procesar plantilla activa:', error);
      }
    } else {
      console.log('No hay plantilla activa o ciudad detectada');
      console.log('activeTemplate:', activeTemplate);
      console.log('cityName:', cityName);
    }

    // Mostrar lugares reales de Google Places
    sortedResults.forEach((place) => {
      const li = document.createElement("li");
      const photoUrl = place.photos ? place.photos[0].getUrl({ maxWidth: 1024, maxHeight: 1024 }) : 'https://via.placeholder.com/200';

      const name = place.name;
      const rating = place.rating || 'N/A';
      const price = calculatePrice(selectedCategory, place);

      li.innerHTML = `
        <img src="${photoUrl}" alt="${name}" class="place-image" style="width: 50%; height: auto;">
        <div><strong>${name}</strong></div>
        <div>${price}</div>
        <div>Rating: ${rating}</div>
      `;

      const imgElement = li.querySelector('.place-image');
      imgElement.addEventListener('click', () => {
        showPlaceInfo(place);
      });

      const addBtn = document.createElement("button");
      addBtn.textContent = "Añadir";
      addBtn.className = "add-button";
      addBtn.addEventListener('click', () => {
        addToItinerary(place);
      });

      li.appendChild(addBtn);
      container.appendChild(li);
    });
  });
}

function calculatePrice(category, place) {
  let price = 0;
  const priceLevel = place.price_level;
  const rating = place.rating || 3;

  if (category === "Restaurante") {
    price = [20, 20, 30, 40, 50, 60][priceLevel] || 20;
    priceString = `${price} Euros por persona`;
    return price;
  }
  if (category === "Cafetería") {
    price = [10, 10, 15, 20, 25, 30][priceLevel] || 10;
    priceString = `${price} Euros por persona`;
    return price;
  }
  if (category === "Hotel") {
    price = [20, 20, 50, 100, 250, 500][Math.round(rating) - 1] || 20;
    priceString = `${price} Euros por noche`;
    return price;
  }
  if (category === "Museo")
  {
    priceString = `5 Euros por persona`;
    return 5;
  }

  if (["Parque", "Centro comercial", "Aeropuerto"].includes(category)) {
    priceString = ` Gratis`;
    return 0;
  }
}

function addToItinerary(place) {

  //Mensaje error repetido
  const repeatError = document.getElementById("repeat-error");
  if (listPlaces.find(p => p.name === place.name)) {
    repeatError.textContent = "Este lugar ya se ha añadido al itinerario";
    repeatError.style.display = "block";
    repeatError.style.borderColor = "red";
    return;
  } else {
    repeatError.style.display = "none";
  }

  //Mensaje error Hotel
  const hotelError = document.getElementById("hotel-error");
  if (listPlaces.find(p => p.category === "Hotel" ) && place.category === "Hotel") {
    hotelError.textContent = "Ya se ha añadido un hotel";
    hotelError.style.display = "block";
    hotelError.style.borderColor = "red";
    return;
  } else {
    hotelError.style.display = "none";
  }

  //Mensaje error Elegir un hotel
  const notHotelError = document.getElementById("not-hotel-error");
  if (counterDay === 1 && listPlaces.length === 0 && selectedCategory !== "Hotel") {
    notHotelError.textContent = "No se ha añadido un hotel";
    notHotelError.style.display = "block";
    notHotelError.style.borderColor = "red";
    return;
  } else {
    notHotelError.style.display = "none";
  }



  //precio del lugar en euros, tipo int
  price = calculatePrice(selectedCategory, place);

  let aPlace = new Place(
    place.name,
    place.photos ? place.photos[0].getUrl({ maxWidth: 1024, maxHeight: 1024 }) : '',
    price,
    place.rating || '',
    place.vicinity || '',
    (++counter).toString(),
    selectedCategory,
    place.geometry.location.lat(),
    place.geometry.location.lng(),
    'coche' // Transporte por defecto
  )

  listPlaces.push(aPlace)

  const li = document.createElement("li");
  li.classList.add("list-item");
  const div = document.createElement("div");

  div.innerHTML = `${counter}. ${place.name} ${priceString} `;

  const delBtn = document.createElement("button");
  delBtn.className = "delete-button";
  delBtn.textContent = "Eliminar";
  delBtn.innerHTML = '<img src="../mockups/garbage.png" alt="Eliminar" style="width: 20px; height: 20px;">';

  delBtn.addEventListener("click", () => {
    const index = Array.from(placesList.children).indexOf(li);
    listPlaces.splice(index,1);
    li.remove();
    counter--;
    renumberItems();
    setSaved(false);
    
    // Recalcular ruta después de eliminar un lugar
    if (listPlaces.length >= 2) {
      setTimeout(() => {
        calculateAndDisplayRoute();
      }, 100);
    } else {
      showRouteError('Se necesitan al menos 2 lugares para calcular una ruta');
    }
  });
  setSaved(false);
  li.append(div, delBtn);
  placesList.appendChild(li);

  if(selectedCategory === "Hotel"){
    day.innerHTML = `Día ${counterDay}`;
  }
  
  // Actualizar el clima cuando se agrega un lugar
  updateWeatherForCurrentDay();
  
  // Calcular ruta si hay al menos 2 lugares
  if (listPlaces.length >= 2) {
    calculateAndDisplayRoute();
  } else {
    showRouteError('Se necesitan al menos 2 lugares para calcular una ruta');
  }
}

function renumberItems() {
  const items = placesList.children;
  for (let i = 0; i < items.length; i++) {
    const name = listPlaces[i].name;
    const price = listPlaces[i].price;
    const cat = listPlaces[i].category;
    let displayPrice = '';
    if (cat === "Hotel") displayPrice = `${price} Euros la noche`;
    else if (["Restaurante", "Cafetería", "Museo"].includes(cat)) displayPrice = `${price} Euros por persona`;
    else displayPrice = `Gratis`;
    items[i].querySelector("div").innerHTML = `${i + 1}. ${name} ${displayPrice}`;
  }
}

function showPlaceInfo(place) {
  infowindow.setContent(`
    <h3>${place.name}</h3>
    <p>Rating: ${place.rating || 'N/A'}</p>
    <p>${place.vicinity || 'No address available'}</p>
  `);
  infowindow.setPosition(place.geometry.location);
  infowindow.open(map);
}

/**
 * Inicializar servicios de direcciones de forma independiente
 */
function initDirectionsService() {
  try {
    if (!directionsService) {
      directionsService = new google.maps.DirectionsService();
      console.log('DirectionsService inicializado independientemente');
    }
    if (!routeRenderer) {
      routeRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true
      });
      console.log('DirectionsRenderer inicializado independientemente');
    }
  } catch (error) {
    console.error('Error al inicializar servicios de direcciones:', error);
  }
}

window.onload = function() {
  localStorage.clear(); // Elimina todas las claves del localStorage
  initMap();
  
  // Verificar si se está usando una plantilla
  const urlParams = new URLSearchParams(window.location.search);
  const isUsingTemplate = urlParams.get('template') === 'true';
  
  if (isUsingTemplate) {
    loadTemplateStructure();
  }
  
  // Inicializar funcionalidad de plantillas
  initializeTemplateFunctionality();
  
  // Inicializar funcionalidad de transportes
  initializeTransportFunctionality();
  
  // Inicializar servicios de direcciones y minimapa de ruta después de que Google Maps esté cargado
  setTimeout(() => {
    initDirectionsService(); // Inicializar servicios de direcciones
    initDateTimeSelector();
    initRouteMap();
    updateWeatherForCurrentDay();
  }, 1000); // Pequeño delay para asegurar que todo esté cargado
};


document.getElementById("select-container").addEventListener("change", (e) => {
  selectedCategory = e.target.value;
});

document.getElementById("save-day-button").addEventListener("click", (_) => {
  if (listPlaces.length === 0) {
    // Si está vacía, mostramos el mensaje de advertencia
    const warning = document.getElementById("warning");
    warning.innerText = "No puedes guardar un día vacío.";
    warning.style.color = "red"; // Puedes cambiar el color si prefieres
    warning.style.marginTop = "10px";
    warning.style.display = "block"; // Aseguramos que el mensaje se muestre

    // Opcional: borrar el mensaje después de 3 segundos
    setTimeout(() => {
      warning.innerText = "";
      warning.style.display = "none"; // Lo ocultamos de nuevo
    }, 5000);

    // Salimos de la función para evitar que se guarde el día vacío
    return;
  }
  
  // Verificar si se está usando una plantilla y si ya se alcanzó el límite de días
  if (isUsingTemplate && counterDay > templateMaxDays) {
    const warning = document.getElementById("warning");
    warning.innerText = `No puedes agregar más días. Esta plantilla tiene ${templateMaxDays} días fijos.`;
    warning.style.color = "red";
    warning.style.marginTop = "10px";
    warning.style.display = "block";
    
    setTimeout(() => {
      warning.innerText = "";
      warning.style.display = "none";
    }, 5000);
    
    return;
  }

  const key = `Día ${counterDay}`;

  const existingItineraryIndex = plan.itineraries.findIndex(itinerary => itinerary.name === key);
  // Si el itinerario ya existe, lo actualizamos, de lo contrario lo agregamos || en caso de cambiar entre dias
  if (existingItineraryIndex !== -1) {
    plan.itineraries[existingItineraryIndex].places = [...listPlaces];
    console.log(plan)
  } else {
    let it = new Itinerary(key, [...listPlaces]);
    plan.itineraries.push(it);
    console.log(plan)
  }

  //Guardamos el el lc st la lista del dia
  localStorage.setItem(key, JSON.stringify(listPlaces));
  listPlaces.length = 0
  day.innerHTML = `Día ${counterDay}`;
  placesList.innerHTML = '';

  //Generacion de botones por dia
  const dayButton = document.createElement("button");
  dayButton.textContent = key;
  dayButton.classList.add("day-button");

  // Comprobamos si el botón ya existe
  const existingButton = document.querySelector(`#day-buttons-container button[data-day="${key}"]`);
  if (!existingButton) {
    dayButton.setAttribute("data-day", key);  // Añadimos un atributo para identificar el día
    dayButton.addEventListener("click", () => {
      loadDay(key);
    });
    const dayButtonsContainer = document.getElementById("day-buttons-container");
    dayButtonsContainer.appendChild(dayButton);
  }
  // **Incrementamos el contador de días después de guardar y mostrar**
  counterDay++;

  // Actualizamos el contenido del HTML para reflejar el nuevo día
  day.innerHTML = `Día ${counterDay}`;

  // Si estamos usando una plantilla y hemos alcanzado el límite, deshabilitar el botón
  if (isUsingTemplate && counterDay > templateMaxDays) {
    const saveButton = document.getElementById("save-day-button");
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = `Límite alcanzado (${templateMaxDays} días)`;
      saveButton.style.backgroundColor = "#6c757d";
    }
  } else {
    // Llamar a la función loadDay para cargar los lugares del siguiente día
    loadDay(`Día ${counterDay}`);
  }

});


function loadDay(dayKey) {
  // Actualizamos el contador de días
  counterDay = parseInt(dayKey.split(" ")[1]);
  console.log(counterDay);
  day.innerHTML = `Día ${counterDay}`;
  
  // Actualizar la fecha seleccionada basada en el día
  const today = new Date();
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + counterDay - 1);
  
  // Actualizar el selector de fecha
  const dateInput = document.getElementById('day-date');
  if (dateInput) {
    dateInput.value = targetDate.toISOString().split('T')[0];
    selectedDate = targetDate;
  }

  // Obtener los lugares guardados para ese día desde localStorage
  const savedPlaces = JSON.parse(localStorage.getItem(dayKey));
  console.log(savedPlaces);
  if (savedPlaces) {
    // Limpiar la lista de lugares en el HTML
    placesList.innerHTML = '';

    // Sincronizar listPlaces con los lugares guardados
    listPlaces = savedPlaces.map((place, index) => {
      // Creamos un nuevo objeto Place con la estructura adecuada para listPlaces
      return new Place(
        place.name,
        place.photo,
        place.price,
        place.rating,
        place.address,
        (index + 1).toString(),
        place.category,
        place.lat,
        place.lng,
        place.transport || 'coche'
      );
    });

    // Reagregar los lugares a la lista
    listPlaces.forEach((place, index) => {
      const li = document.createElement("li");
      li.classList.add("list-item");
      const div = document.createElement("div");

      div.innerHTML = `${index + 1}. ${place.name} ${place.price} Euros`;
      const delBtn = document.createElement("button");
      delBtn.className = "delete-button";
      delBtn.innerHTML = '<img src="../mockups/garbage.png" alt="Eliminar" style="width: 20px; height: 20px;">';
      delBtn.addEventListener("click", () => {
        listPlaces.splice(index, 1);
        li.remove();
        counter--;
        renumberItems();
        setSaved(false);
        
        // Recalcular ruta después de eliminar un lugar
        if (listPlaces.length >= 2) {
          setTimeout(() => {
            calculateAndDisplayRoute();
          }, 100);
        } else {
          showRouteError('Se necesitan al menos 2 lugares para calcular una ruta');
        }
      });

      li.append(div, delBtn);
      placesList.appendChild(li);
    });
    console.log(listPlaces);
  }

  // Actualizar el clima para el día actual
  updateWeatherForCurrentDay();
  
  // Calcular ruta si hay al menos 2 lugares
  if (listPlaces.length >= 2) {
    calculateAndDisplayRoute();
  } else {
    showRouteError('Se necesitan al menos 2 lugares para calcular una ruta');
  }
}

/**
 * Actualizar el clima para el día actual basado en la ciudad y fecha
 */
function updateWeatherForCurrentDay() {
  // Obtener la ciudad del primer lugar del día (si existe)
  let cityName = '';
  
  if (listPlaces.length > 0) {
    // Intentar obtener la ciudad del primer lugar
    const firstPlace = listPlaces[0];
    
    // Verificar si el lugar tiene una dirección válida
    if (firstPlace.address && firstPlace.address.includes(',')) {
      // Extraer ciudad del address (asumiendo formato: "Dirección, Ciudad, País")
      const addressParts = firstPlace.address.split(',');
      if (addressParts.length >= 2) {
        const potentialCity = addressParts[1].trim();
        
        // Verificar que no sea un número o un nombre de lugar obvio
        if (potentialCity && 
            !/^\d+$/.test(potentialCity) && // No es solo números
            !potentialCity.startsWith('N°') && // No es un número de referencia
            potentialCity.length > 2 && // Tiene más de 2 caracteres
            !['Hotel', 'Restaurante', 'Museo', 'Parque', 'Centro comercial', 'Aeropuerto'].includes(potentialCity)) {
          cityName = potentialCity;
        }
      }
    }
    
    // Si no pudimos extraer la ciudad del address, intentar con el nombre del lugar
    if (!cityName && firstPlace.name) {
      // Lista de ciudades conocidas para verificar si el nombre del lugar contiene una ciudad
      const knownCities = [
        'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao',
        'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Oviedo', 'Granada', 'Tenerife', 'Las Vegas', 'New York',
        'London', 'Paris', 'Rome', 'Berlin', 'Amsterdam', 'Vienna', 'Prague', 'Budapest', 'Warsaw', 'Stockholm',
        'Oslo', 'Copenhagen', 'Helsinki', 'Dublin', 'Edinburgh', 'Glasgow', 'Manchester', 'Liverpool', 'Birmingham',
        'Leeds', 'Sheffield', 'Bristol', 'Cardiff', 'Newcastle', 'Leicester', 'Nottingham', 'Southampton', 'Portsmouth'
      ];
      
      for (const city of knownCities) {
        if (firstPlace.name.toLowerCase().includes(city.toLowerCase())) {
          cityName = city;
          break;
        }
      }
    }
  }
  
  // Si no tenemos ciudad de los lugares, intentar obtenerla del mapa actual
  if (!cityName) {
    // Intentar obtener la ciudad del centro del mapa actual
    if (map && map.getCenter) {
      const center = map.getCenter();
      if (center) {
        // Usar geocoding inverso para obtener la ciudad del centro del mapa
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: center }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const addressComponents = results[0].address_components;
            for (const component of addressComponents) {
              if (component.types.includes('locality')) {
                cityName = component.long_name;
                console.log('Ciudad detectada del mapa:', cityName);
                break;
              }
            }
          }
          
          // Si aún no tenemos ciudad, usar una por defecto
          if (!cityName) {
            cityName = 'Madrid';
          }
          
          // Verificar que la ciudad sea válida
          if (!cityName || cityName.length < 2 || /^\d+$/.test(cityName)) {
            cityName = 'Madrid';
          }
          
          console.log('Ciudad final para el clima:', cityName);
          
          // Usar la fecha seleccionada por el usuario (mediodía por defecto)
          const targetDate = new Date(selectedDate);
          targetDate.setHours(12, 0, 0, 0); // Mediodía
          
          // Actualizar el clima
          updateWeather(cityName, targetDate);
        });
        return; // Salir aquí para evitar ejecutar el código siguiente
      }
    }
    
    // Si no hay mapa, usar ciudad por defecto
    cityName = 'Madrid';
  }
  
  // Verificar que la ciudad sea válida
  if (!cityName || cityName.length < 2 || /^\d+$/.test(cityName)) {
    cityName = 'Madrid';
  }
  
  console.log('Ciudad detectada para el clima:', cityName);
  
  // Usar la fecha seleccionada por el usuario (mediodía por defecto)
  const targetDate = new Date(selectedDate);
  targetDate.setHours(12, 0, 0, 0); // Mediodía
  
  // Actualizar el clima
  updateWeather(cityName, targetDate);
}





document.getElementById("itinerary-title").addEventListener("input", function (e) {
    plan.title = e.target.value
});

document.getElementById("itinerary-description").addEventListener("input", function(e)  {
    plan.description = e.target.value
});

// Función para cargar la estructura de una plantilla
function loadTemplateStructure() {
    try {
        const templateData = sessionStorage.getItem('usingTemplate');
        if (!templateData) {
            console.error('No se encontró la plantilla en sessionStorage');
            return;
        }
        
        // Verificar si ya se cargó una plantilla para evitar duplicados
        if (isUsingTemplate) {
            console.log('Ya hay una plantilla cargada, limpiando primero...');
            clearCurrentItinerary();
        }
        
        const template = JSON.parse(templateData);
        
        // Configurar el plan con los datos de la plantilla
        plan.title = template.title.replace(' (Plantilla)', '');
        plan.description = template.description || '';
        
        // Actualizar los campos de entrada
        const titleInput = document.getElementById('itinerary-title');
        const descriptionInput = document.getElementById('itinerary-description');
        
        if (titleInput) titleInput.value = plan.title;
        if (descriptionInput) descriptionInput.value = plan.description;
        
        // Limpiar contenedor de botones de días antes de agregar nuevos
        const dayButtonsContainer = document.getElementById("day-buttons-container");
        if (dayButtonsContainer) {
            dayButtonsContainer.innerHTML = '';
        }
        
        // Crear la estructura de días basada en la plantilla
        template.itineraries.forEach((day, dayIndex) => {
            const dayKey = `Día ${dayIndex + 1}`;
            
            // Crear el botón del día
            const dayButton = document.createElement("button");
            dayButton.textContent = dayKey;
            dayButton.classList.add("day-button");
            dayButton.setAttribute("data-day", dayKey);
            dayButton.addEventListener("click", () => {
                loadDay(dayKey);
            });
            
            if (dayButtonsContainer) {
                dayButtonsContainer.appendChild(dayButton);
            }
            
            // Guardar los lugares del día en localStorage
            if (day.places && day.places.length > 0) {
                localStorage.setItem(dayKey, JSON.stringify(day.places));
            } else {
                localStorage.setItem(dayKey, JSON.stringify([]));
            }
        });
        
        // Configurar variables de control de plantilla
        isUsingTemplate = true;
        templateMaxDays = template.itineraries.length;
        counterDay = template.itineraries.length + 1;
        
        // Cargar el primer día por defecto
        if (template.itineraries.length > 0) {
            loadDay('Día 1');
        }
        
        // Mostrar mensaje informativo
        showTemplateInfo(template);
        
        // Limpiar la plantilla del sessionStorage
        sessionStorage.removeItem('usingTemplate');
        
        console.log(`Plantilla cargada: ${template.itineraries.length} días`);
        
    } catch (error) {
        console.error('Error al cargar la estructura de la plantilla:', error);
    }
}

// Función para mostrar información sobre la plantilla
function showTemplateInfo(template) {
    const totalDays = template.itineraries.length;
    const totalPlaces = template.itineraries.reduce((total, day) => total + day.places.length, 0);
    
    // Crear elemento informativo
    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #008cff;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        text-align: center;
    `;
    infoDiv.innerHTML = `
        <strong>Usando plantilla: ${template.title}</strong><br>
        <small>${totalDays} días, ${totalPlaces} lugares - Estructura fija</small>
    `;
    
    document.body.appendChild(infoDiv);
    
    // Remover después de 5 segundos
    setTimeout(() => {
        if (infoDiv.parentNode) {
            infoDiv.parentNode.removeChild(infoDiv);
        }
    }, 5000);
}

// Funciones para manejar plantillas
function initializeTemplateFunctionality() {
  const useTemplateBtn = document.getElementById('use-template-btn');
  if (useTemplateBtn) {
    useTemplateBtn.addEventListener('click', openTemplateModal);
  }
}

function openTemplateModal() {
  const modal = document.getElementById('templateModal');
  if (modal) {
    modal.style.display = 'block';
    loadTemplatesList();
  }
}

function closeTemplateModal() {
  const modal = document.getElementById('templateModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

function loadTemplatesList() {
  const templatesList = document.getElementById('templates-list');
  const noTemplates = document.getElementById('no-templates');
  
  if (!currentUserId) {
    console.error('Usuario no autenticado');
    return;
  }
  
  const templates = TemplateManager.getTemplates(currentUserId);
  
  if (templates.length === 0) {
    templatesList.style.display = 'none';
    noTemplates.style.display = 'block';
    return;
  }
  
  templatesList.style.display = 'block';
  noTemplates.style.display = 'none';
  
  const templatesHTML = templates.map(template => `
    <div class="template-item" onclick="applyTemplate('${template.id}')">
      <div class="template-info">
        <h4>${template.title}</h4>
        <p>${template.description || 'Sin descripción'}</p>
        <small>${template.itineraries.length} días, ${template.itineraries.reduce((total, day) => total + day.places.length, 0)} lugares</small>
      </div>
      <button class="apply-template-btn">Aplicar</button>
    </div>
  `).join('');
  
  templatesList.innerHTML = templatesHTML;
}

function applyTemplate(templateId) {
  if (!currentUserId) {
    console.error('Usuario no autenticado');
    return;
  }
  
  const template = TemplateManager.getTemplate(currentUserId, templateId);
  if (!template) {
    console.error('Plantilla no encontrada');
    return;
  }
  
  // Guardar la plantilla en sessionStorage para que se cargue al inicializar
  sessionStorage.setItem('usingTemplate', JSON.stringify(template));
  
  // Guardar los datos de la plantilla para generar lugares inteligentes
  if (template.templateData) {
    sessionStorage.setItem('activeTemplate', JSON.stringify(template.templateData));
  }
  
  // Cerrar el modal
  closeTemplateModal();
  
  // Limpiar el itinerario actual
  clearCurrentItinerary();
  
  // Cargar la estructura de la plantilla
  loadTemplateStructure();
  
  // Mostrar el botón de limpiar plantilla
  showClearTemplateButton();
  
  // Si es una plantilla inteligente, generar lugares automáticamente
  if (template.isSmartTemplate && template.templateData && template.city) {
    console.log('Generando lugares automáticamente para plantilla inteligente');
    const smartPlaces = generateSmartPlacesForCity(template.city, template.templateData);
    
    if (smartPlaces.length > 0) {
      // Agregar los lugares inteligentes al primer día
      const firstDayKey = 'Día 1';
      const existingPlaces = JSON.parse(localStorage.getItem(firstDayKey) || '[]');
      const updatedPlaces = [...existingPlaces, ...smartPlaces];
      localStorage.setItem(firstDayKey, JSON.stringify(updatedPlaces));
      
      // Recargar el día para mostrar los lugares
      loadDay(firstDayKey);
      
      showSuccessMessage(`Plantilla inteligente aplicada. Se generaron ${smartPlaces.length} lugares recomendados automáticamente.`);
    } else {
      showSuccessMessage('Plantilla inteligente aplicada. Busca lugares para generar recomendaciones personalizadas.');
    }
  } else {
    showSuccessMessage('Plantilla aplicada correctamente. Ahora busca lugares para generar recomendaciones inteligentes.');
  }
}

function clearCurrentItinerary() {
  // Limpiar campos de entrada
  document.getElementById('itinerary-title').value = '';
  document.getElementById('itinerary-description').value = '';
  
  // Limpiar lista de lugares
  const placesList = document.getElementById('itinerary-list');
  if (placesList) {
    placesList.innerHTML = '';
  }
  
  // Limpiar botones de días
  const dayButtonsContainer = document.getElementById('day-buttons-container');
  if (dayButtonsContainer) {
    dayButtonsContainer.innerHTML = '';
  }
  
  // Limpiar localStorage de días (limpiar más días para asegurar que no queden residuos)
  for (let i = 1; i <= 30; i++) {
    localStorage.removeItem(`Día ${i}`);
  }
  
  // Resetear variables
  listPlaces = [];
  counter = 0;
  counterDay = 1;
  plan = new ItineraryPlan("", "", "", []);
  
  // Actualizar el día mostrado
  const dayElement = document.getElementById('day');
  if (dayElement) {
    dayElement.innerHTML = 'Día 1';
  }
  
  // Resetear variables de plantilla
  isUsingTemplate = false;
  templateMaxDays = 0;
}

function showSuccessMessage(message) {
  const successDiv = document.createElement('div');
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #28a745;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 10000;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;
  successDiv.textContent = message;
  
  document.body.appendChild(successDiv);
  
  setTimeout(() => {
    if (successDiv.parentNode) {
      successDiv.parentNode.removeChild(successDiv);
    }
  }, 3000);
}

// Hacer las funciones disponibles globalmente
window.closeTemplateModal = closeTemplateModal;
window.applyTemplate = applyTemplate;

// Inicializar funcionalidad de plantillas cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
  // Obtener el usuario actual
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUserId = user.uid;
      initializeTemplateFunctionality();
      
      // Verificar si hay una plantilla para cargar
      if (sessionStorage.getItem('usingTemplate')) {
        loadTemplateStructure();
        showClearTemplateButton();
      }
    }
  });
  
  // Agregar event listener para el cambio de fecha
  const dateInput = document.getElementById('day-date');
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      selectedDate = new Date(e.target.value);
      updateWeatherForCurrentDay();
    });
  }
});

/**
 * Mostrar el botón de limpiar plantilla
 */
function showClearTemplateButton() {
  const clearBtn = document.getElementById('clear-template-btn');
  if (clearBtn) {
    clearBtn.style.display = 'inline-block';
    clearBtn.addEventListener('click', clearActiveTemplate);
  }
}

/**
 * Ocultar el botón de limpiar plantilla
 */
function hideClearTemplateButton() {
  const clearBtn = document.getElementById('clear-template-btn');
  if (clearBtn) {
    clearBtn.style.display = 'none';
  }
}

// Cerrar modal al hacer clic fuera de él
window.addEventListener('click', (event) => {
  const modal = document.getElementById('templateModal');
  if (event.target === modal) {
    closeTemplateModal();
  }
  
  const transportModal = document.getElementById('transportModal');
  if (event.target === transportModal) {
    closeTransportModal();
  }
});

// ======== FUNCIONES DE EDICIÓN MASIVA DE TRANSPORTES ========

/**
 * Inicializar la funcionalidad de edición masiva de transportes
 */
function initializeTransportFunctionality() {
  const editTransportBtn = document.getElementById('edit-transport-btn');
  const applyTransportBtn = document.getElementById('apply-transport-btn');
  
  if (editTransportBtn) {
    editTransportBtn.addEventListener('click', openTransportModal);
  }
  
  if (applyTransportBtn) {
    applyTransportBtn.addEventListener('click', applyTransportToAllDays);
  }
}

/**
 * Abrir el modal de edición de transportes
 */
function openTransportModal() {
  const modal = document.getElementById('transportModal');
  if (modal) {
    modal.style.display = 'block';
  }
}

/**
 * Cerrar el modal de edición de transportes
 */
function closeTransportModal() {
  const modal = document.getElementById('transportModal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Aplicar transporte a todos los días del itinerario
 */
function applyTransportToAllDays() {
  const selectedTransport = document.querySelector('input[name="transport"]:checked');
  
  if (!selectedTransport) {
    showSuccessMessage('Por favor selecciona un medio de transporte');
    return;
  }
  
  const transportType = selectedTransport.value;
  const transportName = selectedTransport.nextElementSibling.nextElementSibling.textContent;
  
  // Obtener todos los días del itinerario
  const dayButtons = document.querySelectorAll('#day-buttons-container button');
  let totalDays = dayButtons.length;
  
  // Si no hay botones de días, verificar si hay lugares en el día actual
  if (totalDays === 0 && listPlaces.length > 0) {
    totalDays = 1;
  }
  
  if (totalDays === 0) {
    showSuccessMessage('No hay días en el itinerario para actualizar');
    return;
  }
  
  // Verificar disponibilidad del transporte para todos los lugares
  const unavailablePlaces = [];
  
  // Verificar lugares del día actual
  listPlaces.forEach(place => {
    if (!isTransportAvailable(place, transportType)) {
      unavailablePlaces.push(place.name);
    }
  });
  
  // Verificar lugares de otros días
  dayButtons.forEach((button, index) => {
    const dayKey = `Día ${index + 1}`;
    const savedPlaces = JSON.parse(localStorage.getItem(dayKey) || '[]');
    savedPlaces.forEach(place => {
      if (!isTransportAvailable(place, transportType)) {
        unavailablePlaces.push(place.name);
      }
    });
  });
  
  // Si hay lugares no compatibles, mostrar advertencia
  if (unavailablePlaces.length > 0) {
    const warningMessage = `Algunos lugares no son compatibles con "${transportName}": ${unavailablePlaces.slice(0, 3).join(', ')}${unavailablePlaces.length > 3 ? '...' : ''}`;
    showSuccessMessage(warningMessage);
    return;
  }
  
  // Actualizar el transporte en todos los días
  let updatedDays = 0;
  
  // Actualizar días con botones
  dayButtons.forEach((button, index) => {
    const dayKey = `Día ${index + 1}`;
    const savedPlaces = JSON.parse(localStorage.getItem(dayKey) || '[]');
    const updatedPlaces = savedPlaces.map(place => ({
      ...place,
      transport: transportType
    }));
    localStorage.setItem(dayKey, JSON.stringify(updatedPlaces));
    updatedDays++;
  });
  
  // Actualizar lugares del día actual
  if (listPlaces.length > 0) {
    listPlaces.forEach(place => {
      place.transport = transportType;
    });
    updatedDays++;
    
    // Recalcular la ruta con el nuevo transporte
    setTimeout(() => {
      if (listPlaces.length >= 2) {
        console.log('Recalculando ruta con nuevo transporte:', transportType);
        calculateAndDisplayRoute();
      }
    }, 500);
  }
  
  // Cerrar el modal
  closeTransportModal();
  
  // Mostrar mensaje de éxito
  showSuccessMessage(`Transporte "${transportName}" aplicado a ${updatedDays} día(s)`);
}

/**
 * Verificar si un transporte está disponible para un lugar
 */
function isTransportAvailable(place, transportType) {
  // Lógica básica de compatibilidad
  const incompatibilities = {
    'avion': ['Parque', 'Centro comercial', 'Cafetería'],
    'tren': ['Parque', 'Centro comercial'],
    'barco': ['Parque', 'Centro comercial', 'Cafetería', 'Museo']
  };
  
  const incompatibleCategories = incompatibilities[transportType] || [];
  return !incompatibleCategories.includes(place.category);
}

// Hacer las funciones disponibles globalmente
window.closeTransportModal = closeTransportModal;
window.applyTransportToAllDays = applyTransportToAllDays;

/**
 * Limpiar la plantilla activa
 */
function clearActiveTemplate() {
  sessionStorage.removeItem('activeTemplate');
  sessionStorage.removeItem('usingTemplate');
  hideClearTemplateButton();
  showSuccessMessage('Plantilla activa eliminada. Puedes crear un nuevo itinerario desde cero.');
}

// Hacer la función disponible globalmente
window.clearActiveTemplate = clearActiveTemplate;

// Hacer las funciones disponibles globalmente
window.closeTransportModal = closeTransportModal;
window.applyTransportToAllDays = applyTransportToAllDays;
window.clearActiveTemplate = clearActiveTemplate;
window.showClearTemplateButton = showClearTemplateButton;
window.hideClearTemplateButton = hideClearTemplateButton;

// ======== FUNCIONES DE GENERACIÓN DE LUGARES INTELIGENTES ========

/**
 * Generar lugares inteligentes basados en la plantilla activa
 */
function generateSmartPlacesForCity(cityName, templateData) {
    console.log('generateSmartPlacesForCity llamado con:', { cityName, templateData });
    
    if (!templateData || !templateData.activities || templateData.activities.length === 0) {
        console.log('No hay plantilla activa o no tiene actividades');
        return []; // No hay plantilla activa o no tiene actividades
    }

    const places = [];
    const activities = templateData.activities;
    const budget = templateData.budget || 'medio';
    const pace = templateData.pace || 'moderado';
    
    console.log('Datos de la plantilla:', { activities, budget, pace });
    
    // Calcular cuántos lugares generar basado en el ritmo
    const placesPerDay = getPlacesPerDay(pace, activities);
    console.log('Lugares por día calculados:', placesPerDay);
    
    // Mapear actividades a categorías con más variedad
    const activityCategories = {
        'museos': ['Museo', 'Galería de Arte', 'Centro Cultural'],
        'restaurantes': ['Restaurante', 'Cafetería', 'Bar', 'Bistró'],
        'naturaleza': ['Parque', 'Jardín Botánico', 'Reserva Natural', 'Mirador'],
        'shopping': ['Centro comercial', 'Mercado', 'Tienda', 'Boutique'],
        'noche': ['Restaurante', 'Bar', 'Discoteca', 'Pub'],
        'deportes': ['Parque', 'Gimnasio', 'Centro Deportivo', 'Piscina']
    };

    // Mezclar las actividades para más variedad
    const shuffledActivities = [...activities].sort(() => Math.random() - 0.5);
    
    // Generar lugares para cada actividad con más variedad
    for (let i = 0; i < placesPerDay; i++) {
        const activity = shuffledActivities[i % shuffledActivities.length];
        const categories = activityCategories[activity];
        
        if (categories && categories.length > 0) {
            // Seleccionar una categoría al azar de las disponibles
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            const place = generateSmartPlace(randomCategory, budget, i + 1, cityName);
            places.push(place);
            console.log(`Lugar generado para actividad ${activity}:`, place);
        }
    }

    // Mezclar los lugares para que no estén en orden predecible
    const shuffledPlaces = places.sort(() => Math.random() - 0.5);

    console.log('Total de lugares inteligentes generados:', shuffledPlaces.length);
    return shuffledPlaces;
}

/**
 * Generar un lugar inteligente
 */
function generateSmartPlace(category, budget, placeNumber, cityName) {
    const budgetRanges = {
        'bajo': { min: 0, max: 50 },
        'medio': { min: 20, max: 150 },
        'alto': { min: 50, max: 500 }
    };

    const budgetRange = budgetRanges[budget] || budgetRanges['medio'];
    const price = Math.floor(Math.random() * (budgetRange.max - budgetRange.min + 1)) + budgetRange.min;
    
    const placeNames = getSmartPlaceNames(category, cityName);
    const randomName = placeNames[Math.floor(Math.random() * placeNames.length)];
    
    // Coordenadas base según la ciudad
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
    
    const baseCoords = cityCoordinates[cityName] || cityCoordinates['Madrid'];
    
    return {
        name: randomName,
        photo: "https://via.placeholder.com/200",
        price: price,
        rating: (Math.random() * 2 + 3).toFixed(1), // Rating entre 3.0 y 5.0
        address: `Dirección ${placeNumber}, ${cityName}`,
        id: `smart_place_${Date.now()}_${placeNumber}`,
        category: category,
        lat: baseCoords.lat + (Math.random() - 0.5) * 0.1,
        lng: baseCoords.lng + (Math.random() - 0.5) * 0.1,
        arrivalTime: null,
        departureTime: null
    };
}

/**
 * Obtener nombres de lugares inteligentes por ciudad
 */
function getSmartPlaceNames(category, cityName) {
    const citySpecificNames = {
        'Madrid': {
            'Museo': ['Museo del Prado', 'Museo Reina Sofía', 'Museo Thyssen-Bornemisza', 'Museo Arqueológico Nacional', 'Museo Sorolla', 'Museo Cerralbo'],
            'Galería de Arte': ['Galería Marlborough', 'Galería Elvira González', 'Galería Juana de Aizpuru', 'Galería Helga de Alvear'],
            'Centro Cultural': ['Centro Cultural Conde Duque', 'Centro Cultural Matadero', 'Centro Cultural Casa de Vacas'],
            'Restaurante': ['Restaurante Botín', 'Casa Lucio', 'Sobrino de Botín', 'La Bola Taberna', 'Casa Mono', 'DiverXO'],
            'Cafetería': ['Café Central', 'Café Gijón', 'Café de Oriente', 'Café Comercial', 'Café de la Luz'],
            'Bar': ['Bar Cock', 'Bar La Venencia', 'Bar Viva Madrid', 'Bar Angelica'],
            'Bistró': ['Bistró Le Petit Bistró', 'Bistró La Finca', 'Bistró El Club Allard'],
            'Parque': ['Parque del Retiro', 'Parque de El Capricho', 'Parque del Oeste', 'Casa de Campo', 'Parque Juan Carlos I'],
            'Jardín Botánico': ['Real Jardín Botánico', 'Jardín Botánico de la Universidad Complutense'],
            'Reserva Natural': ['Monte de El Pardo', 'Parque Regional del Sureste'],
            'Mirador': ['Mirador de San Nicolás', 'Mirador de la Cornisa', 'Mirador del Templo de Debod'],
            'Centro comercial': ['Centro Comercial La Vaguada', 'Centro Comercial Príncipe Pío', 'Centro Comercial Plaza Norte 2', 'Centro Comercial Islazul'],
            'Mercado': ['Mercado de San Miguel', 'Mercado de la Cebada', 'Mercado de Antón Martín', 'Mercado de San Antón'],
            'Tienda': ['Tienda de Antigüedades', 'Tienda de Artesanía', 'Tienda de Moda'],
            'Boutique': ['Boutique de Diseño', 'Boutique Vintage', 'Boutique de Lujo'],
            'Discoteca': ['Teatro Kapital', 'Pachá Madrid', 'Fabrik', 'Mondo'],
            'Pub': ['Pub O\'Connell', 'Pub Dubliners', 'Pub The Irish Rover'],
            'Gimnasio': ['Gimnasio Holmes Place', 'Gimnasio Virgin Active', 'Gimnasio Metropolitan'],
            'Centro Deportivo': ['Centro Deportivo Municipal', 'Centro Deportivo La Elipa'],
            'Piscina': ['Piscina Municipal', 'Piscina de Verano', 'Piscina Cubierta']
        },
        'Barcelona': {
            'Museo': ['Museo Picasso', 'Museo Nacional de Arte de Cataluña', 'Fundación Joan Miró', 'Museo de Historia de Barcelona', 'Museo de Arte Contemporáneo'],
            'Galería de Arte': ['Galería Senda', 'Galería Carles Taché', 'Galería Joan Prats'],
            'Centro Cultural': ['Centro Cultural CCCB', 'Centro Cultural CaixaForum', 'Centro Cultural Arts Santa Mònica'],
            'Restaurante': ['Restaurante Tickets', 'El Xampanyet', 'Can Paixano', 'La Boqueria', 'Casa Calvet'],
            'Cafetería': ['Café de l\'Òpera', 'Café Zurich', 'Café Viena', 'Café de la Pedrera'],
            'Bar': ['Bar Marsella', 'Bar Pastís', 'Bar Ocaña', 'Bar La Concha'],
            'Bistró': ['Bistró Le Petit Bistró', 'Bistró La Finca'],
            'Parque': ['Parque Güell', 'Parque de la Ciudadela', 'Parque del Laberinto de Horta', 'Montjuïc', 'Parque de la España Industrial'],
            'Jardín Botánico': ['Jardín Botánico de Barcelona', 'Jardín Botánico Histórico'],
            'Reserva Natural': ['Parc Natural de Collserola', 'Parc Natural del Delta del Llobregat'],
            'Mirador': ['Mirador de Colón', 'Mirador de Montjuïc', 'Mirador del Tibidabo'],
            'Centro comercial': ['Centro Comercial Diagonal Mar', 'Centro Comercial Glòries', 'Centro Comercial Maremagnum', 'Centro Comercial Arenas'],
            'Mercado': ['Mercado de La Boqueria', 'Mercado de Sant Antoni', 'Mercado de la Concepció'],
            'Tienda': ['Tienda de Diseño', 'Tienda de Artesanía', 'Tienda de Moda'],
            'Boutique': ['Boutique de Diseño', 'Boutique Vintage', 'Boutique de Lujo'],
            'Discoteca': ['Razzmatazz', 'Sala Apolo', 'Moog', 'Opium'],
            'Pub': ['Pub George Payne', 'Pub The Wild Rover', 'Pub Flaherty\'s'],
            'Gimnasio': ['Gimnasio Holmes Place', 'Gimnasio DiR', 'Gimnasio Metropolitan'],
            'Centro Deportivo': ['Centro Deportivo Municipal', 'Centro Deportivo Can Caralleu'],
            'Piscina': ['Piscina Municipal', 'Piscina de Verano', 'Piscina Cubierta']
        },
        'Valencia': {
            'Museo': ['Museo de Bellas Artes', 'Museo de las Ciencias', 'Museo Fallero', 'Museo de Historia de Valencia', 'Museo de la Seda'],
            'Galería de Arte': ['Galería Punto', 'Galería Rosa Santos', 'Galería del Tossal'],
            'Centro Cultural': ['Centro Cultural La Nau', 'Centro Cultural Bancaixa', 'Centro Cultural Octubre'],
            'Restaurante': ['Restaurante La Pepica', 'Casa Montaña', 'Restaurante Navarro', 'La Sucursal', 'Ricard Camarena'],
            'Cafetería': ['Café de las Horas', 'Café Bombón', 'Café Central', 'Café de la Seu'],
            'Bar': ['Bar El Palleter', 'Bar La Lola', 'Bar La Fábrica de Hielo'],
            'Bistró': ['Bistró Le Petit Bistró', 'Bistró La Finca'],
            'Parque': ['Jardín del Turia', 'Parque de Cabecera', 'Jardín Botánico', 'Parque de Viveros', 'Parque de la Rambleta'],
            'Jardín Botánico': ['Jardín Botánico de Valencia', 'Jardín Botánico Histórico'],
            'Reserva Natural': ['Parque Natural de la Albufera', 'Parque Natural del Turia'],
            'Mirador': ['Mirador del Miguelete', 'Mirador de las Torres de Serranos'],
            'Centro comercial': ['Centro Comercial Aqua', 'Centro Comercial Nuevo Centro', 'Centro Comercial Bonaire', 'Centro Comercial Saler'],
            'Mercado': ['Mercado Central', 'Mercado de Colón', 'Mercado de Ruzafa'],
            'Tienda': ['Tienda de Artesanía', 'Tienda de Moda', 'Tienda de Diseño'],
            'Boutique': ['Boutique de Diseño', 'Boutique Vintage', 'Boutique de Lujo'],
            'Discoteca': ['Sala Moon', 'Akuarela Playa', 'Sala 16 Toneladas'],
            'Pub': ['Pub Dublin', 'Pub O\'Haras', 'Pub The Irish'],
            'Gimnasio': ['Gimnasio Holmes Place', 'Gimnasio DiR', 'Gimnasio Metropolitan'],
            'Centro Deportivo': ['Centro Deportivo Municipal', 'Centro Deportivo Benicalap'],
            'Piscina': ['Piscina Municipal', 'Piscina de Verano', 'Piscina Cubierta']
        }
    };

    const defaultNames = {
        'Museo': ['Museo Nacional de Arte', 'Museo de Historia Natural', 'Museo de Ciencias', 'Galería de Arte Moderno', 'Museo de Arte Contemporáneo'],
        'Galería de Arte': ['Galería de Arte Moderno', 'Galería de Arte Contemporáneo', 'Galería de Arte Clásico'],
        'Centro Cultural': ['Centro Cultural Municipal', 'Centro Cultural Regional', 'Centro de Arte Contemporáneo'],
        'Restaurante': ['Restaurante El Gourmet', 'Café Central', 'Bistró Francés', 'Trattoria Italiana', 'Restaurante de Autor'],
        'Cafetería': ['Café del Arte', 'Café Vintage', 'Café Literario', 'Café Moderna', 'Café Tradicional'],
        'Bar': ['Bar Tradicional', 'Bar Moderno', 'Bar de Tapas', 'Bar de Vinos'],
        'Bistró': ['Bistró Francés', 'Bistró Mediterráneo', 'Bistró de Autor'],
        'Parque': ['Parque Central', 'Jardín Botánico', 'Parque de la Ciudad', 'Reserva Natural', 'Parque Urbano'],
        'Jardín Botánico': ['Jardín Botánico Municipal', 'Jardín Botánico Histórico', 'Jardín Botánico Moderno'],
        'Reserva Natural': ['Reserva Natural Municipal', 'Parque Natural Regional', 'Área Natural Protegida'],
        'Mirador': ['Mirador de la Ciudad', 'Mirador Panorámico', 'Mirador Turístico'],
        'Centro comercial': ['Centro Comercial Plaza Mayor', 'Galería de Compras', 'Mall Central', 'Centro Comercial Moderno'],
        'Mercado': ['Mercado Central', 'Mercado Municipal', 'Mercado de Abastos', 'Mercado Artesanal'],
        'Tienda': ['Tienda de Artesanía', 'Tienda de Moda', 'Tienda de Diseño', 'Tienda Local'],
        'Boutique': ['Boutique de Diseño', 'Boutique Vintage', 'Boutique de Lujo', 'Boutique Local'],
        'Discoteca': ['Discoteca Central', 'Sala de Fiestas', 'Club Nocturno', 'Sala de Baile'],
        'Pub': ['Pub Irlandés', 'Pub Inglés', 'Pub Local', 'Pub Tradicional'],
        'Gimnasio': ['Gimnasio Municipal', 'Gimnasio Privado', 'Centro de Fitness', 'Gimnasio Moderno'],
        'Centro Deportivo': ['Centro Deportivo Municipal', 'Centro Deportivo Privado', 'Complejo Deportivo'],
        'Piscina': ['Piscina Municipal', 'Piscina de Verano', 'Piscina Cubierta', 'Centro Acuático'],
        'Hotel': ['Hotel Central', 'Hotel Boutique', 'Hotel de Lujo', 'Hotel Familiar'],
        'Aeropuerto': ['Aeropuerto Internacional', 'Aeropuerto Central', 'Aeropuerto de la Ciudad', 'Terminal Aérea Principal']
    };

    return citySpecificNames[cityName]?.[category] || defaultNames[category] || ['Lugar de Interés'];
}

/**
 * Calcular lugares por día basado en ritmo y actividades
 */
function getPlacesPerDay(pace, activities) {
    const basePlaces = activities.length;
    const paceMultiplier = {
        'relajado': 0.7,
        'moderado': 1.0,
        'intenso': 1.5
    };
    return Math.max(2, Math.round(basePlaces * (paceMultiplier[pace] || 1.0)));
}

// Variables globales para el sistema de rutas (ya declaradas arriba)

/**
 * Inicializar el mini mapa de rutas
 */
function initRouteMap() {
  try {
    console.log('Inicializando mini mapa de rutas...');
    
    // Inicializar servicios de direcciones (siempre, independientemente del minimapa)
    if (!directionsService) {
      directionsService = new google.maps.DirectionsService();
      console.log('DirectionsService inicializado');
    }
    if (!routeRenderer) {
      routeRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        preserveViewport: true
      });
      console.log('DirectionsRenderer inicializado');
    }

    // Crear el mini mapa de rutas (solo si existe el elemento)
    const routeMinimapElement = document.getElementById('route-minimap');
    if (routeMinimapElement) {
      console.log('Elemento route-minimap encontrado, creando mapa...');
      
      routeMinimap = new google.maps.Map(routeMinimapElement, {
        zoom: 12,
        center: { lat: 40.4168, lng: -3.7038 }, // Madrid por defecto
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        gestureHandling: 'cooperative'
      });

      // Asignar el renderer al minimapa
      routeRenderer.setMap(routeMinimap);
      console.log('Mini mapa de rutas creado exitosamente');

      // Configurar controles del minimapa
      setupRouteMapControls();
    } else {
      console.warn('Elemento route-minimap no encontrado');
    }
  } catch (error) {
    console.error('Error al inicializar mini mapa de rutas:', error);
  }
}

/**
 * Configurar controles del mini mapa
 */
function setupRouteMapControls() {
  console.log('Configurando controles del minimapa...');
  
  const zoomInBtn = document.getElementById('zoom-in-route');
  const zoomOutBtn = document.getElementById('zoom-out-route');
  const fitRouteBtn = document.getElementById('fit-route');

  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      if (routeMinimap) {
        const currentZoom = routeMinimap.getZoom();
        if (currentZoom < 20) { // Límite máximo de zoom
          routeMinimap.setZoom(currentZoom + 1);
          console.log('Zoom in:', currentZoom + 1);
        }
      }
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      if (routeMinimap) {
        const currentZoom = routeMinimap.getZoom();
        if (currentZoom > 1) { // Límite mínimo de zoom
          routeMinimap.setZoom(currentZoom - 1);
          console.log('Zoom out:', currentZoom - 1);
        }
      }
    });
  }

  if (fitRouteBtn) {
    fitRouteBtn.addEventListener('click', () => {
      if (routeMinimap && routeRenderer) {
        try {
          // Obtener las direcciones actuales del renderer
          const directions = routeRenderer.getDirections();
          if (directions && directions.routes && directions.routes.length > 0) {
            const route = directions.routes[0];
            if (route.overview_path && route.overview_path.length > 0) {
              // Crear bounds para ajustar el mapa a toda la ruta
              const bounds = new google.maps.LatLngBounds();
              route.overview_path.forEach(point => {
                bounds.extend(point);
              });
              
              // Ajustar el mapa con un pequeño padding
              routeMinimap.fitBounds(bounds, 20);
              console.log('Mapa ajustado a la ruta completa');
            }
          }
        } catch (error) {
          console.error('Error al ajustar mapa a la ruta:', error);
        }
      }
    });
  }

  console.log('Controles del minimapa configurados');
}

/**
 * Asegurar que el minimapa esté inicializado
 */
function ensureRouteMapInitialized() {
  if (!routeMinimap) {
    console.log('Minimapa no inicializado, intentando inicializar...');
    initRouteMap();
    
    // Si aún no está inicializado después de un intento, esperar un poco más
    if (!routeMinimap) {
      setTimeout(() => {
        if (!routeMinimap) {
          console.warn('No se pudo inicializar el minimapa después de múltiples intentos');
        }
      }, 500);
    }
  }
  
  return !!routeMinimap;
}

/**
 * Calcular y mostrar la ruta entre los lugares
 */
function calculateAndDisplayRoute() {
  console.log('Iniciando cálculo de ruta...');
  console.log('Lugares en la lista:', listPlaces.length);
  
  if (listPlaces.length < 2) {
    console.log('No hay suficientes lugares para calcular ruta');
    showRouteError('Se necesitan al menos 2 lugares para calcular una ruta');
    return;
  }

  // Verificar que directionsService esté disponible
  if (!directionsService) {
    console.error('DirectionsService no está disponible, intentando inicializar...');
    initDirectionsService();
    
    if (!directionsService) {
      console.error('No se pudo inicializar DirectionsService');
      showRouteError('Servicio de rutas no disponible');
      return;
    }
  }

  // Asegurar que el minimapa esté inicializado
  ensureRouteMapInitialized();

  console.log('DirectionsService disponible, calculando ruta...');
  showRouteLoading();

  try {
    // Verificar que los lugares tengan coordenadas válidas
    const validPlaces = listPlaces.filter(place => 
      place.lat !== undefined && 
      place.lat !== null && 
      place.lng !== undefined && 
      place.lng !== null &&
      !isNaN(place.lat) && 
      !isNaN(place.lng)
    );

    if (validPlaces.length < 2) {
      console.error('No hay suficientes lugares con coordenadas válidas');
      showRouteError('Algunos lugares no tienen coordenadas válidas');
      return;
    }

    console.log('Lugares válidos para ruta:', validPlaces.length);

    // Crear waypoints para la ruta
    const waypoints = validPlaces.slice(1, -1).map(place => ({
      location: { lat: place.lat, lng: place.lng },
      stopover: true
    }));

    // Determinar el modo de transporte basado en el primer lugar
    const firstPlace = validPlaces[0];
    const transportMode = firstPlace.transport || 'coche';
    const googleTravelMode = getGoogleTravelMode(transportMode);
    
    console.log('Modo de transporte detectado:', transportMode, '->', googleTravelMode);

    // Configurar la solicitud de ruta
    const request = {
      origin: { lat: validPlaces[0].lat, lng: validPlaces[0].lng },
      destination: { lat: validPlaces[validPlaces.length - 1].lat, lng: validPlaces[validPlaces.length - 1].lng },
      waypoints: waypoints,
      optimizeWaypoints: false, // Mantener el orden original
      travelMode: googleTravelMode,
      unitSystem: google.maps.UnitSystem.METRIC
    };

    console.log('Solicitud de ruta:', request);

    // Calcular la ruta usando la API de Google Maps
    directionsService.route(request, (result, status) => {
      console.log('Respuesta de DirectionsService:', status);
      
      if (status === google.maps.DirectionsStatus.OK) {
        console.log('Ruta calculada exitosamente');
        displayRoute(result, transportMode);
        
        // Mostrar la ruta en el minimapa si está disponible
        if (routeRenderer && routeMinimap) {
          routeRenderer.setDirections(result);
          console.log('Ruta mostrada en minimapa');
        }
      } else {
        console.error('Error al calcular ruta:', status);
        let errorMessage = 'Error al calcular la ruta';
        
        switch (status) {
          case google.maps.DirectionsStatus.NOT_FOUND:
            errorMessage = 'No se encontró la ruta entre los lugares';
            break;
          case google.maps.DirectionsStatus.ZERO_RESULTS:
            errorMessage = 'No hay ruta disponible entre los lugares';
            break;
          case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
            errorMessage = 'Demasiados puntos de paso (máximo 23)';
            break;
          case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
            errorMessage = 'Límite de consultas excedido';
            break;
          case google.maps.DirectionsStatus.REQUEST_DENIED:
            errorMessage = 'Solicitud denegada';
            break;
          case google.maps.DirectionsStatus.UNKNOWN_ERROR:
            errorMessage = 'Error desconocido al calcular la ruta';
            break;
        }
        
        showRouteError(errorMessage);
      }
    });

  } catch (error) {
    console.error('Error al calcular ruta:', error);
    showRouteError('Error interno al calcular la ruta');
  }
}

/**
 * Convertir modo de transporte local a Google Maps TravelMode
 */
function getGoogleTravelMode(transportMode) {
  switch (transportMode.toLowerCase()) {
    case 'coche':
    case 'car':
      return google.maps.TravelMode.DRIVING;
    case 'a-pie':
    case 'walking':
    case 'caminando':
      return google.maps.TravelMode.WALKING;
    case 'bicicleta':
    case 'bicycle':
    case 'bike':
      return google.maps.TravelMode.BICYCLING;
    case 'transporte-publico':
    case 'transit':
    case 'public':
      return google.maps.TravelMode.TRANSIT;
    case 'taxi':
      return google.maps.TravelMode.DRIVING; // Taxi usa el mismo modo que coche
    case 'tren':
    case 'train':
      return google.maps.TravelMode.TRANSIT;
    default:
      return google.maps.TravelMode.DRIVING;
  }
}

/**
 * Mostrar la ruta calculada
 */
function displayRoute(result, transportMode = 'coche') {
  try {
    // Verificar que result y result.routes existen y tienen contenido
    if (!result || !result.routes || !result.routes.length || !result.routes[0]) {
      console.error('Resultado de ruta inválido:', result);
      showRouteError('No se pudo obtener información de la ruta');
      return;
    }

    console.log('Mostrando ruta calculada:', result.routes[0]);

    // Mostrar el contenido de la ruta
    const routeContent = document.querySelector('.route-content');
    const routeLoading = document.querySelector('.route-loading');
    const routeError = document.querySelector('.route-error');

    if (routeContent) routeContent.style.display = 'block';
    if (routeLoading) routeLoading.style.display = 'none';
    if (routeError) routeError.style.display = 'none';

    // Obtener la primera ruta
    const route = result.routes[0];
    const leg = route.legs[0]; // Para rutas simples, usar la primera pierna

    // Mostrar información resumida de la ruta
    const routeDistance = document.getElementById('route-distance');
    const routeDuration = document.getElementById('route-duration');
    const routeTransport = document.getElementById('route-transport');

    if (routeDistance) {
      routeDistance.textContent = `📏 ${route.legs.reduce((total, leg) => total + leg.distance.text, '')}`;
    }
    
    if (routeDuration) {
      routeDuration.textContent = `⏱️ ${route.legs.reduce((total, leg) => total + leg.duration.text, '')}`;
    }
    
    if (routeTransport) {
      routeTransport.textContent = `${getTransportIcon(transportMode)} ${getTransportModeText(transportMode)}`;
    }

    // Mostrar pasos detallados de la ruta
    const routeSteps = document.getElementById('route-steps');
    if (routeSteps) {
      routeSteps.innerHTML = '';
      
      // Mostrar pasos para cada pierna de la ruta
      route.legs.forEach((leg, legIndex) => {
        if (legIndex > 0) {
          // Agregar separador entre piernas
          const separator = document.createElement('div');
          separator.className = 'route-step';
          separator.innerHTML = `
            <div class="route-step-icon">📍</div>
            <span>Llegada a: ${leg.start_address}</span>
          `;
          routeSteps.appendChild(separator);
        }
        
        // Mostrar pasos de esta pierna
        leg.steps.forEach((step, stepIndex) => {
          const stepElement = document.createElement('div');
          stepElement.className = 'route-step';
          
          // Obtener icono según el tipo de instrucción
          const icon = getStepIcon(step.maneuver || step.instructions);
          
          stepElement.innerHTML = `
            <div class="route-step-icon">${icon}</div>
            <span>${step.instructions}</span>
            <small>${step.distance.text} - ${step.duration.text}</small>
          `;
          routeSteps.appendChild(stepElement);
        });
      });
    }

    console.log('Ruta mostrada exitosamente');

  } catch (error) {
    console.error('Error al mostrar la ruta:', error);
    showRouteError('Error al mostrar la información de la ruta');
  }
}

/**
 * Obtener icono del modo de transporte
 */
function getTransportIcon(transportMode) {
  switch (transportMode.toLowerCase()) {
    case 'coche':
    case 'car':
      return '🚗';
    case 'a-pie':
    case 'walking':
    case 'caminando':
      return '🚶';
    case 'bicicleta':
    case 'bicycle':
    case 'bike':
      return '🚲';
    case 'transporte-publico':
    case 'transit':
    case 'public':
      return '🚌';
    case 'taxi':
      return '🚕';
    case 'tren':
    case 'train':
      return '🚆';
    default:
      return '🚗';
  }
}

/**
 * Obtener texto del modo de transporte
 */
function getTransportModeText(travelMode) {
  switch (travelMode) {
    case 'DRIVING':
      return 'En coche';
    case 'WALKING':
      return 'A pie';
    case 'BICYCLING':
      return 'En bicicleta';
    case 'TRANSIT':
      return 'Transporte público';
    default:
      return 'En coche';
  }
}

/**
 * Obtener icono para el paso de la ruta
 */
function getStepIcon(instructions) {
  const instruction = instructions.toLowerCase();
  
  if (instruction.includes('gire a la derecha') || instruction.includes('turn right')) {
    return '↱';
  } else if (instruction.includes('gire a la izquierda') || instruction.includes('turn left')) {
    return '↰';
  } else if (instruction.includes('continúe') || instruction.includes('continue')) {
    return '→';
  } else if (instruction.includes('tome') || instruction.includes('take')) {
    return '🛣️';
  } else if (instruction.includes('salga') || instruction.includes('exit')) {
    return '🚪';
  } else if (instruction.includes('entrada') || instruction.includes('entrance')) {
    return '🚪';
  } else {
    return '📍';
  }
}



/**
 * Mostrar loading de la ruta
 */
function showRouteLoading() {
  const routeLoading = document.querySelector('.route-loading');
  const routeContent = document.querySelector('.route-content');
  const routeError = document.querySelector('.route-error');

  if (routeLoading) routeLoading.style.display = 'block';
  if (routeContent) routeContent.style.display = 'none';
  if (routeError) routeError.style.display = 'none';
}

/**
 * Mostrar error de la ruta
 */
function showRouteError(message) {
  const routeError = document.querySelector('.route-error');
  const routeLoading = document.querySelector('.route-loading');
  const routeContent = document.querySelector('.route-content');

  if (routeError) {
    routeError.textContent = message;
    routeError.style.display = 'block';
  }
  if (routeLoading) routeLoading.style.display = 'none';
  if (routeContent) routeContent.style.display = 'none';
}

/**
 * Inicializar el selector de fecha y hora
 */
function initDateTimeSelector() {
  try {
    const dateInput = document.getElementById('day-date');
    if (dateInput) {
      // Establecer fecha por defecto (hoy)
      const today = new Date();
      dateInput.value = today.toISOString().split('T')[0];
      selectedDate = today;
      
      // Agregar event listener para cambios de fecha
      dateInput.addEventListener('change', (e) => {
        selectedDate = new Date(e.target.value);
        console.log('Fecha seleccionada:', selectedDate);
        
        // Actualizar el clima para la nueva fecha
        updateWeatherForCurrentDay();
      });
      
      console.log('Selector de fecha inicializado');
    }
  } catch (error) {
    console.error('Error al inicializar selector de fecha:', error);
  }
}

/**
 * Asegurar que el minimapa esté inicializado
 */