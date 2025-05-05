import {auth, db} from './firebase-config.js';
import {
  addDoc,
  collection,
  doc,
  getDocs, query,
  where
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function addFollowedUser(user) {
  const currentUser = auth.currentUser;
  const newUserRef = collection(db, 'users', currentUser.uid, 'followed');


  //Verificar que no está ya en favoritos para evitar duplicados
  const q = query(newUserRef, where("userRef", "==", user));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    // Si no existe, lo añadimos a favoritos
    await addDoc(newUserRef, {
      userRef: user
    });

  } else {
  }
}