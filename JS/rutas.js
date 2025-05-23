    import {auth} from "./firebase-config.js"
    import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
    import { currentRoutes } from './my-itineraries.js';

    let map;
    let index=0;
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; //Letras para puntuar los sitios del mapa e imprimirlos por pantalla
    let selectedTravelMode = google.maps.TravelMode.DRIVING;
    let currentUser = null;

    let dayRoute = [];

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user;
      }
    });

    async function loadMap(user, currentRoutes, selectedTravelMode) {
      let index = 0; // Índice para identificar los días

      // Verificar que currentRoutes es válido
      if (!Array.isArray(currentRoutes)) {
        console.error("currentRoutes no es un arreglo válido.");
        return;
      }

      // Iterar sobre cada itinerario
      currentRoutes.forEach((day, dayIndex) => {
        // Asegurarnos de que el día tiene lugares (places)
        if (day.places && Array.isArray(day.places)) {
          const dayData = day;
          console.log(dayData);

          // Preparar las rutas de este día
          let dayRoute = [];
          dayData.places.forEach(place => {
            dayRoute.push(place.address);
          });
          // Llamamos a initMap y lo agregamos al contenedor dentro del popup
          initMap(dayIndex, selectedTravelMode, dayRoute);
        }
      });
    }

    function initMap(dayIndex, selectedTravelMode, dayRoute) {


      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();

      const dayContainer = document.createElement("div");
      dayContainer.classList.add('day-container');

      const mapContainer = document.createElement("div");
      mapContainer.id = `map-day-${dayIndex}`;
      mapContainer.classList.add('map-container');
      mapContainer.style.height = "300px";
      mapContainer.style.minHeight = "300px";
      mapContainer.style.marginBottom = "10px";

      const dayLabel = document.createElement("div");
      dayLabel.textContent = `DÍA ${dayIndex + 1}`;
      dayLabel.style.textAlign = "center";
      dayLabel.style.marginTop = "10px";
      dayLabel.style.color = "black";
      dayLabel.style.fontSize = "16px";

      dayContainer.appendChild(mapContainer);
      dayContainer.appendChild(dayLabel);

      const popup = document.getElementById('popup');
      const popupContent = popup.querySelector('.popup-content');

      popupContent.appendChild(dayContainer);


      const map = new google.maps.Map(mapContainer, {
        zoom: 14
      });

      directionsRenderer.setMap(map);

      // Mapeo de los lugares intermedios para incluirlos en la solicitud de ruta
      const waypoints = dayRoute.slice(1, -1).map((direccion) => ({
        location: direccion,
        stopover: true,
      }));

      const request = {
        origin: dayRoute[0],
        destination: dayRoute[dayRoute.length - 1],
        waypoints: waypoints,
        travelMode: selectedTravelMode,
        optimizeWaypoints: true // Para ruta óptima
      };

      // Realizar la solicitud para calcular la ruta
      directionsService.route(request, (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          console.log(result.routes[0].legs); // Tiempos, distancias, etc.

          if (dayRoute.length <= 1) {
            console.log("Solo hay un lugar, no se calcula la ruta.");
            return; // Salir de la función si solo hay un lugar
          }

          // Mostrar la distancia y tiempo de cada ruta por separado
          result.routes[0].legs.forEach((leg, index) => {
            const distancia = leg.distance.text;
            const tiempo = leg.duration.text;

            const letraInicio = letras[index];
            const letraFin = letras[index + 1];


            const infoContainer = document.createElement("div");
            infoContainer.innerHTML = `
        <strong>Ruta ${letraInicio} ➝ ${letraFin}</strong>
        <div class="tiempo">Tiempo estimado: ${tiempo}</div>
        <div class="distancia">Distancia: ${distancia}</div>
            `;
            infoContainer.style.color = "black";
            dayContainer.appendChild(infoContainer);
          });
        } else {
          console.error("No se pudo calcular la ruta:", status);
        }

      });
    }

    function showPopup() {
      const popup = document.getElementById('popup');
      const popupContent = popup.querySelector('.popup-content'); // Contenedor de mapas dentro del popup

      // Limpiar los mapas previos (si hay) antes de agregar nuevos
      popupContent.innerHTML = '';

      const travelModeSection = document.createElement('section');
      travelModeSection.innerHTML = `
    <select id="travelMode">
        <option value="DRIVING">Coche/Moto</option>
        <option value="WALKING">Caminando</option>
        <option value="BICYCLING">Bicicleta</option>
    </select>
  `;
      travelModeSection.classList.add('travel-mode-selector');
      popupContent.appendChild(travelModeSection);
      // Mostrar el popup
      popup.classList.add('show');

      // Cargar los mapas
      loadMap(currentUser, currentRoutes, selectedTravelMode);
      console.log("message");

      const travelModeSelect = document.getElementById("travelMode");
      travelModeSelect.addEventListener("change", (event) => {
        const selectedMode = event.target.value;  // Obtiene el valor del modo de transporte seleccionado

        // Convertimos el valor a un modo de transporte de Google Maps
        let selectedTravelMode;
        switch (selectedMode) {
          case "DRIVING":
            selectedTravelMode = google.maps.TravelMode.DRIVING;
            break;
          case "WALKING":
            selectedTravelMode = google.maps.TravelMode.WALKING;
            break;
          case "BICYCLING":
            selectedTravelMode = google.maps.TravelMode.BICYCLING;
            break;
          default:
            selectedTravelMode = google.maps.TravelMode.DRIVING;
        }
        clearMaps();
        loadMap(currentUser, currentRoutes, selectedTravelMode);
      });
    }


    const closeButton = document.getElementById('closePopup');
    closeButton.addEventListener('click', () => {
      const popup = document.getElementById('popup');
      popup.classList.remove('show');
    });

    export const verRutaBtn = document.createElement("button");
    verRutaBtn.textContent = "Ver rutas";
    verRutaBtn.classList.add("ver-ruta-btn");

    verRutaBtn.addEventListener("click", () => {
      console.log(currentRoutes);
      showPopup();
    });



    function clearMaps() {
      const dayContainers = document.querySelectorAll('.popup-content .day-container');

      // Eliminar cada contenedor de día (que incluye tanto el mapa como el texto)
      dayContainers.forEach(container => {
        container.remove();  // Elimina el contenedor completo (mapa + texto)
      });
    }


