import { ItineraryPlan } from './types.js';
import {itineraries, currentItinerary, list } from './my-itineraries-const.js';

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
    .querySelector(".itinerary-gallery-card")
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

export async function galleryView() {
  console.log("gallery of:", itineraries);
  console.log("current:", currentItinerary);

  await Promise.all(
    Object.values(itineraries).map(async (itinerary) => {
      if (itinerary instanceof ItineraryPlan) {
        const container = await renderItineraryCard(itinerary);
        await appendItineraryCard(container);
      }
    })
  ).then(() => {
    document.getElementById("switch-view").addEventListener("click", () => {
      const nextItineraryButton = document.getElementById('next-itinerary');
      const previousItineraryButton = document.getElementById('previous-itinerary');
      if (view === "list") {
        list.style.display = "none";
        gallery.style.display = "grid";

        nextItineraryButton.style.display = "none";
        previousItineraryButton.style.display = "none";
        view = "gallery";
      } else {
        list.style.display = "contents";
        gallery.style.display = "none";

        nextItineraryButton.style.display = "flex";
        previousItineraryButton.style.display = "flex";
        view = "list";
      }
    });
  });
}

