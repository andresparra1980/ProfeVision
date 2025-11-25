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

    // Create Supabase client with service role (bypasses RLS)
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

    // Execute all queries in parallel
    const [
      usersTotal,
      usersByTier,
      usersNewThisMonth,
      examsTotal,
      examsThisMonth,
      examsWithResults,
      scansTotal,
      scansThisMonth,
      institutionsTotal,
      groupsData,
      studentsTotal,
      aiJobsData,
      // Trends
      usersTrend,
      examsTrend,
      scansTrend,
    ] = await Promise.all([
      // Users total
      supabase.from('profesores').select('*', { count: 'exact', head: true }),

      // Users by tier
      supabase.from('profesores').select('subscription_tier'),

      // Users new this month
      supabase
        .from('profesores')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // Exams total
      supabase.from('examenes').select('*', { count: 'exact', head: true }),

      // Exams this month
      supabase
        .from('examenes')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // Exams with results
      supabase.from('resultados_examen').select('examen_id'),

      // Scans total
      supabase.from('examenes_escaneados').select('*', { count: 'exact', head: true }),

      // Scans this month
      supabase
        .from('examenes_escaneados')
        .select('*', { count: 'exact', head: true })
        .gte('fecha_escaneo', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),

      // Institutions total
      supabase.from('entidades_educativas').select('*', { count: 'exact', head: true }),

      // Groups data
      supabase.from('grupos').select('estado'),

      // Students total
      supabase.from('estudiantes').select('*', { count: 'exact', head: true }),

      // AI jobs
      supabase.from('procesos_examen_similar').select('status'),

      // Trends: Users by month (last 6 months)
      supabase.rpc('get_monthly_counts', {
        p_table_name: 'profesores',
        p_date_column: 'created_at',
        p_months: 6,
      }),

      // Trends: Exams by month
      supabase.rpc('get_monthly_counts', {
        p_table_name: 'examenes',
        p_date_column: 'created_at',
        p_months: 6,
      }),

      // Trends: Scans by month
      supabase.rpc('get_monthly_counts', {
        p_table_name: 'examenes_escaneados',
        p_date_column: 'fecha_escaneo',
        p_months: 6,
      }),
    ]);

    // Process tier distribution
    const tierCounts = { free: 0, plus: 0, admin: 0, grandfathered: 0 };
    usersByTier.data?.forEach((u) => {
      const tier = u.subscription_tier as keyof typeof tierCounts;
      if (tier in tierCounts) tierCounts[tier]++;
    });

    // Process groups
    const groupsActive = groupsData.data?.filter((g) => g.estado === 'activo').length ?? 0;
    const groupsArchived = groupsData.data?.filter((g) => g.estado === 'archivado').length ?? 0;

    // Process AI jobs
    const aiJobsCounts = { completed: 0, failed: 0, total: 0 };
    aiJobsData.data?.forEach((job) => {
      aiJobsCounts.total++;
      if (job.status === 'completed') aiJobsCounts.completed++;
      if (job.status === 'failed') aiJobsCounts.failed++;
    });

    // Process exams with results (unique)
    const examsWithResultsCount = new Set(examsWithResults.data?.map((r) => r.examen_id) || []).size;

    // Generate fallback trends if RPC doesn't exist
    const generateFallbackTrends = () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        months.push({
          month: date.toISOString().slice(0, 7),
          count: 0,
        });
      }
      return months;
    };

    return NextResponse.json({
      users: {
        total: usersTotal.count ?? 0,
        new_this_month: usersNewThisMonth.count ?? 0,
        by_tier: tierCounts,
      },
      exams: {
        total: examsTotal.count ?? 0,
        created_this_month: examsThisMonth.count ?? 0,
        with_results: examsWithResultsCount,
      },
      scans: {
        total: scansTotal.count ?? 0,
        this_month: scansThisMonth.count ?? 0,
      },
      institutions: {
        total: institutionsTotal.count ?? 0,
      },
      groups: {
        total: (groupsData.data?.length ?? 0),
        active: groupsActive,
        archived: groupsArchived,
      },
      students: {
        total: studentsTotal.count ?? 0,
      },
      ai_jobs: aiJobsCounts,
      trends: {
        users_by_month: usersTrend.data ?? generateFallbackTrends(),
        exams_by_month: examsTrend.data ?? generateFallbackTrends(),
        scans_by_month: scansTrend.data ?? generateFallbackTrends(),
      },
    });
  } catch (error) {
    if (DEBUG) console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
