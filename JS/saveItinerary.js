import{getItineraryData} from "./search-places.js";

//Guardar itinerario
const save = document.getElementById("save-itinerary");
save.addEventListener('click', function() {
  const itineraryData = getItineraryData();
  console.log(itineraryData.listNames);
  console.log(itineraryData.listPhoto);
  console.log(itineraryData.listPrice);
  console.log(itineraryData.listRating);
  console.log(itineraryData.listAddress);
  console.log(itineraryData.listDates);
  console.log(itineraryData.listCategories);
});