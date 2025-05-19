import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { auth, db } from "/JS/firebase-config.js";
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

const profileContainer = document.getElementById("profile-info");

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const existingImage = profileContainer.querySelector("img");
    if (existingImage) return; // Ya se cargó

    const docRef = doc(db, `users/${user.uid}`);
    const docSnap = await getDoc(docRef);
    const data = docSnap.data();

    const isPremium = data.premium === true;
    const plan = data.plan || null;

    const profileWrapper = document.createElement("div");
    profileWrapper.id = "profile-wrapper";
    profileWrapper.style.position = "relative";
    profileWrapper.style.cursor = "pointer";
    profileWrapper.style.display = "flex";
    profileWrapper.style.flexDirection = "column";
    profileWrapper.style.alignItems = "center";

    const img = document.createElement("img");
    img.src = data.photoURL || "../mockups/default-avatar.png";
    img.alt = "Perfil";
    img.style.objectFit = "cover";
    img.style.width = "60px";
    img.style.height = "60px";
    img.style.borderRadius = "50%";

    if (isPremium) {
      img.style.boxShadow = "0 0 10px #00b4d8"; // ✨ sombra para premium
    }

    const username = document.createElement("p");
    username.style.fontWeight = "bold";
    username.style.textAlign = "center";
    username.style.fontFamily = "Montserrat, sans-serif";
    username.style.margin = "0.5rem 0";

    if (isPremium) {
      const planNames = {
        basic: "Plan Básico",
        advanced: "Plan Avanzado",
        unlimited: "Plan Ilimitado"
      };

      const premiumIcon = ""; // Aquí podrías añadir un emoji si deseas
      const planLabel = planNames[plan] || "Premium";

      username.innerHTML = `${premiumIcon} ${data.username || "Usuario"}<br><span style="color:#0077cc; font-size: 0.9rem;">${planLabel}</span>`;
    } else {
      username.textContent = data.username || "Usuario";
    }

    const dropdownMenu = document.createElement("div");
    dropdownMenu.id = "dropdown-menu";
    dropdownMenu.classList.add("hidden");

    dropdownMenu.innerHTML = `
      <a onclick="location.href='edit-profile.html'">Editar Perfil</a>
      <a onclick="location.href='edit-preferences.html'">Editar Preferencias</a>
      <a onclick="location.href='my-itineraries.html'">Mis Itinerarios</a>
      <a onclick="location.href='Favorites-Itineraries.html'">Itinerarios Favoritos</a>
      <a onclick="location.href='manage-plan.html'"> Gestionar Plan Premium</a>
      <a href="#" id="logout-button">Cerrar Sesión</a>
    `;

    profileWrapper.addEventListener("click", function (event) {
      event.stopPropagation();
      dropdownMenu.classList.toggle("show");
    });

    document.addEventListener("click", function (event) {
      if (!profileWrapper.contains(event.target)) {
        dropdownMenu.classList.remove("show");
      }
    });

    // Esperar a que el DOM esté listo para añadir logout
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

    // ✅ Mostrar u ocultar el botón "Hazte Premium" según el estado premium
    const premiumBtn = document.getElementById("premium-float-btn");
    if (premiumBtn) {
      if (isPremium) {
        premiumBtn.style.display = "none";
      } else {
        premiumBtn.style.display = "block"; // por si estaba oculto
      }
    }


  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});
