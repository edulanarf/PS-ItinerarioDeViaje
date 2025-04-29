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

async function loadItineraries() {

  const itinerariesRef = collection(db, "/users/CJEqUkAHk4gDMs1z2e10cPaJyop2/itineraries");
  //Contenedor de itinerarios
  const itinerariesSnapshot = await getDocs(itinerariesRef);

  //Recorro el numero de documentos (itinerarios)
  let itineraries = [];
  for (const itineraryDoc of itinerariesSnapshot.docs) {
    const itineraryData = itineraryDoc.data();
    itineraryData.days = (await getDocs(collection(db,`${itineraryDoc.ref.path}/days`))).docs.map(snap => {
      return snap.data();
    })
    itineraries.push(itineraryData);
  }
  console.log(itineraries);
  itineraries = itineraries.filter(itinerary => {
    return itinerary.days.findIndex(day => {
      return day.places.findIndex(place => {
        return checkCity(place);
      }) !== -1;
    }) !== -1;
  });
  console.log(itineraries);
}

let currentUser, preferences, geocoder;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadPreferences(user);
    loadItineraries();
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
          categories: [],
          duration: {
            from: 0,
            to: 24
          },
          cities: []
        };
      }
      resolve(preferences);
    });
  });
}

function checkCity(place) {
  return preferences.cities.findIndex(city => {
    return place.address.endsWith(', '+city.name.split(',').slice(0,1).join());
  }) !== -1;
}

function checkCategory(place) {
  return preferences
}

window.addEventListener("load", () => {
  //geocoder = new google.maps.Geocoder();
});