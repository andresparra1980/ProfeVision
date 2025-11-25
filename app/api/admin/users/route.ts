import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TierService } from '@/lib/services/tier-service';

const DEBUG = process.env.NODE_ENV === 'development';

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const isAdmin = await TierService.isAdmin(supabase, user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse query params
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const search = url.searchParams.get('search') || '';
    const tier = url.searchParams.get('tier') || '';
    const offset = (page - 1) * limit;

    // Build query for users with auth email
    let query = supabase
      .from('profesores')
      .select('id, nombres, apellidos, subscription_tier, subscription_status, created_at', { count: 'exact' });

    // Apply tier filter
    if (tier && ['free', 'plus', 'admin', 'grandfathered'].includes(tier)) {
      query = query.eq('subscription_tier', tier);
    }

    // Apply search filter (on nombres or apellidos)
    if (search) {
      query = query.or(`nombres.ilike.%${search}%,apellidos.ilike.%${search}%`);
    }

    // Apply pagination
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data: profesores, count, error: queryError } = await query;

    if (queryError) {
      if (DEBUG) console.error('Error fetching users:', queryError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get auth emails for each user
    const { data: authUsers } = await supabase.auth.admin.listUsers();

    // Create a map of user id to email
    const emailMap = new Map<string, string>();
    authUsers?.users?.forEach((u) => {
      emailMap.set(u.id, u.email || '');
    });

    // Get stats for each user (in parallel)
    const usersWithStats = await Promise.all(
      (profesores || []).map(async (profesor) => {
        const [entities, subjects, groups, exams, scans] = await Promise.all([
          supabase
            .from('entidades_educativas')
            .select('*', { count: 'exact', head: true })
            .eq('profesor_id', profesor.id),
          supabase
            .from('materias')
            .select('*', { count: 'exact', head: true })
            .eq('profesor_id', profesor.id),
          supabase
            .from('grupos')
            .select('*', { count: 'exact', head: true })
            .eq('profesor_id', profesor.id),
          supabase
            .from('examenes')
            .select('*', { count: 'exact', head: true })
            .eq('profesor_id', profesor.id),
          supabase
            .from('examenes_escaneados')
            .select('*', { count: 'exact', head: true })
            .eq('profesor_id', profesor.id),
        ]);

        return {
          id: profesor.id,
          email: emailMap.get(profesor.id) || '',
          nombres: profesor.nombres,
          apellidos: profesor.apellidos,
          subscription_tier: profesor.subscription_tier,
          subscription_status: profesor.subscription_status,
          created_at: profesor.created_at,
          stats: {
            entities: entities.count ?? 0,
            subjects: subjects.count ?? 0,
            groups: groups.count ?? 0,
            exams: exams.count ?? 0,
            scans: scans.count ?? 0,
          },
        };
      })
    );

    const total = count ?? 0;
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    if (DEBUG) console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
