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

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadPreferences(user);
    fillPreferencesForm();
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});

let currentUser, preferences, geocoder;

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

function fillPreferencesForm() {
  preferences.categories.forEach(category => {
    document.querySelector(`#edit-preferences-form .categories input[value="${category}"]`).checked = true;
  });
  document.querySelector('#edit-preferences-form [name="from-duration"]').value = preferences.duration.from;
  document.querySelector('#edit-preferences-form [name="to-duration"]').value = preferences.duration.to;
  refreshSelectedLocations();
}

function refreshSelectedLocations() {
  let selectedLocations = document.querySelector('.selected-locations');
  selectedLocations.innerHTML = '';
  preferences.cities.forEach(city => {
    let el = document.createElement('div');
    el.innerHTML = `<span>${city.name}</span><a href="#" data-place_id="${city.place_id}" data-lat="${city.lat}" data-lng="${city.lng}" data-name="${city.name}"> <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><path d="M24 20.188l-8.315-8.209 8.2-8.282-3.697-3.697-8.212 8.318-8.31-8.203-3.666 3.666 8.321 8.24-8.206 8.313 3.666 3.666 8.237-8.318 8.285 8.203z"></path></svg></a>`;
    selectedLocations.append(el);
  });
}

window.addEventListener('load',()=>{
  document.querySelector('#edit-preferences-form').addEventListener('submit',e=>{
    e.preventDefault();
    e.stopPropagation();
    preferences.categories = Array.from(
      document.querySelectorAll("#edit-preferences-form .categories input"),
    )
      .filter((el) => el.checked)
      .map((el) => el.value);
    preferences.duration = {
      from: document.querySelector('#edit-preferences-form [name="from-duration"]').value,
      to: document.querySelector('#edit-preferences-form [name="to-duration"]').value,
    }
    let preferencesRef = doc(db, `users/${currentUser.uid}/recommend-itineraries/preferences`);
    setDoc(preferencesRef, preferences).then(() => alert('Preferences updated.'));
    return false;
  });
  geocoder = new google.maps.Geocoder();
  let timeout;
  document
    .querySelector("#locations-search")
    .addEventListener("keyup", function (_) {
      if (timeout !== undefined) {
        clearTimeout(timeout);
      }
      timeout = setTimeout(() => {
        timeout = undefined;
        geocoder.geocode({ address: this.value }, (results, status) => {
          if (status === "OK") {
            results = results.filter(result => result.types.includes('locality'));
            setFoundLocations(
              results.map((result) => ({
                name: result.formatted_address,
                place_id: result.place_id,
                lat: result.geometry.location.lat(),
                lng: result.geometry.location.lng(),
              })),
            );
          }
        });
      }, 500);
    });
  document.querySelector('.locations-list').addEventListener('click',e=>{
    if (e.target.tagName !== 'A') return;
    if(preferences.cities.find(city => city.place_id === e.target.dataset.place_id)) return;
    preferences.cities.push({
      place_id: e.target.dataset.place_id,
      name: e.target.dataset.name,
      lat: e.target.dataset.lat,
      lng: e.target.dataset.lng
    });
    refreshSelectedLocations();
  });
  document.querySelector('.selected-locations').addEventListener('click',e=>{
    let a = e.target.tagName === 'A' ? e.target : e.target.closest('a');
    if (a.tagName !== 'A') return;
    preferences.cities = preferences.cities.filter(city => city.place_id !== a.dataset.place_id);
    refreshSelectedLocations();
  });
});


function setFoundLocations(results) {
  let html = "";
  let template = `
  <a href="#" data-place_id="{place_id}" data-lat="{lat}" data-lng="{lng}" data-name="{placename}">{placename}</a>
  `;
  results.forEach((result) => {
    html += template
      .replace("{place_id}", result.place_id)
      .replace(/{placename}/g, result.name)
      .replace(/{lat}/g, result.lat)
      .replace(/{lng}/g, result.lng);
  });
  let list = document.querySelector(".locations-list");
  list.innerHTML = html;
  if (list.children.length > 0) {
    list.classList.remove('hidden');
  } else {
    list.classList.add('hidden');
  }
}