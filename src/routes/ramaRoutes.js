const express = require('express');
const router = express.Router();
const RamaController = require('../controllers/ramaController');
const verificarToken = require('../middlewares/authMiddleware');

// Rutas base: /api/proyectos (Montado desde server.js)
router.use(verificarToken);

// Obtener ramas de un proyecto (ej: /api/proyectos/5/commits)
router.get('/:id/ramas', RamaController.obtenerRamas); // <-- Nueva ruta GET /api/proyectos/:id/ramas



module.exports = router;