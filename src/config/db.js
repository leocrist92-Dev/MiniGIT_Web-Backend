const mysql = require('mysql2');
require('dotenv').config();

// Crear un pool de conexiones usando Promesas (async/await)
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const promisePool = pool.promise();

// Probar la conexión al iniciar
promisePool.getConnection()
    .then(connection => {
        console.log('✅ Conexión a la base de datos MySQL establecida exitosamente.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error conectando a la base de datos:', err.message);
    });

module.exports = promisePool;