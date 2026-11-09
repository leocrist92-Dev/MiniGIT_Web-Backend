const express = require('express');
const router = express.Router();
const { 
  obtenerEstructuraCommit, 
  obtenerContenidoArchivo, 
  obtenerDiffCommit 
} = require('../controllers/archivoController');

// GET /api/archivos/:repoName/:branch/:hash/estructura
router.get('/:repoName/:branch/:hash/estructura', obtenerEstructuraCommit);

// GET /api/archivos/:repoName/:branch/:hash/archivo?path=ruta/del/archivo
router.get('/:repoName/:branch/:hash/archivo', obtenerContenidoArchivo);

// GET /api/archivos/:repoName/:branch/:hash/diff
router.get('/:repoName/:branch/:hash/diff', obtenerDiffCommit);

module.exports = router;