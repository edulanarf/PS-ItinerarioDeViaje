import { db } from "./firebase-config.js";
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

async function loadItineraries() {
  const itinerariesContainer = document.getElementById("itineraries-container");
  itinerariesContainer.innerHTML = "";

  //Contenedor de itinerarios
  const itinerariesSnapshot = await getDocs(collection(db, "publicItineraries"));

  //Recorro el numero de documentos (itinerarios)
  for (const itineraryDoc of itinerariesSnapshot.docs) {
    const itineraryData = itineraryDoc.data();

    //Creo div para cada uno
    const itineraryDiv = document.createElement("div");
    itineraryDiv.classList.add("itinerary-item");

    //Cada div tiene una imagen
    const img = document.createElement("img");
    img.src = itineraryData.photo;
    img.alt = itineraryData.title;
    img.classList.add("itinerary-image");

    //Y un titulo
    const name = document.createElement("span");
    name.textContent = itineraryData.title;
    name.classList.add("itinerary-name");

    // Agregar elementos al div
    itineraryDiv.appendChild(img);
    itineraryDiv.appendChild(name);
    itinerariesContainer.appendChild(itineraryDiv);
  }
}

document.addEventListener("DOMContentLoaded", loadItineraries);