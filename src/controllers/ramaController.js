// src/controllers/ramaController.js
const { obtenerRamasPorProyecto } = require('../models/ramaModel');

const obtenerRamas = async (req, res) => {
  const { id } = req.params; // Captura el ID del proyecto desde los parámetros de la URL

  try {
    const ramasBD = await obtenerRamasPorProyecto(id);
    return res.json(ramasBD);
  } catch (error) {
    console.error('Error al obtener las ramas del proyecto:', error);
    return res.status(500).json({ mensaje: 'Error al consultar las ramas en la base de datos' });
  }
};

module.exports = {
  obtenerRamas
};