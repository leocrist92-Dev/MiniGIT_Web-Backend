// src/models/ramaModel.js
const db = require('../config/db');

/**
 * Consulta todas las ramas pertenecientes a un proyecto en MySQL
 */
const obtenerRamasPorProyecto = async (idProyecto) => {
  const sql = `
    SELECT 
      id,
      id_proyecto,
      nombre,
      id_version_base,
      activa,
      fecha_creacion
    FROM ramas
    WHERE id_proyecto = ?
    ORDER BY fecha_creacion ASC;
  `;

  const [filas] = await db.query(sql, [idProyecto]);
  return filas;
};

const createRama = async (idProyecto, nombreRama) => {
  const sql = `
      INSERT INTO ramas (id_proyecto, nombre, activa) 
      VALUES (?, ?, 'Si')
  `;

  console.log(idProyecto)
  console.log(nombreRama)

  const [result] = await db.execute(sql, [idProyecto, nombreRama]);
  return result.insertId;
};

module.exports = {
  obtenerRamasPorProyecto,
  createRama
};