import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification, updateProfile
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

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
const provider = new GoogleAuthProvider();
const db = getFirestore(app, "itinerariosdeviaje");

function loginWithGoogle() {
  signInWithPopup(auth, provider)
    .then(async (userCredential) => {
      let photoURL = "https:firebasestorage.googleapis.com/v0/b/itinerarios-de-viaje-2db0b.firebasestorage.app/o/imgs%2FImagen%20perfil%20predeterminada.jpg?alt=media&token=2c1e55dd-3e3d-49cc-b77e-1d6c8abdf4d8";
      const usersCollection = doc(db,`users/${userCredential.user.uid}`);
      await setDoc(usersCollection, {
        username: "User",
        email: userCredential.user.email,
        photoURL: photoURL
      })
      await sendEmailVerification(userCredential.user);

      await updateProfile(userCredential.user, {
        displayName: "User",
        photoURL: photoURL
      });

      console.log("Usuario autenticado:", userCredential.user);
      alert(`Bienvenido, ${userCredential.user.displayName}`);
    })
    .catch((error) => {
      console.error("Error en Google Sign-In:", error.message);
      alert(`Error en Google Sign-In: ${error.message}`);
    });
}

document.getElementById("google-login").addEventListener("click", loginWithGoogle);