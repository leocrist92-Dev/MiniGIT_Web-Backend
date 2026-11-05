const ProyectoModel = require('../models/proyectoModel');

const ProyectoController = {
    // Traer todos los proyectos del usuario logueado
    obtenerProyectos: async (req, res) => {
        try {
            const id_usuario = req.user.id; // Viene del authMiddleware
            const proyectos = await ProyectoModel.getAllByUserId(id_usuario);
            
            res.json({ success: true, data: proyectos });
        } catch (error) {
            console.error('Error obteniendo proyectos:', error);
            res.status(500).json({ success: false, message: 'Error al obtener repositorios.' });
        }
    },

    // Traer el detalle de un proyecto
    obtenerProyectoPorId: async (req, res) => {
        try {
            const id_proyecto = req.params.id;
            const id_usuario = req.user.id;

            const proyecto = await ProyectoModel.getDetalle(id_proyecto, id_usuario);
            if (!proyecto) {
                return res.status(404).json({ success: false, message: 'Repositorio no encontrado o sin acceso.' });
            }

            res.json({ success: true, data: proyecto });
        } catch (error) {
            console.error('Error obteniendo detalle de proyecto:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }
    },

    // Crear un nuevo repositorio
    crearProyecto: async (req, res) => {
        try {
            const { nombre, descripcion, visibilidad } = req.body;
            const id_usuario = req.user.id;

            if (!nombre) {
                return res.status(400).json({ success: false, message: 'El nombre del repositorio es obligatorio.' });
            }

            const nuevoId = await ProyectoModel.create({
                nombre, 
                descripcion, 
                visibilidad: visibilidad || 'Privado', 
                id_usuario
            });

            res.status(201).json({ 
                success: true, 
                message: 'Repositorio creado exitosamente', 
                proyecto_id: nuevoId 
            });
        } catch (error) {
            console.error('Error creando proyecto:', error);
            res.status(500).json({ success: false, message: 'Error al crear repositorio.' });
        }
    }
};

module.exports = ProyectoController;