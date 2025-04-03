import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

import {
  setDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

import { auth, checkAuthState, db, storage } from './firebase-config.js';

checkAuthState();

function registerUser(email, password, displayName, picture) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      let photoURL;

      if (!picture) {
        photoURL = "https://firebasestorage.googleapis.com/v0/b/itinerarios-de-viaje-2db0b.firebasestorage.app/o/imgs%2FImagen%20perfil%20predeterminada.jpg?alt=media&token=2c1e55dd-3e3d-49cc-b77e-1d6c8abdf4d8";
      } else {
        const storageRef = ref(storage, `/Users/${userCredential.user.uid}/ProfilePicture/picture`);
        await uploadBytes(storageRef, picture);
        photoURL = await getDownloadURL(storageRef);
      }

      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: photoURL
      });
      const usersCollection = doc(db, `users/${userCredential.user.uid}`);
      await setDoc(usersCollection, {
        username: displayName,
        email: userCredential.user.email,
        photoURL: photoURL
      });

      await sendEmailVerification(userCredential.user);

      console.log("✅ Usuario registrado correctamente");

      // ✅ Redirigir SIN alert
      window.location.href = "user-login.html";
    })
    .catch((error) => {
      console.error("❌ Error en el registro:", error.message);
      if(error.code === "auth/email-already-in-use"){
        const emailError = document.getElementById("email-error");
        emailError.textContent = "El correo está en uso";
        emailError.style.display = "block";
        email.style.borderColor = "red";
      }
    });
}

document.getElementById("register-form").addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const username = document.getElementById("register-username").value;
  const picture = document.getElementById("register-picture");
  const profilePicture = picture.files[0];

  const nameError = document.getElementById("name-error");
  if (username.length < 4) {
    nameError.textContent = "El nombre debe tener al menos 4 caracteres.";
    nameError.style.display = "block";
    username.style.borderColor = "red";
    return;
  }

  const passwordError = document.getElementById("password-error");
  if (password.length < 6) {
    passwordError.textContent = "La contraseña debe tener al menos 6 caracteres.";
    passwordError.style.display = "block";
    password.style.borderColor = "red";
    return;
  }

  registerUser(email, password, username, profilePicture);
});
