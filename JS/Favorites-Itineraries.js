import { db, auth } from "./firebase-config.js";
import { collection, doc, getDoc, getDocs } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import{deleteFavoriteId} from './deleteFavorite.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';

async function loadItineraries() {

  onAuthStateChanged(auth, async (user) => {
    if (user) {

      const itinerariesContainer = document.getElementById("itineraries-container");
      itinerariesContainer.innerHTML = "";
      let currentItinerary;
      //Contenedor de itinerarios
      const favoritesItinerariesSnapshot = await getDocs(collection(db, "users", user.uid, "favorites"));

      //Recorro el numero de documentos (itinerarios)
      for (const itineraryDoc of favoritesItinerariesSnapshot.docs) {
        const favoriteItineraryData = itineraryDoc.data();
        const itineraryRef = favoriteItineraryData.itineraryRef;
        console.log("publicItineraries", itineraryRef);
        const itineraryDataDocRef = await doc(db,"publicItineraries", itineraryRef);
        const itineraryDataDoc = await getDoc(itineraryDataDocRef);
        const itineraryData = itineraryDataDoc.data();

        //Creo div para cada uno
        const itineraryDiv = document.createElement("div");
        itineraryDiv.classList.add("itinerary-item");

        //Cada div tiene una imagen
        const img = document.createElement("img");
        img.src = itineraryData.photo;
        img.alt = itineraryData.title;
        img.style.cursor = "pointer";
        img.classList.add("itinerary-image");


        img.addEventListener("click", async () => {
          document.querySelector(".popup-title").textContent = itineraryData.title;
          currentItinerary = itineraryData.title
          const popupDaysContainer = document.getElementById("popup-days");
          popupDaysContainer.innerHTML = "";
          console.log(itineraryData)
          const daysRef = collection(db, "publicItineraries", itineraryDataDoc.id, "days");
          const daysData = await getDocs(daysRef);
          let totalPrice = 0;
          let firstPlaceForMap = null;
          daysData.forEach(dayDoc => {
            const dayData = dayDoc.data();

            const dayContainer = document.createElement("div");
            dayContainer.classList.add("popup-day");

            // Título del día
            const dayTitle = document.createElement("h3");
            dayTitle.textContent = dayData.name || dayDoc.id;
            dayContainer.appendChild(dayTitle);

            // Recorrer los lugares del día
            dayData.places.forEach(place => {
              const placeContainer = document.createElement("div");
              placeContainer.classList.add("popup-place");

              if (!firstPlaceForMap) {
                firstPlaceForMap = place;
              }

              const favoriteBtn = document.querySelector(".popup-favorite");
              favoriteBtn.onclick = async () => {
                await deleteFavoriteId(itineraryDoc.id);
                window.location.reload();

              };

              // Imagen
              const img = document.createElement("img");
              img.src = place.photo;
              img.alt = place.name;
              placeContainer.appendChild(img);

              //Suma para el precio total
              totalPrice += place.price || 0;

              // Info
              const info = document.createElement("div");
              info.innerHTML = `
        <strong>${place.name}</strong><br>
        Dirección: ${place.address}<br>
        Categoría: ${place.category}<br>
        Precio: ${place.price} €<br>
        Rating: ${place.rating} ★
      `;
              placeContainer.appendChild(info);
              dayContainer.appendChild(placeContainer);
            });

            popupDaysContainer.appendChild(dayContainer);
          });

          const mapContainer = document.getElementById("popup-map");

// Usa la dirección del primer lugar del primer día como ejemplo

          const address = encodeURIComponent(firstPlaceForMap.address);

          mapContainer.innerHTML = `
  <iframe
    width="100%"
    height="100%"
    frameborder="0"
    style="border:0"
    src="https://www.google.com/maps?q=${address}&output=embed"
    allowfullscreen>
  </iframe>
`;

          document.getElementById("total-price").textContent = `Costo total: ${totalPrice}€`;
          document.querySelector(".popup").classList.add("show");
        })

        //Y un titulo
        const name = document.createElement("span");
        name.textContent = itineraryData.title;
        name.classList.add("itinerary-name");

        // Agregar elementos al div
        itineraryDiv.appendChild(img);
        itineraryDiv.appendChild(name);
        itinerariesContainer.appendChild(itineraryDiv);
      }
    } else {
      console.warn("Usuario no autenticado.");
    }
  });


  document.querySelector(".popup-close").addEventListener("click", () => {
    document.querySelector(".popup").classList.remove("show");
  });
}

document.addEventListener("DOMContentLoaded", loadItineraries);