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
    await Promise.all([loadPreferences(user),loadFavoritesPlaces(user)]);
    places = await loadPreferencesData(preferences);
    await loadUserPlacesStats(user, places);
    updateSectionsInfo(user, preferences, places);
    await updateUserPlacesStats(user);
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});

let map, service, marker, infowindow, geocoder, currentUser, places;

window.addEventListener("load", () => {
  document.querySelectorAll(".nav-tabs > a").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      document
        .querySelectorAll(".nav-tabs > a")
        .forEach((el) => el.classList.remove("active"));
      el.classList.add("active");
      document
        .querySelectorAll(".tab-content > div")
        .forEach((el) => el.classList.remove("show"));
      document.querySelector(el.getAttribute("href")).classList.add("show");
    });
  });
  document.body.addEventListener("click", function (e) {
    if (!e.target.closest(".place")) return;
    e.preventDefault();
    e.stopPropagation();
    let placeId = e.target.closest(".place").dataset.place_id;
    if (e.target.classList.contains("remove-location")) {
      e.target.closest(".place").remove();
      return;
    }
    if (e.target.classList.contains("add-location")) {
      let selectedLocations = document.querySelector(".selected-locations");
      let alreadySelected =
        selectedLocations.querySelector(
          `a.place[data-place_id="${placeId}"]`,
        ) !== null;
      if (alreadySelected) {
        alert("Está localización ya esta seleccionada.");
        return;
      }
      selectedLocations.innerHTML += e.target
        .closest(".place")
        .outerHTML.replace('class="add-location"', 'class="remove-location"')
        .replace("Añadir localización", "Quitar localización");
      return;
    }
    let request = {
      placeId,
    };
    service.getDetails(request, (place, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        place &&
        place.geometry &&
        place.geometry.location
      ) {
        const center = new google.maps.LatLng(
          place.geometry.location.lat(),
          place.geometry.location.lng(),
        );
        map.panTo(center);

        if (marker !== undefined) marker.setMap(null);

        // Add a marker for the place.
        marker = new google.maps.Marker({
          map,
          position: place.geometry.location,
          title: place.name,
        });
        if (place.rating) {
          let photoUrl = place.photos
            ? place.photos[0].getUrl({ maxWidth: 200 })
            : "https://via.placeholder.com/200";
          let scoreHtml = "";
          let intScore = parseInt(place.rating);
          for (let i = 0; i < intScore; i++) {
            scoreHtml += '<span class="star on"></span>';
          }
          if (place.rating - intScore >= 0.5)
            scoreHtml += '<span class="star half"></span>';
          for (let i = Math.round(place.rating); i < 5; i++) {
            scoreHtml += '<span class="star"></span>';
          }
          scoreHtml += ` (${place.rating})`;

          let favorite = favoritesPlaces[place.place_id]!==undefined;

          let content = `
              <img src="${photoUrl}" alt="${place.name}" class="place-image">
              <div class="infobox-place-container">
                <h2><b>${place.name}</b></h2>
                <div><b>Type:</b> ${place.types[0].substring(0,1).toUpperCase()+place.types[0].substring(1)}</div>
                <div><b>Address:</b> ${place.formatted_address}</div>
                <div><b>Phone:</b> ${place?.formatted_phone_number||'Desconocido'}</div>
                <div><b>Opening Hours:</b>
                  <ul>
                    <li>${place.opening_hours?.weekday_text?.map(text => text.substring(0,1).toUpperCase()+text.substring(1))?.join('</li><li>')||'Desconocido'}</li>
                  </ul>
                </div>
                <div class="infobox-score">${scoreHtml}</div>
                <div class="infobox-controls">
                  <button class="add-to-favorite${favorite?' hidden':''}" type="button">Añadir Favorito</button>
                  <button class="remove-from-favorite${favorite?'':' hidden'}" onclick="removeFromFavorites('${place.place_id}')" type="button">Quitar Favorito</button>
                </div>
              </div>`;
          let el = document.createElement('div');
          el.innerHTML = content;
          el.querySelector('.add-to-favorite').addEventListener('click',() => {
            console.log(place);
            addToFavorites(place.place_id,place.name,place.geometry.location.lat(),place.geometry.location.lng(),place.formatted_address,photoUrl);
          })
          infowindow.setContent(el);
        } else {
          infowindow.setContent(place.name);
        }
        infowindow.open(map, marker);
      }
    });
  });
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
  initMap();
});
function setSelectedCategories(categories) {
  document
    .querySelectorAll(`#preferences .categories input`)
    .forEach((el) => (el.checked = false));
  categories.forEach(
    (category) =>
      (document.querySelector(
        `#preferences .categories input[value="${category}"]`,
      ).checked = true),
  );
}
function setSelectedLocations(results) {
  let html = "";
  let template = `
  <a class="place" href="#" data-place_id="{place_id}" data-lat="{lat}" data-lng="{lng}" data-name="{placename}">
    <div class="location-info">
      <div class="place-name">{placename}</div>
      <div class="place-address">Latitude: {lat}</div>
      <div class="place-address">Longitude: {lng}</div>
      <div class="place-control"><button type="button" class="remove-location">Quitar localización</button></div>
    </div>
  </a>`;
  results.forEach((result) => {
    html += template
      .replace("{place_id}", result.place_id)
      .replace(/{placename}/g, result.name)
      .replace(/{lat}/g, result.lat)
      .replace(/{lng}/g, result.lng);
  });
  document.querySelector("#preferences .selected-locations").innerHTML = html;
}
function setFoundLocations(results) {
  let html = "";
  let template = `
  <a class="place" href="#" data-place_id="{place_id}" data-lat="{lat}" data-lng="{lng}" data-name="{placename}">
    <div class="location-info">
      <div class="place-name">{placename}</div>
      <div class="place-address">Latitude: {lat}</div>
      <div class="place-address">Longitude: {lng}</div>
      <div class="place-control"><button type="button" class="add-location">Añadir localización</button></div>
    </div>
  </a>`;
  results.forEach((result) => {
    html += template
      .replace("{place_id}", result.place_id)
      .replace(/{placename}/g, result.name)
      .replace(/{lat}/g, result.lat)
      .replace(/{lng}/g, result.lng);
  });
  document.querySelector("#preferences .found-locations").innerHTML = html;
}

let preferences, placesRecommendationStats, favoritesPlaces;

function loadFavoritesPlaces(user) {
  return new Promise((resolve, _) => {
    let favoritesPlacesRef = collection(db, `users/${user.uid}/favorite-places`);
    favoritesPlacesRef
    getDocs(favoritesPlacesRef).then((querySnap) => {
      favoritesPlaces = {};
      querySnap.docs.forEach(docSnap => favoritesPlaces[docSnap.id]=docSnap.data());
      resolve(favoritesPlaces);
    });
  });
}

window.addToFavorites = (place_id, name, lat, lng, formatted_address, photoUrl) => {
  let favoritePlaceRef = doc(db, `users/${currentUser.uid}/favorite-places`,place_id);
  let place = {place_id,name,lat,lng,formatted_address,photoUrl};
  setDoc(favoritePlaceRef,place).then(()=>{
    favoritesPlaces[place_id] = place;
    document.querySelectorAll('.infobox-controls button').forEach(el => el.classList.toggle('hidden'));
    updateFavoritesSectionInfo(places)
  });
}

window.removeFromFavorites = (place_id) => {
  let favoritePlaceRef = doc(db, `users/${currentUser.uid}/favorite-places`,place_id);
  deleteDoc(favoritePlaceRef).then(()=>{
    delete favoritesPlaces[place_id];
    document.querySelectorAll('.infobox-controls button').forEach(el => el.classList.toggle('hidden'));
    updateFavoritesSectionInfo(places)
  });
}

function loadPreferences(user) {
  return new Promise((resolve, _) => {
    let preferencesRef = doc(db, `users/${user.uid}/recommend-places/preferences`);
    getDoc(preferencesRef).then((docSnap) => {
      if (docSnap.exists()) {
        preferences = docSnap.data();
      } else {
        preferences = {
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
          categories: ["Restaurante", "Cafetería"],
        };
        setDoc(preferencesRef, preferences);
      }
      document
        .querySelector(".configure-preferences")
        .addEventListener("click", function (_) {
          setSelectedLocations(preferences.cities);
          setSelectedCategories(preferences.categories);
          Array.from(this.parentElement.children).forEach((el) =>
            el.classList.remove("hidden"),
          );
          this.classList.add("hidden");
          document.querySelector(".nav-tabs").classList.add("hidden");
          document
            .querySelectorAll(".tab-content > div")
            .forEach((el) => el.classList.remove("show"));
          document.querySelector("#preferences").classList.add("show");
        });
      document
        .querySelector(".cancel-preferences")
        .addEventListener("click", function (_) {
          Array.from(this.parentElement.children).forEach((el) =>
            el.classList.add("hidden"),
          );
          document
            .querySelector(".configure-preferences")
            .classList.remove("hidden");
          document.querySelector(".nav-tabs").classList.remove("hidden");
          document
            .querySelectorAll(".tab-content > div")
            .forEach((el) => el.classList.remove("show"));
          document
            .querySelector(
              document.querySelector(".nav-tabs a.active").getAttribute("href"),
            )
            .classList.add("show");
        });
      document
        .querySelector(".save-preferences")
        .addEventListener("click", function (_) {
          let categories = Array.from(
            document.querySelectorAll("#preferences .categories input"),
          )
            .filter((el) => el.checked)
            .map((el) => el.value);
          let cities = Array.from(
            document.querySelectorAll(
              "#preferences .selected-locations .place",
            ),
          ).map((el) => ({
            name: el.dataset.name,
            place_id: el.dataset.place_id,
            lat: el.dataset.lat,
            lng: el.dataset.lng,
          }));
          setDoc(preferencesRef, {
            cities,
            categories,
          }).then(() => window.location.reload());
        });
      resolve(preferences);
    });
  });
}

function loadUserPlacesStats(user, places) {
  return new Promise((resolve, _) => {
    let placesRecommendationStatsRef = doc(db, `users/${user.uid}/recommend-places/stats`);
    getDoc(placesRecommendationStatsRef).then((docSnap) => {
      if (docSnap.exists()) {
        placesRecommendationStats = docSnap.data();
      } else {
        placesRecommendationStats = {};
      }
      placesRecommendationStats = {};
      let update = false;
      places.forEach((place) => {
        let placeStats = placesRecommendationStats[place.place_id];
        if (placeStats === undefined) {
          placeStats = {
            showOnNew: true,
            ratingHistory: {},
          };
          placesRecommendationStats[place.place_id] = placeStats;
        }
        let date = new Date().toISOString().split("T")[0];
        if (placeStats.ratingHistory[date] !== undefined) return;
        update = true;
        placeStats.ratingHistory[date] = place.rating;
      });
      if (update) {
        setDoc(placesRecommendationStatsRef, placesRecommendationStats);
      }
      resolve(placesRecommendationStats);
    });
  });
}

function updateUserPlacesStats(user) {
  return new Promise((_, __) => {
    let placesRecommendationStatsRef = doc(db, `users/${user.uid}/recommend-places/stats`);
    setDoc(placesRecommendationStatsRef, placesRecommendationStats);
  });
}

async function loadPreferencesData(preferences) {
  const promises = [];
  preferences.cities.forEach((city) => {
    preferences.categories.forEach((category) => {
      const radius = request[category].radius;
      const location = { lat: parseFloat(city.lat), lng: parseFloat(city.lng) };
      const requests = {
        location,
        radius,
        keyword: category,
      };
      promises.push(
        new Promise((resolve, reject) => {
          let fullResults = [];
          service.nearbySearch(requests, (results, status, pagination) => {
            if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) return resolve([]);
            if (status !== google.maps.places.PlacesServiceStatus.OK)
              return reject(status);
            results = results
              .filter((result) => result.rating >= 4)
              .map((result) => {
                result.category = category;
                return result;
              });
            fullResults = fullResults.concat(results);
            if (pagination.hasNextPage && results.length > 0)
              return pagination.nextPage();
            return resolve(fullResults);
          });
        }),
      );
    });
  });
  return (await Promise.all(promises))
    .flat()
    .sort((a, b) => b.rating - a.rating);
}

function updateSectionsInfo(user, preferences, places) {
  updatePopularSectionInfo(user, preferences, places);
  updateUpSectionInfo(user, preferences, places);
  updateNewSectionInfo(user, preferences, places);
  updateFavoritesSectionInfo(places);
}

async function updateFavoritesSectionInfo(places) {
  let favoritesPlacesIds = Object.keys(favoritesPlaces);
  places = places.filter(place => favoritesPlacesIds.includes(place.place_id))
  let foundIds = places.map(place => place.place_id);
  let missingIds = favoritesPlacesIds.filter(place_id => !foundIds.includes(place_id));
  for(let i=0;i<missingIds.length;i++) {
    let place = await (new Promise((resolve,reject) => {
      service.getDetails({placeId:missingIds[i]}, (place, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          place &&
          place.geometry &&
          place.geometry.location
        ) {
          resolve(place);
        } else {
          resolve(null);
        }
      })
    }));
    if (place===null) continue;
    places.push(place);
  }
  updateSectionInfo("favorites", places);
}

function updateUpSectionInfo(user, preferences, places) {
  let upPlaces = places
    .sort((a, b) => {
      let priorDate = new Date(new Date().setDate(new Date().getDate() - 30))
        .toISOString()
        .split("T")[0];
      let aPlaceStats = placesRecommendationStats[a.place_id];
      let aRatingHistoryDates = Object.keys(aPlaceStats.ratingHistory)
        .sort()
        .reverse();
      let aPriorDate =
        aRatingHistoryDates.find((d) => d >= priorDate) ||
        aRatingHistoryDates[0];
      let bPlaceStats = placesRecommendationStats[b.place_id];
      let bRatingHistoryDates = Object.keys(bPlaceStats.ratingHistory)
        .sort()
        .reverse();
      let bPriorDate =
        bRatingHistoryDates.find((d) => d >= priorDate) ||
        bRatingHistoryDates[0];
      let currentDate = aRatingHistoryDates.slice(-1)[0];
      let aRatingDiff =
        aPlaceStats.ratingHistory[currentDate] -
        aPlaceStats.ratingHistory[aPriorDate];
      let bRatingDiff =
        aPlaceStats.ratingHistory[currentDate] -
        bPlaceStats.ratingHistory[bPriorDate];
      return bRatingDiff - aRatingDiff;
    })
    .slice(0, 20);
  upPlaces.forEach((place) => {
    placesRecommendationStats[place.place_id].showOnNew = false;
  });
  updateSectionInfo("up", upPlaces.slice(0, 20));
}

function updatePopularSectionInfo(user, preferences, places) {
  let popularPlaces = places.slice(0, 20);
  popularPlaces.forEach((place) => {
    placesRecommendationStats[place.place_id].showOnNew = false;
  });
  updateSectionInfo("popular", popularPlaces);
}

function updateNewSectionInfo(user, preferences, places) {
  let date = new Date().toISOString().split("T")[0];
  let newPlaces = places
    .filter((place) => {
      return (
        placesRecommendationStats[place.place_id].showOnNew === true ||
        placesRecommendationStats[place.place_id].showOnNew === date
      );
    })
    .slice(0, 20);
  newPlaces.forEach((place) => {
    placesRecommendationStats[place.place_id].showOnNew = date;
  });
  updateSectionInfo("new", newPlaces);
}

function updateSectionInfo(section, places) {
  let html = "";
  let template = `
  <a class="place" href="#" data-place_id="{place_id}">
    <div class="place-category">
      <div class="place-category-icon"><img src="{iconurl}" alt="{categoryname}"></div>
      <div class="place-category-name">{categoryname}</div>
    </div>
    <div class="place-info">
      <div class="place-name">{placename}</div>
      <div class="place-address">{placeaddress}</div>
      <div class="place-description">Nivel de precio: {pricelevel}</div>
      <div class="place-description">Nº de valoraciones: {ratingstotal}</div>
      <div class="place-score">{rating}</div>
    </div>
  </a>`;
  places.forEach((place) => {
    let scoreHtml = "";
    let intScore = parseInt(place.rating);
    for (let i = 0; i < intScore; i++) {
      scoreHtml += '<span class="star on"></span>';
    }
    if (place.rating - intScore >= 0.5)
      scoreHtml += '<span class="star half"></span>';
    for (let i = Math.round(place.rating); i < 5; i++) {
      scoreHtml += '<span class="star"></span>';
    }
    scoreHtml += ` (${place.rating})`;
    let placeHtml = template
      .replace("{place_id}", place.place_id)
      .replace("{iconurl}", place.icon)
      .replace(/{categoryname}/g, place.category)
      .replace("{placename}", place.name)
      .replace("{placeaddress}", place.vicinity)
      .replace("{pricelevel}", priceLevels[place.price_level] || "Desconocido")
      .replace("{ratingstotal}", place.user_ratings_total)
      .replace("{rating}", scoreHtml);
    html += placeHtml;
  });
  document.getElementById(section).innerHTML = html;
}

function initMap() {
  const defaultLocation = { lat: 28.1235, lng: -15.4363 }; // Coordenadas de Las Palmas GC
  map = new google.maps.Map(document.getElementById("map"), {
    center: defaultLocation,
    zoom: 12,
  });
  service = new google.maps.places.PlacesService(map);
  infowindow = new google.maps.InfoWindow();
  geocoder = new google.maps.Geocoder();
}