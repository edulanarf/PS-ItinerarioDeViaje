import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {auth, db} from "/JS/firebase-config.js";
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

const profileContainer = document.getElementById("profile-info");
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const existingImage = profileContainer.querySelector("img");
    if (existingImage) return;  // Si ya existe, no hacemos nada

    const docRef = doc(db, `users/${user.uid}`);
    const docSnap = await getDoc(docRef);


    const profileLink = document.createElement("a");
    profileLink.href = "edit-profile.html";
    profileLink.style.display = "inline-block";

    const img = document.createElement("img");
    img.src = docSnap.data().photoURL;
    console.log(docSnap.data().photoURL);
    img.alt = "Perfil";
    img.style.width = "60px";
    img.style.height = "60px";
    img.style.borderRadius = "50%";
    img.style.objectFit = "cover";

    profileLink.appendChild(img);

    const name = document.createElement("span");
    name.textContent = docSnap.data().username;

    profileContainer.appendChild(profileLink);
    profileContainer.appendChild(name);
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html"
  }
});