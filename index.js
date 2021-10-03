const http = require("http");
const fs = require("fs");
const url = require("url");

const { guardarUsuario, getUsuarios, editUsuario, eliminarUsuario, getTransferencias, getHistorial } = require("./consultas");
const { send } = require("./correo");

http
  .createServer(async (req, res) => {
    /// GET: Devuelve la aplicación cliente disponible en el apoyo de la prueba
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

    ///usuario POST: Recibe los datos de un nuevo usuario y los almacena en PostgreSQL.
    if (req.url == "/usuario" && req.method == "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });
      send();
      req.on("end", async () => {
        try {
          const usuario = JSON.parse(body);
          const result = await guardarUsuario(usuario);
          res.statusCode = 201;
          res.end(JSON.stringify(result));
        } catch (error) {
          res.statusCode = 400;
          res.end();
        }
      });
    }

    ///usuarios GET: Devuelve todos los usuarios registrados con sus balances.
    if (req.url == "/usuarios" && req.method === "GET") {
      try {
        const registros = await getUsuarios();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(registros));
      } catch (error) {
        console.log(error);
        res.statusCode = 500;
        res.end();
      }
    }

    ///usuario PUT: Recibe los datos modificados de un usuario registrado y los actualiza.
    if (req.url.startsWith("/usuario") && req.method === "PUT") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });

      req.on("end", async () => {
        const datos = Object.values(JSON.parse(body));
        try {
          const respuesta = await editUsuario(datos);
          res.statusCode = 200;
          res.end(JSON.stringify(respuesta));
        } catch (error) {
          console.log(error);
          res.end();
        }
      });
    }

    ///usuario DELETE: Recibe el id de un usuario registrado y lo elimina .
    if (req.url.startsWith("/usuario?") && req.method == "DELETE") {
      const { id } = url.parse(req.url, true).query;
      try {
        const respuesta = await eliminarUsuario(id);
        res.statusCode = 200;
        res.end(JSON.stringify(respuesta));
      } catch (error) {
        console.log(error);
        res.end();
      }
    }

    // /transferencia POST: Recibe los datos para realizar una nueva transferencia. Se debe
    // ocupar una transacción SQL en la consulta a la base de datos.
    if (req.url == "/transferencia" && req.method == "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", async () => {
        try {
          const transferencia = Object.values(JSON.parse(body));
          const result = await getTransferencias(transferencia);
          res.statusCode = 200;
          res.end(JSON.stringify(result));
        } catch (error) {
          console.log(error);
          res.end();
        }
        req.on("end", async () => {});
      });
    }

    //      /transferencias GET: Devuelve todas las transferencias almacenadas en la base de
    //      datos en formato de arreglo.
    if (req.url == "/transferencias" && req.method === "GET") {
      try {
        const historial = await getHistorial();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(historial));
      } catch (error) {
        res.end();
      }
    }
  })
  .listen(3000, console.log("Servidor ON en puerto 3000"));
