const Session = require('../models/Session');

/**
 * Middleware para rastrear actividad del usuario
 * Actualiza el timestamp de última actividad en cada request autenticado
 */
async function trackActivity(req, res, next) {
  // Solo rastrear si el usuario está autenticado
  if (req.user && req.session && req.session.accessToken) {
    try {
      // Actualizar última actividad de forma asíncrona
      // No esperamos la respuesta para no bloquear el request
      Session.updateActivity(req.session.accessToken).catch((error) => {
        console.error('Error actualizando actividad:', error);
      });

      // Agregar timestamp de actividad actual a la response
      res.set('X-Last-Activity', new Date().toISOString());
    } catch (error) {
      // No fallar el request por errores de tracking
      console.error('Error en trackActivity:', error);
    }
  }

  next();
}

/**
 * Middleware para verificar inactividad y logout automático
 * Debe ejecutarse después del middleware de autenticación
 */
async function checkInactivity(req, res, next) {
  if (req.user && req.session) {
    try {
      // Buscar sesión actual
      const session = await Session.findByAccessToken(req.session.accessToken);

      if (session && !Session.isSessionActive(session)) {
        // Sesión inactiva, revocar y retornar error
        await Session.revoke(req.session.accessToken, 'inactivity');

        return res.status(401).json({
          error: 'Sesión expirada por inactividad',
          code: 'SESSION_EXPIRED_INACTIVITY',
          message:
            'Su sesión ha expirado debido a inactividad. Por favor, inicie sesión nuevamente.',
        });
      }
    } catch (error) {
      console.error('Error verificando inactividad:', error);
      // En caso de error, continuar con el request
    }
  }

  next();
}

/**
 * Middleware combinado que rastrea actividad y verifica inactividad
 */
async function activityMiddleware(req, res, next) {
  // Primero verificar inactividad
  await checkInactivity(req, res, (error) => {
    if (error) return next(error);

    // Si no hay error, rastrear actividad
    trackActivity(req, res, next);
  });
}

/**
 * Función para limpiar sesiones inactivas (para ejecutar periódicamente)
 */
async function cleanupInactiveSessions() {
  try {
    const cleaned = await Session.cleanup();
    console.log(`Limpieza de sesiones: ${cleaned} sesiones eliminadas`);
    return cleaned;
  } catch (error) {
    console.error('Error en limpieza de sesiones:', error);
    return 0;
  }
}

/**
 * Inicializar limpieza automática de sesiones
 * Ejecuta cada 1 hora
 */
function initializeSessionCleanup() {
  // Ejecutar inmediatamente
  cleanupInactiveSessions();

  // Programar ejecución cada hora
  setInterval(cleanupInactiveSessions, 60 * 60 * 1000);

  console.log('Limpieza automática de sesiones inicializada (cada 1 hora)');
}

/**
 * Middleware para logging de actividad (opcional)
 */
function logActivity(req, res, next) {
  if (req.user) {
    const logData = {
      userId: req.user.id,
      email: req.user.email,
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };

    // Aquí se puede integrar con un sistema de logging más avanzado
    // Por ahora solo log en consola para requests importantes
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      console.log('User Activity:', JSON.stringify(logData));
    }
  }

  next();
}

/**
 * Obtener estadísticas de actividad
 */
async function getActivityStats() {
  try {
    const sessionStats = await Session.getStats();

    return {
      sessions: sessionStats,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas de actividad:', error);
    return null;
  }
}

module.exports = {
  trackActivity,
  checkInactivity,
  activityMiddleware,
  cleanupInactiveSessions,
  initializeSessionCleanup,
  logActivity,
  getActivityStats,
};
