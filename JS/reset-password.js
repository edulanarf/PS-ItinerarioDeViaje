import {sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {auth, checkAuthState} from "./firebase-config.js";



checkAuthState();
function resetPassword(email) {
  sendPasswordResetEmail(auth, email)
    .then(() => {
      console.log("Correo de restablecimiento enviado a:", email);
      alert(`Se ha enviado un correo a ${email} con un enlace para restablecer tu contraseña.`);
    })
    .catch((error) => {
      console.error("Error al enviar el correo de restablecimiento:", error.message);
      alert(`Error al enviar el correo: ${error.message}`);
    });
}

document.getElementById("forgot-password-form").addEventListener("submit", function (e) {
  e.preventDefault();
  let email = document.getElementById("forgot-password-email").value;
  resetPassword(email);
});
