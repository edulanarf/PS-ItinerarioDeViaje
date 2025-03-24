window.addEventListener('load',() => {
    document.querySelectorAll('.nav-tabs > a').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            document.querySelectorAll('.nav-tabs > a').forEach(el => el.classList.remove('active'));
            el.classList.add('active');
            document.querySelectorAll('.tab-content > div').forEach(el => el.classList.remove('show'));
            document.querySelector(el.getAttribute('href')).classList.add('show');
        });
    });
    initMap();
});

function initMap() {
  const defaultLocation = { lat: 28.1235, lng: -15.4363 }; // Coordenadas de Las Palmas GC
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
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