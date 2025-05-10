import {auth, db} from './firebase-config.js';
import {
  addDoc,
  deleteDoc,
  collection,
  doc,
  getDocs, query,
  where
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function removeFollowedUser(user) {
  const currentUser = auth.currentUser;
  const newUserRef = collection(db, 'users', currentUser.uid, 'followed');


  //Verificar que no está ya en favoritos para evitar duplicados
  const q = query(newUserRef, where("userRef", "==", user));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {

  } else {
    await deleteDoc(doc(db, 'users', currentUser.uid, 'followed', querySnapshot.docs[0].id))
  }
}