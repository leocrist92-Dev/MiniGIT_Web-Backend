const db = require('../config/db');

const UsuarioModel = {
    // Buscar usuario por correo para el Login
    findByEmail: async (email) => {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE correo = ?', [email]);
        return rows[0];
    },

    // Buscar usuario por nombre para el Login
    findByName: async (nombre) => {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE nombre = ?', [nombre]);
        return rows[0];
    },

    // Buscar usuario por nombre de usuario para el Login
    findByUserName: async (userName) => {
        const [rows] = await db.execute('SELECT * FROM usuarios WHERE nombre_usuario = ?', [userName]);
        return rows[0];
    },

    // Buscar usuario por ID
    findById: async (id) => {
        const [rows] = await db.execute('SELECT id, nombre_usuario, correo, nombre FROM usuarios WHERE id = ?', [id]);
        return rows[0];
    },

    // Registrar un nuevo usuario
    create: async (usuario) => {
        const query = 'INSERT INTO usuarios (nombre_usuario, correo, password_hash, nombre) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(query, [
            usuario.username, 
            usuario.email, 
            usuario.password_hash, 
            usuario.nombre
        ]);
        return result.insertId;
    }
};

module.exports = UsuarioModel;