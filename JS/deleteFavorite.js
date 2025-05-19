import { auth, db } from './firebase-config.js';
import {
   deleteDoc, doc, getDoc,
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function deleteFavoriteId(itinerary) {
  const currentUser = auth.currentUser;
  const deleteItineraryRef = await doc(db, 'users', currentUser.uid, 'favorites', itinerary);

  if (!deleteItineraryRef) {
    console.warn("No se encontró el itinerario favorito para eliminar.");
    return;
  }

  await deleteDoc(deleteItineraryRef);

}

