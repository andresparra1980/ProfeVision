import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  
  // Rutas personalizadas por idioma
  pathnames: {
    // Páginas públicas
    '/': '/',
    '/about': {
      es: '/acerca-de',
      en: '/about'
    },
    '/pricing': {
      es: '/precios',
      en: '/pricing'
    },
    '/exams': {
      es: '/examenes',
      en: '/exams'
    },
    '/how-it-works': {
      es: '/como-funciona',
      en: '/how-it-works'
    },
    '/contact': {
      es: '/contacto',
      en: '/contact'
    },
    '/blog': {
      es: '/blog',
      en: '/blog'
    },
    '/privacy': {
      es: '/privacidad',
      en: '/privacy'
    },
    '/terms': {
      es: '/terminos',
      en: '/terms'
    },
    '/cookies': {
      es: '/cookies',
      en: '/cookies'
    },
    '/institutions-management': {
      es: '/gestion-instituciones',
      en: '/institutions-management'
    },
    '/subjects-management': {
      es: '/gestion-materias',
      en: '/subjects-management'
    },
    '/groups-management': {
      es: '/gestion-grupos',
      en: '/groups-management'
    },
    '/students-management': {
      es: '/gestion-estudiantes',
      en: '/students-management'
    },
    '/reports': {
      es: '/reportes',
      en: '/reports'
    },
    '/mobile-app': {
      es: '/aplicacion-movil',
      en: '/mobile-app'
    },
    '/exams/manual-generator': {
      es: '/examenes/generador-manual',
      en: '/exams/manual-generator'
    },
    '/exams/ai-generator': {
      es: '/examenes/generador-ia',
      en: '/exams/ai-generator'
    },
    '/exams-with-ai': {
      es: '/examenes-con-ia',
      en: '/exams-with-ai'
    },
    '/paper-exams': {
      es: '/examenes-papel',
      en: '/paper-exams'
    },

    
    // 🔐 Páginas de autenticación (LOCALIZADAS)
    '/auth/login': {
      es: '/auth/iniciar-sesion',
      en: '/auth/login'
    },
    '/auth/register': {
      es: '/auth/registro',
      en: '/auth/register'
    },
    '/auth/reset-password': {
      es: '/auth/restablecer-contrasena',
      en: '/auth/reset-password'
    },
    '/auth/update-password': {
      es: '/auth/actualizar-contrasena',
      en: '/auth/update-password'
    },
    '/auth/verify-email': {
      es: '/auth/verificar-email',
      en: '/auth/verify-email'
    },
    '/auth/email-confirmed': {
      es: '/auth/email-confirmado',
      en: '/auth/email-confirmed'
    },
    // ⚠️ IMPORTANTE: /auth/callback y /auth/direct-recovery NO se localizan
    // Estas rutas deben permanecer sin prefijo para que Supabase funcione
    
    // Dashboard
    '/dashboard': {
      es: '/panel',
      en: '/dashboard'
    },
    '/dashboard/exams': {
      es: '/panel/examenes',
      en: '/dashboard/exams'
    },
    '/dashboard/students': {
      es: '/panel/estudiantes',
      en: '/dashboard/students'
    },
    '/dashboard/groups': {
      es: '/panel/grupos',
      en: '/dashboard/groups'
    },
    '/dashboard/subjects': {
      es: '/panel/materias',
      en: '/dashboard/subjects'
    },
    '/dashboard/reports': {
      es: '/panel/reportes',
      en: '/dashboard/reports'
    },
    '/dashboard/settings': {
      es: '/panel/configuracion',
      en: '/dashboard/settings'
    },
    '/dashboard/profile': {
      es: '/panel/perfil',
      en: '/dashboard/profile'
    },
    '/dashboard/entities': {
      es: '/panel/entidades',
      en: '/dashboard/entities'
    }
  }
});

// 🔐 Rutas que NO deben ser localizadas (para callbacks de Supabase)
export const nonLocalizedRoutes = [
  '/auth/callback',
  '/auth/direct-recovery',
  '/api',
]; 