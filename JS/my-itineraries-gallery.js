import { ItineraryPlan } from './types.js';
import {itineraries, currentItinerary, list } from './my-itineraries.js';

let gallery = document.getElementById("itinerary-gallery-container");
gallery.style.display = "none";
const card = document.getElementById("itinerary-card");
let view = "list"

/**
 * @param {ItineraryPlan} plan
 * @returns {Promise<Element>}
 */
async function renderItineraryCard(plan) {
  const container = document.importNode(card.content, true)
    .querySelector(".preview")
  const intro = container.querySelector(".intro");
  intro.src = plan.photo
  intro.alt = plan.title
  container.querySelector(".title").innerText = plan.title
  container.id = plan.title
  return container
}

async function appendItineraryCard(container) {
  gallery.appendChild(container);
}

export async function galleryView(){
  console.log("gallery of:",itineraries);
  console.log("current:", currentItinerary);
  await Promise.all(
    Object.values(itineraries).map(async (itinerary) => {
      if (itinerary instanceof ItineraryPlan){
        const container = await renderItineraryCard(itinerary);
        await appendItineraryCard(container);
      }
    })
  ).then(() => {
    document.querySelector(".switch-view").addEventListener("click", () => {
      if (view === "list"){
        list.style.display = "none";
        gallery.style.display = "grid";
        view = "gallery"
      } else {
        list.style.display = "contents";
        gallery.style.display = "none";
        view = "list"
      }
    })
  });
}

