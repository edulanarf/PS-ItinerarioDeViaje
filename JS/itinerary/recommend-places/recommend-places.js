import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { request } from '/JS/itinerary/search-places/places.js';

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
const db = getFirestore(app);
let service;

window.addEventListener('load',() => {
    document.querySelectorAll('.nav-tabs > a').forEach(el => {
        el.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            document.querySelectorAll('.nav-tabs > a').forEach(el => el.classList.remove('active'));
            el.classList.add('active');
            document.querySelectorAll('.tab-content > div').forEach(el => el.classList.remove('show'));
            document.querySelector(el.getAttribute('href')).classList.add('show');
        });
    });
    initMap();
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPreferences(user);
  } else {
    console.log("No hay usuario autenticado.");
  }
});

let preferences;

function loadPreferences(user) {
  let preferencesRef = doc(db, "preferences", user.uid);
  getDoc(preferencesRef).then(docSnap => {
    if (docSnap.exists()) {
      preferences = docSnap.data();
    } else {
      preferences = {
        cities: [{name:'Madrid',lat:40.416775,lng:-3.703790},{name:'Barcelona',lat:41.390205,lng:2.154007}],
        categories: ['Restaurante','Cafetería']
      }
      //setDoc(preferencesRef,preferences);
    }
    loadPreferencesData(preferences).then(preferencesData => {
      updateSectionsInfo(user,preferences,preferencesData);
    });
  })
}

function loadPreferencesData(preferences) {
  const promises = [];
  preferences.cities.forEach(city => {
    preferences.categories.forEach(category => {
      const radius = request[category].radius;
      const location = {lat:city.lat,lng:city.lng};
      const requests = {
        location,
        radius,
        keyword: category
      };
      promises.push(new Promise((resolve,reject)=>{
        service.nearbySearch(requests, (results, status) => {
          if (status !== google.maps.places.PlacesServiceStatus.OK) return reject(status);
          return resolve(results);
        })
      }))
    });
  });
  return Promise.all(promises);
}

function updateSectionsInfo(user,preferences,preferencesData) {
  
}

function initMap() {
  const defaultLocation = { lat: 28.1235, lng: -15.4363 }; // Coordenadas de Las Palmas GC
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
  });
  service = new google.maps.places.PlacesService(map);
}

// Función para obtener lugares cercanos y mostrarlos
function fetchNearbyPlaces(location) {
  const option = request[selectedCategory];

  const requests = {
    location: location,
    radius: option.radius,
    keyword: selectedCategory,
  };

  service.nearbySearch(requests, (results, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      const sortedResults = results
        .filter(place => place.rating && place.photos)
        .sort((a, b) => b.rating - a.rating);
      const placesList = document.getElementById('places-list');
      placesList.innerHTML = '';

      sortedResults.forEach((place) => {
        const li = document.createElement('li');
        let photoUrl = place.photos ? place.photos[0].getUrl({ maxWidth: 200 }) : 'https://via.placeholder.com/200';

        li.innerHTML = `
          <img src="${photoUrl}" alt="${place.name}" class="place-image" style="width: 200px; height: auto; border-radius: 10px;">
          <div> ${place.name} </div>
          Rating: ${place.rating || 'N/A'}`;

        const imgElement = li.querySelector('.place-image');
        imgElement.addEventListener('click', () => {
          showPlaceInfo(place);
        });

        placesList.appendChild(li);
      });
    }
  });
}