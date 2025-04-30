import {auth, db} from './firebase-config.js';
import {
  addDoc,
  collection,
  doc,
  getDocs, query,
  where
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function addFavoriteItinerary(itinerary) {
  const currentUser = auth.currentUser;
  const newItineraryRef = collection(db, 'users', currentUser.uid, 'favorites');


  //Verificar que no está ya en favoritos para evitar duplicados
  const q = query(newItineraryRef, where("itineraryRef", "==", itinerary));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    // Si no existe, lo añadimos a favoritos
    await addDoc(newItineraryRef, {
      itineraryRef: itinerary
    });

    console.log("Añadido a favoritos:", itinerary);
  } else {
    console.log("Este itinerario ya está en favoritos.");
  }
}