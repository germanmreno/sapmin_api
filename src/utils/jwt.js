const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Configuración JWT
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

/**
 * Genera un par de tokens (access + refresh)
 * @param {Object} payload - Datos del usuario para el token
 * @returns {Object} { accessToken, refreshToken, expiresAt }
 */
function generateTokenPair(payload) {
  const accessToken = jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
    issuer: 'produccion-app',
    audience: 'produccion-app-users',
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    {
      expiresIn: REFRESH_TOKEN_EXPIRY,
      issuer: 'produccion-app',
      audience: 'produccion-app-users',
    }
  );

  // Calcular fecha de expiración del access token (1 hora)
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  return {
    accessToken,
    refreshToken,
    expiresAt,
  };
}

/**
 * Verifica un access token
 * @param {string} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_ACCESS_SECRET, {
      issuer: 'produccion-app',
      audience: 'produccion-app-users',
    });
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}

/**
 * Verifica un refresh token
 * @param {string} token - Refresh token a verificar
 * @returns {Object} Payload decodificado
 */
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'produccion-app',
      audience: 'produccion-app-users',
    });
  } catch (error) {
    throw new Error('Refresh token inválido o expirado');
  }
}

/**
 * Extrae el token del header Authorization
 * @param {string} authHeader - Header Authorization
 * @returns {string|null} Token extraído
 */
function extractTokenFromHeader(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

module.exports = {
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
