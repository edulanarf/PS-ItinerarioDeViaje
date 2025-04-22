    import {db, auth} from "../JS/firebase-config.js"
    import { collection, doc, getDocs } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
    import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';

    let map;
    let index=0;
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"; //Letras para puntuar los sitios del mapa e imprimirlos por pantalla

    let dayRoute = [];

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        const itinerariesRef = collection(db,"users", user.uid, "itineraries");
        const itineraries = await getDocs(itinerariesRef);
        for (const itiner of itineraries.docs) {
          console.log(itiner.data());
          const itineraryRef = collection(db,"users", user.uid, "itineraries", itiner.id, "days");
          const itinerary = await getDocs(itineraryRef);
          itinerary.forEach(day => {
            const dayData = day.data();
            console.log(dayData);
            dayData.places.forEach(place => {
              dayRoute.push(place.address);
            });
            index = index+1;
            initMap(index);
            dayRoute=[]
          });
        }
        index = 0;
      }
    });


    function initMap(dayIndex) {

      const directionsService = new google.maps.DirectionsService();
      const directionsRenderer = new google.maps.DirectionsRenderer();
      const mapContainer = document.createElement("div");
      mapContainer.id = `map-day-${dayIndex}`;// Asignar un ID único para cada día
      mapContainer.style.height = "400px"; // Ajustar el tamaño del mapa
      document.body.appendChild(mapContainer); // O el contenedor deseado en tu HTML
      const map = new google.maps.Map(document.getElementById(mapContainer.id), {
        zoom: 14
      });

      directionsRenderer.setMap(map);

      //Mapeo de los lugares intermedios para incluirlos en el request
      const waypoints = dayRoute.slice(1, -1).map((direccion) => ({
        location: direccion,
        stopover: true,
      }));

      const request = { //Para los lugares pasar string.
        origin: dayRoute[0],
        destination: dayRoute[0],
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING, //DRIVING(solo en coche/moto), WALKING, BICYCLING, TRANSIT(transporte público)
        optimizeWaypoints: true //para ruta optima.
      };

      //Se pueden editar los puntos A, B, C ... Etc
      directionsService.route(request, (result, status) => {
        if (status === "OK") {
          directionsRenderer.setDirections(result);
          console.log(result.routes[0].legs); //Tiempos, distancias, etc.

          //Obtengo la distancia y tiempo de cada ruta por separado
          result.routes[0].legs.forEach((leg, index) => {
            const distancia = leg.distance.text;
            const tiempo = leg.duration.text;

            const letraInicio = letras[index];
            const letraFin = letras[index + 1];

            console.log(`Ruta ${letraInicio} ➝ ${letraFin}`);
            console.log(`  Desde: ${leg.start_address}`);
            console.log(`  Hasta: ${leg.end_address}`);
            console.log(`  Tiempo estimado: ${tiempo}`);
            console.log(`  Distancia: ${distancia}`);
          });
        } else {
          console.error("No se pudo calcular la ruta:", status);
        }
      });
    }
