const db = require('../config/db');

const EtiquetaModel = {
    // Obtener todos los commits (etiquetas) de un repositorio/rama
    getCommitsByProyecto: async (id_proyecto) => {
        // En una BD normal de Git, las etiquetas apuntan a una rama, y la rama al proyecto.
        // Asumiendo que buscamos la rama por defecto del proyecto.
        const query = `
            SELECT e.hash_version, e.mensaje, e.fecha, r.nombre, u.nombre_usuario as autor
            FROM etiquetas e
            JOIN ramas r ON e.id_rama = r.id
            JOIN usuarios u ON e.id_usuario = u.id
            WHERE r.id_proyecto = ?
            ORDER BY e.fecha DESC
        `;
        const [rows] = await db.execute(query, [id_proyecto]);
        return rows;
    },

    // Obtener el detalle y contenido de un commit específico
    getCommitByHash: async (hash_version) => {
        const query = `
            SELECT e.hash_version, e.mensaje, e.fecha, e.contenido_comprimido, u.nombre_usuario as autor
            FROM etiquetas e
            JOIN usuarios u ON e.id_usuario = u.id
            WHERE e.hash_version = ?
        `;
        const [rows] = await db.execute(query, [hash_version]);
        return rows[0];
    }
};

module.exports = EtiquetaModel;