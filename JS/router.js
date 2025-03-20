function navigateTo(page) {
  // Construir la URL del archivo HTML
  let htmlPath = `HTML/${page}.html`;

  // Construir la URL del archivo CSS correspondiente (mismo nombre de la página)
  let cssPath = `CSS/${page}.css`;

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
          let oldCss = document.getElementById('dynamic-CSS');
          if (oldCss) {
              console.log(oldCss.href, oldCss.rel)
              oldCss.remove();
          }

          // Crear una nueva referencia al CSS de la página cargada
          let newCss = document.createElement('link');
          newCss.id = 'dynamic-CSS';
          newCss.rel = 'stylesheet';
          newCss.href = cssPath;
          newCss.type = 'text/css';
          console.log(newCss.href, newCss.rel);
          document.head.appendChild(newCss);
      })
      .catch(error => console.error(`Error al cargar la página: ${error.message}`));
}

// Cargar una página inicial por defecto
document.addEventListener("DOMContentLoaded", () => {
  navigateTo('user-management/user-login'); // Puedes cambiar la página de inicio aquí
});
