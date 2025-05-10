import {auth, db} from './firebase-config.js';
import {
  addDoc,
  deleteDoc,
  collection,
  doc,
  getDocs, query,
  where
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function removeFavoriteItinerary(itinerary) {
  const currentUser = auth.currentUser;
  const newItineraryRef = collection(db, 'users', currentUser.uid, 'favorites');


  //Verificar que no está ya en favoritos para evitar duplicados
  const q = query(newItineraryRef, where("itineraryRef", "==", itinerary));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {

    console.log("Este itinerario ya no está en favoritos.");
  } else {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'favorites', querySnapshot.docs[0].id))
    console.log("Quitado a favoritos:", itinerary);
  }
}