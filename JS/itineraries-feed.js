import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { request } from "/JS/places.js";
import { priceLevels } from "/JS/price-levels.js";
import { auth, db } from "./firebase-config.js";
import{addFavoriteItinerary} from './addFavorite.js'
import{removeFavoriteItinerary} from './removeFavorite.js'
import { addFollowedUser } from "./addFollowed.js";
import { removeFollowedUser } from "./removeFollowed.js";
import { addItineraryReview, getItineraryRating, getItineraryReviews, drawReviews } from './itinerariesReviewsUtils.js';

async function loadItineraries() {
  const itinerariesRef = collection(db, "publicItineraries");
  const itinerariesSnapshot = await getDocs(itinerariesRef);
  itineraries = [];
  for (const itineraryDoc of itinerariesSnapshot.docs) {
    const itineraryData = itineraryDoc.data();
    itineraryData.days = (await getDocs(collection(db,`${itineraryDoc.ref.path}/days`))).docs.map(snap => {
      return snap.data();
    })
    let rating = await getItineraryRating(itineraryDoc.ref.id);
    itineraryData.rating = parseFloat(rating.averageRating||0).toFixed(2).replace(/(\.[1-9]?)0+$/,'$1').replace(/\.$/,'');
    itineraryData.ratingCount = rating.ratingCount||0;
    itineraryData.id = itineraryDoc.id;
    itineraryData.totalCost = itineraryData.days.reduce((c,v)=>{
      return c+v.places.reduce((c,v)=>{
        return c+v.price;
      },0);
    },0);
    itineraries.push(itineraryData);
  }
  return itineraries;
}

let currentUser, users, preferences, itineraries, searchCategories = [], searchLocalities = [], searchCreators = [], favorites = [], followed = [], favoritePlaces = [], previousDay = null;
let map, service, directionsService, directionsRenderer, geocoder, marker;
const allCategories = ['Hotel','Restaurante','Cafetería','Museo','Parque','Centro comercial','Aeropuerto'];

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await Promise.all([
      loadPreferences(user),
      loadUsers(),
      loadItineraries(),
      loadFavorites(),
      loadFollowed(),
      loadFavoritePlaces()
    ])
    drawItineraries();
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});

function loadPreferences(user) {
  return new Promise((resolve, _) => {
    let preferencesRef = doc(db, `users/${user.uid}/recommend-itineraries/preferences`);
    getDoc(preferencesRef).then(docSnap => {
      if (docSnap.exists()) {
        preferences = docSnap.data();
      } else {
        preferences = {
          categories: ["Restaurante", "Cafetería"],
          duration: {
            from: 1,
            to: 3
          },
          cities: [
            {
              name: "Madrid, España",
              place_id: "ChIJgTwKgJcpQg0RaSKMYcHeNsQ",
              lat: 40.41672790000001,
              lng: -3.7032905,
            },
            {
              name: "Barcelona, España",
              place_id: "ChIJ5TCOcRaYpBIRCmZHTz37sEQ",
              lat: 41.3873974,
              lng: 2.168568,
            },
          ],
        };
      }
      resolve(preferences);
    });
  });
}

async function loadUsers() {
  const usersRef = collection(db, "users");
  const usersSnapshot = await getDocs(usersRef);
  users = {};
  usersSnapshot.docs.forEach(doc => {
    users[doc.id] = doc.data();
  });
  return users;
}

async function loadFavorites() {
  const itinerariesRef = collection(db, 'users', currentUser.uid, 'favorites');
  return favorites = (await getDocs(itinerariesRef)).docs.map(itineraryDoc => itineraryDoc.data().itineraryRef);
}
async function loadFollowed() {
  const usersRef = collection(db, 'users', currentUser.uid, 'followed');
  return followed = (await getDocs(usersRef)).docs.map(userDoc => userDoc.data().userRef);
}

async function loadFavoritePlaces() {
  const fPlacesRef = collection(db, 'users', currentUser.uid, 'favorite-places');
  return favoritePlaces = (await getDocs(fPlacesRef)).docs.map(fPlaceDoc => fPlaceDoc.data());
}

function drawItineraries() {
  let itinerariesGroups = [];
  let cities = searchLocalities.length === 0 ? preferences.cities : searchLocalities;
  let categories = searchCategories.length === 0 ? preferences.categories : searchCategories;
  let creators = searchCreators.length === 0 ? [null] : searchCreators;
  let duration = preferences.duration;
  let f0Itineraries = itineraries.filter(itinerary => itinerary.days.length >= duration.from && itinerary.days.length <= duration.to);
  const pushGroup = (itineraries, creator, categories, cities) => {
    if (itineraries.length===0) return;
    let name = [];
    if(creator) name.push(`creado por ${creator}`);
    if (categories||cities) name.push('con visita');
    if (categories) name.push(`a ${categories.join(', ')}`);
    if (cities) name.push(`en ${cities.join(', ')}`);
    name = name.join(' ');
    name = name.substring(0,1).toUpperCase() + name.substring(1);
    itinerariesGroups.push({
      name,
      itineraries
    });
  };
  const applyCreatorFilter = (itineraries, userId) => {
    return itineraries.filter(itinerary => itinerary.userRef === userId);
  };
  const applyCitiesFilter = (itineraries, cities) => {
    return itineraries.filter(itinerary => {
      return cities.findIndex(city => {
        return itinerary.days.findIndex(day => {
          return day.places.findIndex(place => {
            return place.address.endsWith(', '+city);
          }) !== -1;
        }) === -1;
      }) === -1;
    });
  };
  const applyCategoriesFilter = (itineraries, categories) => {
    return itineraries.filter(itinerary => {
      return categories.findIndex(category => {
        return itinerary.days.findIndex(day => {
          return day.places.findIndex(place => {
            return place.category === category;
          }) !== -1;
        }) === -1;
      }) === -1;
    });
  }
  const applyFPlacesFilter = (itineraries, fPlaces) => {
    return itineraries.filter(itinerary => {
      return fPlaces.findIndex(fPlace => {
        const street = fPlace.formatted_address.split(',')[0];
        return itinerary.days.findIndex(day => {
          return day.places.findIndex(place => {
            return (
              place.name === fPlace.name
              &&
              place.address.startsWith(street+',')
            );
          }) !== -1;
        }) === -1;
      }) === -1;
    });
  }
  const localitiesChunkSize = Math.max(searchLocalities.length,1);
  const categoriesChunkSize = Math.max(searchCategories.length,1);
  creators.forEach(userId => {
    let f1Itineraries = userId ? applyCreatorFilter(f0Itineraries,userId) : f0Itineraries;
    let creatorName = userId ? users[userId].username : null;
    if (userId && searchLocalities.length === 0 && searchCategories.length === 0) {
      pushGroup(f1Itineraries,creatorName,null,null);
    }
    for (let i = 0; i < cities.length; i += localitiesChunkSize) {
      const citiesChunk = cities.slice(i, i + localitiesChunkSize).map(city => city.name.split(',').slice(0,1).join());
      let f2Itineraries = applyCitiesFilter(f1Itineraries,citiesChunk);
      if (searchLocalities.length > 0 && searchCategories.length === 0) {
        pushGroup(f2Itineraries,creatorName,null,citiesChunk)
      }
      for (let j = 0; j < categories.length; j += categoriesChunkSize) {
        const categoriesChunk = categories.slice(j, j + categoriesChunkSize);
        let f3Itineraries = applyCategoriesFilter(f2Itineraries,categoriesChunk);
        pushGroup(f3Itineraries,creatorName,categoriesChunk,citiesChunk);
      }
    }
  });
  if (searchCreators.length === 0 && searchLocalities.length === 0 && searchCategories.length === 0) {
    followed.forEach(userId => {
      pushGroup(applyCreatorFilter(f0Itineraries,userId),users[userId].username,null,null);
    });
    favoritePlaces.forEach(favoritePlace => {
      pushGroup(applyFPlacesFilter(f0Itineraries,[favoritePlace]),null,[favoritePlace.name],null);
    });
  }
  const star = `
    <svg class="star-single-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
      <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
    </svg>
  `;
  const groupTemplate = `
    <div class="destination">
      <div class="destination-header"><h2>{{name}}</h2></div>
      <div class="destination-content">
        {{itinerariesHtml}}
      </div>
    </div>
  `;
  const itineraryTemplate = `
    <a href="#" class="itinerary" data-id="{{id}}">
      <img class="itinerary-image" src="{{photo}}" alt="Madrid">
      <div class="itinerary-content">
        <div class="itinerary-title">{{title}}</div>
        <div class="itinerary-created-by">Creado por <span class="value">{{creator}}</span></div>
        <div class="itinerary-rating"><span class="itinerary-rating-value">{{rating}}</span>${star} (<span class="itinerary-rating-count">{{ratingCount}}</span> usuarios)</div>
        <div class="itinerary-description">{{description}}</div>
      </div>
    </a>
  `;
  let html = itinerariesGroups.map(group => {
    let itinerariesHtml = group.itineraries.map(itinerary => {
      return itineraryTemplate
        .replace('{{id}}',itinerary.id)
        .replace('{{title}}',itinerary.title)
        .replace('{{photo}}',itinerary.photo)
        .replace('{{rating}}',itinerary.rating)
        .replace('{{ratingCount}}',itinerary.ratingCount)
        .replace('{{description}}',itinerary.description||'')
        .replace('{{creator}}',users[itinerary.userRef]?.username||'')
        ;
    }).join('');
    return groupTemplate
      .replace('{{name}}',group.name)
      .replace('{{itinerariesHtml}}',itinerariesHtml)
      ;
  }).join('');
  document.querySelector('.destinations').innerHTML = html;
}

function drawFilters() {
  let html = '';
  html += searchLocalities.map(city => {
    return `<a href="#" class="search-filter" data-type="locality" data-place_id="${city.place_id}">&times; ${city.name.split(',').slice(0,1).join()}</a>`;
  }).join('');
  html += searchCategories.map(category => {
    return `<a href="#" class="search-filter" data-type="category" data-name="${category}">&times; ${category}</a>`;
  }).join('');
  html += searchCreators.map(userId => {
    return `<a href="#" class="search-filter" data-type="creator" data-user_id="${userId}">&times; ${users[userId].username}</a>`;
  }).join('');
  document.querySelector('.current-filters').innerHTML = html;
}

window.addEventListener("load", () => {
  document.querySelector('.destinations').addEventListener('click',e => {
    let link = e.target.closest('a')
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    if (moved) return;
    let itinerary = itineraries.find(itinerary => itinerary.id===link.dataset.id);
    showModal(itinerary);
  });
  let pos = { top: 0, left: 0, x: 0, y: 0 };
  let ele, moved;
  const mouseDownHandler = function (e) {
    ele = e.target.closest('.destination-content');
    moved = false;
    if (!ele) return;
    e.preventDefault();
    ele.style.userSelect = 'none';
    pos = {
        // The current scroll
        left: ele.scrollLeft,
        // Get the current mouse position
        x: e.clientX,
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };
  const mouseMoveHandler = function (e) {
    moved = true;
    // How far the mouse has been moved
    const dx = e.clientX - pos.x;

    // Scroll the element
    ele.scrollLeft = pos.left - dx;
  };
  const mouseUpHandler = function () {
    document.removeEventListener('mousemove', mouseMoveHandler);
    document.removeEventListener('mouseup', mouseUpHandler);
  };
  document.querySelector('.destinations').addEventListener('mousedown',mouseDownHandler);
  document.querySelector('.modal').addEventListener('click',e => {
    if (!e.target.classList.contains('modal')&&!e.target.classList.contains('close')) return;
    e.target.closest('.modal').classList.add('hidden');
  });
  initMap();
  let timeout;
  document.querySelector('#search-input').addEventListener('keyup',e => {
    if (timeout !== undefined) {
      clearTimeout(timeout);
    }
    let searchResults = document.querySelector('.search-results');
    let resultsCategory = document.querySelector('.result-category-category');
    let resultsLocality = document.querySelector('.result-category-locality');
    let resultsCreator = document.querySelector('.result-category-creator');
    searchResults.classList.add('hidden');
    resultsCategory.classList.add('hidden')
    resultsLocality.classList.add('hidden');
    resultsCreator.classList.add('hidden');
    if (e.target.value.length < 3) {
      return;
    }
    let filteredCategories = allCategories.filter(category => category.toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase()));
    if (filteredCategories.length > 0) {
      resultsCategory.querySelector('.result-category-content').innerHTML = filteredCategories.map(result => {
        return `<a class="result-category-item" data-type="category" data-name="${result}" href="#">${result}</a>`
      }).join('');
      resultsCategory.classList.remove('hidden')
    }
    let filteredCreators = Object.keys(users).filter(userId => users[userId].username.toLocaleLowerCase().includes(e.target.value.toLocaleLowerCase()));
    if (filteredCreators.length > 0) {
      resultsCreator.querySelector('.result-category-content').innerHTML = filteredCreators.map(result => {
        return `<a class="result-category-item" data-type="creator" data-user_id="${result}" href="#">${users[result].username}</a>`
      }).join('');
      resultsCreator.classList.remove('hidden')
    }
    timeout = setTimeout(() => {
      timeout = undefined;
      geocoder.geocode({ address: e.target.value }, (results, status) => {
        if (status === "OK") {
          results = results.filter(result => result.types.includes('locality'));
          if (results.length > 0) {
            resultsLocality.querySelector('.result-category-content').innerHTML = results.map(result => {
              let city = {
                name: result.formatted_address,
                place_id: result.place_id,
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              };
              return `<a class="result-category-item" data-type="locality" data-name="${city.name}" data-place_id="${city.place_id}" data-lat="${city.lat}" data-lat="${city.lng}" href="#">${city.name}</a>`
            }).join('');
            resultsLocality.classList.remove('hidden');
          }
        }
        if(!searchResults.querySelector('.result-category:not(.hidden)')) return;
        searchResults.classList.remove('hidden');
      });
    }, 500);
  });
  document.querySelector('.search-results').addEventListener('click',e=>{
    let link = e.target.closest('a');
    if(!link) return;
    document.querySelector('#search-input').value = '';
    document.querySelector('.search-results').classList.add('hidden');
    if(link.dataset.type==='locality') {
      searchLocalities.push({name:link.dataset.name,place_id:link.dataset.place_id,lat:link.dataset.lat,lng:link.dataset.lng});
    } else if(link.dataset.type==='category') {
      searchCategories.push(link.dataset.name);
    } else if(link.dataset.type==='creator') {
      searchCreators.push(link.dataset.user_id);
    }
    drawFilters();
    drawItineraries()
  });
  document.querySelector('.current-filters').addEventListener('click',e=>{
    let link = e.target.closest('a');
    if(!link) return;
    if(link.dataset.type==='locality') {
      searchLocalities = searchLocalities.filter(city => city.place_id !== link.dataset.place_id);
    } else if(link.dataset.type==='category') {
      searchCategories = searchCategories.filter(category => category !== link.dataset.name);
    } else if(link.dataset.type==='creator') {
      searchCreators = searchCreators.filter(userId => userId !== link.dataset.user_id);
    }
    drawFilters();
    drawItineraries()
  });
  document.querySelector('.add-to-favortites').addEventListener('click',e=>{
    addFavoriteItinerary(e.target.dataset.itineraryId).then(() => {
      e.target.classList.add('hidden');
      favorites.push(e.target.dataset.itineraryId);
      document.querySelector('.remove-from-favortites').classList.remove('hidden');
    });
  });
  document.querySelector('.remove-from-favortites').addEventListener('click',e=>{
    removeFavoriteItinerary(e.target.dataset.itineraryId).then(() => {
      e.target.classList.add('hidden');
      favorites = favorites.filter(itineraryId => itineraryId !== e.target.dataset.itineraryId);
      document.querySelector('.add-to-favortites').classList.remove('hidden');
    });
  });
  document.querySelector('.show-reviews').addEventListener('click',e=>{
    getItineraryReviews(e.target.dataset.itineraryId).then(reviews => {
      drawReviews(reviews);
      document.querySelectorAll('.modal-itinerary-content, .itinerary-map').forEach(el => el.classList.add('hidden'));
      let reviewsContent = document.querySelector('.modal-reviews-content');
      reviewsContent.classList.remove('hidden');
      e.target.classList.add('hidden');
      document.querySelector('.show-itinerary').classList.remove('hidden');
    });
  });
  document.querySelector('.show-itinerary').addEventListener('click',e=>{
      document.querySelectorAll('.modal-itinerary-content, .itinerary-map').forEach(el => el.classList.remove('hidden'));
      let reviewsContent = document.querySelector('.modal-reviews-content');
      reviewsContent.classList.add('hidden');
      e.target.classList.add('hidden');
      document.querySelector('.show-reviews').classList.remove('hidden');
  });
  document.querySelector('.form-rating').addEventListener('click',e=>{
    const svg = e.target.closest('svg');
    if (!svg) return;
    Array.from(svg.parentElement.children).forEach(el => el.classList.remove('selected'));
    svg.classList.add('selected');
  });
  document.querySelector('.new-review').addEventListener('click',e=>{
    let rating = Array.from(document.querySelector('.form-rating').children).reverse().findIndex(v => v.classList.contains('selected'))+1;
    addItineraryReview(e.target.dataset.itineraryId,rating,document.querySelector('.modal-reviews-form textarea').value).then(saved => {
      if (!saved) return;
      getItineraryReviews(e.target.dataset.itineraryId).then(reviews => {
        drawReviews(reviews);
        let count = reviews.length;
        let average = parseFloat(reviews.reduce((c,v)=>c+v.rating,0)/count).toFixed(2).replace(/(\.[1-9]?)0+$/,'$1').replace(/\.$/,'');
        document.querySelector('.rating-value').textContent = average;
        document.querySelector('.rating-count').textContent = count;
        let itinerary = itineraries.find(v => v.id === e.target.dataset.itineraryId);
        itinerary.rating = average;
        itinerary.ratingCount = count;
        document.querySelectorAll('.itinerary[data-id="'+e.target.dataset.itineraryId+'"] .itinerary-rating').forEach(el => {
          el.querySelector('.itinerary-rating-value').textContent = average;
          el.querySelector('.itinerary-rating-count').textContent = count;
        });
      });
    });
  })
  document.querySelector('.follow').addEventListener('click',e=>{
    addFollowedUser(e.target.dataset.userId).then(() => {
      e.target.classList.add('hidden');
      followed.push(e.target.dataset.userId);
      document.querySelector('.stop-following').classList.remove('hidden');
    });
  });
  document.querySelector('.stop-following').addEventListener('click',e=>{
    removeFollowedUser(e.target.dataset.userId).then(() => {
      e.target.classList.add('hidden');
      followed = followed.filter(userId => userId !== e.target.dataset.userId);
      document.querySelector('.follow').classList.remove('hidden');
    });
  });
  document.querySelector('.itinerary-days').addEventListener('click',e=>{
    let link = e.target.closest('a');
    if (!link) return;
    e.preventDefault();
    e.stopPropagation();
    panTo(link.dataset.lat,link.dataset.lng);
    let container = link.closest('.itinerary-day-places');
    let previousDayOld = previousDay;
    previousDay = container.dataset.day;
    if (previousDay===previousDayOld) return;
    placeWaypoints(JSON.parse(container.dataset.waypoints));
  });
});

function showModal(itinerary) {
  const modal = document.querySelector('.modal');
  modal.querySelector('.modal-header').textContent = itinerary.title;
  modal.querySelector('.modal-itinerary-created-by .value').textContent = users[itinerary.userRef].username||'';
  modal.querySelector('.modal-itinerary-description').textContent = itinerary.description||'';
  const star = `
    <svg class="star-single" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
      <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
    </svg>
  `;
  const dayTemplate = `
    <div class="itinerary-day">
      <div class="itinerary-day-header">{{name}}</div>
      <div class="itinerary-day-places" data-day="{{name}}" data-waypoints='{{waypoints}}'>
        {{placesHtml}}
      </div>
    </div>
  `;
  const placeTemplate = `
    <a href="#" class="itinerary-day-place" data-name="{{name}}" data-lat="{{lat}}" data-lng="{{lng}}">
      <img class="itinerary-day-place-img" src="{{photo}}" alt="">
      <div class="itinerary-day-place-data">
        <div class="itinerary-day-place-name">{{name}}</div>
        <div class="itinerary-day-place-address">
          Dirección: <span class="value">{{address}}</span>
        </div>
        <div class="itinerary-day-place-category">
          Categoría: <span class="value">{{category}}</span>
        </div>
        <div class="itinerary-day-place-price">
          Precio: <span class="value">{{price}}</span> €
        </div>
        <div class="itinerary-day-place-rating">
          Valoración: <span class="value">{{rating}}</span>${star}
        </div>
      </div>
    </a>
  `;
  let html = `
<div class="rating"><b>Valoración:</b> <span class="rating-value">{{rating}}</span>${star} (<span class="rating-count">{{ratingCount}}</span> usuarios)</div>
<div class="total-cost"><b>Coste total:</b> {{totalCost}}€</div>
`.replace('{{totalCost}}',itinerary.totalCost).replace('{{rating}}',itinerary.rating).replace('{{ratingCount}}',itinerary.ratingCount)+itinerary.days.map(day => {
    let waypoints = [];
    let placesHtml = day.places.map(place => {
      waypoints.push({lat:place.lat,lng:place.lng});
      return placeTemplate
        .replace('{{photo}}',place.photo)
        .replace(/{{name}}/g,place.name)
        .replace('{{address}}',place.address)
        .replace('{{category}}',place.category)
        .replace('{{price}}',place.price)
        .replace('{{rating}}',place.rating)
        .replace('{{lat}}',place.lat)
        .replace('{{lng}}',place.lng)
      ;
    }).join('');
    return dayTemplate
      .replace(/{{name}}/g,day.name)
      .replace('{{placesHtml}}',placesHtml)
      .replace('{{waypoints}}',JSON.stringify(waypoints))
    ;
  }).join('');
  modal.querySelector('.itinerary-days').innerHTML = html;
  let addToFavoritesBtn = modal.querySelector('.add-to-favortites');
  let removeFromFavoritesBtn = modal.querySelector('.remove-from-favortites');
  let showReviewsBtn = modal.querySelector('.show-reviews');
  let showItineraryBtn = modal.querySelector('.show-itinerary');
  let newReviewBtn = modal.querySelector('.new-review');
  addToFavoritesBtn.dataset.itineraryId = itinerary.id;
  removeFromFavoritesBtn.dataset.itineraryId = itinerary.id;
  showReviewsBtn.dataset.itineraryId = itinerary.id;
  newReviewBtn.dataset.itineraryId = itinerary.id;
  if (favorites.includes(itinerary.id)) {
    removeFromFavoritesBtn.classList.remove('hidden');
    addToFavoritesBtn.classList.add('hidden');
  } else {
    addToFavoritesBtn.classList.remove('hidden');
    removeFromFavoritesBtn.classList.add('hidden');
  }
  showReviewsBtn.classList.remove('hidden');
  showItineraryBtn.classList.add('hidden');
  modal.querySelectorAll('.modal-itinerary-content, .itinerary-map').forEach(el => el.classList.remove('hidden'));
  modal.querySelector('.modal-reviews-content').classList.add('hidden');
  let addToFolloedBtn = modal.querySelector('.follow');
  let removeFromFollowedBtn = modal.querySelector('.stop-following');
  addToFolloedBtn.dataset.userId = itinerary.userRef;
  removeFromFollowedBtn.dataset.userId = itinerary.userRef;
  if (followed.includes(itinerary.userRef)) {
    removeFromFollowedBtn.classList.remove('hidden');
    addToFolloedBtn.classList.add('hidden');
  } else {
    addToFolloedBtn.classList.remove('hidden');
    removeFromFollowedBtn.classList.add('hidden');
  }
  let place = itinerary.days[0].places[0];
  previousDay = itinerary.days[0].name;
  panTo(place.lat,place.lng);
  placeWaypoints(itinerary.days[0].places);
  modal.classList.remove('hidden');
}

function placeWaypoints(waypoints) {
  if (isNaN(waypoints[0].lat)) return;
  let origin = new google.maps.LatLng(waypoints[0].lat,waypoints[0].lng);
  let destination = new google.maps.LatLng(waypoints.slice(-1)[0].lat,waypoints.slice(-1)[0].lng);
  let wps = [];
  for(let i = 1; i < waypoints.length-1; i++) {
    wps.push({ location: new google.maps.LatLng(waypoints[i].lat,waypoints[i].lng)});
  }
  let request = {
    origin,
    destination,
    waypoints: wps,
    travelMode: 'DRIVING'
  };
  directionsService.route(request,(result, status)=>{
    if (status === 'OK') {
      directionsRenderer.setDirections(result);
    }
  });
}

function panTo(lat,lng) {
  if(isNaN(lat)) return;
  const center = new google.maps.LatLng(
    lat,
    lng,
  );
  map.panTo(center);
}

function initMap() {
  const defaultLocation = { lat: 28.1235, lng: -15.4363 }; // Coordenadas de Las Palmas GC
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
  });
  service = new google.maps.places.PlacesService(map);
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer();
  directionsRenderer.setMap(map);
  geocoder = new google.maps.Geocoder();
}