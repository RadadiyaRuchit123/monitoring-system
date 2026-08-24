import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { authService } from '../services/authService';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isOwner: false,
  isOfficeStaff: false,
  isGroundStaff: true,
  isAdmin: false,
  canAccessControlPanel: false,
  userDepartment: 'general',
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch complete profile details from 'profiles' table
  const fetchUserProfile = async (userId, userEmail, userMetadata) => {
    if (!userId) {
      setProfile(null);
      return;
    }

    try {
      let userProfile = await authService.getProfile(userId);

      // Block removed/deactivated staff members or missing profiles
      if (!userProfile || userProfile.role === 'removed') {
        try {
          await authService.signOut();
        } catch (e) {}
        setUser(null);
        setProfile(null);
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {}
        return;
      }

      setProfile(userProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setProfile(null);
    }
  };

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserProfile(currentUser.id, currentUser.email, currentUser.user_metadata).finally(() => {
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen to real-time Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        await fetchUserProfile(currentUser.id, currentUser.email, currentUser.user_metadata);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    const data = await authService.signIn({ email, password });
    setUser(data.user);
    if (data.user) {
      await fetchUserProfile(data.user.id, data.user.email, data.user.user_metadata);
    }
    return data;
  };

  const signup = async (email, password, name, role, department = 'kitchen', branch_id = null) => {
    if (!role) {
      throw new Error('Role selection is mandatory. Please select a role.');
    }
    const data = await authService.signUp({ email, password, name, role, department, branch_id });
    if (data.user) {
      setUser(data.user);
      await fetchUserProfile(data.user.id, data.user.email, { name, role, department, branch_id });
    }
    return data;
  };

  const logout = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.warn('Supabase signout API call note:', err);
    } finally {
      // Force immediate reset of state and session storage
      setUser(null);
      setProfile(null);
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Storage clear error:', e);
      }
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const updated = await authService.updateProfile(user.id, updates);
    setProfile(updated);
    return updated;
  };

  const role = profile?.role || '';
  const isOwner = role === 'owner';
  const isOfficeStaff = role === 'office_staff';
  const isAdmin = role === 'admin' || isOwner;
  const isKarigar = role === 'karigar' || role === 'ground_staff' || role === 'user';
  const isCashier = role === 'cashier';
  const isGroundStaff = isKarigar || isCashier;
  const canAccessControlPanel = isOwner || isOfficeStaff || isAdmin;
  const canVerify = isOwner || isOfficeStaff;
  const userDepartment = profile?.department || 'kitchen';
  const userBranch = profile?.branches?.name || 'Main Branch';

  const value = {
    user,
    profile,
    loading,
    isOwner,
    isOfficeStaff,
    isGroundStaff,
    isKarigar,
    isCashier,
    isAdmin,
    canAccessControlPanel,
    canVerify,
    userDepartment,
    userBranch,
    loading,
    isOwner,
    isOfficeStaff,
    isGroundStaff,
    isKarigar,
    isCashier,
    isAdmin,
    canAccessControlPanel,
    canVerify,
    userDepartment,
    login,
    signup,
    logout,
    updateProfile,
    refreshProfile: () => user && fetchUserProfile(user.id, user.email, user.user_metadata),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
