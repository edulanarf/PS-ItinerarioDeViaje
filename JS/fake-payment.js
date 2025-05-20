import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

// Precios por plan
const planPrices = {
  basic: 4.49,
  advanced: 9.99,
  unlimited: 19.49
};

// Obtener parámetros de la URL
const urlParams = new URLSearchParams(window.location.search);
const selectedPlan = urlParams.get("plan");         // ej. unlimited
const upgradeFrom = urlParams.get("upgradeFrom");   // ej. basic (opcional)

const planNameMap = {
  basic: "Plan Básico",
  advanced: "Plan Avanzado",
  unlimited: "Plan Ilimitado"
};

// Calcular precio a pagar
let amount = planPrices[selectedPlan];
if (upgradeFrom && planPrices[upgradeFrom]) {
  amount = planPrices[selectedPlan] - planPrices[upgradeFrom];
}

// Mostrar resumen del plan y precio
const display = document.getElementById("selected-plan");
display.innerText = `Plan seleccionado: ${planNameMap[selectedPlan] || selectedPlan} — ${
  amount.toFixed(2)
} € a pagar`;

// Validar y simular pago
document.getElementById("fake-payment-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const error = document.getElementById("form-error");
  error.textContent = "";

  const name = document.getElementById("card-name").value.trim();
  const number = document.getElementById("card-number").value.trim().replace(/\s/g, '');
  const expiry = document.getElementById("expiry").value.trim();
  const cvc = document.getElementById("cvc").value.trim();

  if (!name || !number || !expiry || !cvc) {
    error.textContent = "⚠️ Por favor, completa todos los campos.";
    return;
  }

  if (number.length < 16 || !/^\d+$/.test(number)) {
    error.textContent = "⚠️ Número de tarjeta inválido.";
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("Debes estar autenticado para continuar.");
      return;
    }

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        premium: true,
        plan: selectedPlan
      });

      alert("✅ ¡Pago exitoso! Tu plan ha sido activado.");
      window.location.href = "home-page.html";
    } catch (err) {
      console.error("❌ Error al actualizar el plan:", err);
      alert("❌ Ocurrió un error al activar el plan.");
    }
  });
});

// Botón cancelar: redirige a home
document.getElementById("cancel-payment").addEventListener("click", () => {
  const confirmCancel = confirm("¿Deseas cancelar el proceso de activación del plan?");
  if (confirmCancel) {
    window.location.href = "home-page.html";
  }
});
