import { useEffect, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { syncGuestProgressToAccount } from '@/lib/authSync';
import { supabase, supabaseConfigError } from '@/lib/supabaseClient';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [recoverySession, setRecoverySession] = useState(false);
  const [error, setError] = useState<string | null>(supabaseConfigError);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
      } else {
        setUser(data.session?.user ?? null);
      }
      setLoading(false);
    }).catch((sessionError: unknown) => {
      if (!active) return;
      setError(sessionError instanceof Error ? sessionError.message : 'Unable to load your account.');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null);
        setError(null);
        if (event === 'PASSWORD_RECOVERY') setRecoverySession(true);
        if (event === 'SIGNED_OUT') setRecoverySession(false);
        setLoading(false);
      },
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    if (!supabase) throw new Error(supabaseConfigError ?? 'Cloud accounts are unavailable.');
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    if (data.user?.id) {
      await syncGuestProgressToAccount(data.user.id);
    }
  }

  async function signUp(email: string, password: string) {
    if (!supabase) throw new Error(supabaseConfigError ?? 'Cloud accounts are unavailable.');
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (authError) throw authError;
    if (data.user?.id && data.session) {
      await syncGuestProgressToAccount(data.user.id);
    }
  }

  async function signOut() {
    if (!supabase) throw new Error(supabaseConfigError ?? 'Cloud accounts are unavailable.');
    const { error: authError } = await supabase.auth.signOut();
    if (authError) throw authError;
  }

  async function sendPasswordReset(email: string) {
    if (!supabase) throw new Error(supabaseConfigError ?? 'Cloud accounts are unavailable.');
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (authError) throw authError;
  }

  async function updatePassword(password: string) {
    if (!supabase) throw new Error(supabaseConfigError ?? 'Cloud accounts are unavailable.');
    const { error: authError } = await supabase.auth.updateUser({ password });
    if (authError) throw authError;
    setRecoverySession(false);
  }

  async function deleteAccount() {
    if (!supabase) throw new Error(supabaseConfigError ?? 'Cloud accounts are unavailable.');
    const { error: deleteError } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (deleteError) throw deleteError;
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) throw signOutError;
  }

  return {
    user,
    loading,
    configured: Boolean(supabase),
    configError: supabaseConfigError,
    error,
    recoverySession,
    signIn,
    signUp,
    signOut,
    sendPasswordReset,
    updatePassword,
    deleteAccount,
  };
}

export type AuthState = ReturnType<typeof useAuth>;
