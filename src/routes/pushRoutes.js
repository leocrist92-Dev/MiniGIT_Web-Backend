// src/routes/pushRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { recibirPush } = require('../controllers/pushController');

// Crear carpeta temporal para Multer si no existe
const TEMP_UPLOADS_DIR = path.join(__dirname, '../../uploads_temporales');
if (!fs.existsSync(TEMP_UPLOADS_DIR)) {
  fs.mkdirSync(TEMP_UPLOADS_DIR, { recursive: true });
}

// Configuración de Multer
const upload = multer({
  dest: TEMP_UPLOADS_DIR,
  limits: {
    fileSize: 100 * 1024 * 1024 // Máximo 100 MB por archivo
  }
});

// Campos multipart exactos enviados desde Python:
// ('worktree', ...) y ('commits', ...)
const camposPush = upload.fields([
  { name: 'worktree', maxCount: 1 },
  { name: 'commits', maxCount: 50 }
]);

// POST /api/push (Sin verificarToken para permitir sincronización desde Desktop Python)
router.post('/', camposPush, (req, res, next) => {
  recibirPush(req, res).catch(next);
});

// Captura errores propios de Multer y devuelve la clave 'error' esperada por Python
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: `Error en recepción de archivos (${err.code}): ${err.message}`
    });
  }
  return res.status(500).json({
    error: err.message || 'Error inesperado al procesar el Push'
  });
});

module.exports = router;