import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js";
import { getFirestore, setDoc, addDoc,collection, doc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const auth = getAuth(app);
const storage = getStorage(app);
const db = getFirestore(app, "itinerariosdeviaje"); //base de datos


onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Usuario autenticado:", user.email);
  } else {
    console.log("No hay usuario autenticado.");
  }
});

function registerUser(email, password, displayName, picture) {
  createUserWithEmailAndPassword(auth, email, password)
    .then(async (userCredential) => {
      // Subir la imagen de perfil al Storage
      const storageRef = ref(storage, `/Users/${userCredential.user.uid}/ProfilePicture/${picture.name}`);
      await uploadBytes(storageRef, picture);

      // Obtener la URL de la imagen subida
      const photoURL = await getDownloadURL(storageRef);

      // Actualizar el perfil del usuario con el nombre y la foto (en el Auth)
      await updateProfile(userCredential.user, {
        displayName: displayName,
        photoURL: photoURL
      });

      const usersCollection = doc(db,`users/${userCredential.user.uid}`);
      await setDoc(usersCollection, {
        username: displayName,
        email: userCredential.user.email,
        photoURL: photoURL
      });
      
      await sendEmailVerification(userCredential.user);

      console.log("Usuario registrado correctamente");
      alert(`Usuario registrado: ${userCredential.user.email}`);
    })
    .catch((error) => {
      console.log("Error en el registro", error.message);
      alert(`Error al registrar: ${error.message}`);
    });
}

document.getElementById("register-form").addEventListener("submit", function (e) {
  e.preventDefault();
  let email = document.getElementById("register-email").value;
  let password = document.getElementById("register-password").value;
  let username = document.getElementById("register-username").value;
  let picture = document.getElementById("register-picture");

  const profilePicture = picture.files[0];
  registerUser(email, password, username, profilePicture);

});