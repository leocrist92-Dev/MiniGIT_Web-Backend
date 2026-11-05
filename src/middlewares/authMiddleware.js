const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    // Leer el token de los headers (formato: "Bearer token_aqui")
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Acceso denegado. No se proporcionó un token.' });
    }

    try {
        // Verificar el token con la clave secreta
        const decodificado = jwt.verify(token, process.env.JWT_SECRET);
        
        // Agregar los datos del usuario (id, email) al objeto request para usarlo en los controladores
        req.user = decodificado;
        next(); // Continuar con la siguiente función (el controlador)
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token inválido o expirado.' });
    }
};

module.exports = verificarToken;