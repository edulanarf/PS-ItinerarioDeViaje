import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { auth } from './firebase-config.js';

onAuthStateChanged(auth, (user) => {
  if (!user) {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html"
  }
})

function userLogout() {
  signOut(auth)
    .then(() => {
      console.log("Cerrando sesión...");
      alert("Has cerrado sesión correctamente.");
      // Redirige al index
      window.location.href = "index.html"; // Ajusta si tu index está en otro nivel
    })
    .catch((error) => {
      console.log("Error al cerrar sesión:", error.message);
      alert(`Error al cerrar sesión: ${error.message}`);
    });
}

document.getElementById("logout-button").addEventListener("click", () => {
  userLogout();
});
