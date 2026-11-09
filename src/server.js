const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
//const authRoutes = require('./src/routes/authRoutes');
//const proyectoRoutes = require('./src/routes/proyectoRoutes');
//const commitRoutes = require('./src/routes/commitRoutes');
const authRoutes = require('./routes/authRoutes');
const proyectoRoutes = require('./routes/proyectoRoutes');
const commitRoutes = require('./routes/commitRoutes');
const ramaRoutes = require('./routes/ramaRoutes');
const archivoRoutes = require('./routes/archivoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globales
app.use(cors()); // Permite peticiones desde React (ej. localhost:5173)
app.use(express.json()); // Permite recibir datos en formato JSON en req.body

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/proyectos', commitRoutes); // Anidado lógicamente con proyectos
app.use('/api/proyectos', ramaRoutes);
app.use('/api/archivos', archivoRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenido a la API de Mini-Git' });
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en el puerto ${PORT}`);
    console.log(`👉 http://localhost:${PORT}`);
});