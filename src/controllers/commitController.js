const EtiquetaModel = require('../models/etiquetaModel');

const CommitController = {
    // Obtener todos los commits (etiquetas) de un repositorio
    obtenerCommitsDeProyecto: async (req, res) => {
        try {
            const id_proyecto = req.params.id; // Viene de la URL /api/proyectos/:id/commits
            
            const commits = await EtiquetaModel.getCommitsByProyecto(id_proyecto);
            
            res.json({ success: true, data: commits });
        } catch (error) {
            console.error('Error obteniendo commits:', error);
            res.status(500).json({ success: false, message: 'Error al cargar el historial de commits.' });
        }
    },

    // Obtener detalle de un commit en específico por su Hash
    obtenerDetalleCommit: async (req, res) => {
        try {
            const hash = req.params.hash;
            
            const commit = await EtiquetaModel.getCommitByHash(hash);
            
            if (!commit) {
                return res.status(404).json({ success: false, message: 'Commit no encontrado.' });
            }

            res.json({ success: true, data: commit });
        } catch (error) {
            console.error('Error obteniendo detalle del commit:', error);
            res.status(500).json({ success: false, message: 'Error interno.' });
        }
    }
};

module.exports = CommitController;