
import {
  signInWithPopup,
  GoogleAuthProvider,
  sendEmailVerification, updateProfile
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import {setDoc, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

import {auth, db} from "./firebase-config.js";
const provider = new GoogleAuthProvider();

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
      window.location.href = "user-login.html";
      alert(`Bienvenido, ${userCredential.user.displayName}`);
    })
    .catch((error) => {
      console.error("Error en Google Sign-In:", error.message);
      alert(`Error en Google Sign-In: ${error.message}`);
    });
}

document.getElementById("google-login").addEventListener("click", loginWithGoogle);