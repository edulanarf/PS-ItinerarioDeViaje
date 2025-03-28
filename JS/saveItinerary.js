import { getItineraryData, listNames } from './search-places.js';
import { db, auth } from './firebase-config.js';
import { doc, setDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import {onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getSaved, setSaved } from './saved-verification.js';

export let saved;

let itineraryTitle;
document.getElementById("itinerary-title").addEventListener("change", (e) => {
  itineraryTitle = e.target.value;
});

//Guardar itinerario
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuario autenticado:", user.email);
      const save = document.getElementById("save-itinerary");
      save.addEventListener("click", async function () {
        const itineraryData = getItineraryData();

        try {
          const itineraryRef = doc(db, `users/${user.uid}/itineraries/${itineraryTitle}`);

          // Guardar los datos en Firestore
          await setDoc(itineraryRef, {
            names: itineraryData.listNames,
            photos: itineraryData.listPhoto,
            prices: itineraryData.listPrice,
            ratings: itineraryData.listRating,
            addresses: itineraryData.listAddress,
            dates: itineraryData.listDates,
            categories: itineraryData.listCategories,
          });
          console.log("✅ Itinerario guardado correctamente.");
          saved = true;
          alert("✅ Itinerario guardado correctamente.");
          setSaved(true);
        } catch (error) {
          console.error("❌ Error al guardar el itinerario:", error.message);
        }
      });

    } else {
      console.log("No hay usuario autenticado.");
    }
  });


/**
 * for the future...
 * @param dates
 * @returns {Timestamp[]}
 */
function datesToTimestamp(dates) {
    let timestamps = []
    dates.forEach( date => {
      timestamps.push(Timestamp.fromDate(date))
    })
    return timestamps;
  }

  //Mensaje alerta si no se ha guardado
window.addEventListener("beforeunload", (event) => {
  if (!getSaved()) { // Solo muestra la advertencia si hay datos en el itinerario
    event.preventDefault();
    event.returnValue = "Tienes cambios sin guardar. ¿Seguro que quieres salir?";
  }
});
