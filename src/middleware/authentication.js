const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const Session = require('../models/Session');
const User = require('../models/User');

/**
 * Middleware de autenticación
 * Verifica que el usuario esté autenticado y la sesión sea válida
 */
async function authenticate(req, res, next) {
  try {
    // Extraer token del header
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        code: 'NO_TOKEN',
      });
    }

    // Verificar token JWT
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      return res.status(401).json({
        error: 'Token inválido o expirado',
        code: 'INVALID_TOKEN',
      });
    }

    // Buscar sesión en base de datos
    const session = await Session.findByAccessToken(token);
    if (!session) {
      return res.status(401).json({
        error: 'Sesión no encontrada',
        code: 'SESSION_NOT_FOUND',
      });
    }

    // Verificar si la sesión está activa
    if (!Session.isSessionActive(session)) {
      return res.status(401).json({
        error: 'Sesión inactiva o expirada',
        code: 'SESSION_INACTIVE',
      });
    }

    // Actualizar última actividad
    await Session.updateActivity(token);

    // Agregar información del usuario a la request
    req.user = session.user;
    req.session = {
      id: session.id,
      accessToken: token,
      lastActivity: session.lastActivity,
    };

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR',
    });
  }
}

/**
 * Middleware de autenticación opcional
 * No falla si no hay token, pero si hay token lo valida
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      // No hay token, continuar sin autenticación
      req.user = null;
      req.session = null;
      return next();
    }

    // Si hay token, validarlo
    return authenticate(req, res, next);
  } catch (error) {
    // En caso de error, continuar sin autenticación
    req.user = null;
    req.session = null;
    next();
  }
}

/**
 * Middleware para verificar que el usuario esté activo
 */
function requireActiveUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      error: 'Autenticación requerida',
      code: 'AUTH_REQUIRED',
    });
  }

  if (!req.user.isActive) {
    return res.status(403).json({
      error: 'Usuario inactivo',
      code: 'USER_INACTIVE',
    });
  }

  next();
}

/**
 * Middleware para verificar que el usuario sea el propietario del recurso
 */
function requireOwnership(userIdField = 'userId') {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdField] || req.body[userIdField];

    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED',
      });
    }

    if (req.user.id !== parseInt(resourceUserId)) {
      return res.status(403).json({
        error: 'Acceso denegado: no es propietario del recurso',
        code: 'NOT_OWNER',
      });
    }

    next();
  };
}

/**
 * Middleware para rate limiting básico por IP
 */
const rateLimitStore = new Map();

function rateLimit(maxRequests = 100, windowMs = 15 * 60 * 1000) {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpiar entradas antiguas
    if (rateLimitStore.has(clientIp)) {
      const requests = rateLimitStore.get(clientIp);
      const validRequests = requests.filter(
        (timestamp) => timestamp > windowStart
      );
      rateLimitStore.set(clientIp, validRequests);
    }

    // Obtener requests actuales
    const currentRequests = rateLimitStore.get(clientIp) || [];

    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Demasiadas solicitudes',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000),
      });
    }

    // Agregar request actual
    currentRequests.push(now);
    rateLimitStore.set(clientIp, currentRequests);

    next();
  };
}

/**
 * Rate limiting específico para endpoints de autenticación
 */
const authRateLimit = rateLimit(5, 15 * 60 * 1000); // 5 intentos por 15 minutos

module.exports = {
  authenticate,
  optionalAuth,
  requireActiveUser,
  requireOwnership,
  rateLimit,
  authRateLimit,
};
