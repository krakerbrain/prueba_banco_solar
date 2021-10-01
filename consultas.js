const { Pool } = require("pg");
const date = new Date();
let fecha = date.toLocaleDateString();

const pool = new Pool({
  user: "mario",
  host: "localhost",
  database: "bancosolar",
  password: "1234",
  port: 5432,
  max: 20,
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 2000,
});

const guardarUsuario = async (usuario) => {
  const values = Object.values(usuario);
  const consulta = {
    text: "INSERT INTO usuarios (nombre, balance) values ($1,$2) RETURNING *;",
    values,
  };

  try {
    const result = await pool.query(consulta);
    return result;
  } catch (e) {
    return e;
  }
};

const getUsuarios = async () => {
  try {
    const result = await pool.query("SELECT * FROM usuarios");
    return result;
  } catch (e) {
    return e;
  }
};

const editUsuario = async (datos) => {
  const consulta = {
    text: "UPDATE usuarios SET nombre = $2, balance = $3 WHERE id = $1 RETURNING *;",
    values: datos,
  };

  try {
    const result = await pool.query(consulta);
    return result;
  } catch (error) {
    console.log("Codigo de error", error.code);
    return error;
  }
};

const eliminarUsuario = async (id) => {
  try {
    const result = await pool.query(`DELETE FROM usuarios WHERE id = ${id}`);
    return result;
  } catch (error) {
    console.log("Codigo de error", error.code);
    return error;
  }
};

const getTransferencias = async (datosTranfer) => {
  pool.connect(async (error_conexion, client, release) => {
    if (error_conexion) return console.error(error_conexion.code);
    const values = Object.values(datosTranfer);

    try {
      await client.query("BEGIN");

      const transferencia = {
        text: `INSERT INTO transferencias (emisor, receptor, monto, fecha)
                            VALUES ($1,$2,$3,'${fecha}') RETURNING *;`,
        values,
      };

      const transfer = await client.query(transferencia);

      const userUpdateHaber = {
        text: `UPDATE usuarios SET balance = balance - $2 WHERE id = $1 RETURNING *;`,
        values: [values[0], values[2]],
      };
      const haber = await client.query(userUpdateHaber);

      const userUpdateDebe = {
        text: "UPDATE usuarios SET balance = balance + $2 WHERE id = $1 RETURNING *;",
        values: [values[1], values[2]],
      };
      console.log(userUpdateDebe.values);

      const debe = await client.query(userUpdateDebe);

      //   console.log("Descuento realizado con éxito: ", descuento.rows[0]);
      //   console.log("Transacción realizada con éxito: ", transaccion.rows[0]);

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      console.log(e);
      console.log("Error codigo ", e.code);
      console.log("Detalle del error ", e.detail);
      console.log("Tabla originaria del error ", e.table);
      console.log("Restriccion violada en el campo ", e.constraint);
    }
    release();
    pool.end();
  });
};

module.exports = { guardarUsuario, getUsuarios, editUsuario, eliminarUsuario, getTransferencias };
