import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getFirestore, collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { getStorage } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import { Itinerary, ItineraryPlan } from './types.js';

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

/**
 * @param {string} userId
 * @returns {Promise<ItineraryPlan[]>}
 */
export async function getPlans(userId){
  const itinerariesRef = collection(db, `users/${userId}/itineraries`)
    .withConverter(ItineraryPlan.itineraryPlanConverter);
  try {
    const querySnapshot = await getDocs(itinerariesRef);
    console.log(querySnapshot);
    /**
     * @type {ItineraryPlan[]}
     */
    const itineraryPlans = [];
    /**
     * @type {ItineraryPlan[]}
     */
    const processed = []
    await querySnapshot.forEach((file) => {
      itineraryPlans.push(file.data())
    })
    await Promise.all(itineraryPlans.map(async (plan) => {
      const daysRef = collection(itinerariesRef, plan.title, 'days')
        .withConverter(Itinerary.itineraryConverter);
      const daySnapshot = await getDocs(daysRef);
      const files = []
      /**
       * @type {Itinerary[]}
       */
      const days = []
      await daySnapshot.forEach((file) =>  { files.push(file) })
      await Promise.all(files.map(async file => {
        let a = await file.data()
        console.log("a: ", a);
        days.push(a)
      }))
        .then(async _ => await Promise.all(days.map(day => plan.itineraries.push(day))))
        .then(_ => {
          processed.push(plan)
          console.log(plan);
        });

    }));

    processed.values().forEach(
      (i) => {
        i.itineraries.forEach((k) => console.log(k.toString()));
      }
    )
    return processed;
  } catch (error) {
    console.error("Error getting itineraries: ", error);
    return [];
  }
}