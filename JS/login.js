import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import {auth} from "./firebase-config.js";

function checkAuthState() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuario autenticado:", user.email);
    } else {
      console.log("No hay usuario autenticado.");
    }
  });
}

checkAuthState();

function loginUser(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      if (user.emailVerified) {
        console.log("✅ Usuario logueado:", user.email);

        window.location.href = "index.html";
      } else {
        alert("⚠️ Debes verificar tu correo antes de iniciar sesión.");
      }
    })
    .catch((error) => {
      console.error("❌ Error en el login:", error.message);
      alert(`Error en el login: ${error.message}`);
    });
}

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  loginUser(email, password);
});
