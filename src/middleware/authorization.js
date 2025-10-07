const Role = require('../models/Role');

/**
 * Middleware de autorización por roles
 * @param {Array<string>} allowedRoles - Roles permitidos
 * @returns {Function} Middleware function
 */
function requireRole(allowedRoles = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Autenticación requerida',
          code: 'AUTH_REQUIRED',
        });
      }

      // Obtener roles del usuario
      const userRoles = await Role.getUserRoles(req.user.id);
      const userRoleNames = userRoles.map((role) => role.roleName);

      // Verificar si el usuario tiene alguno de los roles permitidos
      const hasRequiredRole = allowedRoles.some((role) =>
        userRoleNames.includes(role)
      );

      if (!hasRequiredRole) {
        return res.status(403).json({
          error: 'Permisos insuficientes',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: allowedRoles,
          current: userRoleNames,
        });
      }

      // Agregar roles a la request para uso posterior
      req.userRoles = userRoles;
      req.userRoleNames = userRoleNames;

      next();
    } catch (error) {
      console.error('Error en middleware de autorización:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Middleware de autorización por permisos específicos
 * @param {string} moduleName - Nombre del módulo
 * @param {string} permissionName - Nombre del permiso
 * @returns {Function} Middleware function
 */
function requirePermission(moduleName, permissionName) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Autenticación requerida',
          code: 'AUTH_REQUIRED',
        });
      }

      // Verificar si el usuario tiene el permiso específico
      const hasPermission = await Role.userHasPermission(
        req.user.id,
        moduleName,
        permissionName
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Permiso denegado',
          code: 'PERMISSION_DENIED',
          required: `${moduleName}.${permissionName}`,
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando permisos:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Middleware para verificar múltiples permisos (OR logic)
 * @param {Array<Object>} permissions - Array de {module, permission}
 * @returns {Function} Middleware function
 */
function requireAnyPermission(permissions = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Autenticación requerida',
          code: 'AUTH_REQUIRED',
        });
      }

      // Verificar si el usuario tiene alguno de los permisos
      for (const { module, permission } of permissions) {
        const hasPermission = await Role.userHasPermission(
          req.user.id,
          module,
          permission
        );
        if (hasPermission) {
          return next();
        }
      }

      return res.status(403).json({
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: permissions.map((p) => `${p.module}.${p.permission}`),
      });
    } catch (error) {
      console.error('Error verificando permisos múltiples:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Middleware para verificar múltiples permisos (AND logic)
 * @param {Array<Object>} permissions - Array de {module, permission}
 * @returns {Function} Middleware function
 */
function requireAllPermissions(permissions = []) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Autenticación requerida',
          code: 'AUTH_REQUIRED',
        });
      }

      // Verificar que el usuario tenga TODOS los permisos
      for (const { module, permission } of permissions) {
        const hasPermission = await Role.userHasPermission(
          req.user.id,
          module,
          permission
        );
        if (!hasPermission) {
          return res.status(403).json({
            error: 'Permisos insuficientes',
            code: 'INSUFFICIENT_PERMISSIONS',
            required: permissions.map((p) => `${p.module}.${p.permission}`),
            missing: `${module}.${permission}`,
          });
        }
      }

      next();
    } catch (error) {
      console.error('Error verificando todos los permisos:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  };
}

/**
 * Middleware para super administradores
 */
const requireSuperAdmin = requireRole(['SUPER_ADMIN']);

/**
 * Middleware para administradores (SUPER_ADMIN o ADMIN)
 */
const requireAdmin = requireRole(['SUPER_ADMIN', 'ADMIN']);

/**
 * Middleware para operadores y superiores
 */
const requireOperator = requireRole(['SUPER_ADMIN', 'ADMIN', 'OPERATOR']);

/**
 * Middleware para cualquier usuario autenticado
 */
const requireAnyRole = requireRole([
  'SUPER_ADMIN',
  'ADMIN',
  'OPERATOR',
  'VIEWER',
]);

// Definiciones de permisos por módulo para fácil uso
const PERMISSIONS = {
  DASHBOARD: {
    VIEW: { module: 'DASHBOARD', permission: 'view' },
    EXPORT: { module: 'DASHBOARD', permission: 'export' },
  },
  USERS: {
    CREATE: { module: 'USERS', permission: 'create' },
    READ: { module: 'USERS', permission: 'read' },
    UPDATE: { module: 'USERS', permission: 'update' },
    DELETE: { module: 'USERS', permission: 'delete' },
  },
  ALIANZAS: {
    CREATE: { module: 'ALIANZAS', permission: 'create' },
    READ: { module: 'ALIANZAS', permission: 'read' },
    UPDATE: { module: 'ALIANZAS', permission: 'update' },
    DELETE: { module: 'ALIANZAS', permission: 'delete' },
  },
  ACTAS_ARRIME: {
    CREATE: { module: 'ACTAS_ARRIME', permission: 'create' },
    READ: { module: 'ACTAS_ARRIME', permission: 'read' },
    UPDATE: { module: 'ACTAS_ARRIME', permission: 'update' },
    DELETE: { module: 'ACTAS_ARRIME', permission: 'delete' },
    BULK_UPLOAD: { module: 'ACTAS_ARRIME', permission: 'bulk_upload' },
  },
  // TODO: Agregar más módulos según se necesiten
};

module.exports = {
  requireRole,
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireSuperAdmin,
  requireAdmin,
  requireOperator,
  requireAnyRole,
  PERMISSIONS,
};
