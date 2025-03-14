import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { keys } from '../../apiKeys';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = {
  apiKey: keys.APIKEYFIREBASE,
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

function userLogout() {
  signOut(auth)
    .then(()=> {
      console.log("Cerrando sesión");
      alert("Cerrando sesión");
    })
    .catch((error)=> {
      console.log("Error al cerrar sesión:", error.message);
      alert(`Error al cerrar sesión ${error.message}`);
    });
}

document.getElementById("log-out").addEventListener("click", function() {
  userLogout();
});
