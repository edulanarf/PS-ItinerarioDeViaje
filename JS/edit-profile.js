  import {
    onAuthStateChanged,
    updatePassword,
    updateProfile
  } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
  import { doc, getDoc, updateDoc } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
  import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes
  } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js';

  import { auth, checkAuthState, db, storage } from './firebase-config.js';

  checkAuthState();

  const nameInput = document.getElementById("display-name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("new-password");
  const photoInput = document.getElementById("profile-picture");
  const photoPreview = document.getElementById("current-photo");
  const form = document.getElementById("edit-profile-form");

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const docRef = doc(db, `users/${user.uid}`);
      const docSnap = await getDoc(docRef);

      nameInput.value = docSnap.data().username;
      photoPreview.src = docSnap.data().photoURL;
    } else {
      console.log("not authenticated!!!!");
      window.location.href = "../HTML/user-login.html"
    }
  });

  // Subida de imagen
  async function uploadProfilePicture(newPhoto, user) {
    const storageRef = ref(storage, `/Users/${user.uid}/ProfilePicture/picture`);

    try {
      await deleteObject(storageRef);
    } catch (error) {
      console.warn("⚠️ No se pudo eliminar la imagen anterior:", error.message);
    }

    await uploadBytes(storageRef, newPhoto);
    return await getDownloadURL(storageRef);
  }

  // Guardar cambios
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    const usersCollection = doc(db, `users/${user.uid}`);
    if (!user) return;

    console.log("1..");
    const updates = {};
    const newName = nameInput.value.trim();
    console.log("2..");
    const newPassword = passwordInput.value.trim();
    const newPhoto = photoInput.files[0];
    console.log("3..");

    try {
      if (newName && newName !== user.displayName) {
        console.log("nombre");
        updates.displayName = newName;

        await updateDoc(usersCollection, {
          username: newName,
        });
      }

      if (newPhoto) {
        console.log("foto");
        updates.photoURL = await uploadProfilePicture(newPhoto, user);

        await updateDoc(usersCollection, {
          photoURL: updates.photoURL,
        });
      }

      if (Object.keys(updates).length > 0) {
        await updateProfile(user, updates);
      }

      if (newPassword.length >= 6) {
        await updatePassword(user, newPassword);
      }


      alert("✅ Perfil actualizado correctamente.");
      location.reload();
      setTimeout(()=> {window.location.href = "/HTML/home-page.html"}, 2000)

    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      alert("Error al actualizar perfil: " + error.message);
    }
  });
