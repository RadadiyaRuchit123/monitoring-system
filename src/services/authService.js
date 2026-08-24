import { supabase, isSupabaseConfigured } from '../lib/supabase';

/**
 * Service handling Supabase Authentication & Profile Management
 */
export const authService = {
  /**
   * Signs up a new user and creates auth + profile record with selected role & department
   */
  async signUp({ email, password, name, role = 'office_staff' }) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase credentials are not configured. Please set up your .env file.');
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          full_name: name,
          role,
        },
      },
    });

    if (error) {
      throw new Error(this.getFriendlyAuthErrorMessage(error.message));
    }

    // Immediately insert/upsert profile row with selected role
    if (data.user) {
      await this.createInitialProfile(data.user.id, email, { name, role });
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
    const role = metadata.role || 'office_staff';

    const { data, error } = await supabase
      .from('profiles')
      .upsert([{
        user_id: userId,
        name,
        email,
        role,
        updated_at: new Date().toISOString(),
      }], { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.warn('Error creating initial profile:', error.message);
      return null;
    }

    return data;
  },

  /**
   * Fetches profile record for a user ID
   */
  async getProfile(userId) {
    if (!isSupabaseConfigured() || !userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching user profile:', error.message);
      return null;
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
