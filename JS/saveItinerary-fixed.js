import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { doc, setDoc, Timestamp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { auth, db } from './firebase-config.js';
import { LocalStorageManager } from './local-storage.js';
import { getSaved, setSaved } from './saved-verification.js';
import { plan } from './search-places.js';
import { Itinerary, ItineraryPlan } from './types.js';

//Guardar itinerario
onAuthStateChanged(auth, (user) => {
  if (user) {
    const save = document.getElementById("save-itinerary");
    if (!save) {
      console.warn("Botón de guardar no encontrado");
      return;
    }
    
    save.addEventListener("click", async function () {

      const titleError = document.getElementById("title-error");
      
      // Validar que el plan exista y tenga un título
      if (!plan || !plan.title || plan.title === "") {
        titleError.textContent = "Asigne un título al itinerario";
        titleError.style.display = "block";
        titleError.style.borderColor = "red";
        return;
      }
      
      // Validar que el plan tenga itinerarios
      if (!plan.itineraries || plan.itineraries.length === 0) {
        titleError.textContent = "Agregue al menos un día al itinerario";
        titleError.style.display = "block";
        titleError.style.borderColor = "red";
        return;
      }
      
      // Validar que al menos un itinerario tenga lugares
      const hasPlaces = plan.itineraries.some(itinerary => 
        itinerary.places && itinerary.places.length > 0
      );
      
      if (!hasPlaces) {
        titleError.textContent = "Agregue al menos un lugar al itinerario";
        titleError.style.display = "block";
        titleError.style.borderColor = "red";
        return;
      }
      
      titleError.style.display = "none";

      // Validar que existan itinerarios y lugares antes de acceder a la foto
      if (plan.itineraries && plan.itineraries.length > 0 && 
          plan.itineraries[0].places && plan.itineraries[0].places.length > 0) {
        plan.photo = plan.itineraries[0].places[0].photo || '';
      } else {
        plan.photo = '';
      }
      
      try {
        // Intentar guardar en Firestore primero
        if (db) {
          const itineraryRef = doc(db, `users/${user.uid}/itineraries/${plan.title}`)
            .withConverter(ItineraryPlan.itineraryPlanConverter);
          await setDoc(itineraryRef, plan)
          
          for (const itinerary of plan.itineraries) {
            const dayRef = doc(itineraryRef, "days", itinerary.name).withConverter(Itinerary.itineraryConverter);
            await setDoc(dayRef, itinerary);
          }
          
          setSaved(true);
          alert("✅ Itinerario guardado exitosamente en la nube");
        } else {
          // Fallback a localStorage
          const success = LocalStorageManager.saveItinerary(user.uid, plan);
          if (success) {
            setSaved(true);
            alert("✅ Itinerario guardado localmente (modo offline)");
          } else {
            throw new Error("No se pudo guardar localmente");
          }
        }
      } catch (error) {
        console.error("❌ Error al guardar el itinerario:", error.message);
        
        // Intentar guardar en localStorage como último recurso
        try {
          const success = LocalStorageManager.saveItinerary(user.uid, plan);
          if (success) {
            setSaved(true);
            alert("✅ Itinerario guardado localmente (modo offline)");
          } else {
            alert("⚠️ Error: No se pudo guardar el itinerario");
          }
        } catch (localError) {
          alert("⚠️ Error al guardar el itinerario: " + error.message);
        }
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