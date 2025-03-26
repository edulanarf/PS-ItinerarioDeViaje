import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { getStorage} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

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

export { app, auth, storage, db };