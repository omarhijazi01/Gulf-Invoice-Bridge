import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { auth } from '../services/auth';

export function RequireAuth() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const location = useLocation();

  useEffect(() => {
    if (!auth) {
      setSession(null);
      return;
    }
    let active = true;
    auth.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data: subscription } = auth.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (session === undefined) return <div className="state">Checking your session…</div>;
  if (!session) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}
