import {auth, db} from './firebase-config.js';
import { addDoc, collection, doc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export function addFavoriteItinerary(itinerary)
{
  const currentUser = auth.currentUser;
  const newItineraryRef = collection(db, 'users', currentUser.uid, 'favorites'); //Referencia a la coleccion, crear doc dentro | tener en cuenta si el itinerario ya estaba en favoritos?
  console.log("Añadido a favoritos itinerario: ", itinerary);
  addDoc(newItineraryRef, {
      itineraryRef: itinerary
  });
}