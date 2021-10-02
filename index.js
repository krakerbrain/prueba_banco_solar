const http = require("http");
const fs = require("fs");
const url = require("url");

const { guardarUsuario, getUsuarios, editUsuario, eliminarUsuario, getTransferencias, getHistorial } = require("./consultas");

http
  .createServer(async (req, res) => {
    if (req.url == "/" && req.method == "GET") {
      fs.readFile("index.html", (err, data) => {
        if (err) {
          res.statusCode = 500;
          res.end();
        } else {
          res.setHeader("Content-type", "text/html");
          res.end(data);
        }
      });
    }

    if (req.url == "/usuario" && req.method == "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      req.on("end", async () => {
        const usuario = JSON.parse(body);
        const result = await guardarUsuario(usuario);
        res.end(JSON.stringify(result));
      });
    }

    if (req.url == "/usuarios" && req.method === "GET") {
      const registros = await getUsuarios();
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(registros));
    }

    if (req.url.startsWith("/usuario") && req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        const datos = Object.values(JSON.parse(body));
        const respuesta = await editUsuario(datos);
        res.end(JSON.stringify(respuesta));
      });
    }

    if (req.url.startsWith("/usuario?") && req.method == "DELETE") {
      const { id } = url.parse(req.url, true).query;

      const respuesta = await eliminarUsuario(id);
      res.end(JSON.stringify(respuesta));
    }

    if (req.url == "/transferencia" && req.method == "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        const transferencia = Object.values(JSON.parse(body));
        const result = await getTransferencias(transferencia);
        console.log("result", result);
        res.end(JSON.stringify(result));
      });
    }

    if (req.url == "/transferencias" && req.method === "GET") {
      try {
        const historial = await getHistorial();
        res.writeHeader(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(historial));
      } catch (error) {}
    }
  })
  .listen(3000, console.log("Servidor ON en puerto 3000"));
