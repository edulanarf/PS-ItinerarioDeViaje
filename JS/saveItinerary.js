import { db, auth } from './firebase-config.js';
import { doc, setDoc, getDoc, collection, getDocs, Timestamp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getSaved, setSaved } from './saved-verification.js';
import { Itinerary, ItineraryPlan } from './types.js';
import { plan } from './search-places.js';

// Función para chequear si el usuario puede guardar otro itinerario según plan
async function canSaveNewItinerary(userUid) {
  const userRef = doc(db, "users", userUid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) throw new Error("Usuario no encontrado");

  const userData = userSnap.data();
  const isPremium = userData.premium === true;
  const plan = userData.plan || null;

  const limits = {
    basic: 5,
    advanced: 10,
    unlimited: Infinity
  };

  const maxItineraries = isPremium ? (limits[plan] ?? 0) : 2;

  const itinerariesCol = collection(db, `users/${userUid}/itineraries`);
  const itinerariesSnapshot = await getDocs(itinerariesCol);
  const count = itinerariesSnapshot.size;

  return count < maxItineraries;
}

//Guardar itinerario con límite validado
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

      try {
        const canSave = await canSaveNewItinerary(user.uid);
        if (!canSave) {
          alert("Has alcanzado el límite de itinerarios para tu plan. Por favor, actualiza a Premium para guardar más.");
          return;
        }

        plan.photo = plan.itineraries.at(0)?.places.at(0)?.photo || '';

        const itineraryRef = doc(db, `users/${user.uid}/itineraries/${plan.title}`)
          .withConverter(ItineraryPlan.itineraryPlanConverter);
        await setDoc(itineraryRef, plan);

        for (const itinerary of plan.itineraries) {
          const dayRef = doc(itineraryRef, "days", itinerary.name).withConverter(Itinerary.itineraryConverter);
          await setDoc(dayRef, itinerary);
        }
        setSaved(true);
        alert("Itinerario guardado correctamente.");
      } catch (error) {
        console.error("❌ Error al guardar el itinerario:", error.message);
        alert("Error guardando itinerario, inténtalo de nuevo más tarde.");
      }
    });
  } else {
    window.location.href = "../HTML/user-login.html";
  }
});

/**
 * for the future...
 * @param dates
 * @returns {Timestamp[]}
 */
function datesToTimestamp(dates) {
  let timestamps = []
  dates.forEach(date => {
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
