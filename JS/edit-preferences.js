import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";
import { request } from "/JS/places.js";
import { priceLevels } from "/JS/price-levels.js";
import { auth, db } from "./firebase-config.js";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
  } else {
    console.log("not authenticated!!!!");
    window.location.href = "../HTML/user-login.html";
  }
});