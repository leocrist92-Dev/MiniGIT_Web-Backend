// src/controllers/pushController.js
const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Misma ruta base que usa archivoController.js para que React lea lo que Python envía
const REPOS_BASE_DIR = path.join(__dirname, '../../../../../Prueba_servidor_minigit');

// Helper de seguridad para limpiar nombres de carpetas/archivos y evitar Path Traversal (../)
const limpiarSegmento = (valor) => path.basename(String(valor || '').trim());

// Helper para borrar archivos temporales de Multer sin romper el flujo si ya fueron eliminados
const eliminarTemporalSeguro = async (rutaArchivo) => {
  if (!rutaArchivo) return;
  try {
    if (fs.existsSync(rutaArchivo)) {
      await fs.promises.unlink(rutaArchivo);
    }
  } catch (err) {
    console.warn(`Advertencia al limpiar temporal ${rutaArchivo}:`, err.message);
  }
};

/**
 * Recibe el Push desde la aplicación Desktop en Python:
 * - req.body: { usuario, proyecto, rama }
 * - req.files: { worktree: [File], commits: [File, ...] }
 */
const recibirPush = async (req, res) => {
  const archivosTemporales = [];

  try {
    // 1. Extraer y validar metadatos enviados en datos_formulario
    const usuarioRaw = req.body.usuario;
    const proyectoRaw = req.body.proyecto;
    const ramaRaw = req.body.rama;

    if (!usuarioRaw || !proyectoRaw || !ramaRaw) {
      return res.status(400).json({
        error: 'Faltan parámetros obligatorios: usuario, proyecto y rama son requeridos.',
        mensaje: 'Faltan parámetros obligatorios.'
      });
    }

    const usuario = limpiarSegmento(usuarioRaw);
    const proyecto = limpiarSegmento(proyectoRaw);
    const rama = limpiarSegmento(ramaRaw);

    if (!usuario || !proyecto || !rama) {
      return res.status(400).json({
        error: 'Los nombres de usuario, proyecto o rama contienen caracteres inválidos.'
      });
    }

    // 2. Obtener archivos subidos por Multer y registrarlos para limpieza garantizada
    const worktreeFile = req.files && req.files['worktree'] ? req.files['worktree'][0] : null;
    const commitsFiles = req.files && req.files['commits'] ? req.files['commits'] : [];

    if (worktreeFile) archivosTemporales.push(worktreeFile.path);
    for (const cFile of commitsFiles) {
      archivosTemporales.push(cFile.path);
    }

    // 3. Construir rutas destino en el servidor:
    //    mis_repositorios/<usuario>/<proyecto>/.commits/<rama>/
    const rutaBaseRama = path.join(REPOS_BASE_DIR, usuario, proyecto, '.commits', rama);
    const rutaArchivosRama = path.join(rutaBaseRama, 'archivos-rama');

    // Verificación estricta de límites de directorio
    const baseResuelta = path.resolve(REPOS_BASE_DIR);
    if (!path.resolve(rutaBaseRama).startsWith(baseResuelta + path.sep)) {
      return res.status(403).json({
        error: 'Acceso denegado: ruta fuera del directorio permitido.'
      });
    }

    // 4. Crear toda la jerarquía de carpetas si no existen (si ya existen, las reutiliza)
    await fs.promises.mkdir(rutaBaseRama, { recursive: true });
    await fs.promises.mkdir(rutaArchivosRama, { recursive: true });

    // 5. Guardar los ZIPs de los commits directamente en .commits/<rama>/<hash>.zip
    const commitsGuardados = [];
    for (const file of commitsFiles) {
      const nombreSeguroZip = limpiarSegmento(file.originalname);
      const destinoCommit = path.join(rutaBaseRama, nombreSeguroZip);

      // copyFile + unlink evita errores EXDEV si la carpeta temporal está en otro disco
      await fs.promises.copyFile(file.path, destinoCommit);
      commitsGuardados.push(nombreSeguroZip);
    }

    // 6. Actualizar la carpeta 'archivos-rama' con el contenido exacto de worktree.zip
    if (worktreeFile) {
      // Vaciar contenido viejo para que archivos eliminados localmente también desaparezcan
      await fs.promises.rm(rutaArchivosRama, { recursive: true, force: true });
      await fs.promises.mkdir(rutaArchivosRama, { recursive: true });

      // Descomprimir worktree.zip directamente dentro de 'archivos-rama'
      const zipWorktree = new AdmZip(worktreeFile.path);
      zipWorktree.extractAllTo(rutaArchivosRama, true);
    }

    console.log(
      `[PUSH EXITOSO] ${usuario}/${proyecto} (Rama: ${rama}) -> ${commitsGuardados.length} commits recibidos.`
    );

    // 7. Responder HTTP 200 (Python comprueba respuesta.status_code == 200)
    return res.status(200).json({
      message: 'Sincronización completada con éxito',
      mensaje: 'Sincronización completada con éxito',
      ruta_destino: `${usuario}/${proyecto}/.commits/${rama}`,
      commits_procesados: commitsGuardados.length,
      worktree_actualizado: Boolean(worktreeFile)
    });

  } catch (error) {
    console.error('Error al procesar el Push en el servidor:', error);
    // Python lee respuesta.json().get('error') cuando status_code != 200
    return res.status(500).json({
      error: `Fallo al procesar los archivos en el servidor: ${error.message}`,
      mensaje: 'Fallo al procesar los archivos en el servidor'
    });
  } finally {
    // 8. Eliminar siempre los archivos temporales generados por Multer
    for (const tempPath of archivosTemporales) {
      await eliminarTemporalSeguro(tempPath);
    }
  }
};

module.exports = {
  recibirPush
};