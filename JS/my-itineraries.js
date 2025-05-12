import { auth, db, getPlans, storage } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { ItineraryPlan } from './types.js';
import { galleryView } from './my-itineraries-gallery.js';
import { verRutaBtn } from './rutas.js';
import { getDownloadURL, ref, uploadBytes } from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-storage.js';
import {
  collection,
  deleteDoc,
  doc,
  getDoc, getDocs,
  updateDoc
} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js';
import { shareItinerary } from './shareItinerary.js';

export const list = document.getElementById("itinerary-list-container")
const template = document.getElementById("itinerary-container");
const dayButton = document.getElementById("day-button");
let session = null;

export const itineraries = {};
export let currentItinerary = "";
let currentDay = "";
export let currentRoutes;
let currentItineraryTitle;
let currentItineraryPhoto;

onAuthStateChanged(auth, (user) => {
  if (user) {
    session = user;
    init(user).then(() => {
      listView().then(() => console.log("list ready"));
      galleryView().then(() => console.log("gallery ready"));
    }).then(() => console.log("changed, and finished"));
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});

function switchDay(container, day) {
  container.querySelector(`ul[data-day="${currentDay}"]`).style.display = 'none';
  container.querySelector(`button[data-day="${currentDay}"]`).classList.replace('up', 'down');
  currentDay = day.innerText;
  container.querySelector(`ul[data-day="${currentDay}"]`).style.display = 'block';
  container.querySelector(`button[data-day="${currentDay}"]`).classList.replace('down', 'up');
}

function addDaysListeners() {
  Object.values(itineraries).forEach(itinerary => {
    const container = document.querySelector(`[data-name="${itinerary.title}"][data-type=list]`);
    const days = container.querySelector('.days').querySelectorAll(".day-button");
    days.forEach(day => {
      day.addEventListener("click", (_) => switchDay(container, day));
    });
  });
}

function nextDay() {
  let it = document.querySelector(`[data-name="${currentItinerary}"][data-type=list]`);
  switchDay(it,
    it.querySelector(`button[data-day="${currentDay}"]`).nextElementSibling ||
    it.querySelector(".days").firstElementChild
  );
}

function prevDay() {
  let it = document.querySelector(`[data-name="${currentItinerary}"][data-type=list]`);
  switchDay(it,
    it.querySelector(`button[data-day="${currentDay}"]`).previousElementSibling ||
    it.querySelector(".days").lastElementChild
  );
}

async function listView() {
  currentDay = Object.values(itineraries).at(0).itineraries.at(0).name;
  currentRoutes = Object.values(itineraries).at(0);
  renderAllItineraries(itineraries)
    .then(_ => {
      showItinerary(currentItinerary, currentItinerary).then(_ => console.log('showed'));
    })
    .then(() => {
      document.getElementById('next-itinerary').addEventListener('click', () => {
        nextItinerary(currentItinerary).then(data => currentItinerary = data);
      });
      document.getElementById('previous-itinerary').addEventListener('click', () => {
        previousItinerary(currentItinerary).then(data => currentItinerary = data);
      });
      addDaysListeners();
      document.addEventListener('keydown', (event) => {
        switch (event.key) {
          case 'ArrowDown': nextDay(); break;
          case 'ArrowUp': prevDay(); break;
          case 'ArrowLeft': previousItinerary(currentItinerary).then(data => currentItinerary = data); break;
          case 'ArrowRight': nextItinerary(currentItinerary).then(data => currentItinerary = data); break;
        }
      });
    });
}

async function init(user) {
  await getPlans(user.uid).then(data => {
    data.forEach((it) => {
      itineraries[it.title] = it;
    });
  }).catch(err => console.error(err)).then(() => currentItinerary = Object.keys(itineraries).at(0));
}

async function showItinerary(before, after){
  const scrollY = window.scrollY;
  let from = document.querySelector(`[data-name="${before}"][data-type=list]`);
  from.classList.remove("visible");
  from.style.display = "none";
  from.querySelector(`ul[data-day="${currentDay}"]`).style.display = "none";
  from.querySelector(`button[data-day="${currentDay}"]`).classList.replace("up", "down");

  let to = document.querySelector(`[data-name="${after}"][data-type=list]`);
  to.classList.add("visible");
  currentDay = itineraries[before].itineraries.at(0).name;
  currentRoutes = itineraries[after].itineraries;

  to.querySelector(`ul[data-day="${currentDay}"]`).style.display = "block";
  to.querySelector(`button[data-day="${currentDay}"]`).classList.replace("down", "up");

  let buttonGroup = to.querySelector(".button-group") || document.createElement("div");
  buttonGroup.classList.add("button-group");
  to.appendChild(buttonGroup);
  buttonGroup.innerHTML = "";
  buttonGroup.appendChild(verRutaBtn);

  const shareButton = document.createElement("button");
  shareButton.innerText = "publicar";
  shareButton.classList.add("publicar");
  shareButton.style.cursor = "pointer";



  const currentContainer = document.querySelector(".my-itineraries.visible");
  currentItineraryTitle = currentContainer.dataset.name;
  const itineraryDocRef = doc(db, `users/${session.uid}/itineraries/${currentItineraryTitle}`);
  const itinerarySnapshot = await getDoc(itineraryDocRef);
  const itineraryData = itinerarySnapshot.data()

  if(itineraryData.published){
    shareButton.innerText = "Publicado";
    shareButton.addEventListener("click", async () => {
      const currentContainer = document.querySelector(".my-itineraries[style='display: grid;']");
      currentItineraryTitle = currentContainer.dataset.name;
      const itinerary = itineraries[currentItineraryTitle];
      const itineraryDocRef = doc(db, `users/${session.uid}/itineraries/${itinerary.title}`);
      const itineraryPhotoRef = await getDoc(itineraryDocRef);
      const currentItineraryPublishedRef = itineraryPhotoRef.data().publishedRef;
      deleteDoc(currentItineraryPublishedRef);

      const daysCollectionRef = collection(db, `publicItineraries/${currentItineraryPublishedRef.id}/days`);
      const daysSnapshot = await getDocs(daysCollectionRef);
      const daysDeletePromises = daysSnapshot.docs.map(async doc => await deleteDoc(doc.ref));
      await Promise.all(daysDeletePromises);

      await updateDoc(itineraryDocRef, {
        published:false
      })
      window.location.reload();
    });
  } else {
    shareButton.innerText = "publicar";
    shareButton.addEventListener("click", async () => {
      const currentContainer = document.querySelector(".my-itineraries[style='display: grid;']");
      currentItineraryTitle = currentContainer.dataset.name;
      const itinerary = itineraries[currentItineraryTitle];
      const itineraryDocRef = doc(db, `users/${session.uid}/itineraries/${itinerary.title}`);
      const itineraryPhotoRef = await getDoc(itineraryDocRef);
      currentItineraryPhoto = itineraryPhotoRef.data().photo;
      await shareItinerary(currentRoutes, currentItineraryTitle, currentItineraryPhoto);
      window.location.reload();
    });
  }

  buttonGroup.appendChild(shareButton);

  to.style.display = "grid";
  window.scrollTo(0, scrollY); //Para cada vez q se renderiza el contenido
}

async function nextItinerary(current) {
  let next = document.querySelector(`[data-name="${current}"][data-type=list]`).nextElementSibling || list.firstElementChild;
  next = next.dataset.name;
  await showItinerary(current, next);
  return next;
}

async function previousItinerary(current) {
  let previous = document.querySelector(`[data-name="${current}"][data-type=list]`).previousElementSibling || list.lastElementChild;
  previous = previous.dataset.name;
  await showItinerary(current, previous);
  return previous;
}

async function renderAllItineraries(itineraries) {
  await Promise.all(
    Object.values(itineraries).map(async (itinerary) => {
      if (itinerary instanceof ItineraryPlan){
        const container = await renderItinerary(itinerary);
        await appendItinerary(container);
      }
    })
  );
}

async function renderDay(itinerary, daysContainer, listContainer) {
  let button = await document.importNode(dayButton.content, true).querySelector('button');
  button.innerText = itinerary.name;
  button.dataset.day = itinerary.name;
  await daysContainer.appendChild(button);
  let ul = document.createElement('ul');
  ul.className = 'places';
  ul.dataset.day = itinerary.name;
  await Promise.all(itinerary.places.map(async place => {
    let li = document.createElement('li');
    li.innerText = place.toString();
    await ul.appendChild(li);
  }));
  ul.style.display = 'none';
  await listContainer.appendChild(ul);
}

async function renderItinerary(plan) {
  const container = document.importNode(template.content, true).querySelector(".my-itineraries");
  const intro = container.querySelector(".intro");
  intro.src = plan.photo;
  intro.alt = plan.title;
  intro.style.cursor = "pointer";

  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.style.display = "none";

  inputFile.addEventListener("change", async (event) => {
    const file = event.target.files[0];
    if (file) {
      const currentContainer = document.querySelector(".my-itineraries[style='display: grid;']");
      const itineraryName = currentContainer.dataset.name;
      const itinerary = itineraries[itineraryName];

      const storageRef = ref(storage, `Users/${session.uid}/itineraries/${itinerary.title}/photo.jpg`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      const itineraryDocRef = doc(db, `users/${session.uid}/itineraries/${itinerary.title}`);
      await updateDoc(itineraryDocRef, { photo: photoURL });
      intro.src = photoURL;
    }
  });


  const deleteButton = container.querySelector('.delete-itinerary');
  if (deleteButton) {
    deleteButton.addEventListener('click', async () => {
      const confirmDelete = confirm(`¿Estás seguro de eliminar el itinerario "${plan.title}"?`);
      if (confirmDelete) {
        try {
          // Eliminar de Firestore
          const itineraryDocRef = doc(db, `users/${session.uid}/itineraries/${plan.title}`);
          await deleteDoc(itineraryDocRef);

          const itineraryDaysDocRef = collection(db, `users/${session.uid}/itineraries/${plan.title}/days`);
          const daysSnapshot = await getDocs(itineraryDaysDocRef);
          for (const dayDoc of daysSnapshot.docs) {
            await deleteDoc(dayDoc.ref);
          }

          // Eliminar del DOM
          container.remove();

          // Eliminar de la variable en memoria
          delete itineraries[plan.title];

          console.log(`Itinerario "${plan.title}" eliminado correctamente.`);
          window.location.reload();
        } catch (error) {
          console.error("Error al eliminar el itinerario:", error);
        }
      }
    });
  }

  intro.addEventListener("click", () => inputFile.click());

  container.querySelector(".title").innerText = plan.title;
  const listContainer = container.querySelector(".list-container");
  const daysContainer = container.querySelector(".days");

  for (const itinerary of plan.itineraries) {
    await renderDay(itinerary, daysContainer, listContainer);
  }

  container.dataset.name = plan.title;
  container.style.display = "none";

  if(plan.description != null){
    container.querySelector(".description").innerHTML  = plan.description;
  }

  return container;
}

async function appendItinerary(container) {
  let exist = document.querySelector(`[data-name="${container.dataset.name}"][data-type=list]`);
  if (exist) {
    list.replaceChild(container, exist);
  } else {
    list.appendChild(container);
  }
}


