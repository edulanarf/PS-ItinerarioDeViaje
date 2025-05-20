import {
  auth,
  db,
  deleteAllDocumentsInCollection, deleteStorageFolderContents, deleteImage,
  itinerariesOfPlansFirestorePath,
  placeStoragePath, planDaysStoragePath,
  planFirestorePath,
  planPreviewStoragePath,
  storeImage,
  storeImageFromUrl,
  userPlansFirestorePath
} from './firebase-config.js';
import {
  addDoc,
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  Timestamp
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getSaved, setSaved } from './saved-verification.js';
import { Itinerary, ItineraryPlan, NoID } from './types.js';
import { allPlaces, DESCRIPTION, PHOTO, PLAN_ID, SHARED_WITH, TITLE } from './search-places.js';
import { closeBtn, hideLoader, hideModal, modal, showLoader, showModal } from "./modalFloatingWindow.js";

/**
 * @type {ItineraryPlan}
 */
let storingItinerary;

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

//Guardar itinerario
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const save = document.getElementById("save-itinerary");
      save.addEventListener("click", async function () {
        if (!validation()) return
        storingItinerary = createPlanFromForm();
        let creating = storingItinerary.id === NoID
        modal.querySelector("h2").textContent = creating ? "Creando itinerario..." : "Actualizando itinerario...";
        showLoader()
        showModal()
        try {
          if (storingItinerary.id === NoID) {
            const canSave = await canSaveNewItinerary(user.uid);
            if (!canSave) {
              modal.querySelector("h2").textContent = "Has alcanzado el límite de itinerarios para tu plan.\n Por favor, actualiza a Premium para guardar más.";
              hideLoader()
              setTimeout(() => hideModal(), 3000)
              return;
            }
          }
          await storeItineraryPlan(user.uid, storingItinerary);
          setSaved(true);
          hideLoader()
          modal.querySelector("h2").textContent = `El itinerario ha sido ${creating? "creado": "modificado"} con éxito`;
        } catch (error) {
          console.error("❌ Error al guardar el itinerario:", error.message);
        }
      });
    } else {
      window.location.href = "../HTML/user-login.html"
    }
  });



export async function storeItineraryPlanWithID(userId, itineraryPlan) {
  const itineraryRef = doc(db, planFirestorePath(userId,itineraryPlan.id)).withConverter(ItineraryPlan.Converter)
  await deleteImage(planPreviewStoragePath(userId,itineraryPlan.id));
  await addPhotoToPlan(userId,itineraryRef, itineraryPlan, PHOTO)
    .then(async ()=> await deleteAllDocumentsInCollection(itinerariesOfPlansFirestorePath(userId,itineraryPlan.id)))
    .then(async () => await deleteStorageFolderContents(planDaysStoragePath(userId,itineraryPlan.id)))
    .then(async () => {
      for (const itinerary of itineraryPlan.itineraries) {
        const dayRef = doc(itineraryRef, "days", itinerary.name).withConverter(
          Itinerary.Converter,
        );
        await setDoc(dayRef, itinerary);
      }
    })
}

/**
 * @param {string} userId
 * @param itineraryPlanRef
 * @param {ItineraryPlan} plan
 * @param {File} photo
 * @returns {Promise<void>}
 */
async function addPhotoToPlan(userId, itineraryPlanRef, plan, photo) {
  console.log("foto for",userId,itineraryPlanRef.id, plan.title);
  plan.photo = await storeImage(planPreviewStoragePath(userId,itineraryPlanRef.id), photo);
  console.log("photo url:", plan.photo);
  await setDoc(itineraryPlanRef, plan)
  console.log("photo & plan saved");
}

/**
 *
 * @param {string} userId
 * @param itineraryPlanRef
 * @param {ItineraryPlan} itineraryPlan
 * @returns {Promise<void>}
 */
async function addPhotoToPlanFromPlaces(userId, itineraryPlanRef, itineraryPlan) {
  itineraryPlan.photo = await storeImageFromUrl(
    planPreviewStoragePath(userId, itineraryPlanRef.id),
    itineraryPlan.itineraries.at(0).places.at(0).photo
  );
  await setDoc(itineraryPlanRef, itineraryPlan)
}

async function addPhotosToPlaces(itinerary, userId, itineraryPlanId) {
  await Promise.all(
    itinerary.places.map(async (p, index) => {
      p.photo = await storeImageFromUrl(
        placeStoragePath(userId, itineraryPlanId, itinerary.name, index),
        p.photo,
      );
      console.log(p.photo);
    }),
  );
}

/**
 *
 * @param userId
 * @param {ItineraryPlan} itineraryPlan
 * @returns {Promise<void>}
 */
export async function storeItineraryPlanNoID(userId, itineraryPlan) {
  const plansCollection = collection(db, userPlansFirestorePath(userId)).withConverter(ItineraryPlan.Converter)
  const itineraryPlanRef = await addDoc(plansCollection, itineraryPlan);
  await Promise.all(
    itineraryPlan.itineraries.map(async (itinerary) => {
      await addPhotosToPlaces(itinerary, userId, itineraryPlanRef.id);
      const dayRef = doc(
        db,
        itinerariesOfPlansFirestorePath(userId, itineraryPlanRef.id),
        itinerary.name
      ).withConverter(Itinerary.Converter);
      await setDoc(dayRef, itinerary);
    })
  );

  if (PHOTO) await addPhotoToPlan(userId,itineraryPlanRef, itineraryPlan, PHOTO);
  else await addPhotoToPlanFromPlaces(userId,itineraryPlanRef, itineraryPlan);

}

export async function storeItineraryPlan(userId, itineraryPlan) {
  if (itineraryPlan.id !== NoID) await storeItineraryPlanWithID(userId, itineraryPlan);
  else await storeItineraryPlanNoID(userId, itineraryPlan);
}

function validation() {
  const titleError = document.getElementById("title-error");
  if (TITLE === "") {
    titleError.textContent = "Asigne un título al itinerario";
    titleError.style.display = "block";
    titleError.style.borderColor = "red";
    return false;
  } else if (allPlaces.filter((arr) => arr.length === 0).length > 0) {
    titleError.textContent = "elimine el dia que no visite lugares.";
    titleError.style.display = "block";
    titleError.style.borderColor = "red";
    return false;
  } else {
    titleError.style.display = "none";
    return true;
  }
}

function createPlanFromForm() {
  return new ItineraryPlan(
    TITLE,
    DESCRIPTION,
    allPlaces.at(0).at(0).photo || "",
    allPlaces.map(
      (arr, index) =>
        new Itinerary(`Día ` + String(index + 1).padStart(3, "0"), arr),
    ),
    PLAN_ID,
    SHARED_WITH
  );
}


closeBtn.addEventListener("click", () => {
  hideModal()
})


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
