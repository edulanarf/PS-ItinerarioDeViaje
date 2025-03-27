import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { getStorage } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import { Place, Itinerary, FBItinerary } from "./types.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCpB77wDXu-mNsKKIFg6BddH6DTminG9g",
  authDomain: "itinerarios-de-viaje-2db0b.firebaseapp.com",
  projectId: "itinerarios-de-viaje-2db0b",
  storageBucket: "itinerarios-de-viaje-2db0b.appspot.com",
  messagingSenderId: "86468425538",
  appId: "1:86468425538:web:8bc9c4194193614f7cfadb",
  measurementId: "G-CKN1D6S9GR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app, "itinerariosdeviaje");

export function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuario autenticado:", user.email);
      return user.uid;
    } else {
      console.log("No hay usuario autenticado.");
      return null;
    }
  });
}


export { app, auth, storage, db };

export async function getUserData(userId) {
  const docRef = doc(db, "users", userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const userData = docSnap.data();
    console.log("User data:", userData);
    // Now you can work with the userData object
    return userData;
  } else {
    console.log("No such document!");
    return null;
  }
}

export async function getUserItineraries(userId) {
  const itinerariesRef = collection(db, `users/${userId}/itineraries`);
  try {
    const querySnapshot = await getDocs(itinerariesRef);
    /**
     * @type {Itinerary[]}
     */
    const itineraries = [];
    querySnapshot.forEach((file) => {
      const fbi = new FBItinerary(file.data());
      const i =  loadItinerary(file.id, fbi)
      itineraries.push( i);
    });
    itineraries.forEach(
      (i) => {
        console.log(i.toString());
      }
    )
    return itineraries;
  } catch (error) {
    console.error("Error getting itineraries: ", error);
    return [];
  }
}

/**
 * @param {string} id
 * @param {FBItinerary} data
 */
export function loadItinerary(id,data) {

  let itinerary = new Itinerary(id);
  itinerary.toString = () => {
    return itinerary.name + ":\n" + itinerary.places.map(p => "-\t" + p.toString()).join('\n');
  }
  for (let i = 0; i < data.names.length; i++) {
    itinerary.places.push(
      new Place(
        data.names.at(i),
        data.photos.at(i),
        data.prices.at(i),
        data.ratings.at(i),
        data.addresses.at(i),
        data.dates.at(i),
        data.categories.at(i)
      )
    )
  }
  return itinerary;
}


