import {auth, db} from './firebase-config.js';
import {
  addDoc,
  collection,
  doc,
  getDocs, query,
  where,
  getAggregateFromServer,
  average,
  count
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function getItineraryReviews(itineraryId) {
  const reviewsCol = collection(db, 'publicItineraries', itineraryId, 'reviews');
  const querySnapshot = await getDocs(reviewsCol);
  if (querySnapshot.empty) return [];
  const usersRefs = [...new Set(querySnapshot.docs.map(doc => doc.data().userRef))];
  let usersNames;
  if (usersRefs.length) {
    usersNames = (await getDocs(query(collection(db,'users'), where('__name__', 'in', usersRefs)))).docs.reduce((c,v)=>{
      c[v.id] = v.data().username;
      return c;
    },{});
  } else {
    usersNames = {};
  }
  return querySnapshot.docs.map(doc => {
    return {...doc.data(),userName:usersNames[doc.data().userRef]};
  });
}

export async function getItineraryRating(itineraryId) {
  const reviewsCol = collection(db, 'publicItineraries', itineraryId, 'reviews');
  const querySnapshot = await getAggregateFromServer(reviewsCol, {
    averageRating: average('rating'),
    ratingCount: count()
  });
  if (querySnapshot.empty) return {averageRating:0,ratingCount:0};
  return querySnapshot.data();
}

export async function addItineraryReview(itineraryId,rating,reviewText) {
  const currentUser = auth.currentUser;
  const reviewsCol = collection(db, 'publicItineraries', itineraryId, 'reviews');
  const q = query(reviewsCol, where('userRef','==',currentUser.uid));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) return false;
  addDoc(reviewsCol,{
    userRef: currentUser.uid,
    rating,
    reviewText
  });
  return true;
}