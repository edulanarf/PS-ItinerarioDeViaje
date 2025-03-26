import {signInWithPopup, GoogleAuthProvider} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import {auth} from "./firebase-config.js";
const provider = new GoogleAuthProvider();

function loginWithGoogle() {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Usuario autenticado:", result.user);
      alert(`Bienvenido, ${result.user.displayName}`);
    })
    .catch((error) => {
      console.error("Error en Google Sign-In:", error.message);
      alert(`Error en Google Sign-In: ${error.message}`);
    });
}

document.getElementById("google-login").addEventListener("click", loginWithGoogle);