import {signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {auth} from "./firebase-config.js";

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

document.getElementById("logout-button").addEventListener("click", function() {
  userLogout();
});
