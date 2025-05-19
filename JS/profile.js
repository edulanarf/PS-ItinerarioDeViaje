import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { auth, db } from "/JS/firebase-config.js";
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

const profileContainer = document.getElementById("profile-info");

// Estilos básicos para menú
const style = document.createElement('style');
style.textContent = `
  #profile-wrapper {
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  #profile-wrapper img {
    object-fit: cover;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    transition: box-shadow 0.3s ease;
  }
  #profile-wrapper img.premium {
    box-shadow: 0 0 10px #00b4d8;
  }
  #username {
    font-weight: bold;
    text-align: center;
    font-family: 'Montserrat', sans-serif;
    margin: 0.5rem 0;
  }
  #dropdown-menu {
    display: none;
    position: absolute;
    top: 80px;
    background: white;
    border-radius: 6px;
    box-shadow: 0 4px 8px rgb(0 0 0 / 0.15);
    padding: 10px 0;
    width: 180px;
    font-family: 'Montserrat', sans-serif;
    z-index: 1000;
  }
  #dropdown-menu.show {
    display: block;
  }
  #dropdown-menu a, #dropdown-menu button {
    display: block;
    padding: 10px 20px;
    color: #333;
    text-decoration: none;
    font-size: 0.95rem;
    background: none;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid #eee;
  }
  #dropdown-menu a:last-child, #dropdown-menu button:last-child {
    border-bottom: none;
  }
  #dropdown-menu a:hover, #dropdown-menu button:hover {
    background-color: #f0f4f8;
  }
  /* Google translate override to hide ugly banners */
  .goog-te-banner-frame.skiptranslate { display: none !important; }
  body { top: 0 !important; }
  .goog-logo-link, .goog-te-gadget { display:none !important; }
  #language-selector {
    margin-top: 10px;
    padding: 6px 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    font-size: 1rem;
    font-family: 'Montserrat', sans-serif;
    width: 190px;
  }
`;
document.head.appendChild(style);

function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + (days*24*60*60*1000));
  const expires = "expires="+ d.toUTCString();
  document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../HTML/user-login.html";
    return;
  }

  const docRef = doc(db, `users/${user.uid}`);
  const docSnap = await getDoc(docRef);
  const data = docSnap.data();

  const isPremium = data.premium === true;
  const plan = data.plan || null;

  // Limpiar container por si hay algo
  profileContainer.innerHTML = '';

  // Crear wrapper perfil
  const profileWrapper = document.createElement('div');
  profileWrapper.id = 'profile-wrapper';

  // Imagen
  const img = document.createElement('img');
  img.src = data.photoURL || "../mockups/default-avatar.png";
  img.alt = 'Perfil';
  if (isPremium) img.classList.add('premium');
  profileWrapper.appendChild(img);

  // Nombre y plan
  const username = document.createElement('p');
  username.id = 'username';
  if (isPremium) {
    const planNames = {
      basic: "Plan Básico",
      advanced: "Plan Avanzado",
      unlimited: "Plan Ilimitado"
    };
    const premiumIcon = "⭐ ";
    username.innerHTML = `${premiumIcon}${data.username || "Usuario"}<br><span style="color:#0077cc; font-size: 0.9rem;">${planNames[plan] || "Premium"}</span>`;
  } else {
    username.textContent = data.username || "Usuario";
  }
  profileContainer.appendChild(username);

  // Dropdown menú
  const dropdownMenu = document.createElement('div');
  dropdownMenu.id = 'dropdown-menu';
  dropdownMenu.innerHTML = `
    <a href="edit-profile.html">Editar Perfil</a>
    <a href="edit-preferences.html">Editar Preferencias</a>
    <a href="my-itineraries.html">Mis Itinerarios</a>
    <a href="Favorites-Itineraries.html">Itinerarios Favoritos</a>
    <a href="manage-plan.html">Gestionar Plan Premium</a>
    <button id="logout-button">Cerrar Sesión</button>
  `;

  profileWrapper.appendChild(dropdownMenu);
  profileContainer.appendChild(profileWrapper);

  // Click para toggle menú
  profileWrapper.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    dropdownMenu.classList.remove('show');
  });

  // Logout
  document.getElementById('logout-button').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      window.location.href = "../HTML/user-login.html";
    } catch (err) {
      console.error('Error cerrando sesión:', err);
    }
  });

  // --- Aquí insertamos el traductor sólo si es premium ---

  if (isPremium) {
    // Contenedor oculto del traductor Google
    const translateDiv = document.createElement('div');
    translateDiv.id = 'google_translate_element';
    translateDiv.style.marginTop = '10px';
    profileContainer.appendChild(translateDiv);

    // Selector desplegable para idiomas
    const langSelector = document.createElement('select');
    langSelector.id = 'language-selector';
    langSelector.innerHTML = `
      <option value="es" selected>🇪🇸 Español</option>
      <option value="en">🇺🇸 English</option>
      <option value="fr">🇫🇷 Français</option>
      <option value="de">🇩🇪 Deutsch</option>
      <option value="it">🇮🇹 Italiano</option>
    `;
    profileContainer.appendChild(langSelector);

    // Función oficial Google Translate init
    window.googleTranslateElementInit = function () {
      new google.translate.TranslateElement({
        pageLanguage: 'es',
        includedLanguages: 'es,en,fr,de,it',
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        autoDisplay: false
      }, 'google_translate_element');
    };

    // Cargar script de Google Translate
    const script = document.createElement('script');
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    document.body.appendChild(script);

    // Cambiar idioma con cookie y recarga
    langSelector.addEventListener('change', () => {
      const lang = langSelector.value;
      setCookie('googtrans', `/es/${lang}`, 365);
      location.reload();
    });
  }
});
