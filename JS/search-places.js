// ✅ MODIFICACIÓN PRINCIPAL: añadir botón "Añadir" a cada resultado

import { request } from '/JS/places.js';

let map, service, infowindow;
let markers = [];
let selectedCategory = "Hotel";

// Info para el itinerario
let placeName, placePhoto, placePrice, placeAddress, placeRating, placeWebUrl;
export let listNames = [], listPhoto = [], listPrice = [], listRating = [], listAddress = [], listDates = [], listCategories = [];
let itineraryTitle;
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
    fetchNearbyPlaces(place.geometry.location);
  });

  const reloadBtn = document.getElementById("reload-button");
  reloadBtn.addEventListener('click', function(event) {
    event.preventDefault();
    const places = searchBox.getPlaces();
    if (!places.length) return;
    fetchNearbyPlaces(places[0].geometry.location);
  });
}

function fetchNearbyPlaces(location) {
  const option = request[selectedCategory];
  const req = { location, radius: option.radius, keyword: selectedCategory };
  service.nearbySearch(req, (results, status) => {
    if (status !== google.maps.places.PlacesServiceStatus.OK) return;

    const sortedResults = results.filter(p => p.rating && p.photos).sort((a, b) => b.rating - a.rating);
    const container = document.getElementById("places-list");
    container.innerHTML = '';

    sortedResults.forEach((place) => {
      const li = document.createElement("li");
      const photoUrl = place.photos ? place.photos[0].getUrl({ maxWidth: 200 }) : 'https://via.placeholder.com/200';

      const name = place.name;
      const rating = place.rating || 'N/A';
      const price = calculatePrice(selectedCategory, place);

      li.innerHTML = `
        <img src="${photoUrl}" alt="${name}" class="place-image" style="width: 50%; height: auto;">
        <div><strong>${name}</strong></div>
        <div>${price}</div>
        <div>Rating: ${rating}</div>
      `;

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
    return `${price} Euros por persona`;
  }
  if (category === "Cafetería") {
    price = [10, 10, 15, 20, 25, 30][priceLevel] || 10;
    return `${price} Euros por persona`;
  }
  if (category === "Hotel") {
    price = [20, 20, 50, 100, 250, 500][Math.round(rating) - 1] || 20;
    return `${price} Euros la noche`;
  }
  if (category === "Museo") return `5 Euros`;
  if (["Parque", "Centro comercial", "Aeropuerto"].includes(category)) return `Gratis`;
  return `Precio no disponible`;
}

function addToItinerary(place) {
  if (listNames.includes(place.name)) {
    alert("Este lugar ya está en el itinerario.");
    return;
  }
  if (listCategories.includes("Hotel") && selectedCategory === "Hotel") {
    alert("Ya has elegido un hotel.");
    return;
  }

  listNames.push(place.name);
  listPhoto.push(place.photos ? place.photos[0].getUrl({ maxWidth: 300 }) : '');
  listAddress.push(place.vicinity || '');
  listRating.push(place.rating || '');
  listCategories.push(selectedCategory);
  listPrice.push(place.price_level || 0);
  listDates.push(++counter);

  const li = document.createElement("li");
  li.classList.add("list-item");
  const div = document.createElement("div");
  div.innerHTML = `${counter}. ${place.name}`;

  const delBtn = document.createElement("button");
  delBtn.className = "delete-button";
  delBtn.textContent = "Eliminar";
  delBtn.addEventListener("click", () => {
    const index = Array.from(placesList.children).indexOf(li);
    [listNames, listPhoto, listPrice, listAddress, listRating, listDates, listCategories].forEach(arr => arr.splice(index, 1));
    li.remove();
    counter--;
    renumberItems();
  });

  li.append(div, delBtn);
  placesList.appendChild(li);
}

function renumberItems() {
  const items = placesList.children;
  for (let i = 0; i < items.length; i++) {
    const name = listNames[i];
    const price = listPrice[i];
    const cat = listCategories[i];
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

window.onload = initMap;

document.getElementById("select-container").addEventListener("change", (e) => {
  selectedCategory = e.target.value;
});

document.getElementById("itinerary-title").addEventListener("change", (e) => {
  itineraryTitle = e.target.value;
});

export function getItineraryData() {
  return {
    listNames,
    listPhoto,
    listPrice,
    listRating,
    listAddress,
    listDates,
    listCategories,
  };
}
