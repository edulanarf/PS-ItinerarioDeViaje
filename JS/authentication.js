import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

// TODO: Add SDKs for Firebase products that you want to use

const firebaseConfig = {
    apiKey: "AIzaSyCCpB77wDXu-mNsKKIFg6BddH6DTminG9g",
    authDomain: "itinerarios-de-viaje-2db0b.firebaseapp.com",
    projectId: "itinerarios-de-viaje-2db0b",
    storageBucket: "itinerarios-de-viaje-2db0b.firebasestorage.app",
    messagingSenderId: "86468425538",
    appId: "1:86468425538:web:8bc9c4194193614f7cfadb",
    measurementId: "G-CKN1D6S9GR"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * change navbar and accessible html for user
 * @param login - function to execute once user has login
 * @param logout - function to execute once user has logout
 */
export function onAuthStateChanged(login, logout) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("Usuario autenticado:", user.email);
            login()
        } else {
            console.log("No hay usuario autenticado.");
            logout()
        }
    });
}
