
import { db, auth } from './firebase-config.js';
import { doc, setDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import {onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getSaved, setSaved } from './saved-verification.js';
import { ItineraryPlan } from './types.js';

export let saved=false;

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

        const titleError = document.getElementById("title-error");
        if (itineraryTitle === undefined) {
          titleError.textContent = "Asigne un título al itinerario";
          titleError.style.display = "block";
          titleError.style.borderColor = "red";
          return;
        } else {
          titleError.style.display = "none";
        }


        try {
          const itineraryRef = doc(db, `users/${user.uid}/itineraries/${itineraryTitle}`)
            .withConverter(ItineraryPlan.itineraryPlanConverter);


          const keys = Object.keys(localStorage);
          for (const key of keys) {
            if (key.startsWith("Día")) {
              const storedData = localStorage.getItem(key);
              if (storedData) {
                const listaTareas = JSON.parse(storedData);
                const [names, photos, prices, ratings, addresses, dates, categories] = listaTareas;


                const dayRef = doc(itineraryRef, "days", key);

                await setDoc(dayRef, {
                  names: names,
                  photos: photos,
                  prices: prices,
                  ratings: ratings,
                  addresses: addresses,
                  dates: dates,
                  categories: categories,
                });

                const itineraryInfoRef = doc(db, `users/${user.uid}/itineraries/${itineraryTitle}`);
                await setDoc(itineraryInfoRef, {
                  title: itineraryTitle,
                  photo: photos[0] || "",
                });
                console.log(`✅ Día ${key} guardado correctamente en Firestore.`);

              }
            }
          }


          console.log("✅ Itinerario guardado correctamente.");
          saved = true;
          setSaved(true);
        } catch (error) {
          console.error("❌ Error al guardar el itinerario:", error.message);
        }
      });





    } else {
      console.log("not authenticated!!!!");
      window.location.href = "../HTML/user-login.html"
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
