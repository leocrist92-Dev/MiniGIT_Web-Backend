const express = require('express');
const router = express.Router();
const ProyectoController = require('../controllers/proyectoController');
const verificarToken = require('../middlewares/authMiddleware');

// Rutas base: /api/proyectos
// Todas estas rutas están protegidas por el middleware de autenticación
router.use(verificarToken);

router.get('/', ProyectoController.obtenerProyectos);
router.get('/:id', ProyectoController.obtenerProyectoPorId);
router.post('/', ProyectoController.crearProyecto);

module.exports = router;