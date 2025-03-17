function navigateTo(page) {
  // Construir la URL del archivo HTML
  let htmlPath = `HTML/${page}.html`;
  
  // Construir la URL del archivo CSS correspondiente (mismo nombre de la página)
  let cssPath = `css/${page}.css`;

  // Cargar el HTML en el contenido principal
  fetch(htmlPath, { cache: "no-cache" })
      .then(response => {
          if (!response.ok) {
              throw new Error(`Página no encontrada: ${htmlPath}`);
          }
          return response.text();
      })
      .then(data => {
          document.getElementById('content').innerHTML = data;

          // Eliminar cualquier CSS anterior cargado dinámicamente
          let oldCss = document.getElementById('dynamic-css');
          if (oldCss) {
              oldCss.remove();
          }

          // Crear una nueva referencia al CSS de la página cargada
          let newCss = document.createElement('link');
          newCss.id = 'dynamic-css';
          newCss.rel = 'stylesheet';
          newCss.href = cssPath;
          document.head.appendChild(newCss);
      })
      .catch(error => console.error(`Error al cargar la página: ${error.message}`));
}

// Cargar una página inicial por defecto
document.addEventListener("DOMContentLoaded", () => {
  navigateTo('gestion_de_usuarios/user-login'); // Puedes cambiar la página de inicio aquí
});
