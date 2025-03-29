import {auth, getUserItineraries} from "./firebase-config.js"
import { onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { Itinerary } from "./types.js"

const main = document.querySelector("main")
const template = document.querySelector("template");
let session = null
const itineraries = {}

console.log("start");

onAuthStateChanged(auth, (user) => {
  if (user) {
    session = user
    init(user).then(() => console.log("changed, and finished"))
  }
  else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html"
  }
});

async function init(user) {
  await getUserItineraries(user.uid).then(data => {
    console.log("someone")
    console.log(user.uid)
    console.log(data)
    if (Array.isArray(data) &&
      data.length > 0 &&
      data.every(item => item instanceof Itinerary)) {
      data.forEach((it) => {
        console.log(it);
        itineraries[it.name] = it
      });
    }
  }).catch(err => console.error(err))
  console.log(itineraries);
  let currentItinerary = Object.keys(itineraries).at(0);
  console.log("current: " + currentItinerary);
  renderAllItineraries(itineraries).then(_ => {
    console.log("all rendered");
    showItinerary(currentItinerary, currentItinerary).then(_=>console.log("showed"));
    document.getElementById("next-itinerary").addEventListener('click', () => {
      console.log("showing next");
      nextItinerary(currentItinerary).then(data => {currentItinerary = data});
    })
    document.getElementById("previous-itinerary").addEventListener('click', () => {
      console.log("showing previous");
      previousItinerary(currentItinerary).then(data => {currentItinerary = data});

    })
  });
}



async function showItinerary(before, after){
  document.getElementById(before).style.display = "none";
  document.getElementById(after).style.display = "grid";
  //my-itineraries class is a grid display
  console.log("switch:" + before + " - " + after);
}

async function nextItinerary(current) {
  let next = document.getElementById(current).nextElementSibling || main.firstElementChild.nextElementSibling;
  next = next.id
  await showItinerary(current, next)
  return next
}

async function previousItinerary(current) {
  let previous = document.getElementById(current).previousElementSibling.id || main.lastElementChild.id;
  await showItinerary(current, previous)
  return previous
}

/**
 * @param {Itinerary[]} itineraries
 * @returns {Promise<void>}
 */
async function renderAllItineraries(itineraries) {
  await Promise.all(
    Object.values(itineraries).map(async (itinerary) => {
      const container = await renderItinerary(itinerary);
      await appendItinerary(container);
    })
  );
}



async function renderItinerary(itinerary) {
  const container = document.importNode(template.content, true)
    .querySelector(".my-itineraries")
  const intro = container.querySelector(".intro");
  intro.src = itinerary.places.at(0).photo
  intro.alt = itinerary.places.at(0).name
  container.querySelector(".title").innerText = itinerary.name
  const places = container.querySelector(".places")
  itinerary.places.forEach(place => {
    let li = document.createElement("li")
    li.innerText = place.toString()
    places.appendChild(li)
  })
  container.id = itinerary.name
  container.style.display = "none"
  console.log("container", itinerary.name, container);
  return container
}

async function appendItinerary(container) {
  let exist = document.getElementById(container.id)
  if (exist) {
    main.replaceChild(container, exist)
    console.log("replacing", exist.id);
  } else {
    main.appendChild(container)
    console.log("adding", container.id);
  }
}


/**
 *
 * @param itinerary
 * @param previousName
 * @returns {Promise<void>}
 */
async function renderModified(itinerary, previousName){
  let old;
  if (previousName) {
    old = document.getElementById(previousName)
  } else {
    old = document.getElementById(itinerary.name)
  }
  main.replaceChild(await renderItinerary(itinerary),old)
}