const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Ruta base donde guardas las carpetas de los repositorios en tu laptop/servidor
//const REPOS_BASE_DIR = path.join(__dirname, '../../../Prueba_servidor_minigit'); 
const REPOS_BASE_DIR = path.join(__dirname, '../../../../../Prueba_servidor_minigit'); 

// Helper seguro para evitar caracteres de escape (../) en segmentos de ruta
const limpiarSegmento = (segmento) => path.basename(segmento || '');

// Helper 1: Ruta al archivo ZIP de un commit histórico
const obtenerRutaZip = (username, repoName, branch, hash) => {
  return path.join(
    REPOS_BASE_DIR,
    limpiarSegmento(username),
    limpiarSegmento(repoName),
    '.commits',
    limpiarSegmento(branch),
    `${limpiarSegmento(hash)}.zip`
  );
};

// Helper 2: Ruta a la carpeta física con los archivos actuales de la rama
const obtenerRutaArchivosRama = (username, repoName, branch) => {
  return path.join(
    REPOS_BASE_DIR,
    limpiarSegmento(username),
    limpiarSegmento(repoName),
    '.commits',
    limpiarSegmento(branch),
    'archivos-rama'
  );
};

// Helper 3: Escaneo recursivo de carpetas y archivos dentro de 'archivos-rama'
const escanearDirectorioRecursivo = async (dirBase, dirActual = dirBase) => {
  const entradas = await fs.promises.readdir(dirActual, { withFileTypes: true });
  let resultados = [];

  // Ordenar: primero carpetas, luego archivos (ambos alfabéticamente)
  entradas.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const entrada of entradas) {
    const rutaCompleta = path.join(dirActual, entrada.name);
    // Normalizar separadores a '/' para compatibilidad entre Windows y navegadores web
    const rutaRelativa = path.relative(dirBase, rutaCompleta).split(path.sep).join('/');
    const stats = await fs.promises.stat(rutaCompleta);

    if (entrada.isDirectory()) {
      resultados.push({
        name: rutaRelativa,
        path: rutaRelativa,
        type: 'folder',
        msg: 'Directorio de proyecto',
        date: stats.mtime.toLocaleDateString()
      });
      const subResultados = await escanearDirectorioRecursivo(dirBase, rutaCompleta);
      resultados = resultados.concat(subResultados);
    } else {
      resultados.push({
        name: rutaRelativa,
        path: rutaRelativa,
        type: 'file',
        size: stats.size,
        msg: 'Archivo actual de rama',
        date: stats.mtime.toLocaleDateString()
      });
    }
  }

  return resultados;
};

// ============================================================================
// 1. NUEVA FUNCIÓN: Obtener estructura completa desde 'archivos-rama'
//    Soporta parámetro opcional ?dir=ruta/subcarpeta
// ============================================================================
const obtenerEstructuraRama = async (req, res) => {
  const { username, repoName, branch } = req.params;
  const subDir = req.query.dir ? String(req.query.dir).trim() : '';

  const rutaBaseRama = path.resolve(obtenerRutaArchivosRama(username, repoName, branch));
  const rutaObjetivo = subDir ? path.resolve(rutaBaseRama, subDir) : rutaBaseRama;

  // Protección estricta contra Path Traversal (impide salir de 'archivos-rama' con ../)
  if (!rutaObjetivo.startsWith(rutaBaseRama + path.sep) && rutaObjetivo !== rutaBaseRama) {
    return res.status(403).json({ mensaje: 'Acceso denegado: ruta de carpeta no permitida' });
  }

  try {
    if (!fs.existsSync(rutaObjetivo)) {
      return res.json([]);
    }

    const statsDir = await fs.promises.stat(rutaObjetivo);
    if (!statsDir.isDirectory()) {
      return res.status(400).json({ mensaje: 'La ruta solicitada no corresponde a un directorio' });
    }

    // Leer ÚNICAMENTE los archivos y subcarpetas directos del nivel actual
    const entradas = await fs.promises.readdir(rutaObjetivo, { withFileTypes: true });

    // Ordenar: primero carpetas, luego archivos (ambos alfabéticamente)
    entradas.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });

    const estructura = [];

    for (const entrada of entradas) {
      const rutaCompleta = path.join(rutaObjetivo, entrada.name);
      // Ruta relativa completa desde 'archivos-rama' (ej: "src/controllers/user.js")
      const rutaRelativa = path.relative(rutaBaseRama, rutaCompleta).split(path.sep).join('/');
      const stats = await fs.promises.stat(rutaCompleta);

      estructura.push({
        name: entrada.name, // <-- SOLO el nombre corto de la carpeta o archivo
        path: rutaRelativa, // <-- Ruta relativa completa para navegar o abrir el archivo
        type: entrada.isDirectory() ? 'folder' : 'file',
        size: entrada.isDirectory() ? null : stats.size,
        msg: entrada.isDirectory() ? 'Directorio de proyecto' : 'Archivo actual de rama',
        date: stats.mtime.toLocaleDateString()
      });
    }

    return res.json(estructura);
  } catch (error) {
    console.error('Error al leer el directorio de archivos-rama:', error);
    return res.status(500).json({ mensaje: 'Error al leer los archivos de la carpeta en el servidor' });
  }
};

// ============================================================================
// 2. FUNCIÓN MODIFICADA: Leer contenido de archivo directamente desde 'archivos-rama'
// ============================================================================
const obtenerContenidoArchivo = async (req, res) => {
  const { username, repoName, branch } = req.params;
  const filePath = req.query.path; // Ejemplo: ?path=src/index.js

  if (!filePath) {
    return res.status(400).json({ mensaje: 'El parámetro query "path" es obligatorio' });
  }

  const rutaBaseRama = path.resolve(obtenerRutaArchivosRama(username, repoName, branch));
  const rutaArchivo = path.resolve(rutaBaseRama, filePath);

  // Protección de seguridad contra Path Traversal (../)
  if (!rutaArchivo.startsWith(rutaBaseRama + path.sep) && rutaArchivo !== rutaBaseRama) {
    return res.status(403).json({ mensaje: 'Acceso denegado: ruta de archivo no permitida' });
  }

  try {
    if (!fs.existsSync(rutaArchivo)) {
      return res.status(404).json({ mensaje: 'El archivo solicitado no existe en la rama actual' });
    }

    const stats = await fs.promises.stat(rutaArchivo);
    if (stats.isDirectory()) {
      return res.status(400).json({ mensaje: 'La ruta corresponde a una carpeta, no a un archivo' });
    }

    const content = await fs.promises.readFile(rutaArchivo, 'utf8');
    return res.json({
      name: path.basename(rutaArchivo),
      path: filePath,
      content,
      lines: content.split('\n').length
    });
  } catch (error) {
    console.error('Error al leer el archivo desde archivos-rama:', error);
    return res.status(500).json({ mensaje: 'Error interno al leer el contenido del archivo' });
  }
};

// ============================================================================
// 3. NUEVA FUNCIÓN: Empaquetar 'archivos-rama' en ZIP y enviarlo para Clonar
// ============================================================================
const clonarRama = async (req, res) => {
  const { username, repoName, branch } = req.params;
  const rutaRama = obtenerRutaArchivosRama(username, repoName, branch);

  try {
    if (!fs.existsSync(rutaRama)) {
      return res.status(404).json({ mensaje: 'No existen archivos en esta rama para clonar' });
    }

    const zip = new AdmZip();
    // Comprime recursivamente todo el contenido de 'archivos-rama' en la raíz del ZIP
    zip.addLocalFolder(rutaRama);

    const zipBuffer = zip.toBuffer();
    const nombreDescarga = `${repoName}-${branch}.zip`;

    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${nombreDescarga}"`,
      'Content-Length': zipBuffer.length
    });

    return res.send(zipBuffer);
  } catch (error) {
    console.error('Error al generar el ZIP para clonar:', error);
    return res.status(500).json({ mensaje: 'Error al empaquetar los archivos del proyecto' });
  }
};

const obtenerEstructuraCommit = (req, res) => {
  const { username, repoName, branch, hash } = req.params;
  const zipPath = obtenerRutaZip(username, repoName, branch, hash);

  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ mensaje: 'Commit no encontrado en el disco' });
  }

  try {
    const zip = new AdmZip(zipPath);
    const zipEntries = zip.getEntries();
    
    const estructura = [];
    
    zipEntries.forEach(entry => {
      // Ignoramos la carpeta diff y su contenido para la vista de código
      if (!entry.entryName.startsWith('diff/')) {
        estructura.push({
          name: entry.name || entry.entryName, // Nombre del archivo o carpeta
          path: entry.entryName,
          type: entry.isDirectory ? 'folder' : 'file',
          msg: 'Archivo del commit',
          date: new Date().toLocaleDateString() // Podrías sacar la fecha de la BD cruzando el hash
        });
      }
    });

    res.json(estructura);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al leer el archivo ZIP', error });
  }
};

const obtenerDiffCommit = (req, res) => {
  const { username, repoName, branch, hash } = req.params;
  const zipPath = obtenerRutaZip(username, repoName, branch, hash);

  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ mensaje: 'Commit no encontrado en el disco' });
  }

  try {
    const zip = new AdmZip(zipPath);
    const diffContent = zip.readAsText('diff/diff.txt', 'utf8');

    if (!diffContent) {
      return res.json([]);
    }

    const lineas = diffContent.split('\n');
    const diffFormateado = [];

    let oldLineNum = 0;
    let newLineNum = 0;

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];

      // Ignorar líneas completamente vacías al final del archivo
      if (i === lineas.length - 1 && linea.trim() === '') continue;

      // 1. Detectar cabeceras de bloques git diff (ej: @@ -1,3 +1,5 @@)
      if (linea.startsWith('@@')) {
        const match = linea.match(/@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
        if (match) {
          oldLineNum = parseInt(match[1], 10);
          newLineNum = parseInt(match[2], 10);
        }
        diffFormateado.push({
          oldLine: '',
          newLine: '',
          text: linea,
          type: 'hunk'
        });
        continue;
      }

      // 2. Cabeceras de nombres de archivos (--- a/file y +++ b/file)
      if (linea.startsWith('---') || linea.startsWith('+++')) {
        diffFormateado.push({
          oldLine: '',
          newLine: '',
          text: linea,
          type: linea.startsWith('---') ? 'deleted-header' : 'added-header'
        });
        continue;
      }

      // 3. Línea eliminada (-)
      if (linea.startsWith('-')) {
        diffFormateado.push({
          oldLine: oldLineNum++,
          newLine: '',
          text: linea,
          type: 'deleted'
        });
        newLineNum++
      }
      // 4. Línea añadida (+)
      else if (linea.startsWith('+')) {
        diffFormateado.push({
          oldLine: '',
          newLine: newLineNum++,
          text: linea,
          type: 'added'
        });
        oldLineNum++
      }
      // 5. Línea normal de contexto (sin cambios)
      else {
        diffFormateado.push({
          oldLine: oldLineNum++,
          newLine: newLineNum++,
          text: linea,
          type: 'normal'
        });
      }
    }

    return res.json(diffFormateado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al leer el diff', error });
  }
};

module.exports = {
  obtenerEstructuraRama,
  obtenerContenidoArchivo,
  clonarRama,
  obtenerEstructuraCommit,
  obtenerDiffCommit
};