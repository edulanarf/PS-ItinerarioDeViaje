import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  updateProfile,
  updatePassword
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCCpB77wDXu-mNsKKIFg6BddH6DTminG9g",
  authDomain: "itinerarios-de-viaje-2db0b.firebaseapp.com",
  projectId: "itinerarios-de-viaje-2db0b",
  storageBucket: "itinerarios-de-viaje-2db0b.appspot.com",
  messagingSenderId: "86468425538",
  appId: "1:86468425538:web:8bc9c4194193614f7cfadb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const nameInput = document.getElementById("display-name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("new-password");
const photoInput = document.getElementById("profile-picture");
const photoPreview = document.getElementById("current-photo");
const saveButton = document.getElementById("save-button");
const form = document.getElementById("edit-profile-form");

let userRef;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userRef = doc(db, "users", user.uid);
    nameInput.value = user.displayName || "";
    emailInput.value = user.email || "";
    photoPreview.src = user.photoURL || "../mockups/default-profile.jpg";
  }
});

// Subida de imagen
async function uploadProfilePicture(file, uid) {
  const storageRef = ref(storage, `users/${uid}/profile.jpg`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
}

// Guardar cambios
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) return;

  const updates = {};
  const newName = nameInput.value.trim();
  const newPassword = passwordInput.value.trim();
  const newPhoto = photoInput.files[0];

  try {
    if (newName && newName !== user.displayName) {
      updates.displayName = newName;
    }

    if (newPhoto) {
      const url = await uploadProfilePicture(newPhoto, user.uid);
      updates.photoURL = url;
    }

    if (Object.keys(updates).length > 0) {
      await updateProfile(user, updates);
    }

    if (newPassword.length >= 6) {
      await updatePassword(user, newPassword);
    }

    await setDoc(userRef, {
      username: newName || user.displayName,
      email: user.email,
      photoURL: updates.photoURL || user.photoURL
    });

    alert("✅ Perfil actualizado correctamente.");
    location.reload();

  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    alert("Error al actualizar perfil: " + error.message);
  }
});
