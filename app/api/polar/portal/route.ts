import { CustomerPortal } from "@polar-sh/nextjs";
import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  server: "sandbox", // TODO: cambiar a "production" en prod
  
  getCustomerId: async (_req: NextRequest) => {
    // Obtener usuario autenticado
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("No autorizado");
    }

    // Obtener polar_customer_id del profesor
    const { data: profesor } = await supabase
      .from("profesores")
      .select("polar_customer_id")
      .eq("id", user.id)
      .single();

    if (!profesor?.polar_customer_id) {
      throw new Error("No se encontró customer ID de Polar");
    }

    return profesor.polar_customer_id;
  },
});
