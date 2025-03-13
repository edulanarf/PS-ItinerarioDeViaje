let map, service, infowindow;
let markers=[];

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
map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

// Este evento se dispara cuando el usuario selecciona un lugar de la barra de búsqueda
searchBox.addListener("places_changed", () => {
const places = searchBox.getPlaces();

if (places.length == 0) return;

// Limpiamos los marcadores
markers.forEach((marker) => marker.setMap(null));

const place = places[0];
map.setCenter(place.geometry.location);
map.setZoom(14);

const marker = new google.maps.Marker({
map, position: place.geometry.location,
});

markers.push(marker);

// Mostrar detalles del lugar
infowindow.setContent(place.name);
infowindow.open(map, marker);

// Buscar lugares cercanos al lugar seleccionado (por ejemplo, restaurantes)
const request = {
  location: place.geometry.location,
  radius: '1000',
  type: 'restaurant', // Tipo de lugar a buscar
};


// Realizar la búsqueda de lugares cercanos
service.nearbySearch(request, (results, status) => {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    // Mostrar los resultados de los restaurantes
    const placesList = document.getElementById('places-list');
    placesList.innerHTML = ''; // Limpiar la lista anterior

    results.forEach((place) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${place.name}</strong><br>Rating: ${place.rating || 'N/A'}`;
      placesList.appendChild(li);
    });
  }
});
});
}

// Cargar el mapa al inicio
window.onload = initMap;

