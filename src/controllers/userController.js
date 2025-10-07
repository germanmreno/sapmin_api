const User = require('../models/User');
const Role = require('../models/Role');
const Session = require('../models/Session');
const { sanitizeInput } = require('../utils/password');

class UserController {
  /**
   * Listar usuarios con paginación y filtros
   */
  static async list(req, res) {
    try {
      const { page = 1, limit = 10, search = '', active = 'all' } = req.query;

      // Validar parámetros
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

      // Construir filtros
      const filters = {};

      if (search) {
        filters.email = {
          contains: sanitizeInput(search).toLowerCase(),
        };
      }

      if (active !== 'all') {
        filters.isActive = active === 'true';
      }

      // Obtener usuarios
      const result = await User.list({
        page: pageNum,
        limit: limitNum,
        search: sanitizeInput(search),
      });

      res.json({
        users: result.users.map((user) => ({
          id: user.id,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          roles: user.userRoles?.map((ur) => ur.role) || [],
        })),
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error listando usuarios:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Obtener usuario por ID
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          error: 'ID de usuario inválido',
          code: 'INVALID_USER_ID',
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
      }

      // Obtener roles y permisos
      const userRoles = await Role.getUserRoles(userId);
      const userPermissions = await Role.getUserPermissions(userId);

      res.json({
        user: {
          id: user.id,
          email: user.email,
          isActive: user.isActive,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        roles: userRoles,
        permissions: userPermissions,
      });
    } catch (error) {
      console.error('Error obteniendo usuario:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Actualizar usuario (solo para administradores)
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          error: 'ID de usuario inválido',
          code: 'INVALID_USER_ID',
        });
      }

      // Verificar que el usuario existe
      const existingUser = await User.findById(userId);
      if (!existingUser) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
      }

      // Por ahora solo permitimos actualizar el estado activo
      if (typeof isActive === 'boolean') {
        if (!isActive) {
          // Si se desactiva el usuario, cerrar todas sus sesiones
          await Session.revokeAllUserSessions(userId);
          await User.deactivate(userId);
        } else {
          // Reactivar usuario (requiere implementar método en User model)
          // await User.activate(userId)
        }
      }

      // Obtener usuario actualizado
      const updatedUser = await User.findById(userId);

      res.json({
        message: 'Usuario actualizado exitosamente',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          isActive: updatedUser.isActive,
          updatedAt: updatedUser.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error actualizando usuario:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Asignar rol a usuario
   */
  static async assignRole(req, res) {
    try {
      const { id } = req.params;
      const { roleId } = req.body;
      const userId = parseInt(id);

      if (isNaN(userId) || isNaN(parseInt(roleId))) {
        return res.status(400).json({
          error: 'ID de usuario o rol inválido',
          code: 'INVALID_IDS',
        });
      }

      // Verificar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
      }

      // Asignar rol
      const assignment = await Role.assignToUser(userId, parseInt(roleId));

      res.json({
        message: 'Rol asignado exitosamente',
        assignment: {
          userId: assignment.userId,
          roleId: assignment.roleId,
          user: assignment.user,
          role: assignment.role,
        },
      });
    } catch (error) {
      console.error('Error asignando rol:', error);

      if (error.message.includes('ya tiene este rol')) {
        return res.status(400).json({
          error: error.message,
          code: 'ROLE_ALREADY_ASSIGNED',
        });
      }

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Remover rol de usuario
   */
  static async removeRole(req, res) {
    try {
      const { id, roleId } = req.params;
      const userId = parseInt(id);
      const roleIdNum = parseInt(roleId);

      if (isNaN(userId) || isNaN(roleIdNum)) {
        return res.status(400).json({
          error: 'ID de usuario o rol inválido',
          code: 'INVALID_IDS',
        });
      }

      // Remover rol
      const success = await Role.removeFromUser(userId, roleIdNum);

      if (!success) {
        return res.status(404).json({
          error: 'Asignación de rol no encontrada',
          code: 'ROLE_ASSIGNMENT_NOT_FOUND',
        });
      }

      res.json({
        message: 'Rol removido exitosamente',
      });
    } catch (error) {
      console.error('Error removiendo rol:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Obtener sesiones activas de un usuario
   */
  static async getUserSessions(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          error: 'ID de usuario inválido',
          code: 'INVALID_USER_ID',
        });
      }

      // Verificar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
      }

      // Por ahora retornamos información básica
      // TODO: Implementar método en Session model para obtener sesiones por usuario
      res.json({
        message: 'Funcionalidad en desarrollo',
        userId: userId,
      });
    } catch (error) {
      console.error('Error obteniendo sesiones del usuario:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Cerrar todas las sesiones de un usuario (solo administradores)
   */
  static async revokeUserSessions(req, res) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({
          error: 'ID de usuario inválido',
          code: 'INVALID_USER_ID',
        });
      }

      // Verificar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          error: 'Usuario no encontrado',
          code: 'USER_NOT_FOUND',
        });
      }

      // Revocar todas las sesiones
      const revokedCount = await Session.revokeAllUserSessions(userId);

      res.json({
        message: 'Sesiones del usuario revocadas exitosamente',
        revokedSessions: revokedCount,
      });
    } catch (error) {
      console.error('Error revocando sesiones del usuario:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Obtener estadísticas de usuarios
   */
  static async getStats(req, res) {
    try {
      // TODO: Implementar estadísticas más detalladas
      const result = await User.list({ page: 1, limit: 1000 });

      const stats = {
        total: result.pagination.total,
        active: result.users.filter((u) => u.isActive).length,
        inactive: result.users.filter((u) => !u.isActive).length,
        withRoles: result.users.filter(
          (u) => u.userRoles && u.userRoles.length > 0
        ).length,
      };

      res.json({
        stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);

      res.status(500).json({
        error: 'Error interno del servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

module.exports = UserController;
