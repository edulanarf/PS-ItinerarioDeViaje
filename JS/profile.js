import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { auth, db } from "/JS/firebase-config.js";
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { MINE } from "./my-itineraries-const.js";

const profileContainer = document.getElementById("profile-info");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const existingImage = profileContainer.querySelector("img");
    if (existingImage) return; // Ya se cargó

    const docRef = doc(db, `users/${user.uid}`);
    const docSnap = await getDoc(docRef);

    const profileWrapper = document.createElement("div");
    profileWrapper.id = "profile-wrapper";
    profileWrapper.style.position = "relative";
    profileWrapper.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = docSnap.data().photoURL || "../mockups/default-avatar.png";
    img.alt = "Perfil";
    img.style.objectFit = "cover";

    const username = document.createElement("p");
    username.textContent = docSnap.data().username || "Usuario";
    username.style.fontWeight = "bold";
    username.style.textAlign = "center";
    username.style.fontFamily = "Montserrat, sans-serif";

    const dropdownMenu = document.createElement("div");
    dropdownMenu.id = "dropdown-menu";
    dropdownMenu.classList.add("hidden");

    // ✅ Botones del menú con ID para logout
    dropdownMenu.innerHTML = `
      <a onclick="location.href='edit-profile.html'">Editar Perfil</a>
      <a onclick="location.href='edit-preferences.html'">Editar Preferencias</a>
      <a onclick="location.href='my-itineraries.html?type=${MINE}'">Mis Itinerarios</a>
      <a href="#" id="logout-button">Cerrar Sesión</a>
    `;

    // Mostrar/ocultar el menú al hacer click
    profileWrapper.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    // Cerrar si se hace clic fuera
    document.addEventListener("click", function (event) {
      if (!profileWrapper.contains(event.target)) {
        dropdownMenu.classList.remove("show");
      }
    });

    // ✅ Evento para cerrar sesión al instante
    setTimeout(() => {
      const logoutBtn = document.getElementById("logout-button");
      if (logoutBtn) {
        logoutBtn.addEventListener("click", async (e) => {
          e.preventDefault();
          try {
            await signOut(auth);
            window.location.href = "../HTML/user-login.html";
          } catch (error) {
            console.error("Error al cerrar sesión:", error);
          }
        });
      }
    }, 0);

    profileWrapper.appendChild(img);
    profileWrapper.appendChild(dropdownMenu);
    profileContainer.appendChild(profileWrapper);
    profileContainer.appendChild(username);
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});
