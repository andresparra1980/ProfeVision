import { Pathnames, defineRouting } from 'next-intl/routing';

export const pathnames = {
  // Páginas públicas
  '/': '/',
  '/about': {
    es: '/acerca-de',
    en: '/about',
    fr: '/a-propos',
    pt: '/sobre'
  },
  '/pricing': {
    es: '/precios',
    en: '/pricing',
    fr: '/tarification',
    pt: '/precos'
  },
  '/exams': {
    es: '/examenes',
    en: '/exams',
    fr: '/examens',
    pt: '/exames'
  },
  '/how-it-works': {
    es: '/como-funciona',
    en: '/how-it-works',
    fr: '/comment-ca-marche',
    pt: '/como-funciona'
  },
  '/contact': {
    es: '/contacto',
    en: '/contact',
    fr: '/contact',
    pt: '/contato'
  },
  '/blog': {
    es: '/blog',
    en: '/blog',
    fr: '/blog',
    pt: '/blog'
  },
  '/privacy': {
    es: '/privacidad',
    en: '/privacy',
    fr: '/confidentialite',
    pt: '/privacidade'
  },
  '/terms': {
    es: '/terminos',
    en: '/terms',
    fr: '/conditions',
    pt: '/termos'
  },
  '/cookies': {
    es: '/cookies',
    en: '/cookies',
    fr: '/cookies',
    pt: '/cookies'
  },
  '/data-deletion': {
    es: '/data-deletion',
    en: '/data-deletion',
    fr: '/data-deletion',
    pt: '/data-deletion'
  },
  '/institutions-management': {
    es: '/gestion-instituciones',
    en: '/institutions-management',
    fr: '/gestion-etablissements',
    pt: '/gerenciamento-instituicoes'
  },
  '/subjects-management': {
    es: '/gestion-materias',
    en: '/subjects-management',
    fr: '/gestion-matieres',
    pt: '/gerenciamento-disciplinas'
  },
  '/groups-management': {
    es: '/gestion-grupos',
    en: '/groups-management',
    fr: '/gestion-groupes',
    pt: '/gerenciamento-grupos'
  },
  '/students-management': {
    es: '/gestion-estudiantes',
    en: '/students-management',
    fr: '/gestion-etudiants',
    pt: '/gerenciamento-estudantes'
  },
  '/reports': {
    es: '/reportes',
    en: '/reports',
    fr: '/rapports',
    pt: '/relatorios'
  },
  '/mobile-app': {
    es: '/aplicacion-movil',
    en: '/mobile-app',
    fr: '/application-mobile',
    pt: '/aplicativo-movil'
  },
  '/exams/manual-generator': {
    es: '/examenes/generador-manual',
    en: '/exams/manual-generator',
    fr: '/examens/generateur-manuel',
    pt: '/exames/gerador-manual'
  },
  '/exams/ai-generator': {
    es: '/examenes/generador-ia',
    en: '/exams/ai-generator',
    fr: '/examens/generateur-ia',
    pt: '/exames/gerador-ia'
  },
  '/exams-with-ai': {
    es: '/examenes-con-ia',
    en: '/exams-with-ai',
    fr: '/examens-avec-ia',
    pt: '/exames-com-ia'
  },
  '/paper-exams': {
    es: '/examenes-papel',
    en: '/paper-exams',
    fr: '/examens-papier',
    pt: '/exames-papel'
  },

  
  // 🔐 Páginas de autenticación (LOCALIZADAS)
  '/auth/login': {
    es: '/auth/iniciar-sesion',
    en: '/auth/login',
    fr: '/auth/connexion',
    pt: '/auth/entrar'
  },
  '/auth/register': {
    es: '/auth/registro',
    en: '/auth/register',
    fr: '/auth/inscription',
    pt: '/auth/cadastro'
  },
  '/auth/reset-password': {
    es: '/auth/restablecer-contrasena',
    en: '/auth/reset-password',
    fr: '/auth/reinitialiser-mot-de-passe',
    pt: '/auth/redefinir-senha'
  },
  '/auth/update-password': {
    es: '/auth/actualizar-contrasena',
    en: '/auth/update-password',
    fr: '/auth/mettre-a-jour-mot-de-passe',
    pt: '/auth/atualizar-senha'
  },
  '/auth/verify-email': {
    es: '/auth/verificar-email',
    en: '/auth/verify-email',
    fr: '/auth/verifier-email',
    pt: '/auth/verificar-email'
  },
  '/auth/email-confirmed': {
    es: '/auth/email-confirmado',
    en: '/auth/email-confirmed',
    fr: '/auth/email-confirme',
    pt: '/auth/email-confirmado'
  },
  // ⚠️ IMPORTANTE: /auth/callback y /auth/direct-recovery NO se localizan
  // Estas rutas deben permanecer sin prefijo para que Supabase funcione
  
  // Dashboard rutas principales
  '/dashboard': {
    es: '/dashboard',
    en: '/dashboard',
    fr: '/tableau-de-bord',
    pt: '/painel'
  },
  '/dashboard/exams': { 
    es: '/dashboard/examenes', 
    en: '/dashboard/exams',
    fr: '/dashboard/examens',
    pt: '/dashboard/exames'
  },
  '/dashboard/exams/create': { 
    es: '/dashboard/examenes/crear', 
    en: '/dashboard/exams/create',
    fr: '/dashboard/examens/creer',
    pt: '/dashboard/exames/criar'
  },
  '/dashboard/exams/create-with-ai': { 
    es: '/dashboard/examenes/crear-con-ia', 
    en: '/dashboard/exams/create-with-ai',
    fr: '/dashboard/examens/creer-avec-ia',
    pt: '/dashboard/exames/criar-com-ia'
  },
  '/dashboard/exams/ai-exams-creation-chat': {
    es: '/dashboard/examenes/chat-creacion-ia',
    en: '/dashboard/exams/ai-exams-creation-chat',
    fr: '/dashboard/examens/chat-creation-ia',
    pt: '/dashboard/exames/chat-criacao-ia'
  },
  '/dashboard/exams/[id]': {
    es: '/dashboard/examenes/[id]',
    en: '/dashboard/exams/[id]',
    fr: '/dashboard/examens/[id]',
    pt: '/dashboard/exames/[id]'
  },
  '/dashboard/exams/[id]/edit': {
    es: '/dashboard/examenes/[id]/editar',
    en: '/dashboard/exams/[id]/edit',
    fr: '/dashboard/examens/[id]/modifier',
    pt: '/dashboard/exames/[id]/editar'
  },
  '/dashboard/exams/[id]/export': {
    es: '/dashboard/examenes/[id]/exportar',
    en: '/dashboard/exams/[id]/export',
    fr: '/dashboard/examens/[id]/exporter',
    pt: '/dashboard/exames/[id]/exportar'
  },
  '/dashboard/exams/[id]/responses': {
    es: '/dashboard/examenes/[id]/respuestas',
    en: '/dashboard/exams/[id]/responses',
    fr: '/dashboard/examens/[id]/reponses',
    pt: '/dashboard/exames/[id]/respostas'
  },
  '/dashboard/exams/[id]/assign': {
    es: '/dashboard/examenes/[id]/asignar',
    en: '/dashboard/exams/[id]/assign',
    fr: '/dashboard/examens/[id]/assigner',
    pt: '/dashboard/exames/[id]/atribuir'
  },
   '/dashboard/exams/[id]/link-grade-component': {
     es: '/dashboard/examenes/[id]/vincular-calificacion',
     en: '/dashboard/exams/[id]/link-grade-component',
     fr: '/dashboard/examens/[id]/lier-note',
     pt: '/dashboard/exames/[id]/vincular-nota'
   },
  '/dashboard/exams/[id]/results': {
    es: '/dashboard/examenes/[id]/resultados',
    en: '/dashboard/exams/[id]/results',
    fr: '/dashboard/examens/[id]/resultats',
    pt: '/dashboard/exames/[id]/resultados'
  },
  '/dashboard/students': { 
    es: '/dashboard/estudiantes', 
    en: '/dashboard/students',
    fr: '/dashboard/etudiants',
    pt: '/dashboard/estudantes'
  },
  '/dashboard/groups': { 
    es: '/dashboard/grupos', 
    en: '/dashboard/groups',
    fr: '/dashboard/groupes',
    pt: '/dashboard/grupos'
  },
  '/dashboard/groups/[id]/students': {
    es: '/dashboard/grupos/[id]/estudiantes',
    en: '/dashboard/groups/[id]/students',
    fr: '/dashboard/groupes/[id]/etudiants',
    pt: '/dashboard/grupos/[id]/estudantes'
  },
  '/dashboard/groups/[id]/grades': {
    es: '/dashboard/grupos/[id]/calificaciones',
    en: '/dashboard/groups/[id]/grades',
    fr: '/dashboard/groupes/[id]/notes',
    pt: '/dashboard/grupos/[id]/notas'
  },
  '/dashboard/groups/[id]/grading-scheme': {
    es: '/dashboard/grupos/[id]/esquema-calificacion',
    en: '/dashboard/groups/[id]/grading-scheme',
    fr: '/dashboard/groupes/[id]/schema-notation',
    pt: '/dashboard/grupos/[id]/esquema-notas'
  },
  '/dashboard/subjects': { 
    es: '/dashboard/materias', 
    en: '/dashboard/subjects',
    fr: '/dashboard/matieres',
    pt: '/dashboard/disciplinas'
  },
  '/dashboard/subscription': {
    es: '/dashboard/suscripcion',
    en: '/dashboard/subscription',
    fr: '/dashboard/abonnement',
    pt: '/dashboard/assinatura'
  },
  '/dashboard/settings': { 
    es: '/dashboard/configuracion', 
    en: '/dashboard/settings',
    fr: '/dashboard/parametres',
    pt: '/dashboard/configuracoes'
  },
  '/dashboard/profile': { 
    es: '/dashboard/perfil', 
    en: '/dashboard/profile',
    fr: '/dashboard/profil',
    pt: '/dashboard/perfil'
  },
  '/dashboard/entities': {
    es: '/panel/entidades',
    en: '/dashboard/entities',
    fr: '/panel/entites',
    pt: '/painel/entidades'
  },
  // Admin dashboard
  '/dashboard/admin': {
    es: '/dashboard/admin',
    en: '/dashboard/admin',
    fr: '/dashboard/admin',
    pt: '/dashboard/admin'
  },
  '/dashboard/admin/users': {
    es: '/dashboard/admin/usuarios',
    en: '/dashboard/admin/users',
    fr: '/dashboard/admin/utilisateurs',
    pt: '/dashboard/admin/usuarios'
  }
} satisfies Pathnames<['es', 'en', 'fr', 'pt']>;

export const routing = defineRouting({
  locales: ['es', 'en', 'fr', 'pt'],
  defaultLocale: 'es',
  pathnames
});

export type AppPathnames = keyof typeof pathnames;

// A comment to trigger recompilation
// 🔐 Rutas que NO deben ser localizadas (para callbacks de Supabase)
export const nonLocalizedRoutes = [
  '/auth/callback',
  '/auth/direct-recovery',
  '/api',
];
