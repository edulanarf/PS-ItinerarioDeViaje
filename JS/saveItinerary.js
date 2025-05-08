
import { db, auth, deleteAllDocumentsInCollection } from "./firebase-config.js";
import {
  addDoc,
  collection,
  doc,
  setDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getSaved, setSaved } from './saved-verification.js';
import { Itinerary, ItineraryPlan, NoID } from "./types.js";
import { plan } from "./search-places.js";

export async function storeItineraryPlanWithID(userId, itineraryPlan) {
  const itineraryRef = doc(db, `users/${userId}/itineraries/${itineraryPlan.id}`).withConverter(ItineraryPlan.Converter)
  await setDoc(
    itineraryRef,
    itineraryPlan)
    .then(()=> deleteAllDocumentsInCollection(`users/${userId}/itineraries/${itineraryPlan.id}/days`))
    .then(async () => {
      for (const itinerary of itineraryPlan.itineraries) {
        const dayRef = doc(itineraryRef, "days", itinerary.name).withConverter(
          Itinerary.Converter,
        );
        await setDoc(dayRef, itinerary);
      }
    })
}

export async function storeItineraryPlanNoID(userId, itineraryPlan) {
  const itinerariesCollection = collection(db, `users/${userId}/itineraries`).withConverter(ItineraryPlan.Converter)
  const itineraryRef = await addDoc(itinerariesCollection, itineraryPlan);
  await setDoc(
    itineraryRef,
    itineraryPlan)
    .then(()=> deleteAllDocumentsInCollection(`users/${userId}/itineraries/${itineraryRef.id}/days`))
    .then(async () => {
      for (const itinerary of itineraryPlan.itineraries) {
        const dayRef = doc(itineraryRef, "days", itinerary.name).withConverter(
          Itinerary.Converter,
        );
        await setDoc(dayRef, itinerary);
      }
    })
}

export async function storeItineraryPlan(userId, itineraryPlan) {
  if (itineraryPlan.id !== NoID) await storeItineraryPlanWithID(userId, itineraryPlan);
  else await storeItineraryPlanNoID(userId, itineraryPlan);
}

//Guardar itinerario
  onAuthStateChanged(auth, (user) => {
    if (user) {
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
        
        try {
          await storeItineraryPlan(user.id, plan);
          setSaved(true);
        } catch (error) {
          console.error("❌ Error al guardar el itinerario:", error.message);
        }
      });
    } else {
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
