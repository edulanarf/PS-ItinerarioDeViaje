import {auth, db} from './firebase-config.js';
import {
  addDoc,
  collection,
  doc,
  getDocs, query,
  where, orderBy,
  getAggregateFromServer,
  average,
  count,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';

export async function getItineraryReviews(itineraryId) {
  const reviewsCol = collection(db, 'publicItineraries', itineraryId, 'reviews');
  const querySnapshot = await getDocs(query(reviewsCol, orderBy('created','desc')));
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
    reviewText,
    created: serverTimestamp()
  });
  return true;
}

export function drawReviews(reviews) {
  const reviewsContent = document.querySelector('.modal-reviews-list');
  const reviewForm = document.querySelector('.modal-reviews-form');
  reviewForm.classList.remove('popup-hidden');
  if (reviews.length===0) {
    reviewsContent.innerHTML = '<div class="no-reviews-found"><b>¡Se el primero en valorar el itinerario!</b></div>';
    return;
  }
  reviewsContent.innerHTML = '';
  let ownReviewIndex = reviews.findIndex(v => v.userRef === auth.currentUser.uid);
  console.log(ownReviewIndex);
  if (ownReviewIndex !== -1) {
    reviewForm.classList.add('popup-hidden');
    reviewsContent.innerHTML = '<div class="no-reviews-found"><b>¡Ya has valorado tu experiencia!</b></div>';
  }
  const reviewTemplate = `
    <div class="itinerary-review">
      <div class="itinerary-review-username">{{username}}</div>
      <div class="itinerary-review-rating">
        <svg class="star-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
        </svg>
        <svg class="star-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
        </svg>
        <svg class="star-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
        </svg>
        <svg class="star-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
        </svg>
        <svg class="star-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
          <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
        </svg>
      </div>
      <div class="itinerary-review-text">{{reviewText}}</div>
    </div>
  `;
  reviewsContent.innerHTML += reviews.map(review => {
    return reviewTemplate
      .replace('{{username}}',review.userName)
      .replace('star-'+review.rating,'star-'+review.rating+' selected')
      .replace('{{reviewText}}','<p>'+review.reviewText.split("\n").join('</p><p>')+'</p>');
  }).join('');
}