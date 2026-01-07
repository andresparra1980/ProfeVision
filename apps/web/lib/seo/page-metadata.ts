import type { Metadata } from 'next';
import {
  BASE_URL,
  LOCALES,
  LOCALIZED_ROUTES,
  buildLocalizedUrl,
  buildAlternates,
  type Locale,
} from './routes';

// Metadata por página y locale
type PageMeta = {
  title: string;
  description: string;
};

const pageMetadata: Record<string, Record<Locale, PageMeta>> = {
  '/': {
    en: {
      title: 'ProfeVision - The Best App to Scan and Grade Paper Exams with AI',
      description: "ProfeVision, the best app to scan and grade paper exams with AI. Automate exam creation, correction and management, save time and improve your students' education.",
    },
    es: {
      title: 'ProfeVisión - La Mejor App para Escanear y Calificar Exámenes en Papel con IA',
      description: 'ProfeVisión, la mejor aplicación para escanear y calificar exámenes en papel con IA. Automatiza la creación, corrección y gestión de exámenes.',
    },
    fr: {
      title: "ProfeVision - La Meilleure App pour Scanner et Noter les Examens avec l'IA",
      description: "ProfeVision, la meilleure application pour scanner et noter les examens papier avec l'IA. Automatisez la création et la correction des examens.",
    },
    pt: {
      title: 'ProfeVision - O Melhor App para Escanear e Corrigir Provas em Papel com IA',
      description: 'ProfeVision, o melhor aplicativo para escanear e corrigir provas em papel com IA. Automatize a criação, correção e gestão de provas.',
    },
  },
  '/pricing': {
    en: {
      title: 'Pricing Plans - ProfeVision',
      description: 'Choose the perfect plan for your needs. Start free and upgrade anytime. Affordable pricing for teachers and educators.',
    },
    es: {
      title: 'Planes y Precios - ProfeVisión',
      description: 'Elige el plan perfecto para tus necesidades. Comienza gratis y actualiza cuando quieras. Precios accesibles para profesores.',
    },
    fr: {
      title: 'Tarifs et Plans - ProfeVision',
      description: 'Choisissez le plan parfait pour vos besoins. Commencez gratuitement et mettez à niveau à tout moment.',
    },
    pt: {
      title: 'Planos e Preços - ProfeVision',
      description: 'Escolha o plano perfeito para suas necessidades. Comece grátis e faça upgrade quando quiser.',
    },
  },
  '/how-it-works': {
    en: {
      title: 'How It Works - ProfeVision',
      description: 'Learn how ProfeVision helps you create exams with AI, scan paper tests, and grade automatically. Save hours every week.',
    },
    es: {
      title: 'Cómo Funciona - ProfeVisión',
      description: 'Descubre cómo ProfeVisión te ayuda a crear exámenes con IA, escanear pruebas en papel y calificar automáticamente.',
    },
    fr: {
      title: 'Comment Ça Marche - ProfeVision',
      description: "Découvrez comment ProfeVision vous aide à créer des examens avec l'IA, scanner les tests papier et noter automatiquement.",
    },
    pt: {
      title: 'Como Funciona - ProfeVision',
      description: 'Descubra como o ProfeVision ajuda você a criar provas com IA, escanear testes em papel e corrigir automaticamente.',
    },
  },
  '/privacy': {
    en: {
      title: 'Privacy Policy - ProfeVision',
      description: 'Our privacy policy explains how we collect, use, and protect your personal data. Your privacy is important to us.',
    },
    es: {
      title: 'Política de Privacidad - ProfeVisión',
      description: 'Nuestra política de privacidad explica cómo recopilamos, usamos y protegemos tus datos personales.',
    },
    fr: {
      title: 'Politique de Confidentialité - ProfeVision',
      description: 'Notre politique de confidentialité explique comment nous collectons, utilisons et protégeons vos données personnelles.',
    },
    pt: {
      title: 'Política de Privacidade - ProfeVision',
      description: 'Nossa política de privacidade explica como coletamos, usamos e protegemos seus dados pessoais.',
    },
  },
  '/terms': {
    en: {
      title: 'Terms of Service - ProfeVision',
      description: 'Read our terms of service to understand your rights and responsibilities when using ProfeVision.',
    },
    es: {
      title: 'Términos de Servicio - ProfeVisión',
      description: 'Lee nuestros términos de servicio para entender tus derechos y responsabilidades al usar ProfeVisión.',
    },
    fr: {
      title: "Conditions d'Utilisation - ProfeVision",
      description: "Lisez nos conditions d'utilisation pour comprendre vos droits et responsabilités lors de l'utilisation de ProfeVision.",
    },
    pt: {
      title: 'Termos de Serviço - ProfeVision',
      description: 'Leia nossos termos de serviço para entender seus direitos e responsabilidades ao usar o ProfeVision.',
    },
  },
  '/cookies': {
    en: {
      title: 'Cookie Policy - ProfeVision',
      description: 'Learn about how we use cookies to improve your experience on ProfeVision.',
    },
    es: {
      title: 'Política de Cookies - ProfeVisión',
      description: 'Conoce cómo usamos las cookies para mejorar tu experiencia en ProfeVisión.',
    },
    fr: {
      title: 'Politique de Cookies - ProfeVision',
      description: 'Découvrez comment nous utilisons les cookies pour améliorer votre expérience sur ProfeVision.',
    },
    pt: {
      title: 'Política de Cookies - ProfeVision',
      description: 'Saiba como usamos cookies para melhorar sua experiência no ProfeVision.',
    },
  },
  '/contact': {
    en: {
      title: 'Contact Us - ProfeVision',
      description: 'Get in touch with our team. We are here to help you with any questions about ProfeVision.',
    },
    es: {
      title: 'Contáctanos - ProfeVisión',
      description: 'Ponte en contacto con nuestro equipo. Estamos aquí para ayudarte con cualquier pregunta.',
    },
    fr: {
      title: 'Contactez-Nous - ProfeVision',
      description: 'Contactez notre équipe. Nous sommes là pour vous aider avec toutes vos questions.',
    },
    pt: {
      title: 'Contate-Nos - ProfeVision',
      description: 'Entre em contato com nossa equipe. Estamos aqui para ajudá-lo com qualquer dúvida.',
    },
  },
  '/blog': {
    en: {
      title: 'Blog - ProfeVision',
      description: 'Read our latest articles about education, AI in teaching, exam management, and tips for teachers.',
    },
    es: {
      title: 'Blog - ProfeVisión',
      description: 'Lee nuestros últimos artículos sobre educación, IA en la enseñanza, gestión de exámenes y consejos para profesores.',
    },
    fr: {
      title: 'Blog - ProfeVision',
      description: "Lisez nos derniers articles sur l'éducation, l'IA dans l'enseignement, la gestion des examens et des conseils pour les enseignants.",
    },
    pt: {
      title: 'Blog - ProfeVision',
      description: 'Leia nossos últimos artigos sobre educação, IA no ensino, gestão de provas e dicas para professores.',
    },
  },
  '/exams-with-ai': {
    en: {
      title: 'Create Exams with AI - ProfeVision',
      description: 'Generate professional exams in minutes using artificial intelligence. Multiple choice, true/false, and more question types.',
    },
    es: {
      title: 'Crear Exámenes con IA - ProfeVisión',
      description: 'Genera exámenes profesionales en minutos usando inteligencia artificial. Opción múltiple, verdadero/falso y más.',
    },
    fr: {
      title: "Créer des Examens avec l'IA - ProfeVision",
      description: "Générez des examens professionnels en minutes grâce à l'intelligence artificielle. QCM, vrai/faux et plus.",
    },
    pt: {
      title: 'Criar Provas com IA - ProfeVision',
      description: 'Gere provas profissionais em minutos usando inteligência artificial. Múltipla escolha, verdadeiro/falso e mais.',
    },
  },
  '/paper-exams': {
    en: {
      title: 'Scan Paper Exams - ProfeVision',
      description: 'Scan and grade paper exams instantly with your phone camera. OMR technology for fast, accurate grading.',
    },
    es: {
      title: 'Escanear Exámenes en Papel - ProfeVisión',
      description: 'Escanea y califica exámenes en papel al instante con la cámara de tu celular. Tecnología OMR para calificación rápida.',
    },
    fr: {
      title: 'Scanner les Examens Papier - ProfeVision',
      description: 'Scannez et notez les examens papier instantanément avec votre téléphone. Technologie OMR pour une notation rapide.',
    },
    pt: {
      title: 'Escanear Provas em Papel - ProfeVision',
      description: 'Escaneie e corrija provas em papel instantaneamente com a câmera do celular. Tecnologia OMR para correção rápida.',
    },
  },
  '/institutions-management': {
    en: {
      title: 'Manage Institutions - ProfeVision',
      description: 'Organize your institutions and schools in one place. Perfect for teachers working at multiple locations.',
    },
    es: {
      title: 'Gestión de Instituciones - ProfeVisión',
      description: 'Organiza tus instituciones y escuelas en un solo lugar. Perfecto para profesores que trabajan en múltiples lugares.',
    },
    fr: {
      title: 'Gestion des Établissements - ProfeVision',
      description: 'Organisez vos établissements et écoles en un seul endroit. Parfait pour les enseignants travaillant dans plusieurs lieux.',
    },
    pt: {
      title: 'Gestão de Instituições - ProfeVision',
      description: 'Organize suas instituições e escolas em um só lugar. Perfeito para professores que trabalham em vários locais.',
    },
  },
  '/subjects-management': {
    en: {
      title: 'Manage Subjects - ProfeVision',
      description: 'Organize all your subjects and courses. Create question banks and reuse content across exams.',
    },
    es: {
      title: 'Gestión de Materias - ProfeVisión',
      description: 'Organiza todas tus materias y cursos. Crea bancos de preguntas y reutiliza contenido entre exámenes.',
    },
    fr: {
      title: 'Gestion des Matières - ProfeVision',
      description: 'Organisez toutes vos matières et cours. Créez des banques de questions et réutilisez le contenu.',
    },
    pt: {
      title: 'Gestão de Disciplinas - ProfeVision',
      description: 'Organize todas as suas disciplinas e cursos. Crie bancos de questões e reutilize conteúdo entre provas.',
    },
  },
  '/groups-management': {
    en: {
      title: 'Manage Groups & Classes - ProfeVision',
      description: 'Organize your student groups and classes. Track grades and performance by group.',
    },
    es: {
      title: 'Gestión de Grupos y Clases - ProfeVisión',
      description: 'Organiza tus grupos de estudiantes y clases. Rastrea calificaciones y rendimiento por grupo.',
    },
    fr: {
      title: 'Gestion des Groupes et Classes - ProfeVision',
      description: 'Organisez vos groupes et classes. Suivez les notes et les performances par groupe.',
    },
    pt: {
      title: 'Gestão de Turmas e Classes - ProfeVision',
      description: 'Organize seus grupos de alunos e turmas. Acompanhe notas e desempenho por grupo.',
    },
  },
  '/students-management': {
    en: {
      title: 'Manage Students - ProfeVision',
      description: 'Keep track of all your students in one place. View individual performance and exam history.',
    },
    es: {
      title: 'Gestión de Estudiantes - ProfeVisión',
      description: 'Mantén un registro de todos tus estudiantes en un solo lugar. Ve rendimiento individual e historial.',
    },
    fr: {
      title: 'Gestion des Étudiants - ProfeVision',
      description: "Gardez une trace de tous vos étudiants en un seul endroit. Consultez les performances individuelles et l'historique.",
    },
    pt: {
      title: 'Gestão de Alunos - ProfeVision',
      description: 'Mantenha o registro de todos os seus alunos em um só lugar. Veja desempenho individual e histórico.',
    },
  },
  '/reports': {
    en: {
      title: 'Reports & Analytics - ProfeVision',
      description: 'Get detailed insights into student performance. Charts, statistics, and exportable reports.',
    },
    es: {
      title: 'Reportes y Análisis - ProfeVisión',
      description: 'Obtén información detallada sobre el rendimiento estudiantil. Gráficos, estadísticas y reportes exportables.',
    },
    fr: {
      title: 'Rapports et Analyses - ProfeVision',
      description: 'Obtenez des informations détaillées sur les performances. Graphiques, statistiques et rapports exportables.',
    },
    pt: {
      title: 'Relatórios e Análises - ProfeVision',
      description: 'Obtenha insights detalhados sobre o desempenho dos alunos. Gráficos, estatísticas e relatórios exportáveis.',
    },
  },
  '/mobile-app': {
    en: {
      title: 'Mobile App - ProfeVision',
      description: 'Grade exams on the go with our mobile app. Scan paper tests with your phone camera anywhere, anytime.',
    },
    es: {
      title: 'Aplicación Móvil - ProfeVisión',
      description: 'Califica exámenes sobre la marcha con nuestra app móvil. Escanea pruebas con tu celular donde sea.',
    },
    fr: {
      title: 'Application Mobile - ProfeVision',
      description: "Notez les examens en déplacement avec notre application mobile. Scannez les tests n'importe où.",
    },
    pt: {
      title: 'Aplicativo Móvel - ProfeVision',
      description: 'Corrija provas em qualquer lugar com nosso app móvel. Escaneie testes com seu celular onde estiver.',
    },
  },
  '/data-deletion': {
    en: {
      title: 'Data Deletion - ProfeVision',
      description: 'Request deletion of your personal data. We respect your right to privacy and data control.',
    },
    es: {
      title: 'Eliminación de Datos - ProfeVisión',
      description: 'Solicita la eliminación de tus datos personales. Respetamos tu derecho a la privacidad.',
    },
    fr: {
      title: 'Suppression des Données - ProfeVision',
      description: 'Demandez la suppression de vos données personnelles. Nous respectons votre droit à la vie privée.',
    },
    pt: {
      title: 'Exclusão de Dados - ProfeVision',
      description: 'Solicite a exclusão dos seus dados pessoais. Respeitamos seu direito à privacidade.',
    },
  },
};

const OG_IMAGE = `${BASE_URL}/android-chrome-512x512.png`;

function getOgLocale(locale: Locale): string {
  const map: Record<Locale, string> = {
    en: 'en_US',
    es: 'es_ES',
    fr: 'fr_FR',
    pt: 'pt_BR',
  };
  return map[locale];
}

function getAlternateLocales(currentLocale: Locale): string[] {
  return LOCALES.filter((l) => l !== currentLocale).map(getOgLocale);
}

/**
 * Generate SEO metadata for a public page
 * @param canonicalPath - The canonical path (e.g., '/pricing', '/how-it-works')
 * @param locale - The current locale
 */
export function generatePageMetadata(
  canonicalPath: string,
  locale: string
): Metadata {
  const validLocale = (locale as Locale) || 'en';
  const meta = pageMetadata[canonicalPath]?.[validLocale] || pageMetadata[canonicalPath]?.en;

  if (!meta || !LOCALIZED_ROUTES[canonicalPath]) {
    return {
      title: 'ProfeVision',
      description: 'The best app to scan and grade paper exams with AI.',
    };
  }

  const currentUrl = buildLocalizedUrl(canonicalPath, validLocale);
  const alternates = buildAlternates(canonicalPath);

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: currentUrl,
      languages: alternates,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: currentUrl,
      siteName: 'ProfeVision',
      locale: getOgLocale(validLocale),
      alternateLocale: getAlternateLocales(validLocale),
      type: 'website',
      images: [
        {
          url: OG_IMAGE,
          width: 512,
          height: 512,
          alt: meta.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [OG_IMAGE],
    },
  };
}
