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

  console.log("ruta: " + zipPath);
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

  try {
    const zip = new AdmZip(zipPath);
    const diffContent = zip.readAsText('diff/diff.txt', 'utf8');
    
    if (!diffContent) {
      return res.json([]); // Si no hay diff, devolvemos array vacío
    }

    // Parseo básico del diff.txt para la interfaz (DetalleCommitPage)
    const lineas = diffContent.split('\n');
    const diffFormateado = lineas.map((linea, index) => {
      let type = 'normal';
      if (linea.startsWith('+')) type = 'added';
      else if (linea.startsWith('-')) type = 'deleted';

      return {
        oldLine: type === 'deleted' ? index + 1 : '',
        newLine: type === 'added' ? index + 1 : '',
        text: linea,
        type
      };
    });

    res.json(diffFormateado);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al leer el diff', error });
  }
};

module.exports = {
  obtenerEstructuraCommit,
  obtenerContenidoArchivo,
  obtenerDiffCommit
};