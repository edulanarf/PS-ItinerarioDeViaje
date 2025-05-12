// noinspection JSUnresolvedReference

import {onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { auth } from './firebase-config.js';
import { Itinerary, ItineraryPlan, Place } from './types.js';

//module
import {currentItineraryPlan} from './my-itineraries-const.js';


let map, service, infowindow, circle;
let markers = [];
let selectedCategory = "Hotel";
let price;
let priceString;
let counterDay = 1;
let radius = 2000;

export let PLAN_ID = ""
export let TITLE = ""
export let DESCRIPTION = ""

/**
 * @type {Place[][]}
 */
export const allPlaces = [[]]


//NODES
const ItineraryPlanDaysContainer = document.getElementById("places");
const daySelector = document.getElementById("daySelector")


//TEMPLATES
const dayContainerTemplate = document.getElementById("day-container");
const listPlaceItemTemplate = document.getElementById("list-place-item");

// Info para el itinerario
let dayCurrent = 1
let counter = 0;


onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "../HTML/user-login.html"
  }
})

// Crear un objeto URL a partir de la URL actual
const url = new URL(window.location.href);
// Obtener la query parameters usando URLSearchParams
const params = new URLSearchParams(url.search);
// Acceder a un parámetro específico
const paramValue = params.get('edit');
/* si se esta editando:
la url seria algo como ..../HTML/search-places.html?edit=true
si no se esta editando:
la url seria algo como ..../HTML/search-places.html
 */
/**
 * @type {ItineraryPlan}
 */
let editingItinerary = null
if (paramValue) {
  console.log("editing");
  editingItinerary = currentItineraryPlan()
  PLAN_ID = editingItinerary.id
  await renderExisting()
} else {
  console.log("creating");
}



//PLACE

///map references
/**
 * @param {number} day
 * @param {Place} place
 */
async function addPlaceToMatrix(day,place) {
  allPlaces[day-1].push(place)
  console.log("place added",allPlaces);
}

async function removePlaceFromMatrix(day,place) {
  console.log("deleting",day,place, "from", allPlaces);
  allPlaces[day-1].splice(allPlaces[day-1].indexOf(place),1);
  console.log("place deleted",allPlaces);
}

async function displayPriceOfPlace(place) {
  if (place.category === "Hotel") return `${place.price} Euros la noche`;
  else if (["Restaurante", "Cafetería", "Museo"].includes(place.category))
    return `${place.price} Euros por persona`;
  else return `Gratis`;
}

/// HTML
/**
 * @param {Place} place
 * @param {number} day
 */
async function createPlaceItem(place,day){
  let clone = document.importNode(listPlaceItemTemplate.content, true).querySelector("li");
  clone.querySelector(".name").textContent = place.name;
  clone.querySelector(".price").textContent = `${await displayPriceOfPlace(place)}`;
  clone.querySelector(".delete-button").addEventListener("click", async () => {
    clone.remove();
    await removePlaceFromMatrix(day,place)
  })
  await addPlaceToMatrix(day,place)
  console.log("createplaceitem", clone);
  return clone
}

/**
 * @param {Place} place
 * @param {number} day
 */
async function renderNewPlaceForDay(place,day){
  document.querySelector(`[data-day="${day}"]`).querySelector('ul').appendChild( await createPlaceItem(place, day));
}


// CRUD Itinerary (day)
/// map References
async function newDay(){
  allPlaces.push([]);
  console.log("new day",allPlaces);
}
async function deleteDay(day){
  allPlaces.splice(day,1);
  console.log("day deleted",allPlaces);
}



/// selector
async function createOptionForDaySelector(i) {
  const option = document.createElement("option");
  option.value = `${i}`;
  option.text = `Día ${i}`;
  return option;
}

async function deleteDayFromSelector(day){
  let option = daySelector.querySelector(`[value="${day}"]`);
  option.remove();
  for (let i = day + 1; i <= allPlaces.length; i++) {
    option = (daySelector.querySelector(`[value="${i}"]`))
    if (option) {
      option.value = `${i-1}`;
      option.text =`Día ${i-1}`;
    }
  }
  console.log("deleted day",day,allPlaces);
}

async function updateSelector(){
  daySelector.appendChild( await createOptionForDaySelector(allPlaces.length));
  daySelector.value = `${allPlaces.length}`;
}


/// HTML
async function createDayContainer(){
  return document
    .importNode(dayContainerTemplate.content, true)
    .querySelector("div");
}

/**
 * @param {number} from - number of the former day
 * @param {number}  to - number of the next day
 */
async function switchDay(from, to) {
  document.querySelector(`[data-day="${from}"]`).style.display = "none";
  document.querySelector(`[data-day="${to}"]`).style.display = "block"
  dayCurrent = to
}

/**
 * @param {number} day
 * @param {Itinerary} itinerary
 */
async function renderPlacesForDay(day, itinerary) {
  let list = document.querySelector(`[data-day="${day}"]`).querySelector("ul");
  await Promise.all(
    itinerary.places.map(async (place) => {
    list.appendChild(await createPlaceItem(place, day));
  }))
}



async function renumberDays(index){
  console.log("renumber days");
  const days = await document.querySelectorAll('[data-day]')
  console.log(days.length);
  days.forEach((day) => {
    if (Number(day.dataset.day) > index) {
      day.dataset.day = `${Number(day.dataset.day)-1}`
      day.querySelector("h1").textContent = `Día ${day.dataset.day}`;
    }
  })
}

/**
 * @param {number} index
 * @return {HTMLElement} day element
 * @see renderNewDay - calls this function to create the element
 */
async function createDayElement(index){
  let day = await createDayContainer();
  console.log("day element created:",day, index);
  day.dataset.day = `${index}`;
  day.querySelector('h1').textContent = "Día " + index;
  day.querySelector('.delete-button').addEventListener('click', async () => {
    day.remove();
    await deleteDayFromSelector(index)
    await deleteDay(index)
    await renumberDays(index)
    daySelector.value = `${index-1}`
    await switchDay(index-1,index-1)
  })
  await newDay()
  await updateSelector()
  day.style.display = "none";
  console.log("new day element created and filled:",day, index);
  return day
}

/**
 * given a number, creates and renders a new day
 * @param {number} index
 * @see createDayElement - renderNewDay uses this function to create the element
 */
async function renderNewDay(index){
  console.log("index of day to add", index);
  ItineraryPlanDaysContainer.appendChild( await createDayElement(index));
  console.log("switching from render new day", dayCurrent, index);
  await switchDay(dayCurrent,index)
}

/**
 * @param {number} index
 * @param {Itinerary} itinerary
 */
async function renderNewDayForExisting(index, itinerary) {
  await renderNewDay(index)
  await renderPlacesForDay(index, itinerary)
  await switchDay(index-1, index)
}

async function renderExisting(){
  document.getElementById("itinerary-title").value = editingItinerary.title;
  document.getElementById("itinerary-description").value = editingItinerary.description;
  await renderPlacesForDay(1, editingItinerary.itineraries.at(0))
  editingItinerary.itineraries.map(async (itinerary, index) => {
    if (index === 0) return;
    await renderNewDayForExisting(index + 1, itinerary);
  })
  dayCurrent = editingItinerary.itineraries.length;
}


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
  console.log("void", searchBox.getPlaces());

  searchBox.addListener("places_changed", async () => {
    const places = searchBox.getPlaces();
    console.log(" search places",places);
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
    await fetchNearbyPlaces(place.geometry.location);
  });

  const reloadBtn = document.getElementById("reload-button");
  reloadBtn.addEventListener('click', async function(event) {
    event.preventDefault();
    console.log(searchBox);
    const places = searchBox.getPlaces();
    console.log(" reload places",places);
    if (!places.length) return;
    await fetchNearbyPlaces(places[0].geometry.location);
  });
  document.getElementById("select-container").addEventListener('change', async function(event) {
    event.preventDefault();
    const places = searchBox.getPlaces();
    if (!places.length) return;
    await fetchNearbyPlaces(places[0].geometry.location);
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

async function fetchNearbyPlaces(location) {
  const req = { location, radius: radius, keyword: selectedCategory };
  service.nearbySearch(req, (results, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK) return;

    const sortedResults = results.filter(p => p.rating && p.photos).sort((a, b) => b.rating - a.rating);
    const container = document.getElementById("places-list");
    container.innerHTML = '';

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
      addBtn.addEventListener("click", async () => {
        await addToItinerary(place);
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

async function addToItinerary(place) {

  console.log("reading",dayCurrent, allPlaces);
  //Mensaje error repetido
  const repeatError = document.getElementById("repeat-error");
  if (allPlaces[dayCurrent-1].find(p => p.name === place.name)) {
    repeatError.textContent = "Este lugar ya se ha añadido al itinerario";
    repeatError.style.display = "block";
    repeatError.style.borderColor = "red";
    return;
  } else {
    repeatError.style.display = "none";
  }

  //Mensaje error Hotel
  const hotelError = document.getElementById("hotel-error");
  if (allPlaces[dayCurrent-1].find(p => p.category === "Hotel" ) && place.category === "Hotel") {
    hotelError.textContent = "Ya se ha añadido un hotel";
    hotelError.style.display = "block";
    hotelError.style.borderColor = "red";
    return;
  } else {
    hotelError.style.display = "none";
  }

  //Mensaje error Elegir un hotel
  const notHotelError = document.getElementById("not-hotel-error");
  if (counterDay === 1 && allPlaces[dayCurrent-1].length === 0 && selectedCategory !== "Hotel") {
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
    place.geometry.location.lng()
  )

  await renderNewPlaceForDay(aPlace, dayCurrent);
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

window.onload = function() {
  localStorage.clear(); // Elimina todas las claves del localStorage
  initMap();
};


document.getElementById("select-container").addEventListener("change", (e) => {
  selectedCategory = e.target.value;
});

document.getElementById("save-day-button").addEventListener("click", async (_) => {
  console.log("current day from adding", dayCurrent, "places", allPlaces);
  if (allPlaces[dayCurrent-1].length === 0) {
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
  await renderNewDay(allPlaces.length + 1);

});

document.getElementById("itinerary-title").addEventListener("input", function (e) {
    TITLE = e.target.value
});

document.getElementById("itinerary-description").addEventListener("input", function(e)  {
    DESCRIPTION = e.target.value
});

daySelector.addEventListener('change', async function(event) {
  event.preventDefault();
  console.log("switching from selector", dayCurrent, daySelector.value);
  await switchDay(dayCurrent,Number(daySelector.value))
})