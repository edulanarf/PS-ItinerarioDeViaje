import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import { Itinerary, ItineraryPlan, User } from "./types.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCpB77wDXu-mNsKKIFg6BddH6DTminG9g",
  authDomain: "itinerarios-de-viaje-2db0b.firebaseapp.com",
  projectId: "itinerarios-de-viaje-2db0b",
  storageBucket: "itinerarios-de-viaje-2db0b.firebasestorage.app",
  messagingSenderId: "86468425538",
  appId: "1:86468425538:web:8bc9c4194193614f7cfadb",
  measurementId: "G-CKN1D6S9GR",
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

/**
 * @param {string[]} names
 * @returns {Promise<{foundUserIds: string[], notFound: string[]}>}
 *
 * Use Example:
 * const names = ["alice", "bob", "charlie"];
 *
 * findUsersByUsernames(names).then(result => {
 *   console.log("IDs found:", result.foundUserIds); //ids
 *   console.log("No found:", result.notFound); //names
 * });
 *
 * NOTES:
 */
export async function getUsers(names) {
  const usersRef = collection(db, "users").withConverter(User.Converter);

  // Dividir la búsqueda en fragmentos (máximo 10 por consulta debido a Firestore IN limit)
  const foundUsers = {};
  const CHUNK_SIZE = 10;

  const chunks = [];
  for (let i = 0; i < names.length; i += CHUNK_SIZE) {
    chunks.push(names.slice(i, i + CHUNK_SIZE));
  }

  await Promise.all(
    chunks.map((chunk) => {
      const q = query(usersRef, where("username", "in", chunk));
      return getDocs(q).then((querySnapshot) => {
        console.log(querySnapshot);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log("read data", data);
          const username = data.name;
          console.log("read", username);
          // Verificación estricta
          if (chunk.includes(username)) {
            foundUsers[username] = doc.id;
          }
        });
      });
    }),
  );

  // Crear lista final de resultados
  const foundUserIds = Object.values(foundUsers);
  const notFound = names.filter((name) => !foundUsers[name]);

  return {
    foundUserIds,
    notFound,
  };
}

export async function getUserData(userId) {
  const docRef = doc(db, "users", userId).withConverter(User.Converter);
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
 *
 * @param {string} collectionPath - in the form collection/doc/.../collection
 * @returns {Promise<void>}
 */
export async function deleteAllDocumentsInCollection(collectionPath) {
  const snapshot = await getDocs(collection(db, collectionPath));

  if (snapshot.empty) {
    console.log("La colección está vacía o no existe.");
    return;
  }

  const deletions = snapshot.docs.map((docSnap) => {
    return deleteDoc(doc(db, collectionPath, docSnap.id));
  });

  await Promise.all(deletions);
  console.log("Todos los documentos han sido eliminados.");
}

/// get plans modular
/**
 * @param {string} userId
 * @returns {CollectionReference}
 */
function getItinerariesRef(userId) {
  return collection(db, `users/${userId}/itineraries`).withConverter(
    ItineraryPlan.Converter,
  );
}

/**
 * @param {string} userId
 * @returns {CollectionReference}
 */
function getSharedItinerariesRef(userId) {
  return collection(db, `users/${userId}/shared`).withConverter(
    ItineraryPlan.Converter,
  );
}

/**
 * @param {CollectionReference} itinerariesRef
 * @returns {Promise<ItineraryPlan[]>}
 */
async function fetchItineraryPlans(itinerariesRef) {
  const querySnapshot = await getDocs(itinerariesRef);
  const plans = [];
  querySnapshot.forEach((doc) => plans.push(doc.data()));
  return plans;
}

/**
 * @param {CollectionReference} itinerariesRef
 * @param {ItineraryPlan} plan
 * @returns {Promise<Itinerary[]>}
 */
async function fetchDaysForPlan(itinerariesRef, plan) {
  const daysRef = collection(itinerariesRef, plan.title, "days").withConverter(
    Itinerary.Converter,
  );
  const docs = [];
  (await getDocs(daysRef)).forEach((doc) => docs.push(doc));
  const days = [];
  await Promise.all(docs.map(async (doc) => days.push(await doc.data())));
  return days;
}

/**
 * @param {string} userId
 * @returns {Promise<ItineraryPlan[]>}
 */
export async function getPlans(userId) {
  try {
    return await getItinerariesPlans(getItinerariesRef(userId));
  } catch (error) {
    console.error("Error getting itineraries: ", error);
    return [];
  }
}

/**
 * @param {string} userId
 * @returns {Promise<ItineraryPlan[]>}
 */
export async function getShared(userId) {
  try {
    return await getItinerariesPlans(getSharedItinerariesRef(userId));
  } catch (error) {
    console.error("Error getting itineraries: ", error);
    return [];
  }
}

/**
 * @param {CollectionReference} itinerariesRef
 * @returns {Promise<ItineraryPlan[]>}
 */
export async function getItinerariesPlans(itinerariesRef) {
  try {
    const itineraryPlans = await fetchItineraryPlans(itinerariesRef);

    return await Promise.all(
      itineraryPlans.map(async (plan) => {
        await fetchDaysForPlan(itinerariesRef, plan).then((arr) =>{
          plan.itineraries.push(...arr);
        });
        return plan;
      }),
    );
  } catch (error) {
    console.error("Error getting itineraries: ", error);
    return [];
  }
}
