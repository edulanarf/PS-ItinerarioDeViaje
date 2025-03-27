import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// Config
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

function loginUser(email, password) {
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;

      if (user.emailVerified) {
        console.log("✅ Usuario logueado:", user.email);

        // ✅ Redirigir SIN alert
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
