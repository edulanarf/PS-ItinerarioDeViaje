import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  collection,
  CollectionReference,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  listAll,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import {
  Itinerary,
  ItineraryPlan,
  ItineraryPlanReference,
  User,
} from "./types.js";

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
 * @returns {Promise<{foundUserIds: Record<string,string>, notFound: string[]}>}
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
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const username = data.name;
          // Verificación estricta
          if (chunk.includes(username)) {
            foundUsers[username] = doc.id;
          }
        });
      });
    }),
  );

  // Crear lista final de resultados
  const foundUserIds = foundUsers;
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
    // Now you can work with the userData object
    return await docSnap.data();
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
    ItineraryPlanReference.Converter,
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
  const daysRef = collection(itinerariesRef, plan.id, "days").withConverter(
    Itinerary.Converter,
  );
  const docs = [];
  let snap = await getDocs(daysRef)
  snap.forEach((doc) => docs.push(doc));
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
 *
 * @param sharedItinerariesRef - ref of ItineraryPlanReference collection
 * @returns {Promise<ItineraryPlan[]>}
 */
async function getSharedItinerariesPlans(sharedItinerariesRef) {
  /**
   * @type {ItineraryPlanReference[]}
   */
  const references = [];
  const plans = [];
  const querySnapshot = await getDocs(sharedItinerariesRef);

  querySnapshot.forEach((doc) => references.push(doc.data()));
  await Promise.all(
    references.map(async (ref) => {
      plans.push(await getAnItineraryPlan(ref.author, ref.plan));
    }),
  );
  return plans;
}

/**
 * @param {string} userId
 * @returns {Promise<ItineraryPlan[]>}
 */
export async function getShared(userId) {
  try {
    return await getSharedItinerariesPlans(getSharedItinerariesRef(userId));
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
        await fetchDaysForPlan(itinerariesRef, plan).then((arr) => {
          plan.itineraries.push(...arr);
          if (plan.id === "HtitI6sc2ThjYMTPv0EO") console.log(arr);
        });
        return plan;
      }),
    );
  } catch (error) {
    console.error("Error getting itineraries plans: ", error);
    return [];
  }
}

export async function getAnItineraryPlan(userId, itineraryPlanId) {
  let col = collection(db, userPlansFirestorePath(userId)).withConverter(
    ItineraryPlan.Converter,
  );
  let ref = doc(db, planFirestorePath(userId, itineraryPlanId)).withConverter(
    ItineraryPlan.Converter,
  );
  /**
   * @type {ItineraryPlan}
   */
  let plan = (await getDoc(ref)).data();
  await fetchDaysForPlan(col, plan).then((arr) => {
    plan.itineraries.push(...arr);
  });
  return plan;
}

/*
STORAGE
 */

export async function deleteImage(path) {
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if (error.code === "storage/object-not-found") {
      console.log("ℹ️ No había imagen anterior que eliminar.");
    } else {
      console.warn(
        "⚠️ Error al intentar eliminar la imagen anterior:",
        error.message,
      );
    }
  }
}

export async function deleteStorageFolderContents(folderPath) {
  const folderRef = ref(storage, folderPath);

  try {
    const result = await listAll(folderRef);

    // Borra archivos directamente en la carpeta
    await Promise.all(result.items.map((itemRef) => deleteObject(itemRef)));

    console.log(`🧹 Se borraron todos los archivos de ${folderPath}`);
  } catch (err) {
    console.error("❌ Error al borrar carpeta:", err);
  }
}

/**
 *
 * @param {string }path
 * @param {File} photo
 * @returns {Promise<string>}
 */
export async function storeImage(path, photo) {
  const storageRef = ref(storage, path);

  await deleteImage(path);

  await uploadBytes(storageRef, photo);
  return await getDownloadURL(storageRef);
}

function getExtensionFromMime(type) {
  const map = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[type] || "bin";
}

export function proxyUrl(url) {
  return `http://localhost:3000/proxy-image?url=${encodeURIComponent(url)}`;
}

export async function fetchFileFromUrl(url, filename = "photo") {
  const response = await fetch(proxyUrl(url));
  if (!response.ok) throw new Error("❌ No se pudo obtener el recurso");

  const blob = await response.blob();
  const extension = getExtensionFromMime(blob.type);
  return new File([blob], `${filename}.${extension}`, { type: blob.type });
}

export async function storeImageFromUrl(path, originalUrl) {
  const proxiedUrl = proxyUrl(originalUrl);
  try {
    const response = await fetch(proxiedUrl);
    if (!response.ok)
      throw new Error("No se pudo obtener la imagen desde el proxy");

    const blob = await response.blob();

    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    console.log(`✅ Imagen subida a: ${path}`);
    return await getDownloadURL(storageRef);
  } catch (err) {
    console.error("❌ Error al subir imagen desde URL:", err);
  }
}

/*
 PATHS in DB
 */

//STORAGE
export function profileStoragePath(userID) {
  return `Users/${userID}/ProfilePicture/picture`;
}
export function userPlansStoragePath(userID) {
  return `Users/${userID}/itineraries`;
}
export function planStoragePath(userID, planID) {
  return `${userPlansStoragePath(userID)}/${planID}`;
}
export function planPreviewStoragePath(userID, planID) {
  return `${planStoragePath(userID, planID)}/preview`;
}
export function planDaysStoragePath(userID, planID) {
  return `${planStoragePath(userID, planID)}/days`;
}
export function placeStoragePath(userID, planID, day, index) {
  return `${planDaysStoragePath(userID, planID)}/${day}-${String(index).padStart(3, "0")}`;
}
//FIRESTORE
export function userPlansFirestorePath(userID) {
  return `users/${userID}/itineraries`;
}
export function planFirestorePath(userID, planID) {
  return `${userPlansFirestorePath(userID)}/${planID}`;
}

export function itinerariesOfPlansFirestorePath(userID, planID) {
  return `${planFirestorePath(userID, planID)}/days`;
}
