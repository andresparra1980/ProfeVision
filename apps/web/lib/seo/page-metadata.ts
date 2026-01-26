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
  keywords?: string[];
};

const pageMetadata: Record<string, Record<Locale, PageMeta>> = {
  '/': {
    en: {
      title: 'ProfeVision - The Best App to Scan and Grade Paper Exams with AI',
      description: "ProfeVision is the ultimate AI-powered app for teachers. Scan and grade paper exams instantly with your phone, automate exam creation, and manage student performance with ease.",
    },
    es: {
      title: 'ProfeVisión - La Mejor App para Escanear y Calificar Exámenes en Papel con IA',
      description: 'ProfeVisión es la herramienta definitiva para profesores. Escanea y califica exámenes en papel al instante con tu celular, automatiza la creación de pruebas con IA y gestiona notas.',
    },
    fr: {
      title: "ProfeVision - La Meilleure App pour Scanner et Noter les Examens avec l'IA",
      description: "ProfeVision est l'application ultime pour les enseignants. Scannez et notez les examens papier instantanément, créez des tests avec l'IA et gérez facilement les résultats.",
    },
    pt: {
      title: 'ProfeVision - O Melhor App para Escanear e Corrigir Provas em Papel com IA',
      description: 'ProfeVision é a ferramenta definitiva para professores. Escaneie e corrija provas em papel instantaneamente, crie avaliações com IA e gerencie o desempenho dos alunos facilmente.',
    },
  },
  '/pricing': {
    en: {
      title: 'Pricing Plans - ProfeVision',
      description: 'Explore affordable pricing plans tailored for teachers and schools. Start with our free tier and upgrade for advanced AI features, unlimited scanning, and detailed analytics.',
    },
    es: {
      title: 'Planes y Precios - ProfeVisión',
      description: 'Explora planes de precios accesibles diseñados para profesores y escuelas. Comienza gratis y actualiza para funciones avanzadas de IA, escaneo ilimitado y análisis detallados.',
    },
    fr: {
      title: 'Tarifs et Plans - ProfeVision',
      description: "Découvrez nos tarifs abordables pour enseignants et écoles. Commencez gratuitement et profitez de fonctionnalités IA avancées, de scans illimités et d'analyses détaillées.",
    },
    pt: {
      title: 'Planos e Preços - ProfeVision',
      description: 'Confira nossos planos acessíveis para professores e escolas. Comece grátis e faça upgrade para recursos avançados de IA, correção ilimitada e análises detalhadas.',
    },
  },
  '/how-it-works': {
    en: {
      title: 'How It Works - ProfeVision',
      description: 'Discover how ProfeVision transforms grading. Learn to generate exams with AI, scan answer sheets with your phone, and get instant results to save hours of work every week.',
    },
    es: {
      title: 'Cómo Funciona - ProfeVisión',
      description: 'Descubre cómo ProfeVisión transforma la calificación. Aprende a generar exámenes con IA, escanear hojas de respuesta con tu celular y obtener resultados al instante.',
    },
    fr: {
      title: 'Comment Ça Marche - ProfeVision',
      description: "Découvrez comment ProfeVision transforme la notation. Apprenez à générer des examens avec l'IA, scanner les feuilles de réponses et obtenir des résultats instantanés.",
    },
    pt: {
      title: 'Como Funciona - ProfeVision',
      description: 'Veja como o ProfeVision transforma a correção. Aprenda a criar provas com IA, escanear gabaritos com o celular e obter resultados instantâneos para economizar horas.',
    },
  },
  '/privacy': {
    en: {
      title: 'Privacy Policy - ProfeVision',
      description: 'We value your privacy. Read our detailed Privacy Policy to understand how ProfeVision collects, protects, and manages your personal data and student information securely.',
    },
    es: {
      title: 'Política de Privacidad - ProfeVisión',
      description: 'Valoramos tu privacidad. Lee nuestra Política de Privacidad detallada para entender cómo ProfeVisión recopila, protege y gestiona tus datos personales y de estudiantes.',
    },
    fr: {
      title: 'Politique de Confidentialité - ProfeVision',
      description: 'Votre vie privée compte. Lisez notre politique pour comprendre comment ProfeVision collecte, protège et gère vos données personnelles et celles de vos élèves en toute sécurité.',
    },
    pt: {
      title: 'Política de Privacidade - ProfeVision',
      description: 'Valorizamos sua privacidade. Leia nossa Política de Privacidade para entender como o ProfeVision coleta, protege e gerencia seus dados pessoais e de alunos com segurança.',
    },
  },
  '/terms': {
    en: {
      title: 'Terms of Service - ProfeVision',
      description: 'Review the Terms of Service for using ProfeVision. Understand the rules, user rights, and responsibilities governing the use of our grading and exam management platform.',
    },
    es: {
      title: 'Términos de Servicio - ProfeVisión',
      description: 'Revisa los Términos de Servicio de ProfeVisión. Comprende las reglas, derechos y responsabilidades que rigen el uso de nuestra plataforma de calificación y gestión de exámenes.',
    },
    fr: {
      title: "Conditions d'Utilisation - ProfeVision",
      description: "Consultez les conditions d'utilisation de ProfeVision. Comprenez les règles, droits et responsabilités régissant l'utilisation de notre plateforme de notation d'examens.",
    },
    pt: {
      title: 'Termos de Serviço - ProfeVision',
      description: 'Revise os Termos de Serviço do ProfeVision. Entenda as regras, direitos e responsabilidades que regem o uso de nossa plataforma de correção e gestão de provas.',
    },
  },
  '/cookies': {
    en: {
      title: 'Cookie Policy - ProfeVision',
      description: 'Our Cookie Policy explains how ProfeVision uses cookies to enhance user experience, analyze site traffic, and personalize content. Manage your preferences here.',
    },
    es: {
      title: 'Política de Cookies - ProfeVisión',
      description: 'Nuestra Política de Cookies explica cómo ProfeVisión usa cookies para mejorar la experiencia, analizar el tráfico y personalizar contenido. Gestiona tus preferencias aquí.',
    },
    fr: {
      title: 'Politique de Cookies - ProfeVision',
      description: 'Notre politique de cookies explique comment ProfeVision utilise les cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu.',
    },
    pt: {
      title: 'Política de Cookies - ProfeVision',
      description: 'Nossa Política de Cookies explica como o ProfeVision usa cookies para melhorar a experiência, analisar tráfego e personalizar conteúdo. Gerencie suas preferências.',
    },
  },
  '/contact': {
    en: {
      title: 'Contact Us - ProfeVision',
      description: 'Need help? Contact the ProfeVision support team for inquiries about our AI grading app, account assistance, or partnership opportunities. We are here to assist you.',
    },
    es: {
      title: 'Contáctanos - ProfeVisión',
      description: '¿Necesitas ayuda? Contacta al equipo de soporte de ProfeVisión para consultas sobre nuestra app de calificación, ayuda con tu cuenta u oportunidades de colaboración.',
    },
    fr: {
      title: 'Contactez-Nous - ProfeVision',
      description: "Besoin d'aide ? Contactez l'équipe support de ProfeVision pour toute question sur notre application, assistance compte ou opportunités de partenariat.",
    },
    pt: {
      title: 'Contate-Nos - ProfeVision',
      description: 'Precisa de ajuda? Entre em contato com a equipe de suporte do ProfeVision para dúvidas sobre nosso app, assistência com a conta ou parcerias. Estamos aqui para ajudar.',
    },
  },
  '/blog': {
    en: {
      title: 'Blog - ProfeVision',
      description: 'Stay updated with the ProfeVision blog. Read expert articles on education technology, AI in the classroom, assessment strategies, and productivity tips for modern teachers.',
    },
    es: {
      title: 'Blog - ProfeVisión',
      description: 'Mantente actualizado con el blog de ProfeVisión. Lee artículos expertos sobre tecnología educativa, IA en el aula, estrategias de evaluación y tips de productividad docente.',
    },
    fr: {
      title: 'Blog - ProfeVision',
      description: 'Restez informé avec le blog ProfeVision. Lisez des articles sur la technologie éducative, l\'IA en classe, les stratégies d\'évaluation et des conseils de productivité.',
    },
    pt: {
      title: 'Blog - ProfeVision',
      description: 'Fique atualizado com o blog do ProfeVision. Leia artigos sobre tecnologia educacional, IA na sala de aula, estratégias de avaliação e dicas de produtividade para professores.',
    },
  },
  '/exams-with-ai': {
    en: {
      title: 'Create Exams with AI & Bloom\'s Taxonomy - ProfeVision',
      description: 'Revolutionize assessment with our pedagogical AI assistant. Generate valid, Bloom\'s Taxonomy-aligned exams with automated scaffolding and instant feedback for students.',
      keywords: ['AI exam generator', 'Bloom taxonomy', 'instructional design', 'pedagogical AI', 'automated rubrics', 'teacher tools'],
    },
    es: {
      title: 'Crear Exámenes con IA y Taxonomía de Bloom - ProfeVisión',
      description: 'Revoluciona la evaluación con nuestro asistente pedagógico IA. Genera exámenes válidos alineados a la Taxonomía de Bloom con andamiaje automático y retroalimentación.',
      keywords: ['generador de exámenes IA', 'taxonomía de Bloom', 'diseño instruccional', 'IA pedagógica', 'rúbricas automatizadas', 'herramientas docentes'],
    },
    fr: {
      title: "Créer des Exámenes avec l'IA et la Taxonomie de Bloom - ProfeVision",
      description: "Révolutionnez l'évaluation avec notre assistant pédagogique IA. Générez des examens valides alignés sur la taxonomie de Bloom avec échafaudage et rétroaction automatisés.",
      keywords: ['générateur d examen IA', 'taxonomie de Bloom', 'conception pédagogique', 'IA pédagogique', 'rubriques automatisées'],
    },
    pt: {
      title: 'Criar Provas com IA e Taxonomía de Bloom - ProfeVision',
      description: 'Revolucione a avaliação com nosso assistente pedagógico de IA. Gere provas válidas alinhadas à Taxonomia de Bloom com andaimes automatizados e feedback instantâneo.',
      keywords: ['gerador de provas IA', 'taxonomia de Bloom', 'design instrucional', 'IA pedagógica', 'rubricas automatizadas'],
    },
  },
  '/paper-exams': {
    en: {
      title: 'Scan Paper Exams - ProfeVision',
      description: 'Grade paper exams in seconds with ProfeVision. Our OMR technology turns your mobile camera into a high-speed scanner, delivering 99.9% accuracy and instant gradebook sync.',
    },
    es: {
      title: 'Escanear Exámenes en Papel - ProfeVisión',
      description: 'Califica exámenes en papel en segundos con ProfeVisión. Nuestra tecnología OMR convierte tu celular en un escáner de alta velocidad, con 99.9% de precisión.',
    },
    fr: {
      title: 'Scanner les Examens Papier - ProfeVision',
      description: 'Notez les examens papier en quelques secondes avec ProfeVision. Notre technologie OMR transforme votre mobile en scanner haute vitesse avec une précision de 99,9%.',
    },
    pt: {
      title: 'Escanear Provas em Papel - ProfeVision',
      description: 'Corrija provas em papel em segundos com ProfeVision. Nossa tecnologia OMR transforma seu celular em um scanner de alta velocidade, com 99.9% de precisão.',
    },
  },
  '/institutions-management': {
    en: {
      title: 'Manage Institutions - ProfeVision',
      description: 'Effortlessly organize multiple schools and institutions in one dashboard. Ideal for teachers working across different locations who need centralized class management.',
    },
    es: {
      title: 'Gestión de Instituciones - ProfeVisión',
      description: 'Organiza sin esfuerzo múltiples escuelas e instituciones en un panel. Ideal para profesores que trabajan en diferentes lugares y necesitan gestión centralizada.',
    },
    fr: {
      title: 'Gestion des Établissements - ProfeVision',
      description: 'Organisez sans effort plusieurs écoles et établissements dans un seul tableau de bord. Idéal pour les enseignants travaillant sur plusieurs sites.',
    },
    pt: {
      title: 'Gestão de Instituições - ProfeVision',
      description: 'Organize sem esforço várias escolas e instituições em um painel. Ideal para professores que trabalham em diferentes locais e precisam de gestão centralizada.',
    },
  },
  '/subjects-management': {
    en: {
      title: 'Manage Subjects - ProfeVision',
      description: 'Streamline your curriculum. Organize subjects, create reusable question banks, and manage course content efficiently to save preparation time for future exams.',
    },
    es: {
      title: 'Gestión de Materias - ProfeVisión',
      description: 'Optimiza tu currículo. Organiza materias, crea bancos de preguntas reutilizables y gestiona el contenido del curso eficientemente para ahorrar tiempo de preparación.',
    },
    fr: {
      title: 'Gestion des Matières - ProfeVision',
      description: 'Rationalisez votre programme. Organisez les matières, créez des banques de questions réutilisables et gérez efficacement le contenu des cours.',
    },
    pt: {
      title: 'Gestão de Disciplinas - ProfeVision',
      description: 'Otimize seu currículo. Organize disciplinas, crie bancos de questões reutilizáveis e gerencie o conteúdo do curso com eficiência para economizar tempo.',
    },
  },
  '/groups-management': {
    en: {
      title: 'Manage Groups & Classes - ProfeVision',
      description: 'Keep your classes organized with intuitive group management tools. Track student rosters, assign specific exams to groups, and monitor collective performance easily.',
    },
    es: {
      title: 'Gestión de Grupos y Clases - ProfeVisión',
      description: 'Mantén tus clases organizadas con herramientas intuitivas. Gestiona listas de estudiantes, asigna exámenes específicos a grupos y monitorea el rendimiento colectivo.',
    },
    fr: {
      title: 'Gestion des Groupes et Classes - ProfeVision',
      description: 'Gardez vos classes organisées avec des outils de gestion intuitifs. Suivez les listes d\'élèves, assignez des examens aux groupes et surveillez les performances.',
    },
    pt: {
      title: 'Gestão de Turmas e Classes - ProfeVision',
      description: 'Mantenha suas turmas organizadas com ferramentas intuitivas. Gerencie listas de alunos, atribua provas específicas a grupos e monitore o desempenho coletivo.',
    },
  },
  '/students-management': {
    en: {
      title: 'Manage Students - ProfeVision',
      description: 'Centralize student data for better tracking. Access individual profiles, view comprehensive exam history, and monitor academic progress for every student in your classes.',
    },
    es: {
      title: 'Gestión de Estudiantes - ProfeVisión',
      description: 'Centraliza datos de estudiantes para un mejor seguimiento. Accede a perfiles individuales, historial de exámenes y monitorea el progreso académico de cada alumno.',
    },
    fr: {
      title: 'Gestion des Étudiants - ProfeVision',
      description: 'Centralisez les données des étudiants. Accédez aux profils individuels, consultez l\'historique des examens et suivez les progrès académiques de chaque élève.',
    },
    pt: {
      title: 'Gestão de Alunos - ProfeVision',
      description: 'Centralize dados de alunos para melhor acompanhamento. Acesse perfis individuais, veja histórico de provas e monitore o progresso acadêmico de cada estudante.',
    },
  },
  '/reports': {
    en: {
      title: 'Reports & Analytics - ProfeVision',
      description: 'Make data-driven decisions with powerful analytics. visualize class performance with charts, identify knowledge gaps, and download exportable reports for administrative use.',
    },
    es: {
      title: 'Reportes y Análisis - ProfeVisión',
      description: 'Toma decisiones basadas en datos con análisis potentes. Visualiza el rendimiento con gráficos, identifica brechas de conocimiento y descarga reportes exportables.',
    },
    fr: {
      title: 'Rapports et Analyses - ProfeVision',
      description: 'Prenez des décisions basées sur les données. Visualisez les performances avec des graphiques, identifiez les lacunes et téléchargez des rapports exportables.',
    },
    pt: {
      title: 'Relatórios e Análises - ProfeVision',
      description: 'Tome decisões baseadas em dados com análises poderosas. Visualize o desempenho com gráficos, identifique lacunas de conhecimento e baixe relatórios exportáveis.',
    },
  },
  '/mobile-app': {
    en: {
      title: 'OMR Exam Scanner App - Grade in Seconds | ProfeVision',
      description: 'Download the professional OMR scanner for Android & iOS. Grade 30-question exams in seconds with 99.9% accuracy and sync results instantly with your digital gradebook.',
      keywords: ['OMR app', 'grade exams with phone', 'optical mark recognition', 'exam scanner', 'android exam grader', 'iOS exam scanner', 'teacher grading app'],
    },
    es: {
      title: 'App Escáner de Exámenes OMR - Califica en Segundos | ProfeVisión',
      description: 'Descarga el escáner OMR profesional para Android e iOS. Califica exámenes de 30 preguntas en segundos con 99.9% de precisión y sincroniza resultados al instante.',
      keywords: ['app OMR', 'calificar exámenes con celular', 'reconocimiento óptico de marcas', 'escáner de exámenes', 'calificador android', 'app para profesores'],
    },
    fr: {
      title: 'App Scanner OMR - Notez les Examens en Secondes | ProfeVision',
      description: 'Téléchargez le scanner OMR pour Android et iOS. Notez des examens de 30 questions en quelques secondes avec une précision de 99,9% et synchronisez les résultats.',
      keywords: ['app OMR', 'noter examens téléphone', 'scanner examens', 'correction automatique', 'application enseignants'],
    },
    pt: {
      title: 'App Scanner OMR - Corrija Provas em Segundos | ProfeVision',
      description: 'Baixe o scanner OMR profissional para Android e iOS. Corrija provas de 30 questões em segundos com 99.9% de precisão e sincronize resultados instantaneamente.',
      keywords: ['app OMR', 'corrigir provas celular', 'scanner de provas', 'correção automática', 'aplicativo professores'],
    },
  },
  '/data-deletion': {
    en: {
      title: 'Data Deletion - ProfeVision',
      description: 'Request deletion of your personal data effortlessly. We respect your right to privacy and give you full control over your account information and stored data.',
    },
    es: {
      title: 'Eliminación de Datos - ProfeVisión',
      description: 'Solicita la eliminación de tus datos personales sin esfuerzo. Respetamos tu derecho a la privacidad y te damos control total sobre tu información y datos almacenados.',
    },
    fr: {
      title: 'Suppression des Données - ProfeVision',
      description: 'Demandez la suppression de vos données personnelles sans effort. Nous respectons votre droit à la vie privée et vous donnons le contrôle total sur vos informations.',
    },
    pt: {
      title: 'Exclusão de Dados - ProfeVision',
      description: 'Solicite a exclusão dos seus dados pessoais sem esforço. Respeitamos seu direito à privacidade e damos controle total sobre suas informações e dados armazenados.',
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
    keywords: meta.keywords,
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
