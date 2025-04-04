let map;

//Ejemplo con variables
let inicio = "C. León y Castillo, 227, Las Palmas de Gran Canaria"; //Salimos del hotel
let final = "C. León y Castillo, 227, Las Palmas de Gran Canaria"; //Volvemos al hotel
let intermedios = ["C. de Alonso de Ojeda, 4, Las Palmas de Gran Canaria", //Ruta intermedia
  "C. Lepanto, 7, local 3, Las Palmas de Gran Canaria",
  "C. Alfredo L Jones, 41, Las Palmas de Gran Canaria"
];

function initMap() {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 14
  });

  directionsRenderer.setMap(map);

  //Mapeo de los lugares intermedios para incluirlos en el request
  const waypoints = intermedios.map((direccion) => ({
    location: direccion,
    stopover: true,
  }));

  const request = { //Para los lugares pasar string.
    origin: inicio,
    destination: final,
    waypoints: waypoints,
    travelMode: google.maps.TravelMode.DRIVING,
    //optimizeWaypoints: true //para ruta optima.
  };

  //Se pueden editar los puntos A, B, C ... Etc
  directionsService.route(request, (result, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(result);
      console.log(result.routes[0].legs); //Tiempos, distancias, etc.
    } else {
      console.error("No se pudo calcular la ruta:", status);
    }
  });
}

window.onload = function () {
  initMap();
}