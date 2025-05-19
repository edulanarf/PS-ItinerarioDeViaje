export const modal = document.getElementById('modal');
export const closeBtn = document.querySelector('.close-button');

export function showModal() {
  modal.classList.remove('hidden');
}

export function hideModal(){
  modal.classList.add('hidden');
}


const loader = document.getElementById("loading");

// Mostrar el loader
export function showLoader(){
  loader.classList.remove("hidden");
}

export function hideLoader(){
  loader.classList.add("hidden");
}
