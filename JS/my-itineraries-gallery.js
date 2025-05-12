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
  const preview = document.importNode(card.content, true)
    .querySelector(".preview");

  const wrapper = document.createElement("div");
  wrapper.classList.add("itinerary-gallery-card"); // Aquí aplicamos el estilo de tarjeta
  wrapper.appendChild(preview); // Insertamos el .preview dentro del wrapper

  const intro = preview.querySelector(".intro");
  intro.src = plan.photo;
  intro.alt = plan.title;
  preview.querySelector(".title").innerText = plan.title;
  preview.querySelector(".description").innerText = plan.description;
  wrapper.id = plan.title;

  return wrapper; // Devolvemos el contenedor completo
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
    document.querySelector(".switch-view").addEventListener("click", () => {
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

