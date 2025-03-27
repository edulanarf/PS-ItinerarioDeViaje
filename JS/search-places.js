import { request } from '/JS/places.js';

let map, service, infowindow;
let markers = [];
let selectedCategory = "Hotel";

//Info para el itinerario
let placeName;
let placePhoto;
let placePrice;
let placeAddress;
let placeRating;
let placeWebUrl;

export let listNames = [];
export let listPhoto = [];
export let listPrice = [];
export let listRating = [];
export let listAddress = [];
export let listDates = [];
export let listCategories = [];
let itineraryTitle;
let counter = 0;
let counterButtons = 0;



const placesList = document.getElementById("itinerary-list");


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


  const addOption = document.getElementById("add-info-button");
  addOption.addEventListener('click', function () {
    if (listNames.includes(placeName)) {
      alert("El lugar ya se ha añadido al itinerario");
      return;
    }
    if(listCategories.includes("Hotel") && selectedCategory === "Hotel") {
      alert("Ya se ha elegido un hotel");
      return;
    }


    listNames.push(placeName);
    listPhoto.push(placePhoto);
    listAddress.push(placeAddress);
    listRating.push(placeRating);
    listCategories.push(selectedCategory);

    counter++;
    listDates.push(counter);
    let price=0;

    // Asignación de precio
    if(selectedCategory === "Restaurante") {
      if (placePrice != null && placePrice !== "Precio no disponible") {
        let priceMapping = [20, 20, 30, 40, 50, 60]; // Mapea los precios
        listPrice.push(priceMapping[placePrice] || 20);
        price = priceMapping[placePrice] || 20;
        price = price + "Euros por persona";
      } else {
        listPrice.push(20); // Precio por defecto
        price = "20 Euros por persona";
      }
    }

    if(selectedCategory === "Cafetería") {
      if (placePrice != null && placePrice !== "Precio no disponible") {
        let priceMapping = [10, 10, 15, 20, 25, 30]; // Mapea los precios
        listPrice.push(priceMapping[placePrice] || 10);
        price = priceMapping[placePrice] || 10;
        price = price + "Euros por persona";
      } else {
        listPrice.push(10); // Precio por defecto
        price = "10 Euros por persona";
      }
    }

    if(selectedCategory === "Hotel") {
      if (placeRating != null && placeRating !== "Valoración no disponible") {
        let ratingIndex = Math.round(placeRating);
        let priceMapping = [20, 20, 50, 100, 250, 500]; // Mapea los precios
        listPrice.push(priceMapping[ratingIndex-1] || 20);
        price = priceMapping[ratingIndex-1] || 20;
        price = price + "Euros la noche";
      } else {
        listPrice.push(20); // Precio por defecto
        price = "20 Euros la noche";
      }
    }

    if(selectedCategory === "Museo") {
      listPrice.push(5); // Precio por defecto
      price = "5 Euros por persona";
    }

    if(selectedCategory === "Parque" || selectedCategory === "Centro comercial"
      || selectedCategory === "Aeropuerto") {
      listPrice.push(0); // Precio por defecto
      price = "Gratis";
    }

    // Crea un nuevo ítem para la lista
    const listItem = document.createElement("li");
    const placeInfo = document.createElement("div");
    placeInfo.innerHTML = `${counter}. ${placeName} ${price}`; // Muestra el número del lugar junto al nombre

    const deleteButton = document.createElement("button");
      deleteButton.textContent = "Eliminar";
      deleteButton.classList.add("delete-button");

  // Agregar un event listener al botón de eliminar
      deleteButton.addEventListener('click', function() {
        // Eliminar el lugar de las listas internas usando el número de lugar (counter)
        const index = Array.from(placesList.children).indexOf(listItem);

          listNames.splice(index, 1);
          listPhoto.splice(index, 1);
          listPrice.splice(index, 1);
          listAddress.splice(index, 1);
          listRating.splice(index, 1);
          listDates.splice(index, 1);
        listCategories.splice(index, 1);
          // Eliminar el ítem de la lista en el DOM
          listItem.remove();
          counter--;
          counterButtons++;
          renumberListItems();
      });

    //Reordenar la lista
    function renumberListItems() {
      const items = placesList.getElementsByTagName("li");

      for (let i = 0; i < items.length; i++) {
        const placeInfo = items[i].querySelector('div');
        if(listCategories[i] === "Hotel"){
          placeInfo.innerHTML = `${i + 1}. ${listNames[i]} ${listPrice[i]} Euros la noche`;
        }
        if(listCategories[i] === "Restaurante" || listCategories[i] === "Cafetería" ||
          listCategories[i] === "Museo") {
          placeInfo.innerHTML = `${i + 1}. ${listNames[i]} ${listPrice[i]} Euros por persona`;
        }

        if(listCategories[i] === "Parque" || listCategories[i] === "Centro comercial" ||
          listCategories[i] === "Aeropuerto") {
          placeInfo.innerHTML = `${i + 1}. ${listNames[i]} Gratis`;
        }

      }
    }

    // Añadir el item a la lista
    listItem.appendChild(placeInfo);
    listItem.appendChild(deleteButton);
    listItem.classList.add("list-item");
    placesList.appendChild(listItem);
  });

  // Listener para el botón de recargar la búsqueda
  const changeOptionReload = document.getElementById("reload-button");
  changeOptionReload.addEventListener('click', function() {
    event.preventDefault();
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

        placeName = place.name;
        placePhoto = place.photos ? place.photos[0].getUrl({ maxWidth: 300 }) : 'https://via.placeholder.com/200';
        placePrice = place.price_level || 'Precio no disponible';
        placeRating = place.rating || 'Valoración no disponible';
        placeAddress = place.vicinity || 'Dirección no disponible';
        placeWebUrl = place.website
        let price;

        if(selectedCategory === "Restaurante") {
          if (placePrice != null && placePrice !== "Precio no disponible") {
            let priceMapping = [20, 20, 30, 40, 50, 60]; // Mapea los precios
            price = priceMapping[placePrice] || 20;
            price = price +" Euros por persona";
          } else {
            price = "20 Euros por persona" ;
          }
        }

        if(selectedCategory === "Cafetería") {
          if (placePrice != null && placePrice !== "Precio no disponible") {
            let priceMapping = [10, 10, 15, 20, 25, 30];// Mapea los precios
            price = priceMapping[placePrice] || 10;
            price = price +" Euros por persona";
          } else {
            price = "10 Euros por persona" ;
          }
        }

        if(selectedCategory === "Hotel") {
          if (placeRating != null && placeRating !== "Valoración no disponible") {
            let ratingIndex = Math.round(placeRating);
            let priceMapping = [20, 20, 50, 100, 250, 500]; // Mapea los precios
            price = priceMapping[ratingIndex-1] || 20;
            price = price + " Euros la noche";
          } else {
            price="20 Euros la noche";
          }
        }

        if(selectedCategory === "Museo") {
          price = "5 Euros"; // Precio por defecto
        }

        if(selectedCategory === "Parque" || selectedCategory === "Centro comercial"
          || selectedCategory === "Aeropuerto") {
          price = "gratis";
        }


        li.innerHTML = `
          <img src="${photoUrl}" alt="${place.name}" class="place-image" style="width: 50%; height: auto;">
          <div> ${place.name} </div>
          <div> ${price}</div>
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
  placeName = place.name;
  placePhoto = place.photos ? place.photos[0].getUrl({ maxWidth: 300 }) : 'https://via.placeholder.com/200';
  placePrice = place.price_level || 'Precio no disponible';
  placeRating = place.rating || 'Valoración no disponible';
  placeAddress = place.vicinity || 'Dirección no disponible';
  placeWebUrl = place.website

  infowindow.setContent(`
    <h3>${place.name}</h3>
    <p>Rating: ${place.rating || 'N/A'}</p>
    <p>${place.vicinity || 'No address available'}</p>
  `);

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

//Listener para el titulo del itinerario
const itineraryTitleInput = document.getElementById('itinerary-title');
itineraryTitleInput.addEventListener('change', function() {
  itineraryTitle = itineraryTitle.value;
  console.log(itineraryTitle.value);
})

//exportar las listas para el js de guardar itinerario
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

