import {db} from './firebase-config.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  setDoc, updateDoc
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function publishItinerary(itinerary, itineraryId, itineraryPhoto, title) {
  const user = getAuth().currentUser;
  const userRef = user.uid;
  if (await isPublic(userRef, itineraryId)) {
    console.log('El itinerario ya está publicado')
    return;
  }
  const publicItineraryRef = await addDoc(collection(db, 'publicItineraries'), {
    userRef:userRef,
    photo: itineraryPhoto,
    title: title,
    itineraryId: itineraryId
  });
  await saveItineraryInfo(itinerary, publicItineraryRef);

  await updateDoc(doc(db, 'users', userRef, "itineraries", itineraryId), {
    publishedRef: publicItineraryRef,
    published: true
  });
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
        lat: place.lat,
        lng: place.lng
      }))
    });

  }
}

async function isPublic(userRef, itineraryId) {
  console.log(userRef, itineraryId);
  const itineraryRef = doc(db, 'users', userRef, 'itineraries', itineraryId);
  const itinerary = await getDoc(itineraryRef);

  if (!itinerary.data().hasOwnProperty('published')) {
    await updateDoc(itineraryRef, { published: true });
    return false;
  }

  return itinerary.data().published === true;
}