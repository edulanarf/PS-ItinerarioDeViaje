import {auth, getUserItineraries} from "./firebase-config.js"
import { onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js';
import { ItineraryPlan } from './types.js';

const main = document.querySelector("main")
const template = document.getElementById("itinerary-container");
const dayButton = document.getElementById("day-button");
let session = null

/**
 * @type {Record<string,ItineraryPlan>}
 */
const itineraries = {}
let currentItinerary = ""
let currentDay = ""

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

function addDaysListeners() {
  Object.values(itineraries).forEach(itinerary => {
    const container = document.getElementById(itinerary.title)
    const days = container.querySelector('.days').querySelectorAll(".day-button")
    days.forEach(day => {day.addEventListener("click", (_) => {
      container.querySelector(`ul[data-day="${currentDay}"]`).style.display = "none"
      currentDay = day.innerText
      container.querySelector(`ul[data-day="${currentDay}"]`).style.display = "block"
    })})
  })
}

async function init(user) {
  await getUserItineraries(user.uid).then(data => {
    console.log("someone")
    console.log(user.uid)
    console.log("data")
    console.log(data)
    console.log(data.length);
    // data is an ItineraryPlane[] type
    if (Array.isArray(data) &&
      data.length > 0 &&
      data.every(item => item instanceof ItineraryPlan)
    ) {
      data.forEach((it) => {
        console.log("it");
        console.log(it);
        if (it instanceof ItineraryPlan) {
          itineraries[it.title] = it
          console.log("hi");
          console.log(it);
        }
        console.log("bye");
        console.log(it);
      });
    }
    console.log(data.length);
  }).catch(err => console.error(err)).then(() => {
    console.log(itineraries);
    currentItinerary = Object.keys(itineraries).at(0);
    currentDay = Object.values(itineraries).at(0).itineraries.at(0).name;
    console.log("current: " + currentItinerary);
    renderAllItineraries(itineraries)
      .then(_ => {
        console.log("all rendered");
        showItinerary(currentItinerary, currentItinerary).then(_=>console.log("showed"));
      })
      .then((_) => {
        document.getElementById("next-itinerary").addEventListener('click', () => {
          console.log("showing next");
          nextItinerary(currentItinerary).then(data => {currentItinerary = data});
        })
        document.getElementById("previous-itinerary").addEventListener('click', () => {
          console.log("showing previous");
          previousItinerary(currentItinerary).then(data => {currentItinerary = data});
        })
        addDaysListeners()
      });
  })
}


/**
 *
 * @param {string} before
 * @param {string} after
 * @returns {Promise<void>}
 */
async function showItinerary(before, after){
  console.log(before + "\n" + document.getElementById(before));
  document.getElementById(before).style.display = "none";
  console.log(currentDay);
  console.log(document.getElementById(before));
  console.log(document.getElementById(before).querySelector(`ul[data-day="${currentDay}"]`));
  document.getElementById(before).querySelector(`ul[data-day="${currentDay}"]`).style.display = "none";
  let container = document.getElementById(after)
  // visible day 1
  currentDay = itineraries[before].itineraries.at(0).name
  container.querySelector(`ul[data-day="${currentDay}"]`).style.display = "block"
  // then show
  container.style.display = "grid";
  //my-itineraries class is a grid display
  console.log("switch:" + before + " - " + after + " " + currentDay);
}

async function nextItinerary(current) {
  let next = document.getElementById(current).nextElementSibling || main.firstElementChild;
  next = next.id
  await showItinerary(current, next)
  return next
}

async function previousItinerary(current) {
  let previous = document.getElementById(current).previousElementSibling || main.lastElementChild;
  previous = previous.id
  await showItinerary(current, previous)
  return previous
}


/**
 * @param {Object} itineraries
 * @returns {Promise<void>}
 */
async function renderAllItineraries(itineraries) {
  await Promise.all(
    Object.values(itineraries).map(async (itinerary) => {
      if (itinerary instanceof ItineraryPlan){
        const container = await renderItinerary(itinerary);
        await appendItinerary(container);
        console.log("added one day");
      }
    })
  );
}


async function renderDay(itinerary, daysContainer, listContainer) {
  console.log("day render");
  let button = await document.importNode(dayButton.content, true).querySelector('button');
  button.innerText = itinerary.name;
  await daysContainer.appendChild(button);
  let ul = await document.createElement('ul');
  ul.className = 'places';
  ul.dataset.day = itinerary.name;
  await Promise.all(itinerary.places.map(async place => {
      let li = await document.createElement('li');
      li.innerText = await place.toString();
      await ul.appendChild(li);
    console.log(ul);
    })
  )
  ul.style.display = 'none';
  await listContainer.appendChild(ul);
}

/**
 * @param {ItineraryPlan} plan
 * @returns {Promise<Element>}
 */
async function renderItinerary(plan) {
  const container = document.importNode(template.content, true)
    .querySelector(".my-itineraries")
  const intro = container.querySelector(".intro");
  intro.src = plan.photo
  intro.alt = plan.title
  container.querySelector(".title").innerText = plan.title
  const listContainer = container.querySelector(".list-container")
  console.log(listContainer);
  const daysContainer = container.querySelector(".days");

  console.log("about to render day");
  console.log(plan.itineraries);
  for (const itinerary of plan.itineraries) {
    await renderDay(itinerary, daysContainer, listContainer);
    console.log("finished?");
    console.log(listContainer)
    console.log(itinerary);
  }

  console.log(listContainer);
  container.id = plan.title
  container.style.display = "none"
  console.log("container", plan.title, container);
  console.log(container);
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