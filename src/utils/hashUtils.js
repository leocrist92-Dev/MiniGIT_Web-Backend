const crypto = require('crypto');

/**
 * Replica exactamente la función _hashear() de Python:
 * hashlib.sha256(texto.encode()).hexdigest()
 */
const hashearPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Compara la contraseña ingresada en texto plano con el hash de MySQL
 */
const compararPassword = (passwordIngresada, hashAlmacenado) => {
  const hashIngresado = hashearPassword(passwordIngresada);
  return hashIngresado === hashAlmacenado;
};

module.exports = {
  hashearPassword,
  compararPassword
};