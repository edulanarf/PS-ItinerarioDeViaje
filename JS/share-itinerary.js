import { getUsers, shareThisItineraryTo } from "./firebase-config.js";
import { currentItineraryPlan } from "./my-itineraries-const.js";

const modal = document.getElementById('modal');
const openBtn = document.getElementById('share-itinerary');
const closeBtn = document.querySelector('.close-button');
const form = document.getElementById('names-form');
const namesContainer = document.querySelector('.name-group');
const addNameButton = document.getElementById('add-name');
const nameInputTemplate = document.getElementById('name-input-container');
const errorMessage = document.createElement('p'); // Mensaje de error

// Agregar el mensaje de error al contenedor
errorMessage.style.color = 'red';
errorMessage.style.display = 'none';
form.insertBefore(errorMessage, addNameButton);

// Abrir el modal
openBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
});

// Cerrar el modal
closeBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Agregar un nuevo textarea
addNameButton.addEventListener('click', (e) => {
  e.preventDefault();
  // Limpiar mensaje de error al iniciar la validación
  errorMessage.style.display = 'none';
  const clone = document.importNode(nameInputTemplate.content, true).querySelector("div");

  // Crear el botón para eliminar este textarea
  const removeButton = clone.querySelector('button');

  // Cuando el botón "Remove" sea presionado, eliminar el textarea y el botón
  removeButton.addEventListener('click', () => {
    namesContainer.removeChild(clone);
    // Limpiar mensaje de error al iniciar la validación
    errorMessage.style.display = 'none';
  });

  // Agregar los elementos al contenedor
  namesContainer.appendChild(clone);
});




// Al enviar el formulario
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameInputs = document.querySelectorAll('.name-input');
  const names = [];
  let isValid = true;  // Variable para validar si hay algún campo vacío

  // Limpiar mensaje de error al iniciar la validación
  errorMessage.style.display = 'none';

  // Obtener los valores de todos los textareas
  nameInputs.forEach(input => {
    const name = input.value.trim();
    if (name.length > 0) {
      names.push(name);
    } else {
      isValid = false; // Si algún textarea está vacío, es inválido
    }
  });

  // Validación: Si hay algún campo vacío
  if (!isValid) {
    errorMessage.style.display = 'block';
    errorMessage.textContent = 'Please fill in all the fields or delete the empty ones.';
  } else {
    console.log('Nombres ingresados:', names);

    await getUsers(names).then(users => {
      console.log(users);
      if (users.notFound.length > 0) {
        errorMessage.style.display = "block";
        errorMessage.textContent = "the following users were not found: " + users.notFound.join(", ") + ".";
        return;
      }
      users.foundUserIds.forEach(userId => {
        shareThisItineraryTo(userId, currentItineraryPlan())
      })
    })


    // Cerrar modal
    modal.classList.add('hidden');

    // Limpiar los textareas
    nameInputs.forEach(input => input.value = '');
  }
});
