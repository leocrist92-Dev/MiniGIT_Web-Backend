const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');
//import { compararPassword, hashearPassword } from '../utils/hashUtils.js';
const HashUtil = require('../utils/hashUtils');

const AuthController = {
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            // 1. Buscar usuario por email
            let usuario = await UsuarioModel.findByEmail(email);
            if (!usuario) {
                // 1. Buscar usuario por nombre
                usuario = await UsuarioModel.findByName(email);
            }
            if (!usuario) {
                // 1. Buscar usuario por nombre de usuario
                usuario = await UsuarioModel.findByUserName(email);
            }
            if (!usuario) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
            }

            // 2. Verificar estado de la cuenta (según la lógica del script Python)
            if (usuario.estado === 'Bloqueado') {
                return res.status(403).json({ mensaje: 'Cuenta bloqueada. Contacte a soporte.' });
            }

            // 3. Comparar el hash de la contraseña usando SHA-256
            //const esValida = await bcrypt.compare(password, usuario.password_hash);
            //const esValida = password === usuario.password_hash;
            const esValida = HashUtil.compararPassword(password, usuario.password_hash);
            if (!esValida) {
                return res.status(401).json({ success: false, message: 'Credenciales inválidas.' });
            }

            // 4. Generar Token JWT
            const token = jwt.sign(
                { id: usuario.id, email: usuario.correo, username: usuario.nombre_usuario },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                success: true,
                message: 'Login exitoso',
                token: token,
                user: {
                    id: usuario.id,
                    username: usuario.nombre_usuario,
                    email: usuario.correo,
                    nombre: usuario.nombre
                }
            });
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }
    },

    register: async (req, res) => {
        try {
            const { username, email, password, nombre } = req.body;

            // Verificar si ya existe
            const existe = await UsuarioModel.findByEmail(email);
            if (existe) {
                return res.status(400).json({ success: false, message: 'El correo ya está en uso.' });
            }

            // Encriptar password
            const salt = await bcrypt.genSalt(10);
            //const password_hash = await bcrypt.hash(password, salt);
            const password_hash = HashUtil.hashearPassword(req.body.password);

            // Crear usuario
            const userId = await UsuarioModel.create({ username, email, password_hash, nombre });

            res.status(201).json({ success: true, message: 'Usuario registrado exitosamente', userId });
        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({ success: false, message: 'Error al registrar usuario.' });
        }
    }
};

module.exports = AuthController;