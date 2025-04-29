import {db} from './firebase-config.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { addDoc, collection, doc, setDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function shareItinerary(itinerary, itineraryTitle, itineraryPhoto) {
  const user = getAuth().currentUser;
  console.log(itineraryTitle);
  console.log(itineraryPhoto);
  const publicItineraryRef = await addDoc(collection(db, 'publicItineraries'), {
    userRef:user.uid,
    photo: itineraryPhoto,
    title: itineraryTitle,
  });
  await saveItineraryInfo(itinerary, publicItineraryRef);
}

async function saveItineraryInfo(itinerary, publicItineraryRefId) {
  for (let i = 0; i < itinerary.length; i++) {
    const day = itinerary[i];
    const dayId = `Día ${i + 1}`;

    const dayDocRef = doc(db, "publicItineraries", publicItineraryRefId.id, "days", dayId);

    await setDoc(dayDocRef, {
      name: dayId,
      places: day.places.map(place => ({
        name: place.name,
        address: place.address,
        category: place.category,
        date: place.date,
        photo: place.photo,
        price: place.price,
        rating: place.rating,
      }))
    });
  }
}