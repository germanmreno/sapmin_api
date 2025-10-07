const { PrismaClient } = require('@prisma/client');
const Role = require('../src/models/Role');
const User = require('../src/models/User');

const prisma = new PrismaClient();

async function initializeAuthSystem() {
  console.log('🚀 Inicializando sistema de autenticación...\n');

  try {
    // 1. Inicializar roles y permisos por defecto
    console.log('📋 Creando roles y permisos por defecto...');
    const roleResults = await Role.initializeDefaultRoles();

    console.log(`✅ Creados ${roleResults.roles.length} roles`);
    console.log(`✅ Creados ${roleResults.permissions.length} permisos`);

    // 2. Crear usuario administrador por defecto
    console.log('\n👤 Creando usuario administrador por defecto...');

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@produccion.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';

    try {
      // Verificar si ya existe un admin
      const existingAdmin = await User.findByEmail(adminEmail);

      if (!existingAdmin) {
        const adminUser = await User.create({
          email: adminEmail,
          password: adminPassword,
        });

        // Asignar rol de SUPER_ADMIN
        const superAdminRole = await Role.findByName('SUPER_ADMIN');
        if (superAdminRole) {
          await Role.assignToUser(adminUser.id, superAdminRole.id);
          console.log(`✅ Usuario administrador creado: ${adminEmail}`);
          console.log(`🔑 Contraseña temporal: ${adminPassword}`);
          console.log(
            '⚠️  IMPORTANTE: Cambie la contraseña después del primer login'
          );
        }
      } else {
        console.log(`ℹ️  Usuario administrador ya existe: ${adminEmail}`);
      }
    } catch (error) {
      if (error.message.includes('ya está registrado')) {
        console.log(`ℹ️  Usuario administrador ya existe: ${adminEmail}`);
      } else {
        throw error;
      }
    }

    // 3. Asignar permisos a roles por defecto
    console.log('\n🔐 Configurando permisos por defecto...');

    const roles = await Role.list();
    const permissions = await prisma.permission.findMany();

    // SUPER_ADMIN: Todos los permisos
    const superAdminRole = roles.find((r) => r.roleName === 'SUPER_ADMIN');
    if (superAdminRole) {
      for (const permission of permissions) {
        try {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: superAdminRole.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: superAdminRole.id,
              permissionId: permission.id,
            },
          });
        } catch (error) {
          // Permiso ya asignado, continuar
        }
      }
      console.log(`✅ SUPER_ADMIN: ${permissions.length} permisos asignados`);
    }

    // ADMIN: Permisos de lectura y escritura (excepto gestión de usuarios)
    const adminRole = roles.find((r) => r.roleName === 'ADMIN');
    if (adminRole) {
      const adminPermissions = permissions.filter(
        (p) => !p.moduleName.includes('USERS') || p.permissionName === 'read'
      );

      for (const permission of adminPermissions) {
        try {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: adminRole.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: adminRole.id,
              permissionId: permission.id,
            },
          });
        } catch (error) {
          // Permiso ya asignado, continuar
        }
      }
      console.log(`✅ ADMIN: ${adminPermissions.length} permisos asignados`);
    }

    // OPERATOR: Permisos de operación básica
    const operatorRole = roles.find((r) => r.roleName === 'OPERATOR');
    if (operatorRole) {
      const operatorPermissions = permissions.filter(
        (p) =>
          ['create', 'read', 'update'].includes(p.permissionName) &&
          !p.moduleName.includes('USERS') &&
          !p.moduleName.includes('SETTINGS')
      );

      for (const permission of operatorPermissions) {
        try {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: operatorRole.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: operatorRole.id,
              permissionId: permission.id,
            },
          });
        } catch (error) {
          // Permiso ya asignado, continuar
        }
      }
      console.log(
        `✅ OPERATOR: ${operatorPermissions.length} permisos asignados`
      );
    }

    // VIEWER: Solo permisos de lectura
    const viewerRole = roles.find((r) => r.roleName === 'VIEWER');
    if (viewerRole) {
      const viewerPermissions = permissions.filter(
        (p) => p.permissionName === 'read' || p.permissionName === 'view'
      );

      for (const permission of viewerPermissions) {
        try {
          await prisma.rolePermission.upsert({
            where: {
              roleId_permissionId: {
                roleId: viewerRole.id,
                permissionId: permission.id,
              },
            },
            update: {},
            create: {
              roleId: viewerRole.id,
              permissionId: permission.id,
            },
          });
        } catch (error) {
          // Permiso ya asignado, continuar
        }
      }
      console.log(`✅ VIEWER: ${viewerPermissions.length} permisos asignados`);
    }

    // 4. Mostrar resumen
    console.log('\n📊 Resumen del sistema de autenticación:');
    console.log('─'.repeat(50));

    const finalRoles = await Role.list();
    for (const role of finalRoles) {
      console.log(
        `${role.roleName}: ${role.rolePermissions.length} permisos, ${role.userRoles.length} usuarios`
      );
    }

    const userCount = await prisma.user.count();
    const sessionCount = await prisma.userSession.count();

    console.log(`\n👥 Total usuarios: ${userCount}`);
    console.log(`🔐 Total sesiones: ${sessionCount}`);

    console.log('\n✅ Sistema de autenticación inicializado correctamente!');
    console.log('\n📚 Próximos pasos:');
    console.log('1. Cambiar la contraseña del administrador');
    console.log(
      '2. Configurar variables de entorno JWT_ACCESS_SECRET y JWT_REFRESH_SECRET'
    );
    console.log(
      '3. Integrar middleware de autenticación en las rutas existentes'
    );
    console.log('4. Configurar CORS y headers de seguridad');
  } catch (error) {
    console.error('❌ Error inicializando sistema de autenticación:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initializeAuthSystem()
    .then(() => {
      console.log('\n🎉 Inicialización completada!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Error en inicialización:', error);
      process.exit(1);
    });
}

module.exports = initializeAuthSystem;
