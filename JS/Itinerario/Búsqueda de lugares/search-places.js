import { request } from '/js/Itinerario/Búsqueda de lugares/places.js';

let map, service, infowindow;
let markers=[];
let selectedCategory="Restaurante";

function initMap() {
  const defaultLocation = { lat: 28.1235, lng: -15.4363 }; // Coordenadas de Nueva York
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

if (places.length == 0) return;

markers.forEach((marker) => marker.setMap(null));
const place = places[0];
map.setCenter(place.geometry.location);
map.setZoom(14);

const marker = new google.maps.Marker({
map, position: place.geometry.location,
});

markers.push(marker);
infowindow.setContent(place.name);
infowindow.open(map, marker);

const option = request[selectedCategory];

const requests = {
  location: place.geometry.location,
  radius: option.radius,
  keyword: selectedCategory,
};

  service.nearbySearch(requests, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      const sortedResults = results
        .filter(place => place.rating && place.photos)
        .sort((a, b) => b.rating - a.rating);
      const placesList = document.getElementById('places-list');
      placesList.innerHTML = '';

      sortedResults.forEach((place) => {
        const li = document.createElement('li');
        let photoUrl = place.photos ? place.photos[0].getUrl({ maxWidth: 400 }) : 'https://via.placeholder.com/400';


        //Enseña la lista con una foto y nombre, omitiendo los valores N/A
        li.innerHTML = `
        <img src="${photoUrl}" alt="${place.name}" style="width: 400px; height: auto; border-radius: 10px;">
        <div> ${place.name} </div>
        Rating: ${place.rating || 'N/A'}`;

        placesList.appendChild(li);
      });
    }
  });
});
}


window.onload = initMap;

const categorySelect = document.getElementById('select-container');

categorySelect.addEventListener('change', function() {
  selectedCategory = categorySelect.value;
  console.log("Categoría seleccionada:", selectedCategory);
});

