import { request } from '/JS/places.js';

let map, service, infowindow;
let markers = [];
let selectedCategory = "Restaurante";

//Info para el itinerario
let placeName;
let placePhoto;
let placePrice;
let placeAddress;
let placeRating;
let placeWebUrl;

let listNames = [];
let listPhoto = [];
let listPrice = [];
let listAddress = [];
let listRating = [];


function initMap() {
  const defaultLocation = { lat: 28.1235, lng: -15.4363 }; // Coordenadas de Las Palmas GC
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
  });

  service = new google.maps.places.PlacesService(map);
  infowindow = new google.maps.InfoWindow();

  const input = document.getElementById("search-input");
  const searchBox = new google.maps.places.SearchBox(input);

  // Maneja el cambio de lugar en el searchBox
  searchBox.addListener("places_changed", () => {
    const places = searchBox.getPlaces();
    if (places.length === 0) return;

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

    fetchNearbyPlaces(place.geometry.location);
  });

  //Listener para el botón de añadir
  const addOption = document.getElementById("add-info-button");
  addOption.addEventListener('click', function() {


    console.log(placeName);
    console.log(placePhoto);
    console.log(placePrice); //0 = Gratis, 1 = Barato, 2 = Moderado, 3 = Caro, 4 = Muy Caro
    console.log(placeAddress);
    console.log(placeRating);

    if (listNames.includes(placeName)) {
      alert("El lugar ya se ha añadido al itinerario");
      return;
    }
    listNames.push(placeName);
    listPhoto.push(placePhoto);
    listAddress.push(placeAddress);
    listRating.push(placeRating);

    if(placePrice != null && placePrice != undefined && placePrice !== "Precio no disponible"){
      if(placePrice === 1){
        listPrice.push(20);
      }
      if(placePrice === 2){
        listPrice.push(30);
      }
      if(placePrice === 3){
        listPrice.push(40);
      }
      if(placePrice=== 4){
        listPrice.push(50);
      }
      if(placePrice === 5){
        listPrice.push(60);
      }
    } else { //Precio predeterminado 20
      listPrice.push(20);
    }

  });

  const save = document.getElementById("save-itinerary");
  addOption.addEventListener('click', function() {
    console.log(listNames);
    console.log(listPhoto);
    console.log(listPrice); //0 = Gratis, 1 = Barato, 2 = Moderado, 3 = Caro, 4 = Muy Caro
    console.log(listRating);
    console.log(listAddress);
  });




  // Listener para el botón de recargar la búsqueda
  const changeOptionReload = document.getElementById("reload-button");
  changeOptionReload.addEventListener('click', function() {
    const places = searchBox.getPlaces();
    if (places.length === 0) return;
    const place = places[0];
    fetchNearbyPlaces(place.geometry.location);
  });
}

// Función para obtener lugares cercanos y mostrarlos
function fetchNearbyPlaces(location) {
  const option = request[selectedCategory];

  const requests = {
    location: location,
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
        let photoUrl = place.photos ? place.photos[0].getUrl({ maxWidth: 200 }) : 'https://via.placeholder.com/200';

        li.innerHTML = `
          <img src="${photoUrl}" alt="${place.name}" class="place-image" style="width: 200px; height: auto; border-radius: 10px;">
          <div> ${place.name} </div>
          Rating: ${place.rating || 'N/A'}`;

        const imgElement = li.querySelector('.place-image');
        imgElement.addEventListener('click', () => {
          showPlaceInfo(place);
        });

        placesList.appendChild(li);
      });
    }
  });
}

function showPlaceInfo(place) {
  infowindow.setContent(`
    <h3>${place.name}</h3>
    <p>Rating: ${place.rating || 'N/A'}</p>
    <p>${place.vicinity || 'No address available'}</p>
  `);
  placeName = place.name;
  placePhoto = place.photos ? place.photos[0].getUrl({ maxWidth: 300 }) : 'https://via.placeholder.com/200';

  placePrice = place.price_level || 'Precio no disponible';

  placeRating = place.rating !== undefined
    ? `⭐ Valoración: ${place.rating} (${'⭐'.repeat(Math.round(place.rating))})`
    : 'Valoración no disponible';
  placeAddress = place.vicinity || 'Dirección no disponible';
  placeWebUrl = place.website
  infowindow.setPosition(place.geometry.location);
  infowindow.open(map);
}
window.onload = initMap;

// Listener para cambio de categoría
const categorySelect = document.getElementById('select-container');
categorySelect.addEventListener('change', function() {
  selectedCategory = categorySelect.value;
  console.log("Categoría seleccionada:", selectedCategory);
});