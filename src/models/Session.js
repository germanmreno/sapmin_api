const { PrismaClient } = require('@prisma/client');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');

const prisma = new PrismaClient();

// Configuración de inactividad (1 hora en milisegundos)
const INACTIVITY_TIMEOUT = 60 * 60 * 1000; // 1 hora

class Session {
  /**
   * Crea una nueva sesión para el usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Tokens y información de sesión
   */
  static async create(userId) {
    // Generar tokens
    const { accessToken, refreshToken, expiresAt } = generateTokenPair({
      userId,
      type: 'access',
    });

    // Crear sesión en base de datos
    const session = await prisma.userSession.create({
      data: {
        userId: parseInt(userId),
        accessToken,
        refreshToken,
        expiresAt,
        lastActivity: new Date(),
      },
    });

    return {
      sessionId: session.id,
      accessToken,
      refreshToken,
      expiresAt,
      expiresIn: 3600, // 1 hora en segundos
    };
  }

  /**
   * Busca sesión por access token
   * @param {string} accessToken - Access token
   * @returns {Promise<Object|null>} Sesión encontrada
   */
  static async findByAccessToken(accessToken) {
    return await prisma.userSession.findUnique({
      where: {
        accessToken,
        isRevoked: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Busca sesión por refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object|null>} Sesión encontrada
   */
  static async findByRefreshToken(refreshToken) {
    return await prisma.userSession.findUnique({
      where: {
        refreshToken,
        isRevoked: false,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
          },
        },
      },
    });
  }

  /**
   * Actualiza la última actividad de una sesión
   * @param {string} accessToken - Access token
   * @returns {Promise<Object|null>} Sesión actualizada
   */
  static async updateActivity(accessToken) {
    try {
      return await prisma.userSession.update({
        where: {
          accessToken,
          isRevoked: false,
        },
        data: {
          lastActivity: new Date(),
        },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Verifica si una sesión está activa y no ha expirado por inactividad
   * @param {Object} session - Objeto de sesión
   * @returns {boolean} True si la sesión está activa
   */
  static isSessionActive(session) {
    if (!session || session.isRevoked) {
      return false;
    }

    // Verificar si el usuario está activo
    if (!session.user || !session.user.isActive) {
      return false;
    }

    // Verificar inactividad (1 hora)
    const now = new Date();
    const lastActivity = new Date(session.lastActivity);
    const timeSinceActivity = now.getTime() - lastActivity.getTime();

    if (timeSinceActivity > INACTIVITY_TIMEOUT) {
      // Marcar sesión como revocada por inactividad
      this.revoke(session.accessToken, 'inactivity');
      return false;
    }

    // Verificar expiración del token
    if (now > new Date(session.expiresAt)) {
      return false;
    }

    return true;
  }

  /**
   * Renueva tokens usando refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} Nuevos tokens
   */
  static async refresh(refreshToken) {
    // Verificar refresh token
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new Error('Refresh token inválido');
    }

    // Buscar sesión
    const session = await this.findByRefreshToken(refreshToken);
    if (!session) {
      throw new Error('Sesión no encontrada');
    }

    if (!session.user.isActive) {
      throw new Error('Usuario inactivo');
    }

    // Generar nuevos tokens
    const {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
    } = generateTokenPair({
      userId: session.userId,
      type: 'access',
    });

    // Actualizar sesión
    const updatedSession = await prisma.userSession.update({
      where: { id: session.id },
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt,
        lastActivity: new Date(),
      },
    });

    return {
      sessionId: updatedSession.id,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresAt,
      expiresIn: 3600,
    };
  }

  /**
   * Revoca una sesión
   * @param {string} accessToken - Access token de la sesión
   * @param {string} reason - Razón de revocación
   * @returns {Promise<boolean>} True si se revocó exitosamente
   */
  static async revoke(accessToken, reason = 'manual') {
    try {
      await prisma.userSession.update({
        where: { accessToken },
        data: {
          isRevoked: true,
          lastActivity: new Date(),
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Revoca todas las sesiones de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<number>} Número de sesiones revocadas
   */
  static async revokeAllUserSessions(userId) {
    const result = await prisma.userSession.updateMany({
      where: {
        userId: parseInt(userId),
        isRevoked: false,
      },
      data: {
        isRevoked: true,
        lastActivity: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Limpia sesiones expiradas y revocadas
   * @returns {Promise<number>} Número de sesiones eliminadas
   */
  static async cleanup() {
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 días atrás

    const result = await prisma.userSession.deleteMany({
      where: {
        OR: [
          { isRevoked: true },
          { expiresAt: { lt: new Date() } },
          { lastActivity: { lt: cutoffDate } },
        ],
      },
    });

    return result.count;
  }

  /**
   * Obtiene estadísticas de sesiones
   * @returns {Promise<Object>} Estadísticas
   */
  static async getStats() {
    const [total, active, revoked] = await Promise.all([
      prisma.userSession.count(),
      prisma.userSession.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      }),
      prisma.userSession.count({
        where: { isRevoked: true },
      }),
    ]);

    return {
      total,
      active,
      revoked,
      expired: total - active - revoked,
    };
  }
}

module.exports = Session;
