const express = require('express');
const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');
const {
  authenticate,
  authRateLimit,
  requireActiveUser,
} = require('../middleware/authentication');
const {
  requireAdmin,
  requireSuperAdmin,
  PERMISSIONS,
  requirePermission,
} = require('../middleware/authorization');
const { activityMiddleware } = require('../middleware/activityTracker');

const router = express.Router();

// ===== RUTAS PÚBLICAS (SIN AUTENTICACIÓN) =====

/**
 * @route POST /auth/register
 * @desc Registrar nuevo usuario
 * @access Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post('/register', authRateLimit, AuthController.register);

/**
 * @route POST /auth/login
 * @desc Iniciar sesión
 * @access Public
 * @rateLimit 5 requests per 15 minutes
 */
router.post('/login', authRateLimit, AuthController.login);

/**
 * @route POST /auth/refresh
 * @desc Renovar tokens usando refresh token
 * @access Public
 * @rateLimit 10 requests per 15 minutes
 */
router.post('/refresh', authRateLimit, AuthController.refresh);

// ===== RUTAS PROTEGIDAS (REQUIEREN AUTENTICACIÓN) =====

// Middleware para todas las rutas protegidas
router.use(authenticate);
router.use(requireActiveUser);
router.use(activityMiddleware);

/**
 * @route POST /auth/logout
 * @desc Cerrar sesión actual
 * @access Private
 */
router.post('/logout', AuthController.logout);

/**
 * @route POST /auth/logout-all
 * @desc Cerrar todas las sesiones del usuario
 * @access Private
 */
router.post('/logout-all', AuthController.logoutAll);

/**
 * @route GET /auth/me
 * @desc Obtener información del usuario actual
 * @access Private
 */
router.get('/me', AuthController.me);

/**
 * @route GET /auth/verify
 * @desc Verificar estado de la sesión actual
 * @access Private
 */
router.get('/verify', AuthController.verifySession);

// ===== RUTAS DE GESTIÓN DE USUARIOS (SOLO ADMINISTRADORES) =====

/**
 * @route GET /auth/users
 * @desc Listar usuarios (solo administradores)
 * @access Private - Admin
 */
router.get('/users', requirePermission('USERS', 'read'), UserController.list);

/**
 * @route GET /auth/users/stats
 * @desc Obtener estadísticas de usuarios (solo administradores)
 * @access Private - Admin
 */
router.get('/users/stats', requireAdmin, UserController.getStats);

/**
 * @route GET /auth/users/:id
 * @desc Obtener usuario por ID (solo administradores)
 * @access Private - Admin
 */
router.get(
  '/users/:id',
  requirePermission('USERS', 'read'),
  UserController.getById
);

/**
 * @route PUT /auth/users/:id
 * @desc Actualizar usuario (solo administradores)
 * @access Private - Admin
 */
router.put(
  '/users/:id',
  requirePermission('USERS', 'update'),
  UserController.update
);

/**
 * @route POST /auth/users/:id/roles
 * @desc Asignar rol a usuario (solo super administradores)
 * @access Private - SuperAdmin
 */
router.post('/users/:id/roles', requireSuperAdmin, UserController.assignRole);

/**
 * @route DELETE /auth/users/:id/roles/:roleId
 * @desc Remover rol de usuario (solo super administradores)
 * @access Private - SuperAdmin
 */
router.delete(
  '/users/:id/roles/:roleId',
  requireSuperAdmin,
  UserController.removeRole
);

/**
 * @route GET /auth/users/:id/sessions
 * @desc Obtener sesiones activas de usuario (solo administradores)
 * @access Private - Admin
 */
router.get('/users/:id/sessions', requireAdmin, UserController.getUserSessions);

/**
 * @route DELETE /auth/users/:id/sessions
 * @desc Cerrar todas las sesiones de un usuario (solo administradores)
 * @access Private - Admin
 */
router.delete(
  '/users/:id/sessions',
  requireAdmin,
  UserController.revokeUserSessions
);

// ===== MANEJO DE ERRORES =====

// Middleware de manejo de errores para rutas de auth
router.use((error, req, res, next) => {
  console.error('Error en rutas de autenticación:', error);

  // Errores de validación de Prisma
  if (error.code === 'P2002') {
    return res.status(400).json({
      error: 'Datos duplicados',
      code: 'DUPLICATE_DATA',
    });
  }

  // Errores de JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token inválido',
      code: 'INVALID_TOKEN',
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expirado',
      code: 'TOKEN_EXPIRED',
    });
  }

  // Error genérico
  res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
  });
});

module.exports = router;
