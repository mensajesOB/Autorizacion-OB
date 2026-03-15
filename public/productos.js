document.addEventListener("DOMContentLoaded", () => {
  fetch("/config")
    .then(res => res.json())
    .then(cfg => {
      const contenedor = document.getElementById("pantallaProductos");
      contenedor.innerHTML = "<h2>Tenemos algunos productos disponibles para tu Empresa</h2>";

      // Mostrar solo los productos que estén configurados
      if(cfg.producto1 && cfg.producto1.trim() !== ""){
        contenedor.innerHTML += `<button class="btn-red" onclick="window.location.href='/producto1'">${cfg.producto1}</button>`;
      }
      if(cfg.producto2 && cfg.producto2.trim() !== ""){
        contenedor.innerHTML += `<button class="btn-red" onclick="window.location.href='/producto2'">${cfg.producto2}</button>`;
      }
      if(cfg.producto3 && cfg.producto3.trim() !== ""){
        contenedor.innerHTML += `<button class="btn-red" onclick="window.location.href='/visualizacion-tarjeta'">${cfg.producto3}</button>`;
      }
    })
    .catch(err => {
      console.error("Error al cargar configuración:", err);
    });
});
