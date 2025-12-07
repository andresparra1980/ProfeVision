import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  // Obtener usuario autenticado
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  // Obtener polar_customer_id del profesor
  const { data: profesor } = await supabase
    .from("profesores")
    .select("polar_customer_id")
    .eq("id", user.id)
    .single();

  if (!profesor?.polar_customer_id) {
    return NextResponse.json({ error: "No se encontró customer ID de Polar" }, { status: 404 });
  }

  // Crear customer session via Polar API
  const response = await fetch("https://sandbox-api.polar.sh/v1/customer-sessions/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      customer_id: profesor.polar_customer_id,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Polar portal error:", error);
    return NextResponse.json({ error: "Failed to create customer session" }, { status: 500 });
  }

  const session = await response.json();
  
  // Redirigir al portal de Polar
  return NextResponse.redirect(session.customer_portal_url);
}
