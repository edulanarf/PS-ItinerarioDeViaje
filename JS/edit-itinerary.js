// edit-itinerary.js
import { auth, db, storage } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { doc, getDoc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js';
import { MINE } from "./my-itineraries-const.js";

let userId;
let itineraryId;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userId = user.uid;
    const urlParams = new URLSearchParams(window.location.search);
    itineraryId = decodeURIComponent(urlParams.get('id'));
    loadItinerary();
  } else {
    window.location.href = "user-login.html";
  }
});

async function loadItinerary() {
  const docRef = doc(db, `users/${userId}/itineraries/${itineraryId}`);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    document.getElementById('title').value = data.title;
    document.getElementById('preview').src = data.photo;
  } else {
    alert("Itinerario no encontrado.");
  }
}

document.getElementById('photo').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const storageRef = ref(storage, `Users/${userId}/itineraries/${itineraryId}/photo.jpg`);
  await uploadBytes(storageRef, file);
  const photoURL = await getDownloadURL(storageRef);
  document.getElementById('preview').src = photoURL;

  // Guarda temporal para update
  document.getElementById('photo').dataset.url = photoURL;
});

document.getElementById('edit-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const newTitle = document.getElementById('title').value;
  const photoURL = document.getElementById('photo').dataset.url || document.getElementById('preview').src;

  const docRef = doc(db, `users/${userId}/itineraries/${itineraryId}`);
  await updateDoc(docRef, {
    title: newTitle,
    photo: photoURL,
  });

  alert("Itinerario actualizado.");
  window.location.href = `my-itineraries.html?type=${MINE}`;
});

document.getElementById('delete').addEventListener('click', async () => {
  const confirmDelete = confirm("¿Estás seguro de que deseas eliminar este itinerario?");
  if (!confirmDelete) return;

  await deleteDoc(doc(db, `users/${userId}/itineraries/${itineraryId}`));
  alert("Itinerario eliminado.");
  window.location.href = `my-itineraries.html?type=${MINE}`;
});
