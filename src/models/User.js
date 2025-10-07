const { PrismaClient } = require('@prisma/client');
const {
  hashPassword,
  verifyPassword,
  validateEmail,
  validatePassword,
  sanitizeInput,
} = require('../utils/password');

const prisma = new PrismaClient();

class User {
  /**
   * Crea un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} Usuario creado (sin password)
   */
  static async create({ email, password }) {
    // Sanitizar y validar email
    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      throw new Error('Email inválido');
    }

    // Validar contraseña
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: sanitizedEmail },
    });

    if (existingUser) {
      throw new Error('El email ya está registrado');
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(password);

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        passwordHash,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Busca usuario por email
   * @param {string} email - Email del usuario
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  static async findByEmail(email) {
    const sanitizedEmail = sanitizeInput(email).toLowerCase();

    return await prisma.user.findUnique({
      where: { email: sanitizedEmail },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Busca usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Promise<Object|null>} Usuario encontrado
   */
  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
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
        },
      },
    });
  }

  /**
   * Verifica credenciales de usuario
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña en texto plano
   * @returns {Promise<Object|null>} Usuario si las credenciales son válidas
   */
  static async verifyCredentials(email, password) {
    const user = await this.findByEmail(email);

    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new Error('Usuario inactivo');
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // Retornar usuario sin password hash
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Actualiza la última actividad del usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<void>}
   */
  static async updateLastActivity(userId) {
    // Esta funcionalidad se maneja en UserSession
    // Aquí se puede agregar lógica adicional si es necesaria
    return true;
  }

  /**
   * Desactiva un usuario
   * @param {number} userId - ID del usuario
   * @returns {Promise<Object>} Usuario actualizado
   */
  static async deactivate(userId) {
    return await prisma.user.update({
      where: { id: parseInt(userId) },
      data: { isActive: false },
      select: {
        id: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Lista usuarios con paginación
   * @param {Object} options - Opciones de consulta
   * @returns {Promise<Object>} Lista de usuarios y metadata
   */
  static async list({ page = 1, limit = 10, search = '' } = {}) {
    const offset = (page - 1) * limit;

    const where = search
      ? {
          email: {
            contains: search.toLowerCase(),
          },
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = User;
