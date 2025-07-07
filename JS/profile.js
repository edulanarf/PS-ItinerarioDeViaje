import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { auth, db } from "/JS/firebase-config.js";

const profileContainer = document.getElementById("profile-info");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const existingImage = profileContainer.querySelector("img");
    if (existingImage) return; // Ya se cargó

    const profileWrapper = document.createElement("div");
    profileWrapper.id = "profile-wrapper";
    profileWrapper.style.position = "relative";
    profileWrapper.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = "../mockups/default-avatar.png"; // Usar imagen por defecto
    img.alt = "Perfil";
    img.style.objectFit = "cover";

    const username = document.createElement("p");
    username.textContent = user.displayName || user.email || "Usuario"; // Usar datos del auth
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
      <a onclick="location.href='my-itineraries.html'">Mis Itinerarios</a>
      <a onclick="location.href='Favorites-Itineraries.html'">Itinerarios Favoritos</a>
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

    // Intentar cargar datos de Firestore de forma opcional
    try {
      const docRef = doc(db, `users/${user.uid}`);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.photoURL) {
          img.src = userData.photoURL;
        }
        if (userData.username) {
          username.textContent = userData.username;
        }
      }
    } catch (error) {
      // Solo mostrar warning si no es un error de conexión
      if (error.code !== 'unavailable' && error.code !== 'failed-precondition') {
        console.warn("No se pudieron cargar los datos de Firestore:", error.message);
      }
      // La aplicación continúa funcionando con datos básicos del auth
    }
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});

// Exporta la función para obtener el usuario autenticado actual
export function getCurrentUser() {
  return auth.currentUser;
}
