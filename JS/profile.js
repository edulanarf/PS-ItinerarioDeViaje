import {onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {auth, db} from "/JS/firebase-config.js";
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

const profileContainer = document.getElementById("profile-info");
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const existingImage = profileContainer.querySelector("img");
    if (existingImage) return; // Si ya existe, no hacemos nada

    const docRef = doc(db, `users/${user.uid}`);
    const docSnap = await getDoc(docRef);

    // Contenedor del perfil
    const profileWrapper = document.createElement("div");
    profileWrapper.id = "profile-wrapper";
    profileWrapper.style.position = "relative"; // Necesario para el menú
    profileWrapper.style.cursor = "pointer";

    // Imagen de perfil
    const img = document.createElement("img");
    img.src = docSnap.data().photoURL;
    img.alt = "Perfil";
    img.style.objectFit = "cover";

    //Nombre de usuario
    const username = document.createElement("p");
    username.textContent = docSnap.data().username || "Usuario";
    username.style.fontWeight = "bold";
    username.style.textAlign = "center";
    username.style.fontFamily = "Montserrat, sans-serif";

    // Menú desplegable
    const dropdownMenu = document.createElement("div");
    dropdownMenu.id = "dropdown-menu";
    dropdownMenu.classList.add("hidden"); // Inicialmente oculto

    // Opciones del menú
    dropdownMenu.innerHTML = `
      <a onclick="location.href='edit-profile.html'">Editar Perfil</a>
      <a onclick="location.href='edit-preferences.html'">Editar Preferencias</a>
      <a onclick="location.href='my-itineraries.html'">Mis Itinerarios</a>
      <a onclick="location.href='user-logout.html'">Cerrar Sesión</a>
    `;

    // Agregar eventos para mostrar/ocultar menú
    profileWrapper.addEventListener("click", function (event) {
      event.stopPropagation(); // Evita que se cierre inmediatamente
      dropdownMenu.classList.toggle("show");
    });

    // Cierra el menú si se hace clic fuera de él
    document.addEventListener("click", function (event) {
      if (!profileWrapper.contains(event.target)) {
        dropdownMenu.classList.remove("show");
      }
    });
    profileWrapper.style.zIndex = "1000";
    profileWrapper.appendChild(img);
    profileWrapper.appendChild(dropdownMenu);
    profileContainer.appendChild(profileWrapper);
    profileContainer.appendChild(username);
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});