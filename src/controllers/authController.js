const User = require('../models/User');
const Session = require('../models/Session');
const { sanitizeInput } = require('../utils/password');

class AuthController {
  /**
   * Registro de nuevo usuario
   */
  static async register(req, res) {
    try {
      const { email, password } = req.body;

      // Validar campos requeridos
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y contraseña son requeridos',
          code: 'MISSING_FIELDS',
        });
      }

      // Crear usuario
      const user = await User.create({
        email: sanitizeInput(email),
        password,
      });

      // Crear sesión inicial
      const sessionData = await Session.create(user.id);

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        auth: {
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          expiresIn: sessionData.expiresIn,
          expiresAt: sessionData.expiresAt,
        },
      });
    } catch (error) {
      console.error('Error en registro:', error);

      // Errores específicos
      if (
        error.message.includes('Email inválido') ||
        error.message.includes('contraseña') ||
        error.message.includes('ya está registrado')
      ) {
        return res.status(400).json({
          error: error.message,
          code: 'VALIDATION_ERROR',
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Inicio de sesión
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar campos requeridos
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email y contraseña son requeridos',
          code: 'MISSING_FIELDS',
        });
      }

      // Verificar credenciales
      const user = await User.verifyCredentials(sanitizeInput(email), password);

      // Crear nueva sesión
      const sessionData = await Session.create(user.id);

      res.json({
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        auth: {
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          expiresIn: sessionData.expiresIn,
          expiresAt: sessionData.expiresAt,
        },
      });
    } catch (error) {
      console.error('Error en login:', error);

      // Errores de credenciales
      if (
        error.message.includes('Credenciales inválidas') ||
        error.message.includes('Usuario inactivo')
      ) {
        return res.status(401).json({
          error: error.message,
          code: 'INVALID_CREDENTIALS',
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Renovar tokens usando refresh token
   */
  static async refresh(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          error: 'Refresh token requerido',
          code: 'MISSING_REFRESH_TOKEN',
        });
      }

      // Renovar tokens
      const sessionData = await Session.refresh(refreshToken);

      res.json({
        message: 'Tokens renovados exitosamente',
        auth: {
          accessToken: sessionData.accessToken,
          refreshToken: sessionData.refreshToken,
          expiresIn: sessionData.expiresIn,
          expiresAt: sessionData.expiresAt,
        },
      });
    } catch (error) {
      console.error('Error renovando tokens:', error);

      if (
        error.message.includes('Refresh token inválido') ||
        error.message.includes('Sesión no encontrada') ||
        error.message.includes('Usuario inactivo')
      ) {
        return res.status(401).json({
          error: error.message,
          code: 'INVALID_REFRESH_TOKEN',
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout(req, res) {
    try {
      const accessToken = req.session?.accessToken;

      if (accessToken) {
        await Session.revoke(accessToken, 'manual');
      }

      res.json({
        message: 'Sesión cerrada exitosamente',
      });
    } catch (error) {
      console.error('Error en logout:', error);

      // Incluso si hay error, consideramos el logout exitoso
      res.json({
        message: 'Sesión cerrada',
      });
    }
  }

  /**
   * Cerrar todas las sesiones del usuario
   */
  static async logoutAll(req, res) {
    try {
      const userId = req.user.id;
      const revokedCount = await Session.revokeAllUserSessions(userId);

      res.json({
        message: 'Todas las sesiones han sido cerradas',
        revokedSessions: revokedCount,
      });
    } catch (error) {
      console.error('Error en logout all:', error);

      res.status(500).json({
        error: 'Error cerrando sesiones',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Obtener información del usuario actual
   */
  static async me(req, res) {
    try {
      // El usuario ya está disponible por el middleware de autenticación
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        session: {
          lastActivity: req.session.lastActivity,
        },
      });
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Verificar estado de la sesión
   */
  static async verifySession(req, res) {
    try {
      const session = await Session.findByAccessToken(req.session.accessToken);

      if (!session || !Session.isSessionActive(session)) {
        return res.status(401).json({
          error: 'Sesión inválida',
          code: 'INVALID_SESSION',
        });
      }

      res.json({
        valid: true,
        user: {
          id: req.user.id,
          email: req.user.email,
          isActive: req.user.isActive,
        },
        session: {
          expiresAt: session.expiresAt,
          lastActivity: session.lastActivity,
        },
      });
    } catch (error) {
      console.error('Error verificando sesión:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

module.exports = AuthController;
