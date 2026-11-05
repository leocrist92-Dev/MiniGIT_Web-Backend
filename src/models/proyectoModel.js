const db = require('../config/db');

const ProyectoModel = {
    // Obtener todos los repositorios de un usuario
    getAllByUserId: async (id_usuario) => {
        const query = `
            SELECT id, nombre, descripcion, visibilidad, fecha_creacion, estado 
            FROM proyectos 
            WHERE id_usuario = ? AND estado = 'Activo'
            ORDER BY fecha_creacion DESC
        `;
        const [rows] = await db.execute(query, [id_usuario]);
        return rows;
    },

    // Obtener el detalle de un proyecto específico
    getDetalle: async (id_proyecto, id_usuario) => {
        const query = `
            SELECT * FROM proyectos 
            WHERE id = ? AND id_usuario = ? AND estado = 'Activo'
        `;
        const [rows] = await db.execute(query, [id_proyecto, id_usuario]);
        return rows[0];
    },

    // Crear un nuevo repositorio
    create: async (proyecto) => {
        const query = `
            INSERT INTO proyectos (nombre, descripcion, visibilidad, id_usuario, estado) 
            VALUES (?, ?, ?, ?, 'Activo')
        `;
        const [result] = await db.execute(query, [
            proyecto.nombre, 
            proyecto.descripcion, 
            proyecto.visibilidad, 
            proyecto.id_usuario
        ]);
        return result.insertId;
    },
    
    // Eliminar (Borrado lógico)
    delete: async (id_proyecto, id_usuario) => {
        const query = "UPDATE proyectos SET estado = 'Eliminado' WHERE id = ? AND id_usuario = ?";
        const [result] = await db.execute(query, [id_proyecto, id_usuario]);
        return result.affectedRows > 0;
    }
};

module.exports = ProyectoModel;