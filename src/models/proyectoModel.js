const db = require('../config/db');

const ProyectoModel = {
    // Obtener todos los repositorios de un usuario
    getAllByUserId: async (id_usuario) => {
        const query = `
            SELECT 
                p.id,
                p.nombre,
                p.descripcion,
                p.ruta,
                p.visibilidad,
                p.estado,
                p.fecha_creacion,
                -- Subconsulta para obtener el nombre de la rama activa
                (
                    SELECT r.nombre
                    FROM ramas r 
                    WHERE r.id_proyecto = p.id AND r.activa = 'Si' 
                    LIMIT 1
                ) AS rama_activa,
                -- Subconsulta para obtener el tipo/lenguaje de archivo dominante
                (
                    SELECT ta.nombre
                    FROM archivos a 
                    JOIN tipos_archivo ta ON a.id_tipo = ta.id 
                    WHERE a.id_proyecto = p.id 
                    GROUP BY ta.id, ta.nombre 
                    ORDER BY COUNT(a.id) DESC 
                    LIMIT 1
                ) AS lenguaje_principal
            FROM proyectos p
            WHERE p.id_usuario = ?
            ORDER BY p.fecha_creacion DESC;
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