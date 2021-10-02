const { Pool } = require("pg");

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
  pool.connect();
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id");
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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const borraTransf = {
      text: `DELETE FROM transferencias WHERE emisor = $1 OR receptor = $2 RETURNING *;`,
      values: [id, id],
    };
    console.log(borraTransf.values);
    const borrarT = await client.query(borraTransf);

    const borraUser = {
      text: `DELETE FROM usuarios WHERE id = $1 RETURNING *;`,
      values: [id],
    };
    const borrarU = await client.query(borraUser);

    await client.query("COMMIT");

    console.log("Transferencia realizada con éxito: ", borrarU.rows[0]);
    client.release();
    return borrarU;
  } catch (e) {
    await client.query("ROLLBACK");
    console.log(e);
    console.log("Error codigo ", e.code);
    console.log("Detalle del error ", e.detail);
    console.log("Tabla originaria del error ", e.table);
    console.log("Restriccion violada en el campo ", e.constraint);
  }
};

const getTransferencias = async (transferencia) => {
  const client = await pool.connect();
  const values = Object.values(transferencia);

  try {
    await client.query("BEGIN");

    const transferencia = {
      text: `INSERT INTO transferencias (emisor, receptor, monto, fecha)
                                VALUES ($1,$2,$3,now()) RETURNING *;`,
      values,
    };
    const transfer = await client.query(transferencia);

    const actualizaEmisor = {
      text: `UPDATE usuarios SET balance = balance - $2 WHERE id = $1;`,
      values: [values[0], values[2]],
    };
    const debe = await client.query(actualizaEmisor);

    const actualizaReceptor = {
      text: "UPDATE usuarios SET balance = balance + $2 WHERE id = $1;",
      values: [values[1], values[2]],
    };
    const haber = await client.query(actualizaReceptor);

    await client.query("COMMIT");

    console.log("Transferencia realizada con éxito: ", transfer.rows[0]);
    client.release();
    return haber;
  } catch (e) {
    await client.query("ROLLBACK");
    console.log(e);
    console.log("Error codigo ", e.code);
    console.log("Detalle del error ", e.detail);
    console.log("Tabla originaria del error ", e.table);
    console.log("Restriccion violada en el campo ", e.constraint);
  }
};

const getHistorial = async () => {
  try {
    const result = await pool.query(`SELECT t.fecha, e.nombre AS emisor, r.nombre AS receptor,t.monto
                                    FROM transferencias AS t
                                    INNER JOIN usuarios AS e ON t.emisor=e.id  
                                    INNER JOIN usuarios AS r ON t.receptor=r.id;`);
    return result;
  } catch (e) {
    return e;
  }
};

module.exports = { guardarUsuario, getUsuarios, editUsuario, eliminarUsuario, getTransferencias, getHistorial };
