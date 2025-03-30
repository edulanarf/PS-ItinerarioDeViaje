function navigateTo(page) {
  let htmlPath = `HTML/${page}.html`;
  let cssPath = `CSS/${page}.css`;

  fetch(htmlPath, { cache: "no-cache" })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Página no encontrada: ${htmlPath}`);
      }
      return response.text();
    })
    .then(data => {
      let contentDiv = document.getElementById('content');
      contentDiv.innerHTML = data; // Cargar el contenido HTML

      // Eliminar cualquier CSS anterior
      let oldCss = document.getElementById('dynamic-CSS');
      if (oldCss) oldCss.remove();

      // Agregar nuevo CSS si existe
      fetch(cssPath, { method: 'HEAD' })
        .then(res => {
          if (res.ok) {
            let newCss = document.createElement('link');
            newCss.id = 'dynamic-CSS';
            newCss.rel = 'stylesheet';
            newCss.href = cssPath;
            document.head.appendChild(newCss);
          }
        });

      // Ejecutar los scripts dentro del HTML cargado
      let scripts = contentDiv.querySelectorAll("script");
      scripts.forEach(oldScript => {
        let newScript = document.createElement("script");
        newScript.type = "module"; // Permite usar módulos si es necesario
        if (oldScript.src) {
          newScript.src = oldScript.src; // Si el script tiene un archivo src, lo tomamos
        } else {
          newScript.textContent = oldScript.textContent; // Si el script tiene código dentro, lo ejecutamos
        }

        document.body.appendChild(newScript);
      });
    })
    .catch(error => console.error(`Error al cargar la página: ${error.message}`));
}

// Cargar la página inicial
document.addEventListener("DOMContentLoaded", () => {
  navigateTo('user-login');  // Cambia esto según la página de inicio
});