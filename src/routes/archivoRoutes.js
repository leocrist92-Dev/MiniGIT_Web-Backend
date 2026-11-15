const express = require('express');
const router = express.Router();
const { 
  obtenerEstructuraRama, 
  obtenerContenidoArchivo,
  clonarRama,
  obtenerEstructuraCommit, 
  obtenerDiffCommit 
} = require('../controllers/archivoController');
const verificarToken = require('../middlewares/authMiddleware');

// Proteger todas las rutas de archivos con autenticación JWT
router.use(verificarToken);

// 1. Rutas basadas en el estado actual de la rama (carpeta 'archivos-rama')
// GET /api/archivos/:repoName/:branch/estructura
router.get('/:username/:repoName/:branch/estructura', obtenerEstructuraRama);

// GET /api/archivos/:repoName/:branch/archivo?path=ruta/del/archivo
router.get('/:username/:repoName/:branch/archivo', obtenerContenidoArchivo);

router.get('/:username/:repoName/:branch/clonar', clonarRama);

// 2. Rutas basadas en un commit específico (paquetes <hash>.zip)
router.get('/:username/:repoName/:branch/:hash/estructura', obtenerEstructuraCommit);

// GET /api/archivos/:repoName/:branch/:hash/diff
router.get('/:username/:repoName/:branch/:hash/diff', obtenerDiffCommit);

module.exports = router;