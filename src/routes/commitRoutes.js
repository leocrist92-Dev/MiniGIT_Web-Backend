const express = require('express');
const router = express.Router();
const CommitController = require('../controllers/commitController');
const verificarToken = require('../middlewares/authMiddleware');

// Rutas base: /api/proyectos (Montado desde server.js)
router.use(verificarToken);

// Obtener commits de un proyecto (ej: /api/proyectos/5/commits)
router.get('/:id/commits', CommitController.obtenerCommitsDeProyecto);

// Obtener un commit específico por su hash (ej: /api/proyectos/commits/a1b2c3d)
router.get('/commits/:hash', CommitController.obtenerDetalleCommit);

module.exports = router;