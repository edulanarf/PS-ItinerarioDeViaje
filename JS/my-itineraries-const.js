export const itineraries = {};
export let currentItinerary = "";
export function currentItineraryPlan(){
  return itineraries[currentItinerary];
}

