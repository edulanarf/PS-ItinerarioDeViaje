import { LocalStorageManager } from './local-storage.js';
import { ItineraryPlan } from './types.js';

export class TemplateManager {
  /**
   * Guardar un itinerario como plantilla
   * @param {string} userId - ID del usuario
   * @param {ItineraryPlan} itinerary - Itinerario a convertir en plantilla
   * @returns {boolean} - True si se guardó correctamente
   */
  static saveAsTemplate(userId, itinerary) {
    try {
      // Crear una copia del itinerario sin fechas
      const template = {
        ...itinerary,
        id: `template_${Date.now()}`,
        title: `${itinerary.title} (Plantilla)`,
        description: itinerary.description || '',
        createdAt: new Date().toISOString(),
        isTemplate: true,
        // Remover fechas de los itinerarios
        itineraries: itinerary.itineraries.map(day => ({
          ...day,
          date: null, // Remover fecha
          places: day.places.map(place => ({
            ...place,
            arrivalTime: null, // Remover horarios específicos
            departureTime: null
          }))
        }))
      };

      const key = `template_${userId}_${template.id}`;
      localStorage.setItem(key, JSON.stringify(template));
      
      console.log("✅ Plantilla guardada:", template.title);
      return true;
    } catch (error) {
      console.error("❌ Error al guardar plantilla:", error);
      return false;
    }
  }

  /**
   * Obtener todas las plantillas del usuario
   * @param {string} userId - ID del usuario
   * @returns {Array} - Lista de plantillas
   */
  static getTemplates(userId) {
    try {
      const templates = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`template_${userId}_`)) {
          const template = JSON.parse(localStorage.getItem(key));
          templates.push(template);
        }
      }
      return templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } catch (error) {
      console.error("❌ Error al obtener plantillas:", error);
      return [];
    }
  }

  /**
   * Eliminar una plantilla
   * @param {string} userId - ID del usuario
   * @param {string} templateId - ID de la plantilla
   * @returns {boolean} - True si se eliminó correctamente
   */
  static deleteTemplate(userId, templateId) {
    try {
      const key = `template_${userId}_${templateId}`;
      localStorage.removeItem(key);
      console.log("✅ Plantilla eliminada:", templateId);
      return true;
    } catch (error) {
      console.error("❌ Error al eliminar plantilla:", error);
      return false;
    }
  }

  /**
   * Crear un nuevo itinerario desde una plantilla
   * @param {string} userId - ID del usuario
   * @param {string} templateId - ID de la plantilla
   * @param {string} newTitle - Nuevo título para el itinerario
   * @param {Date} startDate - Fecha de inicio
   * @returns {ItineraryPlan|null} - Nuevo itinerario o null si hay error
   */
  static createFromTemplate(userId, templateId, newTitle, startDate) {
    try {
      const key = `template_${userId}_${templateId}`;
      const template = JSON.parse(localStorage.getItem(key));
      
      if (!template) {
        throw new Error("Plantilla no encontrada");
      }

      // Crear nuevo itinerario con fechas
      const newItinerary = {
        ...template,
        id: `itinerary_${Date.now()}`,
        title: newTitle,
        isTemplate: false,
        createdAt: new Date().toISOString(),
        startDate: startDate.toISOString(),
        // Asignar fechas a los días
        itineraries: template.itineraries.map((day, index) => {
          const dayDate = new Date(startDate);
          dayDate.setDate(dayDate.getDate() + index);
          
          return {
            ...day,
            date: dayDate.toISOString(),
            name: `Día ${index + 1}`,
            places: day.places.map(place => ({
              ...place,
              arrivalTime: null, // Se pueden configurar después
              departureTime: null
            }))
          };
        })
      };

      // Guardar el nuevo itinerario
      const success = LocalStorageManager.saveItinerary(userId, newItinerary);
      if (success) {
        console.log("✅ Itinerario creado desde plantilla:", newTitle);
        return newItinerary;
      } else {
        throw new Error("No se pudo guardar el itinerario");
      }
    } catch (error) {
      console.error("❌ Error al crear itinerario desde plantilla:", error);
      return null;
    }
  }

  /**
   * Obtener una plantilla específica
   * @param {string} userId - ID del usuario
   * @param {string} templateId - ID de la plantilla
   * @returns {Object|null} - Plantilla o null si no existe
   */
  static getTemplate(userId, templateId) {
    try {
      const key = `template_${userId}_${templateId}`;
      const template = localStorage.getItem(key);
      return template ? JSON.parse(template) : null;
    } catch (error) {
      console.error("❌ Error al obtener plantilla:", error);
      return null;
    }
  }
} 