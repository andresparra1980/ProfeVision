import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TierService } from '@/lib/services/tier-service';

const DEBUG = process.env.NODE_ENV === 'development';

interface UserWithStats {
  id: string;
  email: string;
  email_confirmed: boolean;
  nombres: string;
  apellidos: string;
  subscription_tier: string;
  subscription_status: string;
  created_at: string;
  stats: {
    entities: number;
    subjects: number;
    groups: number;
    exams: number;
    scans: number;
  };
  activity: number;
}

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
    const sortField = url.searchParams.get('sort') || 'activity';
    const sortOrder = url.searchParams.get('order') || 'desc';

    // Get ALL profesores first (for activity sorting we need all data)
    let query = supabase
      .from('profesores')
      .select('id, nombres, apellidos, subscription_tier, subscription_status, created_at');

    // Apply tier filter
    if (tier && ['free', 'plus', 'admin', 'grandfathered'].includes(tier)) {
      query = query.eq('subscription_tier', tier);
    }

    // Apply search filter
    if (search) {
      query = query.or(`nombres.ilike.%${search}%,apellidos.ilike.%${search}%`);
    }

    const { data: profesores, error: queryError } = await query;

    if (queryError) {
      if (DEBUG) console.error('Error fetching users:', queryError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    if (!profesores || profesores.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    }

    // Get auth emails and confirmation status
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const emailMap = new Map<string, { email: string; confirmed: boolean }>();
    authUsers?.users?.forEach((u) => {
      emailMap.set(u.id, {
        email: u.email || '',
        confirmed: !!u.email_confirmed_at,
      });
    });

    // Get stats for ALL users in parallel
    const usersWithStats: UserWithStats[] = await Promise.all(
      profesores.map(async (profesor) => {
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

        const stats = {
          entities: entities.count ?? 0,
          subjects: subjects.count ?? 0,
          groups: groups.count ?? 0,
          exams: exams.count ?? 0,
          scans: scans.count ?? 0,
        };

        const authInfo = emailMap.get(profesor.id);
        return {
          id: profesor.id,
          email: authInfo?.email || '',
          email_confirmed: authInfo?.confirmed ?? false,
          nombres: profesor.nombres,
          apellidos: profesor.apellidos,
          subscription_tier: profesor.subscription_tier,
          subscription_status: profesor.subscription_status,
          created_at: profesor.created_at,
          stats,
          activity: stats.subjects + stats.groups + stats.exams + stats.scans,
        };
      })
    );

    // Sort ALL users
    usersWithStats.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'activity':
          comparison = a.activity - b.activity;
          break;
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'name':
          comparison = `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`);
          break;
        default:
          comparison = a.activity - b.activity;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination AFTER sorting
    const total = usersWithStats.length;
    const pages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedUsers = usersWithStats.slice(offset, offset + limit);

    return NextResponse.json({
      users: paginatedUsers,
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
