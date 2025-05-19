import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    alert("Debes iniciar sesión para gestionar tu plan.");
    window.location.href = "user-login.html";
    return;
  }

  currentUser = user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    console.error("Usuario no encontrado en Firestore.");
    return;
  }

  const data = userSnap.data();
  const plan = data.plan || null;

  const planLabel = document.getElementById("current-plan-label");
  const planNames = {
    basic: "Plan Básico",
    advanced: "Plan Avanzado",
    unlimited: "Plan Ilimitado"
  };

  if (data.premium) {
    planLabel.innerText = `Tu plan actual es: ${planNames[plan] || "Desconocido"}`;
    const activeCard = document.getElementById(`plan-${plan}`);
    if (activeCard) activeCard.classList.add("active");
  } else {
    planLabel.innerText = "No tienes ningún plan premium activo.";
  }
});

// ✅ Redirige siempre a la pasarela de pago con los parámetros necesarios
window.updatePlan = async function (planType) {
  if (!currentUser) return;

  const userRef = doc(db, "users", currentUser.uid);
  const userSnap = await getDoc(userRef);
  const data = userSnap.data();

  const currentPlan = data.premium ? data.plan : null;

  let url = `fake-payment.html?plan=${planType}`;
  if (currentPlan && currentPlan !== planType) {
    url += `&upgradeFrom=${currentPlan}`;
  }

  window.location.href = url;
};

// ❌ Cancelar suscripción
document.getElementById("cancel-button").addEventListener("click", async () => {
  if (!currentUser) return;

  const confirmCancel = confirm("¿Estás seguro de que deseas cancelar tu suscripción premium?");
  if (!confirmCancel) return;

  try {
    const userRef = doc(db, "users", currentUser.uid);
    await updateDoc(userRef, {
      premium: false,
      plan: null
    });

    alert("🔕 Suscripción cancelada correctamente.");
    window.location.href = "home-page.html";
  } catch (err) {
    console.error("Error al cancelar el plan:", err);
    alert("❌ No se pudo cancelar la suscripción.");
  }
});

// ⬅ Volver al inicio
document.getElementById("back-button").addEventListener("click", () => {
  window.location.href = "home-page.html";
});
