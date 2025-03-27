import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";


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
