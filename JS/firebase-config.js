import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { getStorage } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import { Place, Itinerary, FBItinerary, ItineraryPlan } from './types.js';

const firebaseConfig = {
  apiKey: "AIzaSyCCpB77wDXu-mNsKKIFg6BddH6DTminG9g",
  authDomain: "itinerarios-de-viaje-2db0b.firebaseapp.com",
  projectId: "itinerarios-de-viaje-2db0b",
  storageBucket: "itinerarios-de-viaje-2db0b.firebasestorage.app",
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

async function addDay(id,data) {
  let i = await loadItinerary(id, new FBItinerary(data));
  console.log(i);
  return i
}

async function addPlan(file, itinerariesRef) {
  const planning = await ItineraryPlan.fromJson(file);
  const daysRef = await collection(itinerariesRef, file.title, 'days');
  console.log(daysRef);
  const daysQuerySnapshot = await getDocs(daysRef);
  console.log(daysQuerySnapshot);
  const jsons = []
  console.log("consulting days");
  await daysQuerySnapshot.forEach((data) => {
    jsons.push([data.id, data.data()])
  });
  console.log(jsons);
  await Promise.all(jsons.map( async (data) => {
    console.log("a day is created");
    await addDay(data.at(0),data.at(1))
      .then((it) => planning.itineraries.push(it))
      .then((_) => {
        console.log("a day was created");
        console.log(planning);
      });
  }))
  return planning;
}

export async function getUserItineraries(userId) {
  const itinerariesRef = collection(db, `users/${userId}/itineraries`);
  try {
    const querySnapshot = await getDocs(itinerariesRef);
    console.log(querySnapshot);
    /**
     * @type {ItineraryPlan[]}
     */
    const itineraries = [];
    const jsons = []
    querySnapshot.forEach((file) => {
      jsons.push(file.data())
    })
    for (const file of jsons) {
      await addPlan(file, itinerariesRef)
        .then((plan) => itineraries.push(plan))
        .then((_) => console.log(itineraries));
    }
    itineraries.values().forEach(
      (i) => {
        i.itineraries.forEach((k) => console.log(k.toString()));
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
export async function loadItinerary(id,data) {

  let itinerary = new Itinerary(id);
  itinerary.toString = () => {
    return itinerary.name + ":\n" + itinerary.places.map(p => "-\t" + p.toString()).join('\n');
  }

  let i = 0
  await Promise.all(data.names.map(async _ => {
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
    i += 1
    console.log(itinerary.places);
  }));

  console.log(itinerary.toString());
  return itinerary;
}


