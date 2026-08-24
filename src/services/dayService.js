import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Service managing user day categories (Day 1, Day 2, etc.)
 */
export const dayService = {
  /**
   * Retrieves all days for the authenticated user ordered by day_number
   * @param {string} userId
   */
  async getDays(userId) {
    if (!isSupabaseConfigured() || !userId) return [];

    const { data, error } = await supabase
      .from('days')
      .select('*')
      .eq('user_id', userId)
      .order('day_number', { ascending: true });

    if (error) {
      console.error('Failed to fetch days:', error.message);
      throw new Error('Could not load day checklist. Please refresh.');
    }

    return data || [];
  },

  /**
   * Creates a new day container for the user
   * @param {{ userId: string, day_number: number, title: string, description?: string }} payload
   */
  async createDay({ userId, day_number, title, description = '' }) {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error('Supabase configuration missing');
    }

    const { data, error } = await supabase
      .from('days')
      .insert({
        user_id: userId,
        day_number,
        title,
        description,
      })
      .select()
      .single();

    if (error) {
      if (error.message.includes('unique_user_day_number') || error.code === '23505') {
        throw new Error(`Day ${day_number} already exists.`);
      }
      throw new Error('Failed to create new day. Please try again.');
    }

    return data;
  },

  /**
   * Updates an existing day's title or description
   */
  async updateDay(dayId, userId, { title, description }) {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('days')
      .update({
        title,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dayId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update day details.');
    }

    return data;
  },

  /**
   * Deletes a day and its associated tasks (via cascade)
   */
  async deleteDay(dayId, userId) {
    if (!isSupabaseConfigured() || !userId) return;

    const { error } = await supabase
      .from('days')
      .delete()
      .eq('id', dayId)
      .eq('user_id', userId);

    if (error) {
      throw new Error('Failed to delete day.');
    }
  },
};
