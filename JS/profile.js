import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {auth, db} from "/JS/firebase-config.js";
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

const profileContainer = document.getElementById("profile-info");
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, `users/${user.uid}`);
    const docSnap = await getDoc(docRef);

    const img = document.createElement("img");
    img.src = docSnap.data().photoURL;
    console.log(docSnap.data().photoURL);
    img.alt = "Perfil";
    img.style.width = "40px";
    img.style.height = "40px";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";

    const name = document.createElement("span");
    name.textContent = user.displayName || "Usuario";

    profileContainer.appendChild(img);
    profileContainer.appendChild(name);
  }
});