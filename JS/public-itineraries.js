import { auth, db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import{addFavoriteItinerary} from './addFavorite.js'
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { deleteFavoriteId } from './deleteFavorite.js';
import { addItineraryReview, getItineraryRating, getItineraryReviews, drawReviews } from './itinerariesReviewsUtils.js';

let allItineraries = []; //Para la barra de búsqueda

async function loadItineraries() {
  const itinerariesContainer = document.getElementById("itineraries-container");
  itinerariesContainer.innerHTML = "";
  let currentItinerary;

  //Contenedor de itinerarios
  const itinerariesSnapshot = await getDocs(collection(db, "publicItineraries"));
  allItineraries = itinerariesSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  renderItineraries(allItineraries);


  document.querySelector(".popup-close").addEventListener("click", () => {
    document.querySelector(".popup").classList.remove("show");
  });
}

document.addEventListener("DOMContentLoaded", loadItineraries);


async function updateFavoriteButtonState(user, itineraryId, favoriteBtn) {
  const favoritesRef = collection(db, "users", user.uid, "favorites");
  const favoritesSnapshot = await getDocs(favoritesRef);
  let isFavorite = false;
  let userDocFavoriteRef = null;

  favoritesSnapshot.forEach(doc => {
    if (doc.data().itineraryRef === itineraryId) {
      isFavorite = true;
      userDocFavoriteRef = doc.id;
    }
  });

  if (isFavorite) {
    favoriteBtn.textContent = "Eliminar de favoritos";
    favoriteBtn.onclick = async () => {
      await deleteFavoriteId(userDocFavoriteRef);
      await updateFavoriteButtonState(user, itineraryId, favoriteBtn); // 🔁 recarga el botón
    };
  } else {
    favoriteBtn.textContent = "Añadir a favoritos";
    favoriteBtn.onclick = async () => {
      await addFavoriteItinerary(itineraryId);
      await updateFavoriteButtonState(user, itineraryId, favoriteBtn); // 🔁 recarga el botón
    };
  }
}


function renderItineraries(itinerariesList) {
  const itinerariesContainer = document.getElementById("itineraries-container");
  itinerariesContainer.innerHTML = "";

  itinerariesList.forEach(itineraryData => {
    const itineraryDiv = document.createElement("div");
    itineraryDiv.classList.add("itinerary-item");

    const img = document.createElement("img");
    img.src = itineraryData.photo;
    img.alt = itineraryData.title;
    img.style.cursor = "pointer";
    img.classList.add("itinerary-image");

    img.addEventListener("click", () => showPopup(itineraryData)); // nueva función

    const name = document.createElement("span");
    name.textContent = itineraryData.title;
    name.classList.add("itinerary-name");

    itineraryDiv.appendChild(img);
    itineraryDiv.appendChild(name);
    itinerariesContainer.appendChild(itineraryDiv);
  });
}

document.getElementById("search-itinerary").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase();
  const filtered = allItineraries.filter(itin =>
    itin.title.toLowerCase().includes(query)
  );
  renderItineraries(filtered);
});

document.querySelector('.popup-show-reviews').addEventListener('click',e=>{
  if (e.target.dataset.active==1) {
    e.target.textContent = 'Mostrar reseñas';
    document.querySelector('#popup-reviews').classList.add('popup-hidden');
    document.querySelector('#popup-days').classList.remove('popup-hidden');
    e.target.dataset.active = 0;
    return;
  }
  getItineraryReviews(e.target.dataset.itineraryId).then(reviews => {
    drawReviews(reviews);
    e.target.textContent = 'Mostrar itinerario';
    document.querySelector('#popup-reviews').classList.remove('popup-hidden');
    document.querySelector('#popup-days').classList.add('popup-hidden');
    e.target.dataset.active = 1;
  });
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
    });
  });
})

async function showPopup(itineraryData) {
  const popupDaysContainer = document.getElementById("popup-days");
  popupDaysContainer.innerHTML = "";
  popupDaysContainer.classList.remove('popup-hidden');
  document.querySelector('#popup-reviews').classList.add('popup-hidden');
  document.querySelector('.new-review').dataset.itineraryId =  document.querySelector('.popup-show-reviews').dataset.itineraryId = itineraryData.id;
  document.querySelector(".popup-title").textContent = itineraryData.title;

  const daysRef = collection(db, "publicItineraries", itineraryData.id, "days");
  const daysData = await getDocs(daysRef);
  const rating = await getItineraryRating(itineraryData.id);
  let totalPrice = 0;
  let firstPlaceForMap = null;

  daysData.forEach(dayDoc => {
    const dayData = dayDoc.data();

    const dayContainer = document.createElement("div");
    dayContainer.classList.add("popup-day");

    const dayTitle = document.createElement("h3");
    dayTitle.textContent = dayData.name || dayDoc.id;
    dayContainer.appendChild(dayTitle);

    dayData.places.forEach(place => {
      const placeContainer = document.createElement("div");
      placeContainer.classList.add("popup-place");

      if (!firstPlaceForMap) firstPlaceForMap = place;

      const favoriteBtn = document.querySelector(".popup-favorite");

      onAuthStateChanged(auth, async user => {
        if (user) {
          await updateFavoriteButtonState(user, itineraryData.id, favoriteBtn);
        } else {
          favoriteBtn.textContent = "Inicia sesión para guardar";
          favoriteBtn.disabled = true;
          favoriteBtn.onclick = null;
        }
      });

      const img = document.createElement("img");
      img.src = place.photo;
      img.alt = place.name;
      placeContainer.appendChild(img);

      totalPrice += place.price || 0;

      const info = document.createElement("div");
      info.innerHTML = `
        <strong>${place.name}</strong><br>
        Dirección: ${place.address}<br>
        Categoría: ${place.category}<br>
        Precio: ${place.price} €<br>
        Rating: ${place.rating} ★
      `;
      placeContainer.appendChild(info);
      dayContainer.appendChild(placeContainer);
    });

    popupDaysContainer.appendChild(dayContainer);
  });

  const mapContainer = document.getElementById("popup-map");
  const address = encodeURIComponent(firstPlaceForMap.address);
  mapContainer.innerHTML = `
    <iframe
      width="100%"
      height="100%"
      frameborder="0"
      style="border:0"
      src="https://www.google.com/maps?q=${address}&output=embed"
      allowfullscreen>
    </iframe>
  `;

  document.getElementById("total-price").textContent = `Costo total: ${totalPrice}€`;
  document.querySelector('.popup-rating-value').textContent = parseFloat(rating.averageRating||0).toFixed(2).replace(/(\.[1-9]?)0+$/,'$1').replace(/\.$/,'');
  document.querySelector('.popup-rating-count').textContent = rating.ratingCount||0;
  document.querySelector(".popup").classList.add("show");
}
