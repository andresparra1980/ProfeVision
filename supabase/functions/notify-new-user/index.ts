import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';
async function sendEmail(user) {
  const client = new SmtpClient();
  // Get SMTP configuration from environment variables
  const SMTP_HOST = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
  const SMTP_PORT = parseInt(Deno.env.get('SMTP_PORT') || '587');
  const SMTP_USERNAME = Deno.env.get('SMTP_USERNAME') || '';
  const SMTP_PASSWORD = Deno.env.get('SMTP_PASSWORD') || '';
  // Check if SMTP credentials are provided
  if (!SMTP_USERNAME || !SMTP_PASSWORD) {
    console.error('SMTP credentials not configured');
    throw new Error('SMTP credentials not configured');
  }
  try {
    await client.connectTLS({
      host: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USERNAME,
      password: SMTP_PASSWORD
    });
    // Format created_at date
    const createdDate = new Date(user.created_at);
    const formattedDate = createdDate.toLocaleString('es-ES', {
      timeZone: 'America/Bogota'
    });
    // Extract metadata
    const metadata = user.raw_user_meta_data?.signin_metadata || {};
    const ip = metadata.ip || 'N/A';
    const city = metadata.geo?.city || 'N/A';
    const country = metadata.geo?.country || 'N/A';
    const browser = metadata.userAgent || 'N/A';
    const device = metadata.platform || 'N/A';

    // Create email body with user details
    const emailBody = `
      <h1>Nuevo Usuario Registrado</h1>
      <p>Se ha registrado un nuevo usuario en ProfeVision:</p>
      <ul>
        <li><strong>ID:</strong> ${user.id}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        ${user.phone ? `<li><strong>Teléfono:</strong> ${user.phone}</li>` : ''}
        <li><strong>Fecha de registro:</strong> ${formattedDate}</li>
        <li><strong>Idioma preferido:</strong> ${user.raw_user_meta_data?.preferred_locale || 'N/A'}</li>
      </ul>

      <h2>Datos de Conexión</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <tr style="background-color: #f2f2f2;">
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Dato</th>
          <th style="padding: 8px; text-align: left; border: 1px solid #ddd;">Valor</th>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Ubicación</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${city}, ${country}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">IP</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${ip}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Dispositivo</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${device}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd;">Navegador</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${browser}</td>
        </tr>
      </table>
    `;
    await client.send({
      from: SMTP_USERNAME,
      to: 'info@profevision.com',
      subject: 'Nuevo Usuario Registrado en ProfeVision',
      content: 'text/html',
      html: emailBody
    });
    await client.close();
    return {
      success: true
    };
  } catch (error) {
    console.error('Error sending email:', error);
    try {
      await client.close();
    } catch (closeError) {
      console.error('Error closing SMTP connection:', closeError);
    }
    throw error;
  }
}
serve(async (req) => {
  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Get request payload
    const payload = await req.json();
    // Check if this is an INSERT event on auth.users
    if (payload.type === 'INSERT' && payload.schema === 'auth' && payload.table === 'users') {
      // Get user details
      const user = payload.record;
      // Send notification email
      await sendEmail(user);
      return new Response(JSON.stringify({
        success: true,
        message: 'Email notification sent'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // For other events, just acknowledge
    return new Response(JSON.stringify({
      success: true,
      message: 'Event received but not processed'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
