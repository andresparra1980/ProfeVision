import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TierService } from '@/lib/services/tier-service';

const DEBUG = process.env.NODE_ENV === 'development';

// Helper to get ISO date string for N months ago
function getMonthsAgoDate(months: number): string {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

// Helper to count records by month
function countByMonth(records: { date: string }[], months: number): { month: string; count: number }[] {
  const counts: Record<string, number> = {};

  // Initialize all months with 0
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const key = date.toISOString().slice(0, 7); // YYYY-MM
    counts[key] = 0;
  }

  // Count records
  records.forEach((r) => {
    const key = r.date.slice(0, 7);
    if (key in counts) {
      counts[key]++;
    }
  });

  // Convert to array sorted by month
  return Object.entries(counts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }));
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

      // Trends: Users (last 6 months)
      supabase
        .from('profesores')
        .select('created_at')
        .gte('created_at', getMonthsAgoDate(6)),

      // Trends: Exams (last 6 months)
      supabase
        .from('examenes')
        .select('created_at')
        .gte('created_at', getMonthsAgoDate(6)),

      // Trends: Scans (last 6 months)
      supabase
        .from('examenes_escaneados')
        .select('fecha_escaneo')
        .gte('fecha_escaneo', getMonthsAgoDate(6)),
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

    // Process trends
    const usersTrendData = countByMonth(
      (usersTrend.data || []).map((r: { created_at: string }) => ({ date: r.created_at })),
      6
    );
    const examsTrendData = countByMonth(
      (examsTrend.data || []).map((r: { created_at: string }) => ({ date: r.created_at })),
      6
    );
    const scansTrendData = countByMonth(
      (scansTrend.data || []).map((r: { fecha_escaneo: string }) => ({ date: r.fecha_escaneo })),
      6
    );

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
        users_by_month: usersTrendData,
        exams_by_month: examsTrendData,
        scans_by_month: scansTrendData,
      },
    });
  } catch (error) {
    if (DEBUG) console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
