import { ItineraryPlan } from "./types.js";
export const itineraries = {};
export let currentItinerary = "";
export const template = document.getElementById("itinerary-container");
export const dayButton = document.getElementById("day-button");

/**
 *
 * @returns {ItineraryPlan}
 */
export function currentItineraryPlan(){
  return itineraries[currentItinerary];
}

export function getPlanFromMyItineraries(itinerary_name){
  return itineraries[itinerary_name];
}

export const list = document.getElementById("itinerary-list-container")

export function setCurrent(curr){
  currentItinerary = curr;
  return currentItinerary;
}


// query parameters
export const SHARED = "shared"
export const MINE = "my"