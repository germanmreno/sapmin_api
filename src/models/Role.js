const { PrismaClient } = require('@prisma/client');
const { sanitizeInput } = require('../utils/password');

const prisma = new PrismaClient();

// Estructura de permisos modulares para futuro RBAC
const MODULE_PERMISSIONS = {
  DASHBOARD: ['view', 'export'],
  USERS: ['create', 'read', 'update', 'delete'],
  ALIANZAS: ['create', 'read', 'update', 'delete'],
  ACTAS_ARRIME: ['create', 'read', 'update', 'delete', 'bulk_upload'],
  FUNDICION_F2: ['create', 'read', 'update', 'delete'],
  BARRAS_ORO: ['create', 'read', 'update', 'delete'],
  COBRANZAS: ['create', 'read', 'update', 'delete'],
  SETTINGS: ['read', 'update'],
  REPORTS: ['view', 'export', 'advanced'],
};

class Role {
  /**
   * Crea un nuevo rol
   * @param {Object} roleData - Datos del rol
   * @returns {Promise<Object>} Rol creado
   */
  static async create({ roleName, description }) {
    const sanitizedName = sanitizeInput(roleName).toUpperCase();
    const sanitizedDescription = sanitizeInput(description);

    if (!sanitizedName) {
      throw new Error('Nombre del rol es requerido');
    }

    // Verificar si el rol ya existe
    const existingRole = await prisma.role.findUnique({
      where: { roleName: sanitizedName },
    });

    if (existingRole) {
      throw new Error('El rol ya existe');
    }

    return await prisma.role.create({
      data: {
        roleName: sanitizedName,
        description: sanitizedDescription,
      },
    });
  }

  /**
   * Busca rol por nombre
   * @param {string} roleName - Nombre del rol
   * @returns {Promise<Object|null>} Rol encontrado
   */
  static async findByName(roleName) {
    return await prisma.role.findUnique({
      where: { roleName: roleName.toUpperCase() },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  /**
   * Lista todos los roles
   * @returns {Promise<Array>} Lista de roles
   */
  static async list() {
    return await prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { roleName: 'asc' },
    });
  }

  /**
   * Asigna rol a usuario
   * @param {number} userId - ID del usuario
   * @param {number} roleId - ID del rol
   * @returns {Promise<Object>} Asignación creada
   */
  static async assignToUser(userId, roleId) {
    // Verificar si ya existe la asignación
    const existing = await prisma.userRole.findUnique({
      where: {
        userId_roleId: {
          userId: parseInt(userId),
          roleId: parseInt(roleId),
        },
      },
    });

    if (existing) {
      throw new Error('El usuario ya tiene este rol asignado');
    }

    return await prisma.userRole.create({
      data: {
        userId: parseInt(userId),
        roleId: parseInt(roleId),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        role: true,
      },
    });
  }

  /**
   * Remueve rol de usuario
   * @param {number} userId - ID del usuario
   * @param {number} roleId - ID del rol
   * @returns {Promise<boolean>} True si se removió exitosamente
   */
  static async removeFromUser(userId, roleId) {
    try {
      await prisma.userRole.delete({
        where: {
          userId_roleId: {
            userId: parseInt(userId),
            roleId: parseInt(roleId),
          },
        },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtiene roles de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Roles del usuario
   */
  static async getUserRoles(userId) {
    const userRoles = await prisma.userRole.findMany({
      where: { userId: parseInt(userId) },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    return userRoles.map((ur) => ur.role);
  }

  /**
   * Verifica si un usuario tiene un permiso específico
   * @param {number} userId - ID del usuario
   * @param {string} moduleName - Nombre del módulo
   * @param {string} permissionName - Nombre del permiso
   * @returns {Promise<boolean>} True si tiene el permiso
   */
  static async userHasPermission(userId, moduleName, permissionName) {
    const userRoles = await this.getUserRoles(userId);

    for (const role of userRoles) {
      for (const rolePermission of role.rolePermissions) {
        const permission = rolePermission.permission;
        if (
          permission.moduleName === moduleName &&
          permission.permissionName === permissionName
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Obtiene todos los permisos de un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Array>} Permisos del usuario
   */
  static async getUserPermissions(userId) {
    const userRoles = await this.getUserRoles(userId);
    const permissions = new Set();

    for (const role of userRoles) {
      for (const rolePermission of role.rolePermissions) {
        const permission = rolePermission.permission;
        permissions.add(
          `${permission.moduleName}.${permission.permissionName}`
        );
      }
    }

    return Array.from(permissions);
  }

  /**
   * Inicializa roles y permisos por defecto
   * @returns {Promise<Object>} Resultado de la inicialización
   */
  static async initializeDefaultRoles() {
    const results = {
      roles: [],
      permissions: [],
      assignments: [],
    };

    try {
      // Crear permisos por módulo
      for (const [moduleName, permissions] of Object.entries(
        MODULE_PERMISSIONS
      )) {
        for (const permissionName of permissions) {
          try {
            const permission = await prisma.permission.upsert({
              where: {
                permissionName_moduleName: {
                  permissionName,
                  moduleName,
                },
              },
              update: {},
              create: {
                permissionName,
                moduleName,
                description: `Permiso ${permissionName} para módulo ${moduleName}`,
              },
            });
            results.permissions.push(permission);
          } catch (error) {
            // Permiso ya existe, continuar
          }
        }
      }

      // Crear roles por defecto
      const defaultRoles = [
        {
          roleName: 'SUPER_ADMIN',
          description: 'Administrador con acceso completo al sistema',
        },
        {
          roleName: 'ADMIN',
          description: 'Administrador con acceso a la mayoría de funciones',
        },
        {
          roleName: 'OPERATOR',
          description: 'Operador con acceso a funciones básicas',
        },
        {
          roleName: 'VIEWER',
          description: 'Solo lectura de información',
        },
      ];

      for (const roleData of defaultRoles) {
        try {
          const role = await prisma.role.upsert({
            where: { roleName: roleData.roleName },
            update: {},
            create: roleData,
          });
          results.roles.push(role);
        } catch (error) {
          // Rol ya existe, continuar
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Error inicializando roles: ${error.message}`);
    }
  }

  /**
   * Obtiene la estructura de permisos modulares
   * @returns {Object} Estructura de permisos
   */
  static getModulePermissions() {
    return MODULE_PERMISSIONS;
  }
}

module.exports = Role;
