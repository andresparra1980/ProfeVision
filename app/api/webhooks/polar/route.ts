import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";
import logger from "@/lib/utils/logger";

// Cliente admin para bypassear RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Busca profesor por email en auth.users
 */
async function findProfesorByEmail(email: string) {
  // Buscar usuario en auth.users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (authError) {
    logger.error("Error listando usuarios:", authError);
    return null;
  }

  const user = authData.users.find(u => u.email === email);
  if (!user) {
    logger.warn(`Usuario no encontrado con email: ${email}`);
    return null;
  }

  // Verificar que existe en profesores
  const { data: profesor, error } = await supabaseAdmin
    .from("profesores")
    .select("id, subscription_tier, subscription_status")
    .eq("id", user.id)
    .single();

  if (error) {
    logger.error("Error buscando profesor:", error);
    return null;
  }

  return profesor;
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
    const customerEmail = subscription.customer?.email;
    
    if (!customerEmail) {
      logger.warn("subscription.created sin email de customer");
      return;
    }

    const profesor = await findProfesorByEmail(customerEmail);
    if (!profesor) {
      logger.warn(`No se encontró profesor para email: ${customerEmail}`);
      return;
    }

    await updateProfesorSubscription(profesor.id, {
      subscription_tier: "plus",
      subscription_status: "active",
      polar_customer_id: subscription.customer?.id,
      polar_subscription_id: subscription.id,
      subscription_cycle_start: subscription.startedAt?.toString() || new Date().toISOString(),
    });

    logger.log(`Upgrade a Plus completado para profesor: ${profesor.id}`);
  },

  onSubscriptionActive: async (payload) => {
    logger.log("subscription.active recibido:", payload.data.id);
    
    const subscription = payload.data;
    const customerEmail = subscription.customer?.email;
    
    if (!customerEmail) return;

    const profesor = await findProfesorByEmail(customerEmail);
    if (!profesor) return;

    await updateProfesorSubscription(profesor.id, {
      subscription_status: "active",
    });
  },

  onSubscriptionCanceled: async (payload) => {
    logger.log("subscription.canceled recibido:", payload.data.id);
    
    const subscription = payload.data;
    const customerEmail = subscription.customer?.email;
    
    if (!customerEmail) return;

    const profesor = await findProfesorByEmail(customerEmail);
    if (!profesor) return;

    // Usuario canceló pero mantiene acceso hasta fin de periodo
    await updateProfesorSubscription(profesor.id, {
      subscription_status: "cancelled",
      // subscription_tier permanece "plus" hasta que expire
    });

    logger.log(`Suscripción cancelada (mantiene acceso): ${profesor.id}`);
  },

  onSubscriptionRevoked: async (payload) => {
    logger.log("subscription.revoked recibido:", payload.data.id);
    
    const subscription = payload.data;
    const customerEmail = subscription.customer?.email;
    
    if (!customerEmail) return;

    const profesor = await findProfesorByEmail(customerEmail);
    if (!profesor) return;

    // Suscripción expiró - downgrade a free
    await updateProfesorSubscription(profesor.id, {
      subscription_tier: "free",
      subscription_status: "expired",
    });

    logger.log(`Downgrade a Free completado para profesor: ${profesor.id}`);
  },

  onSubscriptionUpdated: async (payload) => {
    logger.log("subscription.updated recibido:", payload.data.id);
    // Manejar cambios de plan si es necesario en el futuro
  },
});
