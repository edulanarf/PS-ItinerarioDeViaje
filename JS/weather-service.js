// Servicio para manejar información del clima usando OpenWeather API
class WeatherService {
  constructor() {
    // Clave de API de OpenWeather (deberías usar una clave real)
    this.apiKey = 'YOUR_OPENWEATHER_API_KEY'; // Reemplazar con tu clave real
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
  }

  /**
   * Obtener coordenadas de una ciudad
   * @param {string} cityName - Nombre de la ciudad
   * @returns {Promise<Object>} - Coordenadas {lat, lon}
   */
  async getCityCoordinates(cityName) {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(cityName)}&limit=1&appid=${this.apiKey}`
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener coordenadas de la ciudad');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Ciudad no encontrada');
      }
      
      return {
        lat: data[0].lat,
        lon: data[0].lon,
        name: data[0].name,
        country: data[0].country
      };
    } catch (error) {
      console.error('Error al obtener coordenadas:', error);
      throw error;
    }
  }

  /**
   * Obtener pronóstico del clima para una ubicación y fecha específica
   * @param {number} lat - Latitud
   * @param {number} lon - Longitud
   * @param {Date} date - Fecha para la cual obtener el pronóstico
   * @returns {Promise<Object>} - Información del clima
   */
  async getWeatherForecast(lat, lon, date) {
    try {
      // Obtener pronóstico de 5 días
      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=es`
      );
      
      if (!response.ok) {
        throw new Error('Error al obtener pronóstico del clima');
      }
      
      const data = await response.json();
      
      // Encontrar el pronóstico para la fecha específica
      const targetDate = new Date(date);
      targetDate.setHours(12, 0, 0, 0); // Mediodía del día objetivo
      
      const forecast = data.list.find(item => {
        const itemDate = new Date(item.dt * 1000);
        return itemDate.getDate() === targetDate.getDate() &&
               itemDate.getMonth() === targetDate.getMonth() &&
               itemDate.getFullYear() === targetDate.getFullYear();
      });
      
      if (!forecast) {
        // Si no hay pronóstico para esa fecha, usar el más cercano
        const closestForecast = data.list.reduce((closest, item) => {
          const itemDate = new Date(item.dt * 1000);
          const closestDate = new Date(closest.dt * 1000);
          const targetTime = targetDate.getTime();
          
          const itemDiff = Math.abs(itemDate.getTime() - targetTime);
          const closestDiff = Math.abs(closestDate.getTime() - targetTime);
          
          return itemDiff < closestDiff ? item : closest;
        });
        
        return this.formatWeatherData(closestForecast);
      }
      
      return this.formatWeatherData(forecast);
    } catch (error) {
      console.error('Error al obtener pronóstico del clima:', error);
      throw error;
    }
  }

  /**
   * Formatear los datos del clima para mostrar
   * @param {Object} weatherData - Datos del clima de la API
   * @returns {Object} - Datos formateados
   */
  formatWeatherData(weatherData) {
    return {
      temperature: Math.round(weatherData.main.temp),
      feelsLike: Math.round(weatherData.main.feels_like),
      humidity: weatherData.main.humidity,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      windSpeed: Math.round(weatherData.wind.speed * 3.6), // Convertir m/s a km/h
      date: new Date(weatherData.dt * 1000)
    };
  }

  /**
   * Obtener icono del clima
   * @param {string} iconCode - Código del icono de OpenWeather
   * @returns {string} - URL del icono
   */
  getWeatherIcon(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  /**
   * Obtener clima para una ciudad y fecha específica
   * @param {string} cityName - Nombre de la ciudad
   * @param {Date} date - Fecha
   * @returns {Promise<Object>} - Información del clima
   */
  async getWeatherForCity(cityName, date) {
    try {
      const coordinates = await this.getCityCoordinates(cityName);
      const weather = await this.getWeatherForecast(coordinates.lat, coordinates.lon, date);
      
      return {
        ...weather,
        city: coordinates.name,
        country: coordinates.country
      };
    } catch (error) {
      console.error('Error al obtener clima para la ciudad:', error);
      throw error;
    }
  }

  /**
   * Obtener clima mock para desarrollo (cuando no hay API key)
   * @param {Date} date - Fecha
   * @returns {Object} - Datos mock del clima
   */
  getMockWeather(date) {
    const temperatures = [22, 25, 28, 20, 23, 26, 24, 27];
    const descriptions = [
      'cielo despejado',
      'pocas nubes',
      'nubes dispersas',
      'nublado',
      'lluvia ligera',
      'lluvia moderada'
    ];
    const icons = ['01d', '02d', '03d', '04d', '10d', '09d'];
    
    const randomIndex = Math.floor(Math.random() * temperatures.length);
    const descIndex = Math.floor(Math.random() * descriptions.length);
    
    return {
      temperature: temperatures[randomIndex],
      feelsLike: temperatures[randomIndex] + Math.floor(Math.random() * 3) - 1,
      humidity: 60 + Math.floor(Math.random() * 30),
      description: descriptions[descIndex],
      icon: icons[descIndex],
      windSpeed: 5 + Math.floor(Math.random() * 15),
      date: date,
      city: 'Ciudad',
      country: 'País'
    };
  }
}

// Exportar instancia del servicio
export const weatherService = new WeatherService();

// Agregar un comentario para forzar la recarga del módulo
console.log('WeatherService cargado correctamente'); 