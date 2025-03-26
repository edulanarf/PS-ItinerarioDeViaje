import {signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { auth, checkAuthState } from './firebase-config.js';

checkAuthState();

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
