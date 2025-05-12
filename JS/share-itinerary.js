import { auth, db, deleteAllDocumentsInCollection, getUsers } from "./firebase-config.js";
import { currentItineraryPlan } from "./my-itineraries-const.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { Itinerary, ItineraryPlan } from "./types.js";

const modal = document.getElementById('modal');
const openBtn = document.getElementById('share-itinerary');
const closeBtn = document.querySelector('.close-button');
const form = document.getElementById('names-form');
const namesContainer = document.querySelector('.name-group');
const addNameButton = document.getElementById('add-name');
const nameInputTemplate = document.getElementById('name-input-container');
const errorMessage = document.createElement('p'); // Mensaje de error
const successMessage = document.createElement('p') // mensaje de exito

// Agregar el mensaje de error al contenedor
errorMessage.style.color = 'red';
errorMessage.style.display = 'none';
successMessage.style.color = 'green';
successMessage.style.display = 'none';
form.insertBefore(errorMessage, addNameButton);
form.insertBefore(successMessage, errorMessage);

// Abrir el modal
openBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

// Cerrar el modal
closeBtn.addEventListener('click', () => {
  closeModal()
});

function closeModal(){
  errorMessage.display = 'none';
  successMessage.display = 'none';
  modal.classList.add('hidden');
  let names = document.querySelectorAll('.name-input-container');
  names[0].querySelector('.name-input').value = '';
  for (let i = 1; i < names.length; i++) names[i].remove();
}

// Agregar un nuevo textarea
addNameButton.addEventListener('click', (e) => {
  e.preventDefault();
  // Limpiar mensaje de error al iniciar la validación
  errorMessage.style.display = 'none';
  const nameElement = document.importNode(nameInputTemplate.content, true).querySelector("div");

  // Crear el botón para eliminar este textarea
  const removeButton = nameElement.querySelector('button');

  // Cuando el botón "Remove" sea presionado, eliminar el textarea y el botón
  removeButton.addEventListener('click', () => {
    namesContainer.removeChild(nameElement);
    // Limpiar mensaje de error al iniciar la validación
    errorMessage.style.display = 'none';
  });

  // Agregar los elementos al contenedor
  namesContainer.appendChild(nameElement);
});




// Al enviar el formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameInputs = document.querySelectorAll('.name-input');
  const names = [];
  let isValid = true;  // Variable para validar si hay algún campo vacío



  // Obtener los valores de todos los textareas
  nameInputs.forEach(input => {
    const name = input.value.trim();
    if (name.length > 0) {
      names.push(name);
    } else {
      isValid = false; // Si algún textarea está vacío o menor a 6, es inválido
    }
  });

  if (!isValid) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Please fill in all the fields or delete the empty ones.'
  }

  console.log('Nombres ingresados:', names);
  let itineraryPlan = currentItineraryPlan();
  await getUsers(names).then( async (users) => {
    console.log(users);

    //checking errors
    let coincidences = Object.fromEntries(
      Object.entries(users.foundUserIds)
        .filter(([_, valor]) => itineraryPlan.sharedWith.includes(valor))
    );
    if (users.notFound.length > 0) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "the following users were not found: " + users.notFound.join(", ") + ".";
      return;
    } else if (Object.entries(coincidences).length > 0) {
      errorMessage.style.display = "block";
      errorMessage.textContent = "you already shared this itinerary with: " + Object.keys(coincidences).join(", ") + ".";
      return;
    }

    // Limpiar mensaje de error al iniciar la validación
    errorMessage.style.display = 'none';
    // proceed to share
    await Promise.all(
      Object.values(users.foundUserIds).map(userId => shareThisItineraryTo(userId, itineraryPlan))
    );
    await setDoc(doc(db, "users", auth.currentUser.uid, "itineraries", itineraryPlan.id).withConverter(ItineraryPlan.Converter),
      {
        ...itineraryPlan,
        sharedWith: [...itineraryPlan.sharedWith, ...Object.values(users.foundUserIds)]
      }
    )
    console.log("itinerary sharedWith:", itineraryPlan.id,":", itineraryPlan.title,"to",users.foundUserIds);
    successMessage.textContent = "Itinerary shared successfully"
    successMessage.style.display = 'block';
    setTimeout(closeModal,2000)
  })

});


async function shareThisItineraryTo(userId, itineraryPlan) {
  const itineraryRef = doc(db, "users", userId, "shared", itineraryPlan.id).withConverter(ItineraryPlan.Converter)
  await setDoc(itineraryRef, itineraryPlan)
    .then(async ()=> {
      await deleteAllDocumentsInCollection(`users/${userId}/shared/${itineraryPlan.id}/days`)
      console.log("shared:", itineraryPlan.id,":", itineraryPlan.title,"to",userId);
    })
    .then(async () => {
      await Promise.all(
        itineraryPlan.itineraries.map(itinerary => {
          console.log(itinerary, Itinerary.toFirestore(itinerary));
          const dayRef = doc(itineraryRef, "days", itinerary.name).withConverter(Itinerary.Converter);
          return setDoc(dayRef, itinerary);
        })
      ).then(()=> console.log("shared days of", itineraryPlan.id,":", itineraryPlan.title,"to",userId))
    })

}