import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPolarEndpoint } from "@/lib/polar/config";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const productId = searchParams.get("products");
  const customerEmail = searchParams.get("customerEmail");

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  // Obtener usuario autenticado para pasar su ID en metadata
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Crear checkout session via Polar API
  const response = await fetch(getPolarEndpoint("checkouts"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      product_id: productId,
      success_url: process.env.POLAR_SUCCESS_URL,
      customer_email: customerEmail || user.email,
      metadata: {
        supabase_user_id: user.id,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Polar checkout error:", error);
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 });
  }

  const checkout = await response.json();
  
  // Redirigir al checkout de Polar
  return NextResponse.redirect(checkout.url);
}
