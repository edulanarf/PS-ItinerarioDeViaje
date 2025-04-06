
import { db, auth } from './firebase-config.js';
import { doc, setDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import {onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getSaved, setSaved } from './saved-verification.js';
import { Itinerary, ItineraryPlan } from './types.js';
import { plan } from './search-places.js'





//Guardar itinerario
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuario autenticado:", user.email);
      const save = document.getElementById("save-itinerary");
      save.addEventListener("click", async function () {

        const titleError = document.getElementById("title-error");
        if (plan.title === "") {
          titleError.textContent = "Asigne un título al itinerario";
          titleError.style.display = "block";
          titleError.style.borderColor = "red";
          return;
        } else {
          titleError.style.display = "none";
        }

        plan.photo = plan.itineraries.at(0).places.at(0).photo || ''
        console.log(plan);
        try {
          const itineraryRef = doc(db, `users/${user.uid}/itineraries/${plan.title}`)
            .withConverter(ItineraryPlan.itineraryPlanConverter);
          await setDoc(itineraryRef, plan)
          for (const itinerary of plan.itineraries) {
            const dayRef = doc(itineraryRef, "days", itinerary.name).withConverter(Itinerary.itineraryConverter);
            await setDoc(dayRef, itinerary);
            console.log(`✅ Día ${itinerary.name} guardado correctamente en Firestore.`);
          }
          console.log("✅ Itinerario guardado correctamente.");
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
