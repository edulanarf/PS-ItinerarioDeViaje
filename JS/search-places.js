// noinspection JSUnresolvedReference

import {onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { setSaved } from './saved-verification.js';
import { auth } from './firebase-config.js';
import { Itinerary, ItineraryPlan, Place } from './types.js';


let map, service, infowindow, circle;
let markers = [];
let selectedCategory = "Hotel";
let price;
let priceString;
let counterDay = 1;
let radius = 2000;
/**
 * @type {ItineraryPlan}
 */
export let plan = new ItineraryPlan("","","",[]);
/**
 * @type {Place[]}
 */
const listPlaces = []
const day = document.getElementById("day")

onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("not authenticated!!!!");
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

function fetchNearbyPlaces(location) {
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
      addBtn.addEventListener("click", () => {
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
    selectedCategory
  )

  listPlaces.push(aPlace)

  const li = document.createElement("li");
  li.classList.add("list-item");
  const div = document.createElement("div");

  div.innerHTML = `${counter}. ${place.name} ${priceString} `;

  const delBtn = document.createElement("button");
  delBtn.className = "delete-button";
  delBtn.textContent = "Eliminar";
  delBtn.addEventListener("click", () => {
    const index = Array.from(placesList.children).indexOf(li);
    listPlaces.splice(index,1);
    li.remove();
    counter--;
    renumberItems();
    setSaved(false);
  });
  setSaved(false);
  li.append(div, delBtn);
  placesList.appendChild(li);

  if(selectedCategory === "Hotel"){
    day.innerHTML = `Día ${counterDay}`;
  }

  console.log(plan);
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

window.onload = function() {
  localStorage.clear(); // Elimina todas las claves del localStorage
  console.log("LocalStorage limpio al recargar la página.");
  initMap();
};


document.getElementById("select-container").addEventListener("change", (e) => {
  selectedCategory = e.target.value;
});

document.getElementById("save-day-button").addEventListener("click", (_) => {
  const key = `Día ${counterDay}`;
  let it = new Itinerary(key, [...listPlaces])
  console.log(plan);
  plan.itineraries.push(it)
  counterDay++;
  localStorage.setItem(key, JSON.stringify(listPlaces));
  listPlaces.length = 0
  day.innerHTML = `Día ${counterDay}`;
  placesList.innerHTML = '';
});





document.getElementById("itinerary-title").addEventListener("input", function (e) {
    plan.title = e.target.value
    console.log(e.target.value);
});

document.getElementById("itinerary-title").addEventListener("change", function( e) {
  plan.title = e.target.value
  console.log("b " + e.target.value);
});

document.getElementById("itinerary-description").addEventListener("input", function(e)  {
    plan.description = e.target.value
    console.log(e.target.value);
});

