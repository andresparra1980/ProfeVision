/**
 * Shared route mappings for all locales
 * Used by middleware.ts and auth-provider.tsx to ensure consistency
 */
export const routeMappings: Record<string, Record<string, string>> = {
  privacy: { es: "privacidad", en: "privacy", fr: "confidentialite", pt: "privacidade" },
  terms: { es: "terminos", en: "terms", fr: "conditions", pt: "termos" },
  cookies: { es: "cookies", en: "cookies", fr: "cookies", pt: "cookies" },
  dataDeletion: { es: "data-deletion", en: "data-deletion", fr: "data-deletion", pt: "data-deletion" },
  howItWorks: { es: "como-funciona", en: "how-it-works", fr: "comment-ca-marche", pt: "como-funciona" },
  pricing: { es: "precios", en: "pricing", fr: "tarification", pt: "precos" },
  contact: { es: "contacto", en: "contact", fr: "contact", pt: "contato" },
  blog: { es: "blog", en: "blog", fr: "blog", pt: "blog" },
  examsWithAI: { es: "examenes-con-ia", en: "exams-with-ai", fr: "examens-avec-ia", pt: "exames-com-ia" },
  paperExams: { es: "examenes-papel", en: "paper-exams", fr: "examens-papier", pt: "exames-papel" },
  institutions: { es: "gestion-instituciones", en: "institutions-management", fr: "gestion-etablissements", pt: "gerenciamento-instituicoes" },
  subjects: { es: "gestion-materias", en: "subjects-management", fr: "gestion-matieres", pt: "gerenciamento-disciplinas" },
  groups: { es: "gestion-grupos", en: "groups-management", fr: "gestion-groupes", pt: "gerenciamento-grupos" },
  students: { es: "gestion-estudiantes", en: "students-management", fr: "gestion-etudiants", pt: "gerenciamento-estudantes" },
  reports: { es: "reportes", en: "reports", fr: "rapports", pt: "relatorios" },
  mobileApp: { es: "aplicacion-movil", en: "mobile-app", fr: "application-mobile", pt: "aplicativo-movil" },
  // Auth routes
  login: { es: "iniciar-sesion", en: "login", fr: "connexion", pt: "entrar" },
  register: { es: "registro", en: "register", fr: "inscription", pt: "cadastro" },
  resetPassword: { es: "restablecer-contrasena", en: "reset-password", fr: "reinitialiser-mot-de-passe", pt: "redefinir-senha" },
  updatePassword: { es: "actualizar-contrasena", en: "update-password", fr: "mettre-a-jour-mot-de-passe", pt: "atualizar-senha" },
  verifyEmail: { es: "verificar-email", en: "verify-email", fr: "verifier-email", pt: "verificar-email" },
  emailConfirmed: { es: "email-confirmado", en: "email-confirmed", fr: "email-confirme", pt: "email-confirmado" },
};

/**
 * Helper function to get a localized route
 * Falls back to English if locale is not found
 */
export function getLocalizedRoute(key: string, locale: string): string {
  return routeMappings[key]?.[locale] || routeMappings[key]?.["en"] || key;
}
