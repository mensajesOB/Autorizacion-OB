document.addEventListener("DOMContentLoaded", () => {
  const API_URL = "/config";
  const contenedor = document.getElementById("listaProductos");
  const mensaje = document.getElementById("mensaje");
  let tipoAutorizacion = "coordenadas"; // valor por defecto

  // Formato CLP
  function formatoCLP(valor){
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  }

  // Cargar configuración
  fetch(API_URL)
    .then(res => res.json())
    .then(cfg => {
      contenedor.innerHTML = "";
      let contador = 1;

      if(cfg.producto1 && cfg.producto1.trim() !== ""){
        contenedor.innerHTML += `
          <div class="producto">
            <label>
              <input type="radio" name="opcion" value="producto1"> 
              <span>${contador}.- ${cfg.producto1} por ${cfg.monto1 ? formatoCLP(cfg.monto1) : ""}</span>
            </label>
          </div>`;
        contador++;
      }

      if(cfg.producto2 && cfg.producto2.trim() !== ""){
        contenedor.innerHTML += `
          <div class="producto">
            <label>
              <input type="radio" name="opcion" value="producto2"> 
              <span>${contador}.- ${cfg.producto2} por ${cfg.monto2 ? formatoCLP(cfg.monto2) : ""}</span>
            </label>
          </div>`;
        contador++;
      }

      if(cfg.producto3 && cfg.producto3.trim() !== ""){
        contenedor.innerHTML += `
          <div class="producto">
            <label>
              <input type="radio" name="opcion" value="producto3"> 
              <span>${contador}.- ${cfg.producto3}</span>
            </label>
          </div>`;
        contador++;
      }

      tipoAutorizacion = cfg.tipoAutorizacion || "coordenadas";
    })
    .catch(err => {
      console.error("Error al cargar configuración:", err);
      mensaje.innerText = "⚠️ No se pudo cargar configuración del servidor.";
    });

  // Botón LO QUIERO
  document.getElementById("quieroBtn").addEventListener("click", () => {
    const seleccion = document.querySelector('input[name="opcion"]:checked');
    if(!seleccion){
      mensaje.innerText = "⚠️ Debes seleccionar un producto.";
      return;
    }

    localStorage.setItem("seleccionProducto", seleccion.value);
    mensaje.innerText = "Serás redirigido al área de autorización...";

    setTimeout(() => {
      window.location.href = "/autorizacion";
    }, 2000);
  });
});
