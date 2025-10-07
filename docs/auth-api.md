# API de Autenticación - Documentación

## Descripción General

Sistema de autenticación moderno con JWT, refresh tokens, RBAC (Role-Based Access Control) y logout automático por inactividad.

### Características Principales

- ✅ Registro/Login con email y contraseña
- ✅ Validación robusta de contraseñas (8+ chars, mayúscula, número, especial)
- ✅ JWT con access token (1h) + refresh token (7d)
- ✅ Logout automático por inactividad (1 hora)
- ✅ Rate limiting en endpoints de autenticación
- ✅ Sistema RBAC preparado para permisos modulares
- ✅ Headers de seguridad y sanitización de inputs

## Configuración

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL="mysql://user:password@localhost:3306/produccion_db"

# JWT Secrets (generar con crypto.randomBytes(64).toString('hex'))
JWT_ACCESS_SECRET="your-super-secret-access-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Usuario administrador por defecto
ADMIN_EMAIL="admin@produccion.com"
ADMIN_PASSWORD="Admin123!"
```

### Instalación de Dependencias

```bash
npm install bcrypt jsonwebtoken helmet cors express-rate-limit
```

## Endpoints de la API

### Base URL

```
http://localhost:3001/auth
```

---

## 🔓 Endpoints Públicos

### 1. Registro de Usuario

**POST** `/auth/register`

Registra un nuevo usuario en el sistema.

**Rate Limit:** 5 requests por 15 minutos

**Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Validaciones:**

- Email válido y único
- Contraseña: mínimo 8 caracteres, 1 mayúscula, 1 número, 1 carácter especial

**Response 201:**

```json
{
  "message": "Usuario registrado exitosamente",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "auth": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "expiresAt": "2024-01-01T01:00:00.000Z"
  }
}
```

**Errores:**

- `400` - Email inválido o contraseña débil
- `400` - Email ya registrado
- `429` - Rate limit excedido

---

### 2. Inicio de Sesión

**POST** `/auth/login`

Autentica un usuario y genera tokens de sesión.

**Rate Limit:** 5 requests por 15 minutos

**Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "MiPassword123!"
}
```

**Response 200:**

```json
{
  "message": "Inicio de sesión exitoso",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "auth": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "expiresAt": "2024-01-01T01:00:00.000Z"
  }
}
```

**Errores:**

- `401` - Credenciales inválidas
- `401` - Usuario inactivo
- `429` - Rate limit excedido

---

### 3. Renovar Tokens

**POST** `/auth/refresh`

Renueva el access token usando el refresh token.

**Rate Limit:** 10 requests por 15 minutos

**Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**

```json
{
  "message": "Tokens renovados exitosamente",
  "auth": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "expiresAt": "2024-01-01T01:00:00.000Z"
  }
}
```

**Errores:**

- `401` - Refresh token inválido o expirado
- `401` - Sesión no encontrada

---

## 🔒 Endpoints Protegidos

**Autenticación requerida:** Incluir header `Authorization: Bearer <access_token>`

### 4. Información del Usuario Actual

**GET** `/auth/me`

Obtiene información del usuario autenticado.

**Headers:**

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response 200:**

```json
{
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "session": {
    "lastActivity": "2024-01-01T00:30:00.000Z"
  }
}
```

---

### 5. Verificar Sesión

**GET** `/auth/verify`

Verifica si la sesión actual es válida.

**Response 200:**

```json
{
  "valid": true,
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "isActive": true
  },
  "session": {
    "expiresAt": "2024-01-01T01:00:00.000Z",
    "lastActivity": "2024-01-01T00:30:00.000Z"
  }
}
```

---

### 6. Cerrar Sesión

**POST** `/auth/logout`

Cierra la sesión actual.

**Response 200:**

```json
{
  "message": "Sesión cerrada exitosamente"
}
```

---

### 7. Cerrar Todas las Sesiones

**POST** `/auth/logout-all`

Cierra todas las sesiones del usuario.

**Response 200:**

```json
{
  "message": "Todas las sesiones han sido cerradas",
  "revokedSessions": 3
}
```

---

## 👥 Endpoints de Administración

**Permisos requeridos:** Rol de administrador o permisos específicos

### 8. Listar Usuarios

**GET** `/auth/users`

**Permisos:** `USERS.read`

**Query Parameters:**

- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Elementos por página (default: 10, max: 100)
- `search` (opcional): Buscar por email
- `active` (opcional): Filtrar por estado (true/false/all)

**Response 200:**

```json
{
  "users": [
    {
      "id": 1,
      "email": "usuario@ejemplo.com",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "roles": [
        {
          "id": 1,
          "roleName": "ADMIN",
          "description": "Administrador del sistema"
        }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

---

### 9. Obtener Usuario por ID

**GET** `/auth/users/:id`

**Permisos:** `USERS.read`

**Response 200:**

```json
{
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "roles": [
    {
      "id": 1,
      "roleName": "ADMIN",
      "description": "Administrador del sistema"
    }
  ],
  "permissions": ["USERS.read", "USERS.update", "DASHBOARD.view"]
}
```

---

### 10. Actualizar Usuario

**PUT** `/auth/users/:id`

**Permisos:** `USERS.update`

**Body:**

```json
{
  "isActive": false
}
```

**Response 200:**

```json
{
  "message": "Usuario actualizado exitosamente",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "isActive": false,
    "updatedAt": "2024-01-01T01:00:00.000Z"
  }
}
```

---

## 🔐 Sistema RBAC

### Roles por Defecto

1. **SUPER_ADMIN**: Acceso completo al sistema
2. **ADMIN**: Acceso a la mayoría de funciones (excepto gestión de usuarios)
3. **OPERATOR**: Operaciones básicas de CRUD
4. **VIEWER**: Solo lectura

### Módulos de Permisos

```javascript
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
```

### Uso en Middleware

```javascript
// Verificar rol específico
app.get('/admin-only', requireRole(['ADMIN', 'SUPER_ADMIN']), handler);

// Verificar permiso específico
app.post('/users', requirePermission('USERS', 'create'), handler);

// Verificar múltiples permisos (OR)
app.get(
  '/dashboard',
  requireAnyPermission([
    { module: 'DASHBOARD', permission: 'view' },
    { module: 'REPORTS', permission: 'view' },
  ]),
  handler
);
```

---

## 🛡️ Seguridad

### Logout Automático por Inactividad

- **Timeout:** 1 hora de inactividad
- **Tracking:** Cada request actualiza `lastActivity`
- **Verificación:** Middleware verifica inactividad en cada request
- **Limpieza:** Proceso automático cada hora elimina sesiones expiradas

### Rate Limiting

- **Auth endpoints:** 5 requests por 15 minutos
- **Refresh endpoint:** 10 requests por 15 minutos
- **General:** 100 requests por 15 minutos

### Validación de Contraseñas

- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 letra minúscula
- Al menos 1 número
- Al menos 1 carácter especial

### Headers de Seguridad

```javascript
// Implementar con Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  })
);
```

---

## 🚀 Inicialización

### 1. Ejecutar Migración

```bash
cd backend
npx prisma migrate dev --name add_auth_system
```

### 2. Inicializar Sistema

```bash
node scripts/init-auth-system.js
```

### 3. Integrar en Aplicación Principal

```javascript
// En index.js principal
const authRoutes = require('./src/routes/authRoutes');
const {
  initializeSessionCleanup,
} = require('./src/middleware/activityTracker');

// Rutas de autenticación
app.use('/auth', authRoutes);

// Inicializar limpieza automática de sesiones
initializeSessionCleanup();
```

---

## 📝 Ejemplos de Uso

### Cliente JavaScript

```javascript
class AuthClient {
  constructor(baseURL = 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.auth.accessToken;
      this.refreshToken = data.auth.refreshToken;

      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('refreshToken', this.refreshToken);

      return data;
    }

    throw new Error('Login failed');
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    };

    let response = await fetch(url, { ...options, headers });

    // Si el token expiró, intentar renovar
    if (response.status === 401) {
      await this.refreshTokens();
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      response = await fetch(url, { ...options, headers });
    }

    return response;
  }

  async refreshTokens() {
    const response = await fetch(`${this.baseURL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      this.accessToken = data.auth.accessToken;
      this.refreshToken = data.auth.refreshToken;

      localStorage.setItem('accessToken', this.accessToken);
      localStorage.setItem('refreshToken', this.refreshToken);
    } else {
      // Refresh token inválido, redirigir a login
      this.logout();
      window.location.href = '/login';
    }
  }

  async logout() {
    try {
      await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
    } finally {
      this.accessToken = null;
      this.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  }
}
```

---

## 🔧 Integración con Rutas Existentes

### Proteger Rutas Existentes

```javascript
// Ejemplo: Proteger rutas de pequeña minería
const {
  authenticate,
  requirePermission,
} = require('./src/middleware/authentication');

// Proteger todas las rutas de pequeña minería
app.use('/pequena-mineria', authenticate);

// Proteger bulk upload con permiso específico
app.post(
  '/pequena-mineria/bulk-upload',
  requirePermission('ACTAS_ARRIME', 'bulk_upload'),
  bulkUploadHandler
);

// Proteger gestión de alianzas
app.use(
  '/pequena-mineria/alianzas',
  requirePermission('ALIANZAS', 'read'),
  alianzasRoutes
);
```

### Middleware de Logging

```javascript
const { logActivity } = require('./src/middleware/activityTracker');

// Agregar logging a rutas importantes
app.use('/pequena-mineria', authenticate, logActivity);
```

---

## ⚠️ Consideraciones Importantes

1. **Cambiar contraseña del admin** después de la inicialización
2. **Configurar JWT secrets** en producción
3. **Implementar HTTPS** en producción
4. **Configurar CORS** apropiadamente
5. **Monitorear sesiones activas** regularmente
6. **Backup de base de datos** antes de migraciones

---

## 🎯 Próximos Pasos

1. Integrar con frontend (React/Vue)
2. Implementar recuperación de contraseña
3. Agregar autenticación de dos factores (2FA)
4. Implementar audit logs detallados
5. Configurar notificaciones de seguridad
6. Optimizar consultas de permisos con caché
