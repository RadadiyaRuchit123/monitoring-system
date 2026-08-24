import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Service handling Supabase Authentication & Profile Management
 */
export const authService = {
  /**
   * Signs up a new user and creates auth + profile record with selected role & department
   */
  async signUp({ email, password, name, role, branch_id = null, shift = 'day' }) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase credentials are not configured. Please set up your .env file.');
    }

    if (!role) {
      throw new Error('Role selection is mandatory. Please select a restaurant role.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          role,
          branch_id,
          shift,
        },
      },
    });

    if (error) {
      throw new Error(this.getFriendlyAuthErrorMessage(error.message));
    }

    // Immediately insert/upsert profile row with selected role, branch, and shift
    if (data.user) {
      await this.createInitialProfile(data.user.id, email, { name, role, branch_id, shift });
    }

    return data;
  },

  /**
   * Signs in an existing user
   */
  async signIn({ email, password }) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase credentials are not configured. Please set up your .env file.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(this.getFriendlyAuthErrorMessage(error.message));
    }

    // Check if user profile has been removed/deactivated by Owner
    if (data?.user) {
      const profile = await this.getProfile(data.user.id);
      if (profile && profile.role === 'removed') {
        await supabase.auth.signOut();
        throw new Error('Your account has been deactivated or removed by the restaurant owner.');
      }
    }

    return data;
  },

  /**
   * Signs out the current user
   */
  async signOut() {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(this.getFriendlyAuthErrorMessage(error.message));
    }
  },

  /**
   * Creates initial profile record in 'public.profiles' table
   */
  async createInitialProfile(userId, email, metadata = {}) {
    if (!isSupabaseConfigured() || !userId) return null;

    const name = metadata.name || metadata.full_name || email.split('@')[0];
    const role = metadata.role;
    if (!role) {
      throw new Error('Role selection is mandatory for profile creation.');
    }
    const branch_id = metadata.branch_id || null;

    const profileData = {
      user_id: userId,
      name,
      email,
      role,
      shift: metadata.shift || 'day',
      updated_at: new Date().toISOString(),
    };
    if (branch_id) profileData.branch_id = branch_id;

    const { data, error } = await supabase
      .from('profiles')
      .upsert([profileData], { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.warn('Error creating initial profile:', error.message);
      return null;
    }

    return data;
  },

  /**
   * Fetches profile record for a user ID with optional branch info
   */
  async getProfile(userId) {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*, branches(id, name, location)')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      // Fallback query if join fails
      const { data: fallback } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      return fallback;
    }

    return data;
  },

  /**
   * Updates user profile
   */
  async updateProfile(userId, { name, role }) {
    if (!isSupabaseConfigured() || !userId) {
      throw new Error('Supabase not configured');
    }

    const updates = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (role) updates.role = role;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw new Error('Failed to update profile. Please try again.');
    }

    await supabase.auth.updateUser({
      data: { name, role },
    });

    return data;
  },

  getFriendlyAuthErrorMessage(rawMsg) {
    if (!rawMsg) return 'An unexpected error occurred. Please try again.';
    const msg = rawMsg.toLowerCase();

    if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
      return 'Invalid email or password. Please verify your credentials and try again.';
    }
    if (msg.includes('user already registered') || msg.includes('already exists')) {
      return 'An account with this email address already exists. Please log in instead.';
    }
    if (msg.includes('password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('session expired') || msg.includes('token')) {
      return 'Your session has expired. Please log in again.';
    }
    if (msg.includes('email not confirmed')) {
      return 'Email address not confirmed. Please check your inbox or contact support.';
    }

    return rawMsg;
  },
};
