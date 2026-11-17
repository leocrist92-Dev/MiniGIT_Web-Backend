const ProyectoModel = require('../models/proyectoModel');
const RamaModel = require('../models/ramaModel');

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
            const { nombre, descripcion, visibilidad, ruta } = req.body;
            const id_usuario = req.user.id;

            // Garantizar que la rama inicial sea 'main' si no se especifica otra
            const ramaInicial = (req.body.rama_defecto || req.body.defaultBranch || 'main').trim() || 'main';

            // Recibir y normalizar la ruta completa hasta la carpeta padre (sin barras finales sobrantes)
            const rutaPadre = String(req.body.ruta || '')
            .trim()
            .replace(/[\\/]+$/, '');

            if (!nombre) {
                return res.status(400).json({ success: false, message: 'El nombre del repositorio es obligatorio.' });
            }            

            const nuevoId = await ProyectoModel.create({
                nombre, 
                descripcion, 
                visibilidad: visibilidad || 'Privado', 
                id_usuario,
                ruta
            });

            console.log(ramaInicial)
            console.log(nuevoId)
            idp = parseInt(nuevoId, 10);
            const idRamaActiva = await RamaModel.createRama(
                nuevoId,
                ramaInicial
            );

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