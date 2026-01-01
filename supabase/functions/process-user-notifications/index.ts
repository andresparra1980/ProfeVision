import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
async function sendEmail(user) {
  console.log('Preparing to send email for user:', user.email);
  // Get Resend API key from environment variables
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
  if (!RESEND_API_KEY) {
    console.error('Resend API key not configured');
    throw new Error('Resend API key not configured');
  }
  try {
    // Format created_at date
    const createdDate = new Date(user.details.created_at);
    const formattedDate = createdDate.toLocaleString('es-ES', {
      timeZone: 'America/Bogota'
    });
    // Create email HTML content
    const htmlContent = `
      <h1>Nuevo Usuario Registrado</h1>
      <p>Se ha registrado un nuevo usuario en ProfeVision:</p>
      <ul>
        <li><strong>ID:</strong> ${user.user_id}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        ${user.details.phone ? `<li><strong>Teléfono:</strong> ${user.details.phone}</li>` : ''}
        <li><strong>Fecha de registro:</strong> ${formattedDate}</li>
      </ul>
    `;
    console.log('Sending email through Resend');
    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'ProfeVision <notificaciones@profevision.com>',
        to: [
          'info@profevision.com'
        ],
        subject: 'Nuevo Usuario Registrado en ProfeVision',
        html: htmlContent
      })
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }
    const result = await response.json();
    console.log('Email sent successfully:', result);
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}
serve(async (req)=>{
  try {
    console.log('Processing user notifications');
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    // Get unprocessed notifications
    const { data: notifications, error } = await supabase.from('user_notifications').select('*').eq('notification_sent', false).order('created_at', {
      ascending: true
    }).limit(10);
    if (error) {
      console.error('Error fetching notifications:', error);
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
    console.log(`Found ${notifications?.length || 0} notifications to process`);
    if (!notifications || notifications.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: 'No notifications to process'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
    // Process each notification
    const results = [];
    for (const notification of notifications){
      try {
        console.log(`Processing notification for user: ${notification.email}`);
        await sendEmail(notification);
        // Update the notification as sent
        const { error: updateError } = await supabase.from('user_notifications').update({
          notification_sent: true
        }).eq('id', notification.id);
        if (updateError) {
          console.error('Error updating notification status:', updateError);
          throw updateError;
        }
        results.push({
          id: notification.id,
          success: true
        });
      } catch (err) {
        console.error(`Error processing notification ${notification.id}:`, err);
        // Update the notification with error
        await supabase.from('user_notifications').update({
          error: err instanceof Error ? err.message : String(err)
        }).eq('id', notification.id);
        results.push({
          id: notification.id,
          success: false,
          error: String(err)
        });
      }
    }
    return new Response(JSON.stringify({
      success: true,
      message: 'Processed notifications',
      results
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
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
});
