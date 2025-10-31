import { getServiceSupabase } from '@/lib/supabase';
import logger from '@/lib/utils/logger';

// ==================== TYPES ====================

export type SubscriptionTier = 'free' | 'plus' | 'admin' | 'grandfathered';

export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing';

export type Feature = 'ai_generation' | 'scan';

export interface TierLimits {
  tier: SubscriptionTier;
  ai_generations_per_month: number;
  scans_per_month: number;
  max_students: number;
  max_groups: number;
  features: {
    export_pdf: boolean;
    export_latex: boolean;
    priority_support: boolean;
    bulk_operations: boolean;
    admin_panel?: boolean;
    legacy_user?: boolean;
  };
}

export interface UsageStats {
  tier: SubscriptionTier;
  ai_generation: {
    used: number;
    limit: number;
    remaining: number;
  };
  scans: {
    used: number;
    limit: number;
    remaining: number;
  };
  cycle: {
    start: string;
    end: string;
    days_until_reset: number;
  };
}

export interface FeatureLimitCheck {
  allowed: boolean;
  limit: number;
  used: number;
  remaining: number;
  tier: SubscriptionTier;
  cycle_end: string;
}

// ==================== SERVICE CLASS ====================

export class TierService {
  /**
   * Check if a professor can access a feature based on their tier limits
   * @param profesorId - The professor's UUID
   * @param feature - The feature to check ('ai_generation' or 'scan')
   * @returns Promise<FeatureLimitCheck>
   */
  static async checkFeatureAccess(
    profesorId: string,
    feature: Feature
  ): Promise<FeatureLimitCheck> {
    try {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase.rpc('check_feature_limit', {
        p_profesor_id: profesorId,
        p_feature: feature,
      });

      if (error) {
        logger.error('Error checking feature limit:', error);
        throw new Error(`Failed to check feature limit: ${error.message}`);
      }

      return data as FeatureLimitCheck;
    } catch (error) {
      logger.error('Error in checkFeatureAccess:', error);
      throw error;
    }
  }

  /**
   * Increment the usage counter for a feature
   * @param profesorId - The professor's UUID
   * @param feature - The feature to increment ('ai_generation' or 'scan')
   * @param amount - The amount to increment (default: 1)
   * @returns Promise<{ success: boolean }>
   */
  static async incrementUsage(
    profesorId: string,
    feature: Feature,
    amount: number = 1
  ): Promise<{ success: boolean }> {
    try {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase.rpc('increment_feature_usage', {
        p_profesor_id: profesorId,
        p_feature: feature,
        p_amount: amount,
      });

      if (error) {
        logger.error('Error incrementing usage:', error);
        throw new Error(`Failed to increment usage: ${error.message}`);
      }

      return { success: data.success };
    } catch (error) {
      logger.error('Error in incrementUsage:', error);
      throw error;
    }
  }

  /**
   * Get the tier limits configuration for a specific tier
   * @param tier - The subscription tier
   * @returns Promise<TierLimits>
   */
  static async getTierLimits(tier: SubscriptionTier): Promise<TierLimits> {
    try {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase
        .from('tier_limits')
        .select('*')
        .eq('tier', tier)
        .single();

      if (error) {
        logger.error('Error fetching tier limits:', error);
        throw new Error(`Failed to fetch tier limits: ${error.message}`);
      }

      return data as TierLimits;
    } catch (error) {
      logger.error('Error in getTierLimits:', error);
      throw error;
    }
  }

  /**
   * Get the current subscription tier for a professor
   * @param profesorId - The professor's UUID
   * @returns Promise<SubscriptionTier>
   */
  static async getCurrentTier(profesorId: string): Promise<SubscriptionTier> {
    try {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase
        .from('profesores')
        .select('subscription_tier')
        .eq('id', profesorId)
        .single();

      if (error) {
        logger.error('Error fetching current tier:', error);
        throw new Error(`Failed to fetch current tier: ${error.message}`);
      }

      return (data?.subscription_tier || 'free') as SubscriptionTier;
    } catch (error) {
      logger.error('Error in getCurrentTier:', error);
      throw error;
    }
  }

  /**
   * Get comprehensive usage statistics for a professor
   * @param profesorId - The professor's UUID
   * @returns Promise<UsageStats>
   */
  static async getUsageStats(profesorId: string): Promise<UsageStats> {
    try {
      const supabase = getServiceSupabase();

      // Get current tier
      const tier = await this.getCurrentTier(profesorId);

      // Get tier limits
      const limits = await this.getTierLimits(tier);

      // Get usage tracking
      const { data: usage, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('profesor_id', profesorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching usage tracking:', error);
        throw new Error(`Failed to fetch usage tracking: ${error.message}`);
      }

      // If no usage record exists, create default stats
      const aiUsed = usage?.ai_generations_used || 0;
      const scansUsed = usage?.scans_used || 0;
      const cycleEnd = usage?.cycle_end_date || new Date().toISOString();
      const cycleStart = usage?.cycle_start_date || new Date().toISOString();

      // Calculate days until reset
      const now = new Date();
      const endDate = new Date(cycleEnd);
      const daysUntilReset = Math.ceil(
        (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        tier,
        ai_generation: {
          used: aiUsed,
          limit: limits.ai_generations_per_month,
          remaining:
            limits.ai_generations_per_month === -1
              ? -1
              : Math.max(0, limits.ai_generations_per_month - aiUsed),
        },
        scans: {
          used: scansUsed,
          limit: limits.scans_per_month,
          remaining:
            limits.scans_per_month === -1
              ? -1
              : Math.max(0, limits.scans_per_month - scansUsed),
        },
        cycle: {
          start: cycleStart,
          end: cycleEnd,
          days_until_reset: Math.max(0, daysUntilReset),
        },
      };
    } catch (error) {
      logger.error('Error in getUsageStats:', error);
      throw error;
    }
  }

  /**
   * Check if a professor should see the welcome modal
   * @param profesorId - The professor's UUID
   * @returns Promise<boolean>
   */
  static async shouldShowWelcome(profesorId: string): Promise<boolean> {
    try {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase
        .from('profesores')
        .select('first_login_completed')
        .eq('id', profesorId)
        .single();

      if (error) {
        logger.error('Error checking welcome status:', error);
        throw new Error(`Failed to check welcome status: ${error.message}`);
      }

      return !data?.first_login_completed;
    } catch (error) {
      logger.error('Error in shouldShowWelcome:', error);
      throw error;
    }
  }

  /**
   * Mark the welcome flow as completed for a professor
   * @param profesorId - The professor's UUID
   * @returns Promise<{ success: boolean }>
   */
  static async completeWelcome(
    profesorId: string
  ): Promise<{ success: boolean }> {
    try {
      const supabase = getServiceSupabase();

      const { error } = await supabase
        .from('profesores')
        .update({ first_login_completed: true })
        .eq('id', profesorId);

      if (error) {
        logger.error('Error completing welcome:', error);
        throw new Error(`Failed to complete welcome: ${error.message}`);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error in completeWelcome:', error);
      throw error;
    }
  }
}

export default TierService;
