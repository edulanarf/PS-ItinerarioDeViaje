import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, onAuthStateChanged, sendEmailVerification} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario autenticado:", user.email);
  } else {
    console.log("No hay usuario autenticado.");
  }
});

function registerUser(email, password) {
  createUserWithEmailAndPassword(auth, email, password)
    .then((userCredential)=> {
      console.log("Usuario Registrado", userCredential.user);
      sendEmailVerification(userCredential.user);
      alert(`Usuario registrado: ${userCredential.user.email}`);
    })
    .catch((error)=> {
      console.log("Error en el registro", error.message);
      alert(`Error al registrar: ${error.message}`);
    });
}

document.getElementById("register-form").addEventListener("submit", function (e) {
  e.preventDefault();
  let email = document.getElementById("register-email").value;
  let password = document.getElementById("register-password").value;
  registerUser(email, password);
});