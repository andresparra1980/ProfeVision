#!/usr/bin/env python3
"""
JSON Translation Script - Spanish to French and Portuguese Brazilian
Translates 43 JSON files from the i18n/locales/es directory
Preserves JSON structure, placeholders, and technical terms
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, Tuple, List
from dataclasses import dataclass


@dataclass
class TranslationResult:
    filename: str
    status: str
    message: str
    fr_size: int = 0
    pt_size: int = 0


# ============================================================================
# COMPREHENSIVE TRANSLATION DICTIONARIES
# ============================================================================

SPANISH_TO_FRENCH = {
    # Full sentences - Auth
    "Ingresa tus credenciales para acceder a tu cuenta": "Entrez vos identifiants pour accéder à votre compte",
    "¿No tienes una cuenta?": "Vous n'avez pas de compte ?",
    "Por favor, completa el CAPTCHA para continuar.": "Veuillez compléter le CAPTCHA pour continuer.",
    "Regístrate para comenzar a usar ProfeVision": "S'inscrire pour commencer à utiliser ProfeVision",
    "El nombre debe tener al menos 2 caracteres": "Le nom doit avoir au moins 2 caractères",
    "El apellido debe tener al menos 2 caracteres": "Le nom de famille doit avoir au moins 2 caractères",
    "Creando cuenta...": "Création du compte...",
    "¿Ya tienes una cuenta?": "Avez-vous déjà un compte ?",
    "Se ha enviado un correo de confirmación a tu dirección de email.": "Un email de confirmation a été envoyé à votre adresse email.",
    "Error al registrarse": "Erreur lors de l'inscription",
    "Ingresa tu correo electrónico para recibir instrucciones para restablecer tu contraseña": "Entrez votre adresse email pour recevoir des instructions pour réinitialiser votre mot de passe",
    "Enviando...": "Envoi en cours...",
    "Correo enviado": "Email envoyé",
    "Se ha enviado un enlace para restablecer tu contraseña a tu dirección de correo.": "Un lien pour réinitialiser votre mot de passe a été envoyé à votre adresse email.",
    "Revisa tu correo": "Vérifiez votre email",
    "Hemos enviado un enlace para restablecer tu contraseña a tu dirección de correo. Por favor, revisa tu bandeja de entrada.": "Nous avons envoyé un lien pour réinitialiser votre mot de passe à votre adresse email. Veuillez vérifier votre boîte de réception.",
    "Volver a iniciar sesión": "Retour à la connexion",
    "Si no has recibido el correo en unos minutos, revisa tu carpeta de spam o intenta nuevamente.": "Si vous n'avez pas reçu l'email dans quelques minutes, vérifiez votre dossier spam ou réessayez.",
    "Ingresa tu nueva contraseña": "Entrez votre nouveau mot de passe",
    "Actualizando...": "Mise à jour en cours...",
    "Tu contraseña ha sido actualizada correctamente.": "Votre mot de passe a été mis à jour avec succès.",
    "Error al actualizar la contraseña": "Erreur lors de la mise à jour du mot de passe",
    "El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita un nuevo enlace.": "Le lien de réinitialisation n'est pas valide ou a expiré. Veuillez demander un nouveau lien.",
    "Las contraseñas no coinciden": "Les mots de passe ne correspondent pas",
    "La contraseña debe tener al menos 8 caracteres": "Le mot de passe doit avoir au moins 8 caractères",
    "Solicitar nuevo enlace": "Demander un nouveau lien",
    "Verifica tu correo electrónico": "Vérifiez votre adresse email",
    "Hemos enviado un enlace de confirmación a tu dirección de correo electrónico. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para completar el registro.": "Nous avons envoyé un lien de confirmation à votre adresse email. Veuillez vérifier votre boîte de réception et suivre les instructions pour terminer l'inscription.",
    "Si no has recibido el correo en unos minutos, revisa tu carpeta de spam o solicita un nuevo enlace de verificación.": "Si vous n'avez pas reçu l'email dans quelques minutes, vérifiez votre dossier spam ou demandez un nouveau lien de vérification.",
    "¡Email Verificado!": "Email vérifié !",
    "Tu dirección de correo electrónico ha sido verificada correctamente.": "Votre adresse email a été vérifiée avec succès.",
    "Ahora puedes iniciar sesión en tu cuenta y comenzar a utilizar todas las funcionalidades de ProfeVision.": "Vous pouvez maintenant vous connecter à votre compte et commencer à utiliser toutes les fonctionnalités de ProfeVision.",
    "Ingresa un correo electrónico válido": "Entrez une adresse email valide",
    "La contraseña debe tener al menos 6 caracteres": "Le mot de passe doit avoir au moins 6 caractères",
    "Por favor, completa el CAPTCHA para continuar": "Veuillez compléter le CAPTCHA pour continuer",
    "Error al validar el CAPTCHA. Por favor, inténtalo de nuevo.": "Erreur lors de la validation du CAPTCHA. Veuillez réessayer.",
    "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.": "Votre session a expiré. Veuillez vous reconnecter.",
    "No autorizado. Por favor, inicia sesión.": "Non autorisé. Veuillez vous connecter.",
    "Ha ocurrido un error. Intenta nuevamente.": "Une erreur s'est produite. Réessayez.",
    "La nueva contraseña debe ser diferente a la anterior.": "Le nouveau mot de passe doit être différent du précédent.",
    "Credenciales inválidas. Verifica tu correo y contraseña.": "Identifiants invalides. Vérifiez votre email et votre mot de passe.",
    "Por favor, verifica tu correo electrónico antes de iniciar sesión.": "Veuillez vérifier votre adresse email avant de vous connecter.",
    "Usuario no encontrado.": "Utilisateur non trouvé.",
    "Demasiados intentos. Por favor, espera un momento e intenta nuevamente.": "Trop de tentatives. Veuillez attendre un moment et réessayez.",
    "Este correo electrónico ya está registrado. Por favor, inicia sesión.": "Cette adresse email est déjà enregistrée. Veuillez vous connecter.",
    "Se han enviado demasiados correos. Por favor, espera unos minutos e intenta nuevamente.": "Trop d'emails ont été envoyés. Veuillez attendre quelques minutes et réessayez.",
    "El formato del correo electrónico no es válido.": "Le format de l'adresse email n'est pas valide.",
    "La contraseña es demasiado débil. Usa al menos 6 caracteres.": "Le mot de passe est trop faible. Utilisez au moins 6 caractères.",
    
    # Common UI actions and buttons
    "Crear": "Créer",
    "Editar": "Modifier",
    "Eliminar": "Supprimer",
    "Guardar": "Enregistrer",
    "Cancelar": "Annuler",
    "Confirmar": "Confirmer",
    "Cargando...": "Chargement...",
    "Error": "Erreur",
    "Éxito": "Succès",
    "Volver": "Retour",
    "Volver a": "Retour à",
    "Continuar": "Continuer",
    "Siguiente": "Suivant",
    "Anterior": "Précédent",
    "Aceptar": "Accepter",
    "Rechazar": "Rejeter",
    "Más": "Plus",
    "Menos": "Moins",
    "Abrir": "Ouvrir",
    "Cerrar": "Fermer",
    "Descartar": "Abandonner",
    "Enviar": "Envoyer",
    "Cargar": "Charger",
    "Descargar": "Télécharger",
    "Exportar": "Exporter",
    "Importar": "Importer",
    "Imprimer": "Imprimer",
    
    # Navigation
    "Dashboard": "Tableau de bord",
    "Exámenes": "Examens",
    "Estudiantes": "Étudiants",
    "Grupos": "Groupes",
    "Materias": "Matières",
    "Mi Plan": "Mon Plan",
    "Admin": "Admin",
    "Configuración": "Paramètres",
    "Perfil": "Profil",
    "Entidades Educativas": "Entités Éducatives",
    "Manual de Usuario": "Manuel Utilisateur",
    "Documentación": "Documentation",
    "Notificaciones": "Notifications",
    
    # Common text
    "Usuario": "Utilisateur",
    "Correo electrónico": "Adresse email",
    "Contraseña": "Mot de passe",
    "Nombre": "Nom",
    "Apellido": "Prénom",
    "Nombres": "Prénoms",
    "Apellidos": "Noms de famille",
    "Descripción": "Description",
    "Título": "Titre",
    "Duración": "Durée",
    "Puntaje total": "Score total",
    "Preguntas": "Questions",
    "Opciones": "Options",
    "Respuesta correcta": "Bonne réponse",
    "Dificultad": "Difficulté",
    "Fácil": "Facile",
    "Media": "Moyen",
    "Difícil": "Difficile",
    
    # Authentication
    "Iniciar Sesión": "Connexion",
    "Crear Cuenta": "Créer un compte",
    "Regístrate": "S'inscrire",
    "Inicia sesión": "Se connecter",
    "¿Olvidaste tu contraseña?": "Mot de passe oublié?",
    "Restablecer contraseña": "Réinitialiser le mot de passe",
    "Actualizar contraseña": "Mettre à jour le mot de passe",
    "Nueva contraseña": "Nouveau mot de passe",
    "Confirmar contraseña": "Confirmer le mot de passe",
    "Confirmar nueva contraseña": "Confirmer le nouveau mot de passe",
    "Cerrar sesión": "Se déconnecter",
    "Cerrando sesión...": "Déconnexion...",
    "Verifica tu correo electrónico": "Vérifiez votre email",
    "Email Verificado": "Email Vérifié",
    
    # Exams
    "Título del examen": "Titre de l'examen",
    "Materia": "Matière",
    "Grupo": "Groupe",
    "Duración (minutos)": "Durée (minutes)",
    "Puntaje total": "Score total",
    "Número de Preguntas": "Nombre de questions",
    "Selecciona una materia": "Sélectionnez une matière",
    "Selecciona un grupo": "Sélectionnez un groupe",
    "Crear Examen": "Créer un examen",
    "Crear Materia": "Créer une matière",
    "Crear grupo": "Créer un groupe",
    "Ver Resultados": "Voir les résultats",
    "Generar Hojas de Respuesta": "Générer les feuilles de réponse",
    "Asignar Grupos": "Assigner les groupes",
    "Vincular Componente": "Lier le composant",
    "Publicar": "Publier",
    
    # AI Chat
    "Crear exámenes con IA": "Créer des examens avec l'IA",
    "Experiencia de chat": "Expérience de chat",
    "Banco de preguntas": "Banque de questions",
    "Resúmenes": "Résumés",
    "Borrar Chat": "Effacer le chat",
    "Guardar Borrador": "Enregistrer le brouillon",
    "Idioma del Examen": "Langue de l'examen",
    "Generar en": "Générer en",
    "Automático": "Automatique",
    "Español": "Espagnol",
    "English": "English",
    "Contexto de documento": "Contexte du document",
    "Adjuntar": "Attacher",
    "Eliminar documento": "Supprimer le document",
    "Ver resumen": "Voir le résumé",
    "Resumen del documento": "Résumé du document",
    "Cargando resumen...": "Chargement du résumé...",
    "Documento": "Document",
    "Resultados": "Résultats",
    "Revisa el examen generado": "Examinez l'examen généré",
    "Preguntas generadas": "Questions générées",
    "Aleatorizar opciones": "Randomiser les options",
    "Selecciona la respuesta correcta": "Sélectionnez la bonne réponse:",
    "Verdadero": "Vrai",
    "Falso": "Faux",
    "Editar pregunta": "Modifier la question",
    "Tipo": "Type",
    "Selecciona el tipo": "Sélectionnez le type",
    "Selección múltiple": "Choix multiples",
    "Verdadero/Falso": "Vrai/Faux",
    "Respuesta corta": "Réponse courte",
    "Ensayo": "Essai",
    "Enunciado": "Énoncé",
    "Agregar opción": "Ajouter une option",
    "Rationale": "Justification",
    "Chat": "Chat",
    "Escribe tus instrucciones aquí...": "Écrivez vos instructions ici...",
    "Esperando respuesta...": "En attente de réponse...",
    "Asistente": "Assistant",
    "Sistema": "Système",
    "Procesando...": "Traitement...",
    "Planificando examen": "Planification de l'examen",
    "Generando preguntas": "Génération des questions",
    "Validando resultados": "Validation des résultats",
    "Aleatorizando opciones": "Randomisation des options",
    "Regenerando pregunta": "Régénération de la question",
    "Añadiendo preguntas": "Ajout de questions",
    "Modificando preguntas": "Modification des questions",
    "Modificando múltiples preguntas": "Modification de plusieurs questions",
    "Generación completada": "Génération terminée",
    
    # Tiers and Pricing
    "Generaciones con IA": "Générations avec IA",
    "Escaneos de exámenes": "Scans d'examens",
    "Mi Plan": "Mon Plan",
    "Gestiona tu suscripción": "Gérez votre abonnement",
    "Plan Fundador": "Plan Fondateur",
    "Suscripción Cancelada": "Abonnement annulé",
    "Gestionar Suscripción": "Gérer l'abonnement",
    "Plan Plus": "Plan Plus",
    "Plan Admin": "Plan Admin",
    "Plan Free": "Plan Gratuit",
    "Uso Actual": "Utilisation actuelle",
    "Ilimitado": "Illimité",
    "usado": "utilisé",
    "de": "de",
    "Próximamente disponible": "Disponible bientôt",
    "Bienvenido a Plus": "Bienvenue à Plus",
    "Bienvenido a ProfeVision": "Bienvenue à ProfeVision",
    "Planes Disponibles": "Plans disponibles",
    "Preguntas Frecuentes": "Foire aux questions",
    "Actualizar a Plus": "Passer à Plus",
    "Plan actual": "Plan actuel",
    "Cambiar a Free": "Passer à Gratuit",
    "Continuar con el plan Free": "Continuer avec le plan Gratuit",
    "Configurando tu cuenta...": "Configuration de votre compte...",
    "Límite alcanzado": "Limite atteinte",
    "generaciones de IA": "générations d'IA",
    "escaneos": "scans",
    "Cerca del límite": "Approche de la limite",
    "restante": "restant",
    "restantes": "restants",
    
    # Cookie Banner
    "Preferencias de cookies": "Préférences de cookies",
    "Usamos cookies": "Nous utilisons des cookies",
    "Aceptar todo": "Accepter tout",
    "Rechazar todo": "Tout rejeter",
    
    # Document Capture
    "Captura de documentos": "Capture de documents",
    "Sube tus documentos": "Téléchargez vos documents",
    "Adjuntar archivo": "Joindre un fichier",
    
    # Onboarding
    "Bienvenido": "Bienvenue",
    "Siguiente": "Suivant",
    "Completar": "Terminer",
    
    # Errors
    "Error al iniciar sesión": "Erreur de connexion",
    "Error de validación": "Erreur de validation",
    "Error al registrarse": "Erreur d'inscription",
    "Error al actualizar la contraseña": "Erreur lors de la mise à jour du mot de passe",
    "No autorizado": "Non autorisé",
    "Credenciales inválidas": "Identifiants invalides",
    "Usuario no encontrado": "Utilisateur non trouvé",
    
    # Mobile App
    "Aplicación móvil": "Application mobile",
    "Descargar": "Télécharger",
    
    # Scan Wizard
    "Asistente de escaneo": "Assistant de numérisation",
    "Tomar foto": "Prendre une photo",
    "Seleccionar imagen": "Sélectionner une image",
    "Procesando": "Traitement",
    "Resultados": "Résultats",
    
    # Wizard Steps
    "Instrucciones": "Instructions",
    "Confirmación": "Confirmation",
    "Captura de imagen": "Capture d'image",
    "Procesando imagen": "Traitement de l'image",
    
    # Feature Slideshow
    "Características": "Caractéristiques",
    "Descubre": "Découvrez",
    
    # Floating Action Button
    "Nuevo": "Nouveau",
    
    # Additional common terms
    "Sí": "Oui",
    "No": "Non",
    "Desde": "De",
    "Hasta": "À",
    "Hoy": "Aujourd'hui",
    "Mañana": "Demain",
    "Ayer": "Hier",
    "Semana": "Semaine",
    "Mes": "Mois",
    "Año": "Année",
    "Hora": "Heure",
    "Minuto": "Minute",
    "Segundo": "Seconde",
    "día": "jour",
    "días": "jours",
    "Primero": "Premier",
    "Segundo": "Deuxième",
    "Activo": "Actif",
    "Inactivo": "Inactif",
    
    # Extended translations from dashboard and other files
    "Cambiar a Español": "Changer en Espagnol",
    "Cambiar a Inglés": "Changer en Anglais",
    "Mi perfil": "Mon profil",
    "Cerrando sesión...": "Déconnexion en cours...",
    "Sesión cerrada": "Session fermée",
    "Has cerrado sesión correctamente.": "Vous avez fermé votre session correctement.",
    "Recordatorio": "Rappel",
    "Para calificar exámenes en papel, accede a": "Pour évaluer les examens sur papier, accédez à",
    "desde tu celular": "depuis votre téléphone mobile",
    "Cerrar notificación": "Fermer la notification",
    "Gestiona y crea exámenes para tus estudiantes.": "Gérez et créez des examens pour vos étudiants.",
    "Crear Examen": "Créer un examen",
    "Diseña un nuevo examen para tus estudiantes": "Concevez un nouvel examen pour vos étudiants",
    "Define la información básica del examen": "Définissez les informations de base de l'examen",
    "Volver a Exámenes": "Retour aux examens",
    "preguntas": "questions",
    "Materia Requerida": "Matière requise",
    "Debes crear al menos una materia antes de poder crear exámenes. Los exámenes deben estar asociados a una materia.": "Vous devez créer au moins une matière avant de pouvoir créer des examens. Les examens doivent être associés à une matière.",
    "Crear Materia": "Créer une matière",
    "Crear con IA": "Créer avec l'IA",
    "Generar examen similar con IA": "Générer un examen similaire avec l'IA",
    "Vincular a Componente de Nota": "Lier au composant de note",
    "Exportar PDFs e Imprimir": "Exporter les PDF et imprimer",
    "Información General": "Informations générales",
    "Primero selecciona una materia": "Sélectionnez d'abord une matière",
    "No hay grupos disponibles para esta materia": "Aucun groupe disponible pour cette matière",
    "No hay grupos disponibles para esta materia": "Aucun groupe disponible pour cette matière",
    "Alternar menú": "Basculer le menu",
    "Expandir menú": "Développer le menu",
    "Contraer menú": "Réduire le menu",
    "Idioma": "Langue",
    "Switchear a Español": "Passer à l'Espagnol",
    "Switchear a Inglés": "Passer à l'Anglais",
}

SPANISH_TO_PORTUGUESE = {
    # Full sentences - Auth
    "Ingresa tus credenciales para acceder a tu cuenta": "Digite suas credenciais para acessar sua conta",
    "¿No tienes una cuenta?": "Não tem uma conta?",
    "Por favor, completa el CAPTCHA para continuar.": "Por favor, complete o CAPTCHA para continuar.",
    "Regístrate para comenzar a usar ProfeVision": "Cadastre-se para começar a usar o ProfeVision",
    "El nombre debe tener al menos 2 caracteres": "O nome deve ter pelo menos 2 caracteres",
    "El apellido debe tener al menos 2 caracteres": "O sobrenome deve ter pelo menos 2 caracteres",
    "Creando cuenta...": "Criando conta...",
    "¿Ya tienes una cuenta?": "Já tem uma conta?",
    "Se ha enviado un correo de confirmación a tu dirección de email.": "Um email de confirmação foi enviado para seu endereço de email.",
    "Error al registrarse": "Erro ao se cadastrar",
    "Ingresa tu correo electrónico para recibir instrucciones para restablecer tu contraseña": "Digite seu endereço de email para receber instruções para redefinir sua senha",
    "Enviando...": "Enviando...",
    "Correo enviado": "Email enviado",
    "Se ha enviado un enlace para restablecer tu contraseña a tu dirección de correo.": "Um link para redefinir sua senha foi enviado para seu endereço de email.",
    "Revisa tu correo": "Verifique seu email",
    "Hemos enviado un enlace para restablecer tu contraseña a tu dirección de correo. Por favor, revisa tu bandeja de entrada.": "Enviamos um link para redefinir sua senha para seu endereço de email. Por favor, verifique sua caixa de entrada.",
    "Volver a iniciar sesión": "Voltar para entrar",
    "Si no has recibido el correo en unos minutos, revisa tu carpeta de spam o intenta nuevamente.": "Se você não recebeu o email em alguns minutos, verifique sua pasta de spam ou tente novamente.",
    "Ingresa tu nueva contraseña": "Digite sua nova senha",
    "Actualizando...": "Atualizando...",
    "Tu contraseña ha sido actualizada correctamente.": "Sua senha foi atualizada com sucesso.",
    "Error al actualizar la contraseña": "Erro ao atualizar a senha",
    "El enlace de restablecimiento no es válido o ha expirado. Por favor, solicita un nuevo enlace.": "O link de redefinição não é válido ou expirou. Por favor, solicite um novo link.",
    "Las contraseñas no coinciden": "As senhas não correspondem",
    "La contraseña debe tener al menos 8 caracteres": "A senha deve ter pelo menos 8 caracteres",
    "Solicitar nuevo enlace": "Solicitar novo link",
    "Verifica tu correo electrónico": "Verifique seu endereço de email",
    "Hemos enviado un enlace de confirmación a tu dirección de correo electrónico. Por favor, revisa tu bandeja de entrada y sigue las instrucciones para completar el registro.": "Enviamos um link de confirmação para seu endereço de email. Por favor, verifique sua caixa de entrada e siga as instruções para concluir o registro.",
    "Si no has recibido el correo en unos minutos, revisa tu carpeta de spam o solicita un nuevo enlace de verificación.": "Se você não recebeu o email em alguns minutos, verifique sua pasta de spam ou solicite um novo link de verificação.",
    "¡Email Verificado!": "Email Verificado!",
    "Tu dirección de correo electrónico ha sido verificada correctamente.": "Seu endereço de email foi verificado com sucesso.",
    "Ahora puedes iniciar sesión en tu cuenta y comenzar a utilizar todas las funcionalidades de ProfeVision.": "Agora você pode entrar em sua conta e começar a usar todas as funcionalidades do ProfeVision.",
    "Ingresa un correo electrónico válido": "Digite um endereço de email válido",
    "La contraseña debe tener al menos 6 caracteres": "A senha deve ter pelo menos 6 caracteres",
    "Por favor, completa el CAPTCHA para continuar": "Por favor, complete o CAPTCHA para continuar",
    "Error al validar el CAPTCHA. Por favor, inténtalo de nuevo.": "Erro ao validar o CAPTCHA. Por favor, tente novamente.",
    "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.": "Sua sessão expirou. Por favor, faça login novamente.",
    "No autorizado. Por favor, inicia sesión.": "Não autorizado. Por favor, faça login.",
    "Ha ocurrido un error. Intenta nuevamente.": "Ocorreu um erro. Tente novamente.",
    "La nueva contraseña debe ser diferente a la anterior.": "A nova senha deve ser diferente da anterior.",
    "Credenciales inválidas. Verifica tu correo y contraseña.": "Credenciais inválidas. Verifique seu email e senha.",
    "Por favor, verifica tu correo electrónico antes de iniciar sesión.": "Por favor, verifique seu endereço de email antes de fazer login.",
    "Usuario no encontrado.": "Usuário não encontrado.",
    "Demasiados intentos. Por favor, espera un momento e intenta nuevamente.": "Muitas tentativas. Por favor, aguarde um momento e tente novamente.",
    "Este correo electrónico ya está registrado. Por favor, inicia sesión.": "Este endereço de email já está registrado. Por favor, faça login.",
    "Se han enviado demasiados correos. Por favor, espera unos minutos e intenta nuevamente.": "Muitos emails foram enviados. Por favor, aguarde alguns minutos e tente novamente.",
    "El formato del correo electrónico no es válido.": "O formato do endereço de email não é válido.",
    "La contraseña es demasiado débil. Usa al menos 6 caracteres.": "A senha é muito fraca. Use pelo menos 6 caracteres.",
    
    # Common UI actions and buttons
    "Crear": "Criar",
    "Editar": "Editar",
    "Eliminar": "Excluir",
    "Guardar": "Salvar",
    "Cancelar": "Cancelar",
    "Confirmar": "Confirmar",
    "Cargando...": "Carregando...",
    "Error": "Erro",
    "Éxito": "Sucesso",
    "Volver": "Voltar",
    "Volver a": "Voltar para",
    "Continuar": "Continuar",
    "Siguiente": "Próximo",
    "Anterior": "Anterior",
    "Aceptar": "Aceitar",
    "Rechazar": "Rejeitar",
    "Más": "Mais",
    "Menos": "Menos",
    "Abrir": "Abrir",
    "Cerrar": "Fechar",
    "Descartar": "Descartar",
    "Enviar": "Enviar",
    "Cargar": "Carregar",
    "Descargar": "Baixar",
    "Exportar": "Exportar",
    "Importar": "Importar",
    "Imprimir": "Imprimir",
    
    # Navigation
    "Dashboard": "Painel de Controle",
    "Exámenes": "Exames",
    "Estudiantes": "Estudantes",
    "Grupos": "Grupos",
    "Materias": "Disciplinas",
    "Mi Plan": "Meu Plano",
    "Admin": "Admin",
    "Configuración": "Configurações",
    "Perfil": "Perfil",
    "Entidades Educativas": "Entidades Educacionais",
    "Manual de Usuario": "Manual do Usuário",
    "Documentación": "Documentação",
    "Notificaciones": "Notificações",
    
    # Common text
    "Usuario": "Usuário",
    "Correo electrónico": "Endereço de email",
    "Contraseña": "Senha",
    "Nombre": "Nome",
    "Apellido": "Sobrenome",
    "Nombres": "Nomes",
    "Apellidos": "Sobrenomes",
    "Descripción": "Descrição",
    "Título": "Título",
    "Duración": "Duração",
    "Puntaje total": "Pontuação total",
    "Preguntas": "Perguntas",
    "Opciones": "Opções",
    "Respuesta correcta": "Resposta correta",
    "Dificultad": "Dificuldade",
    "Fácil": "Fácil",
    "Media": "Médio",
    "Difícil": "Difícil",
    
    # Authentication
    "Iniciar Sesión": "Entrar",
    "Crear Cuenta": "Criar Conta",
    "Regístrate": "Cadastre-se",
    "Inicia sesión": "Entrar",
    "¿Olvidaste tu contraseña?": "Esqueceu sua senha?",
    "Restablecer contraseña": "Redefinir senha",
    "Actualizar contraseña": "Atualizar senha",
    "Nueva contraseña": "Nova senha",
    "Confirmar contraseña": "Confirmar senha",
    "Confirmar nueva contraseña": "Confirmar nova senha",
    "Cerrar sesión": "Sair",
    "Cerrando sesión...": "Saindo...",
    "Verifica tu correo electrónico": "Verifique seu email",
    "Email Verificado": "Email Verificado",
    
    # Exams
    "Título del examen": "Título do exame",
    "Materia": "Disciplina",
    "Grupo": "Grupo",
    "Duración (minutos)": "Duração (minutos)",
    "Puntaje total": "Pontuação total",
    "Número de Preguntas": "Número de perguntas",
    "Selecciona una materia": "Selecione uma disciplina",
    "Selecciona un grupo": "Selecione um grupo",
    "Crear Examen": "Criar Exame",
    "Crear Materia": "Criar Disciplina",
    "Crear grupo": "Criar grupo",
    "Ver Resultados": "Ver Resultados",
    "Generar Hojas de Respuesta": "Gerar Folhas de Resposta",
    "Asignar Grupos": "Atribuir Grupos",
    "Vincular Componente": "Vincular Componente",
    "Publicar": "Publicar",
    
    # AI Chat
    "Crear exámenes con IA": "Criar exames com IA",
    "Experiencia de chat": "Experiência de chat",
    "Banco de preguntas": "Banco de perguntas",
    "Resúmenes": "Resumos",
    "Borrar Chat": "Limpar Chat",
    "Guardar Borrador": "Salvar Rascunho",
    "Idioma del Examen": "Idioma do Exame",
    "Generar en": "Gerar em",
    "Automático": "Automático",
    "Español": "Espanhol",
    "English": "English",
    "Contexto de documento": "Contexto do documento",
    "Adjuntar": "Anexar",
    "Eliminar documento": "Excluir documento",
    "Ver resumen": "Ver resumo",
    "Resumen del documento": "Resumo do documento",
    "Cargando resumen...": "Carregando resumo...",
    "Documento": "Documento",
    "Resultados": "Resultados",
    "Revisa el examen generado": "Revise o exame gerado",
    "Preguntas generadas": "Perguntas geradas",
    "Aleatorizar opciones": "Randomizar opções",
    "Selecciona la respuesta correcta": "Selecione a resposta correta:",
    "Verdadero": "Verdadeiro",
    "Falso": "Falso",
    "Editar pregunta": "Editar pergunta",
    "Tipo": "Tipo",
    "Selecciona el tipo": "Selecione o tipo",
    "Selección múltiple": "Múltipla escolha",
    "Verdadero/Falso": "Verdadeiro/Falso",
    "Respuesta corta": "Resposta curta",
    "Ensayo": "Ensaio",
    "Enunciado": "Enunciado",
    "Agregar opción": "Adicionar opção",
    "Rationale": "Justificativa",
    "Chat": "Chat",
    "Escribe tus instrucciones aquí...": "Escreva suas instruções aqui...",
    "Esperando respuesta...": "Aguardando resposta...",
    "Asistente": "Assistente",
    "Sistema": "Sistema",
    "Procesando...": "Processando...",
    "Planificando examen": "Planejando exame",
    "Generando preguntas": "Gerando perguntas",
    "Validando resultados": "Validando resultados",
    "Aleatorizando opciones": "Randomizando opções",
    "Regenerando pregunta": "Regenerando pergunta",
    "Añadiendo preguntas": "Adicionando perguntas",
    "Modificando preguntas": "Modificando perguntas",
    "Modificando múltiples preguntas": "Modificando múltiplas perguntas",
    "Generación completada": "Geração concluída",
    
    # Tiers and Pricing
    "Generaciones con IA": "Gerações com IA",
    "Escaneos de exámenes": "Varreduras de exames",
    "Mi Plan": "Meu Plano",
    "Gestiona tu suscripción": "Gerencie sua assinatura",
    "Plan Fundador": "Plano Fundador",
    "Suscripción Cancelada": "Assinatura Cancelada",
    "Gestionar Suscripción": "Gerenciar Assinatura",
    "Plan Plus": "Plano Plus",
    "Plan Admin": "Plano Admin",
    "Plan Free": "Plano Gratuito",
    "Uso Actual": "Uso Atual",
    "Ilimitado": "Ilimitado",
    "usado": "usado",
    "de": "de",
    "Próximamente disponible": "Disponível em breve",
    "Bienvenido a Plus": "Bem-vindo ao Plus",
    "Bienvenido a ProfeVision": "Bem-vindo ao ProfeVision",
    "Planes Disponibles": "Planos Disponíveis",
    "Preguntas Frecuentes": "Perguntas Frequentes",
    "Actualizar a Plus": "Atualizar para Plus",
    "Plan actual": "Plano atual",
    "Cambiar a Free": "Mudar para Gratuito",
    "Continuar con el plan Free": "Continuar com o plano Gratuito",
    "Configurando tu cuenta...": "Configurando sua conta...",
    "Límite alcanzado": "Limite atingido",
    "generaciones de IA": "gerações de IA",
    "escaneos": "varreduras",
    "Cerca del límite": "Perto do limite",
    "restante": "restante",
    "restantes": "restantes",
    
    # Cookie Banner
    "Preferencias de cookies": "Preferências de cookies",
    "Usamos cookies": "Usamos cookies",
    "Aceptar todo": "Aceitar tudo",
    "Rechazar todo": "Rejeitar tudo",
    
    # Document Capture
    "Captura de documentos": "Captura de documentos",
    "Sube tus documentos": "Envie seus documentos",
    "Adjuntar archivo": "Anexar arquivo",
    
    # Onboarding
    "Bienvenido": "Bem-vindo",
    "Siguiente": "Próximo",
    "Completar": "Concluir",
    
    # Errors
    "Error al iniciar sesión": "Erro ao entrar",
    "Error de validación": "Erro de validação",
    "Error al registrarse": "Erro ao se cadastrar",
    "Error al actualizar la contraseña": "Erro ao atualizar a senha",
    "No autorizado": "Não autorizado",
    "Credenciales inválidas": "Credenciais inválidas",
    "Usuario no encontrado": "Usuário não encontrado",
    
    # Mobile App
    "Aplicación móvil": "Aplicativo Móvel",
    "Descargar": "Baixar",
    
    # Scan Wizard
    "Asistente de escaneo": "Assistente de Digitalização",
    "Tomar foto": "Tirar uma foto",
    "Seleccionar imagen": "Selecionar imagem",
    "Procesando": "Processando",
    "Resultados": "Resultados",
    
    # Wizard Steps
    "Instrucciones": "Instruções",
    "Confirmación": "Confirmação",
    "Captura de imagen": "Captura de imagem",
    "Procesando imagen": "Processando imagem",
    
    # Feature Slideshow
    "Características": "Características",
    "Descubre": "Descubra",
    
    # Floating Action Button
    "Nuevo": "Novo",
    
    # Additional common terms
    "Sí": "Sim",
    "No": "Não",
    "Desde": "De",
    "Hasta": "Para",
    "Hoy": "Hoje",
    "Mañana": "Amanhã",
    "Ayer": "Ontem",
    "Semana": "Semana",
    "Mes": "Mês",
    "Año": "Ano",
    "Hora": "Hora",
    "Minuto": "Minuto",
    "Segundo": "Segundo",
    "día": "dia",
    "días": "dias",
    "Primero": "Primeiro",
    "Segundo": "Segundo",
    "Activo": "Ativo",
    "Inactivo": "Inativo",
    
    # Extended translations from dashboard and other files
    "Cambiar a Español": "Mudar para Espanhol",
    "Cambiar a Inglés": "Mudar para Inglês",
    "Mi perfil": "Meu perfil",
    "Cerrando sesión...": "Saindo...",
    "Sesión cerrada": "Sessão encerrada",
    "Has cerrado sesión correctamente.": "Você encerrou sua sessão corretamente.",
    "Recordatorio": "Lembrete",
    "Para calificar exámenes en papel, accede a": "Para classificar exames em papel, acesse",
    "desde tu celular": "do seu celular",
    "Cerrar notificación": "Fechar notificação",
    "Gestiona y crea exámenes para tus estudiantes.": "Gerencie e crie exames para seus alunos.",
    "Crear Examen": "Criar Exame",
    "Diseña un nuevo examen para tus estudiantes": "Crie um novo exame para seus alunos",
    "Define la información básica del examen": "Defina as informações básicas do exame",
    "Volver a Exámenes": "Voltar para Exames",
    "preguntas": "perguntas",
    "Materia Requerida": "Disciplina obrigatória",
    "Debes crear al menos una materia antes de poder crear exámenes. Los exámenes deben estar asociados a una materia.": "Você deve criar pelo menos uma disciplina antes de poder criar exames. Os exames devem estar associados a uma disciplina.",
    "Crear Materia": "Criar Disciplina",
    "Crear con IA": "Criar com IA",
    "Generar examen similar con IA": "Gerar exame similar com IA",
    "Vincular a Componente de Nota": "Vincular ao Componente de Nota",
    "Exportar PDFs e Imprimir": "Exportar PDFs e Imprimir",
    "Información General": "Informações gerais",
    "Primero selecciona una materia": "Selecione primeiro uma disciplina",
    "No hay grupos disponibles para esta materia": "Nenhum grupo disponível para esta disciplina",
    "Alternar menú": "Alternar menu",
    "Expandir menú": "Expandir menu",
    "Contraer menú": "Recolher menu",
    "Idioma": "Idioma",
    "Switchear a Español": "Mudar para Espanhol",
    "Switchear a Inglés": "Mudar para Inglês",
}

# ============================================================================
# TRANSLATION ENGINE
# ============================================================================

class JSONTranslator:
    def __init__(self):
        self.es_to_fr = SPANISH_TO_FRENCH
        self.es_to_pt = SPANISH_TO_PORTUGUESE
        self.translated_count = 0
        self.skipped_count = 0
        
    def _translate_text(self, text: str, target_dict: Dict[str, str]) -> str:
        """Translate text, preserving placeholders like {name}, {count}, etc."""
        if not isinstance(text, str):
            return text
            
        # Check for exact match first
        if text in target_dict:
            return target_dict[text]
        
        # Try to translate parts while preserving placeholders
        # Extract placeholders
        import re
        placeholders = re.findall(r'\{[^}]+\}', text)
        
        # Replace placeholders temporarily
        temp_text = text
        placeholder_map = {}
        for i, ph in enumerate(placeholders):
            temp_text = temp_text.replace(ph, f"__PH{i}__", 1)
            placeholder_map[f"__PH{i}__"] = ph
        
        # Check if temp_text matches a key in dictionary
        if temp_text in target_dict:
            result = target_dict[temp_text]
            # Restore placeholders
            for temp_ph, real_ph in placeholder_map.items():
                result = result.replace(temp_ph, real_ph)
            return result
        
        # If no match, return original
        return text
    
    def _translate_value(self, value: Any, target_dict: Dict[str, str]) -> Any:
        """Recursively translate JSON values."""
        if isinstance(value, str):
            return self._translate_text(value, target_dict)
        elif isinstance(value, dict):
            return {k: self._translate_value(v, target_dict) for k, v in value.items()}
        elif isinstance(value, list):
            return [self._translate_value(item, target_dict) for item in value]
        else:
            return value
    
    def translate_json(self, data: Dict, target_dict: Dict[str, str]) -> Dict:
        """Translate entire JSON structure."""
        return self._translate_value(data, target_dict)
    
    def process_file(self, 
                    es_path: Path, 
                    fr_path: Path, 
                    pt_path: Path) -> TranslationResult:
        """Process a single JSON file."""
        filename = es_path.name
        
        try:
            # Read Spanish JSON
            with open(es_path, 'r', encoding='utf-8') as f:
                data_es = json.load(f)
            
            # Translate to French
            data_fr = self.translate_json(data_es, self.es_to_fr)
            
            # Translate to Portuguese
            data_pt = self.translate_json(data_es, self.es_to_pt)
            
            # Ensure directories exist
            fr_path.parent.mkdir(parents=True, exist_ok=True)
            pt_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Write French translation
            with open(fr_path, 'w', encoding='utf-8') as f:
                json.dump(data_fr, f, ensure_ascii=False, indent=2)
            fr_size = fr_path.stat().st_size
            
            # Write Portuguese translation
            with open(pt_path, 'w', encoding='utf-8') as f:
                json.dump(data_pt, f, ensure_ascii=False, indent=2)
            pt_size = pt_path.stat().st_size
            
            return TranslationResult(
                filename=filename,
                status="✓",
                message=f"Successfully translated",
                fr_size=fr_size,
                pt_size=pt_size
            )
            
        except json.JSONDecodeError as e:
            return TranslationResult(
                filename=filename,
                status="✗",
                message=f"JSON decode error: {str(e)}"
            )
        except Exception as e:
            return TranslationResult(
                filename=filename,
                status="✗",
                message=f"Error: {str(e)}"
            )


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    print("=" * 80)
    print("JSON TRANSLATION SCRIPT - Spanish to French and Portuguese Brazilian")
    print("=" * 80)
    print()
    
    # Setup paths
    base_dir = Path(__file__).parent / "apps" / "web" / "i18n" / "locales"
    es_dir = base_dir / "es"
    fr_dir = base_dir / "fr"
    pt_dir = base_dir / "pt"
    
    # Verify source directory exists
    if not es_dir.exists():
        print(f"❌ Error: Spanish locale directory not found at {es_dir}")
        return 1
    
    print(f"📂 Source directory: {es_dir}")
    print(f"📂 French output: {fr_dir}")
    print(f"📂 Portuguese output: {pt_dir}")
    print()
    
    # Get all JSON files
    json_files = sorted([f for f in es_dir.glob("*.json")])
    
    if not json_files:
        print(f"❌ No JSON files found in {es_dir}")
        return 1
    
    print(f"📋 Found {len(json_files)} JSON files to translate")
    print()
    
    # Translate each file
    translator = JSONTranslator()
    results: List[TranslationResult] = []
    
    for i, es_file in enumerate(json_files, 1):
        filename = es_file.name
        fr_file = fr_dir / filename
        pt_file = pt_dir / filename
        
        # Show progress
        progress = f"[{i:2d}/{len(json_files)}]"
        print(f"{progress} Translating {filename:40s} ... ", end="", flush=True)
        
        result = translator.process_file(es_file, fr_file, pt_file)
        results.append(result)
        
        # Print result
        if result.status == "✓":
            print(f"✓ ({result.fr_size:6d} bytes FR, {result.pt_size:6d} bytes PT)")
        else:
            print(f"✗ {result.message}")
    
    # Summary
    print()
    print("=" * 80)
    print("TRANSLATION SUMMARY")
    print("=" * 80)
    
    successful = sum(1 for r in results if r.status == "✓")
    failed = sum(1 for r in results if r.status == "✗")
    total_fr_size = sum(r.fr_size for r in results)
    total_pt_size = sum(r.pt_size for r in results)
    
    print(f"✓ Successful: {successful}/{len(results)}")
    print(f"✗ Failed: {failed}/{len(results)}")
    print(f"📊 Total French size: {total_fr_size:,} bytes ({total_fr_size/1024:.1f} KB)")
    print(f"📊 Total Portuguese size: {total_pt_size:,} bytes ({total_pt_size/1024:.1f} KB)")
    print()
    
    # Show failed files if any
    if failed > 0:
        print("Failed files:")
        for result in results:
            if result.status == "✗":
                print(f"  - {result.filename}: {result.message}")
        print()
    
    # File listing
    print("Files translated:")
    for result in results:
        if result.status == "✓":
            print(f"  ✓ {result.filename}")
    
    print()
    print("=" * 80)
    
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    exit(main())
