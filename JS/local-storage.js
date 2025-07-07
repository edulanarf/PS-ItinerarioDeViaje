// Almacenamiento local temporal para itinerarios
export class LocalStorageManager {
  static saveItinerary(userId, itinerary) {
    try {
      const key = `itinerary_${userId}_${itinerary.title}`;
      localStorage.setItem(key, JSON.stringify(itinerary));
      return true;
    } catch (error) {
      console.error("Error al guardar en localStorage:", error);
      return false;
    }
  }

  static getItineraries(userId) {
    try {
      const itineraries = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`itinerary_${userId}_`)) {
          const itinerary = JSON.parse(localStorage.getItem(key));
          itineraries.push(itinerary);
        }
      }
      return itineraries;
    } catch (error) {
      console.error("Error al obtener itinerarios de localStorage:", error);
      return [];
    }
  }

  static deleteItinerary(userId, title) {
    try {
      const key = `itinerary_${userId}_${title}`;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("Error al eliminar de localStorage:", error);
      return false;
    }
  }

  static saveUserData(userId, userData) {
    try {
      const key = `user_${userId}`;
      localStorage.setItem(key, JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error("Error al guardar datos de usuario:", error);
      return false;
    }
  }

  static getUserData(userId) {
    try {
      const key = `user_${userId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error al obtener datos de usuario:", error);
      return null;
    }
  }
} 