const helmet = require('helmet');
const cors = require('cors');

/**
 * Configuración de CORS
 */
const corsOptions = {
  origin: function (origin, callback) {
    // En producción, si el frontend se sirve desde el mismo servidor,
    // no habrá origin o será el mismo servidor
    if (process.env.NODE_ENV === 'production' && !origin) {
      return callback(null, true);
    }

    // Lista de orígenes permitidos
    const allowedOrigins = [
      'http://localhost:3000', // React dev server
      'http://localhost:5173', // Vite dev server
      'http://localhost:8080', // Vue dev server
      'http://localhost:3001', // Backend en desarrollo
      process.env.FRONTEND_URL, // URL de producción
      'http://172.16.2.247', // Servidor de producción
      'http://172.16.2.247:3001', // Servidor de producción con puerto
    ].filter(Boolean);

    // Permitir requests sin origin (mobile apps, Postman, mismo servidor)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('⚠️  CORS bloqueado para origen:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-Last-Activity',
  ],
  exposedHeaders: ['X-Last-Activity'],
};

/**
 * Configuración de Helmet para headers de seguridad
 */
const helmetOptions = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Deshabilitado para compatibilidad
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

/**
 * Middleware de sanitización de inputs
 */
function sanitizeInputs(req, res, next) {
  // Sanitizar query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }

  // Sanitizar body parameters
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
}

/**
 * Función recursiva para sanitizar objetos
 */
function sanitizeObject(obj) {
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      // Remover caracteres peligrosos básicos
      obj[key] = obj[key]
        .trim()
        .replace(/[<>]/g, '') // Remover < y >
        .substring(0, 1000); // Limitar longitud
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitizeObject(obj[key]);
    }
  }
}

/**
 * Middleware de logging de seguridad
 */
function securityLogger(req, res, next) {
  // Log de requests sospechosos
  const suspiciousPatterns = [
    /script/i,
    /javascript/i,
    /vbscript/i,
    /onload/i,
    /onerror/i,
    /<.*>/,
    /union.*select/i,
    /drop.*table/i,
  ];

  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl || req.url;
  const body = JSON.stringify(req.body || {});

  const isSuspicious = suspiciousPatterns.some(
    (pattern) =>
      pattern.test(url) || pattern.test(body) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    console.warn('🚨 Suspicious request detected:', {
      ip: req.ip,
      method: req.method,
      url: url,
      userAgent: userAgent,
      body: body,
      timestamp: new Date().toISOString(),
    });
  }

  next();
}

/**
 * Middleware de validación de Content-Type
 */
function validateContentType(req, res, next) {
  // Solo validar para requests con body
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');

    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        error: 'Content-Type debe ser application/json',
        code: 'INVALID_CONTENT_TYPE',
      });
    }
  }

  next();
}

/**
 * Middleware de protección contra ataques de timing
 */
function timingAttackProtection(req, res, next) {
  // Agregar delay aleatorio pequeño para endpoints sensibles
  const sensitiveEndpoints = ['/auth/login', '/auth/register', '/auth/refresh'];

  if (sensitiveEndpoints.some((endpoint) => req.path.includes(endpoint))) {
    const delay = Math.random() * 100; // 0-100ms
    setTimeout(next, delay);
  } else {
    next();
  }
}

/**
 * Configuración completa de seguridad
 */
function setupSecurity(app) {
  // Headers de seguridad
  app.use(helmet(helmetOptions));

  // CORS
  app.use(cors(corsOptions));

  // Sanitización de inputs
  app.use(sanitizeInputs);

  // Logging de seguridad
  app.use(securityLogger);

  // Validación de Content-Type
  app.use(validateContentType);

  // Protección contra timing attacks
  app.use(timingAttackProtection);

  // Ocultar información del servidor
  app.disable('x-powered-by');

  console.log('🛡️  Configuración de seguridad aplicada');
}

/**
 * Configuración específica para producción
 */
function setupProductionSecurity(app) {
  // Configuración adicional para producción
  if (process.env.NODE_ENV === 'production') {
    // Trust proxy para obtener IP real detrás de load balancer
    app.set('trust proxy', 1);

    // Headers adicionales de seguridad
    app.use((req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-XSS-Protection', '1; mode=block');
      res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      next();
    });

    console.log('🔒 Configuración de seguridad de producción aplicada');
  }
}

module.exports = {
  corsOptions,
  helmetOptions,
  sanitizeInputs,
  securityLogger,
  validateContentType,
  timingAttackProtection,
  setupSecurity,
  setupProductionSecurity,
};
