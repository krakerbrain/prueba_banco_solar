//Se usa implementación de Singleton en módulo poolbd
const PoolSingleton = require("./poolbd");
//Se le asigna a la constante el singleton generado
const pool = PoolSingleton.getInstance();

//Se crea la consulta que inserta en la tabla usuarios de la BD al usuario y el monto inicial
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

//Se crea la consulta que selecciona a todos los usuarios para mostrarlos en el front
//se ordenan por ID para que no cambie su posicion en la tabla
const getUsuarios = async () => {
  try {
    const result = await pool.query("SELECT * FROM usuarios ORDER BY id");
    return result;
  } catch (e) {
    return e;
  }
};

//Se crea consulta que actualiza la info del usuario en la tabla
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

//Se crean funcion que realiza dos consultas. Esta consulta se hace por el id, que se obtiene cambiando valores
//en las lineas 242 y 243 del HTML
//La primera consulta elimina todas las transferencias hechas por un usuario
//La segunda, elimina al usuario de la tabla
const eliminarUsuario = async (id) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const borraTransf = {
      text: `DELETE FROM transferencias WHERE emisor = $1 OR receptor = $2 RETURNING *;`,
      values: [id, id],
    };
    const borrarT = await client.query(borraTransf);

    const borraUser = {
      text: `DELETE FROM usuarios WHERE id = $1 RETURNING *;`,
      values: [id],
    };
    const borrarU = await client.query(borraUser);

    await client.query("COMMIT");

    console.log("Transferencia realizada con éxito: ", borrarU.rows[0]);

    return borrarU;
  } catch (e) {
    await client.query("ROLLBACK");
    console.log(e);
    console.log("Error codigo ", e.code);
    console.log("Detalle del error ", e.detail);
    console.log("Tabla originaria del error ", e.table);
    console.log("Restriccion violada en el campo ", e.constraint);
  } finally {
    client.release();
  }
};

//Se crea función que realiza transferencias entre usuarios
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

    return haber;
  } catch (e) {
    await client.query("ROLLBACK");
    console.log(e);
    console.log("Error codigo ", e.code);
    console.log("Detalle del error ", e.detail);
    console.log("Tabla originaria del error ", e.table);
    console.log("Restriccion violada en el campo ", e.constraint);
  } finally {
    client.release();
  }
};

//Se crea consulta que obtiene el historial de transacciones
//Se usa consulta con inner join para mostrar en el front el nombre de los usuarios
//ya que se usaron en todas las consultas de transferencias el id de los mismos
//EL RESULTADO SE DEVUELVE COMO ARREGLO
const getHistorial = async () => {
  try {
    const consulta = {
      text: `SELECT t.fecha, e.nombre AS emisor, r.nombre AS receptor,t.monto
      FROM transferencias AS t
      INNER JOIN usuarios AS e ON t.emisor=e.id  
      INNER JOIN usuarios AS r ON t.receptor=r.id;`,
      rowMode: "array",
    };

    const tranfer = await pool.query(consulta);

    return tranfer;
  } catch (e) {
    return e;
  }
};

module.exports = { guardarUsuario, getUsuarios, editUsuario, eliminarUsuario, getTransferencias, getHistorial };
