import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";
import logger from "@/lib/utils/logger";

// Cliente admin para bypassear RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Obtiene el profesor ID desde metadata o buscando por polar_customer_id
 */
async function getProfesorId(metadata: Record<string, string> | undefined, polarCustomerId?: string): Promise<string | null> {
  // Primero intentar desde metadata (checkout nuevo)
  if (metadata?.supabase_user_id) {
    logger.log(`Usando supabase_user_id desde metadata: ${metadata.supabase_user_id}`);
    return metadata.supabase_user_id;
  }

  // Fallback: buscar por polar_customer_id (para eventos futuros como cancel/revoke)
  if (polarCustomerId) {
    const { data: profesor, error } = await supabaseAdmin
      .from("profesores")
      .select("id")
      .eq("polar_customer_id", polarCustomerId)
      .single();

    if (!error && profesor) {
      logger.log(`Encontrado profesor por polar_customer_id: ${profesor.id}`);
      return profesor.id;
    }
  }

  return null;
}

/**
 * Actualiza suscripción del profesor
 */
async function updateProfesorSubscription(
  profesorId: string,
  data: {
    subscription_tier?: string;
    subscription_status?: string;
    polar_customer_id?: string;
    polar_subscription_id?: string;
    subscription_cycle_start?: string;
  }
) {
  const { error } = await supabaseAdmin
    .from("profesores")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profesorId);

  if (error) {
    logger.error("Error actualizando profesor:", error);
    throw error;
  }

  logger.log(`Profesor ${profesorId} actualizado:`, data);
}

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  
  onSubscriptionCreated: async (payload) => {
    logger.log("subscription.created recibido:", payload.data.id);
    
    const subscription = payload.data;
    const metadata = subscription.metadata as Record<string, string> | undefined;
    
    const profesorId = await getProfesorId(metadata, subscription.customer?.id);
    if (!profesorId) {
      logger.warn("subscription.created: No se pudo determinar profesor ID");
      return;
    }

    await updateProfesorSubscription(profesorId, {
      subscription_tier: "plus",
      subscription_status: "active",
      polar_customer_id: subscription.customer?.id,
      polar_subscription_id: subscription.id,
      subscription_cycle_start: subscription.startedAt?.toString() || new Date().toISOString(),
    });

    logger.log(`Upgrade a Plus completado para profesor: ${profesorId}`);
  },

  onSubscriptionActive: async (payload) => {
    logger.log("subscription.active recibido:", payload.data.id);
    
    const subscription = payload.data;
    const metadata = subscription.metadata as Record<string, string> | undefined;
    
    const profesorId = await getProfesorId(metadata, subscription.customer?.id);
    if (!profesorId) return;

    await updateProfesorSubscription(profesorId, {
      subscription_status: "active",
    });
  },

  onSubscriptionCanceled: async (payload) => {
    logger.log("subscription.canceled recibido:", payload.data.id);
    
    const subscription = payload.data;
    const metadata = subscription.metadata as Record<string, string> | undefined;
    
    const profesorId = await getProfesorId(metadata, subscription.customer?.id);
    if (!profesorId) return;

    // Usuario canceló pero mantiene acceso hasta fin de periodo
    await updateProfesorSubscription(profesorId, {
      subscription_status: "cancelled",
      // subscription_tier permanece "plus" hasta que expire
    });

    logger.log(`Suscripción cancelada (mantiene acceso): ${profesorId}`);
  },

  onSubscriptionRevoked: async (payload) => {
    logger.log("subscription.revoked recibido:", payload.data.id);
    
    const subscription = payload.data;
    const metadata = subscription.metadata as Record<string, string> | undefined;
    
    const profesorId = await getProfesorId(metadata, subscription.customer?.id);
    if (!profesorId) return;

    // Suscripción expiró - downgrade a free
    await updateProfesorSubscription(profesorId, {
      subscription_tier: "free",
      subscription_status: "expired",
    });

    logger.log(`Downgrade a Free completado para profesor: ${profesorId}`);
  },

  onSubscriptionUpdated: async (payload) => {
    logger.log("subscription.updated recibido:", payload.data.id);
    // Manejar cambios de plan si es necesario en el futuro
  },
});
