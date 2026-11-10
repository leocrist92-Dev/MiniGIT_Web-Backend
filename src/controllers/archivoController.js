const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');

// Ruta base donde guardas las carpetas de los repositorios en tu laptop/servidor
//const REPOS_BASE_DIR = path.join(__dirname, '../../../Prueba_servidor_minigit'); 
const REPOS_BASE_DIR = path.join(__dirname, '../../../../../Prueba_servidor_minigit'); 

const obtenerRutaZip = (repoName, branch, hash) => {
  return path.join(REPOS_BASE_DIR, repoName, '.commits', branch, `${hash}.zip`);
};

const obtenerEstructuraCommit = (req, res) => {
  const { repoName, branch, hash } = req.params;
  const zipPath = obtenerRutaZip(repoName, branch, hash);

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

const obtenerContenidoArchivo = (req, res) => {
  const { repoName, branch, hash } = req.params;
  const filePath = req.query.path; // Se envía por query param: ?path=src/index.js
  const zipPath = obtenerRutaZip(repoName, branch, hash);

  try {
    const zip = new AdmZip(zipPath);
    const content = zip.readAsText(filePath, 'utf8');
    
    if (content === null) {
      return res.status(404).json({ mensaje: 'Archivo no encontrado en este commit' });
    }

    res.json({ content });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al leer el contenido', error });
  }
};

const obtenerDiffCommit = (req, res) => {
  const { repoName, branch, hash } = req.params;
  const zipPath = obtenerRutaZip(repoName, branch, hash);

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
  obtenerEstructuraCommit,
  obtenerContenidoArchivo,
  obtenerDiffCommit
};