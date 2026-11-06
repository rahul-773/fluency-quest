import { Trophy, Mic, Swords, Map, Award, RotateCcw, Gem, Flame, Star, Zap } from 'lucide-react';
import type { GameState } from '@/hooks/useGameState';
import { REGIONS } from '@/lib/quests';
import { SCENARIOS } from '@/lib/voice';
import { sfx } from '@/lib/sound';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { AuthState } from '@/hooks/useAuth';

interface ProfileTabProps {
  state: GameState;
  auth: AuthState;
  onReset: () => void;
}

export default function ProfileTab({ state, auth, onReset }: ProfileTabProps) {
  const { progress, levelInfo, cefr } = state;

  const questStats = REGIONS.map((r) => ({
    name: r.name,
    accent: r.accent,
    done: r.quests.filter((q) => progress.completed[q.id] !== undefined).length,
    total: r.quests.length,
  }));

  const totalQuests = questStats.reduce((n, r) => n + r.total, 0);
  const doneQuests = questStats.reduce((n, r) => n + r.done, 0);

  const voiceScenarios = SCENARIOS.map((s) => ({ name: s.title, best: progress.voiceBest[s.id] ?? 0 }));
  const quizWinRate = progress.quizGames > 0 ? Math.round((progress.quizWins / progress.quizGames) * 100) : 0;

  const accentText: Record<string, string> = {
    green: 'text-emerald-300',
    amber: 'text-amber-300',
    pink: 'text-pink-300',
  };
  const accentBar: Record<string, string> = {
    green: 'bg-emerald-400',
    amber: 'bg-amber-400',
    pink: 'bg-pink-400',
  };

  return (
    <div className="space-y-4">
      <AccountCard auth={auth} syncStatus={state.syncStatus} onRetrySync={state.retrySync} onReset={onReset} />

      {/* Identity card */}
      <div className="panel rounded-2xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-sky-600 flex items-center justify-center text-3xl shadow-neon">
            🧑‍🎓
          </div>
          <div className="flex-1">
            <div className="font-display text-xl font-bold text-white">Wayfarer Hero</div>
            <div className="text-sm text-slate-400">
              Level {levelInfo.level} · {cefr} · {levelInfo.title}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-slate-400">Total XP</div>
            <div className="font-display text-2xl font-bold text-amber-300 text-glow-amber">{progress.xp}</div>
          </div>
        </div>

        {/* XP progress to next level */}
        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>{levelInfo.title}</span>
            <span>{progress.xp} / {levelInfo.next === progress.xp ? 'MAX' : levelInfo.next}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
              style={{ width: `${levelInfo.progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Star} label="Level" value={`L${levelInfo.level}`} sub={cefr} color="cyan" />
        <StatCard icon={Zap} label="Total XP" value={String(progress.xp)} sub={`${levelInfo.progress}% to next`} color="amber" />
        <StatCard icon={Flame} label="Day Streak" value={String(progress.streak)} sub="days" color="orange" />
        <StatCard icon={Gem} label="Gems" value={String(progress.gems)} sub="currency" color="emerald" />
      </div>

      {/* Quest progress */}
      <div className="panel rounded-2xl p-5">
        <h3 className="font-display text-base font-bold text-white flex items-center gap-2 mb-3">
          <Map className="w-4 h-4 text-cyan-300" /> Quest Progress
        </h3>
        <div className="space-y-3">
          {questStats.map((r) => (
            <div key={r.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className={`font-medium ${accentText[r.accent]}`}>{r.name}</span>
                <span className="text-slate-400">{r.done}/{r.total}</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full rounded-full ${accentBar[r.accent]} transition-all duration-500`}
                  style={{ width: `${r.total ? (r.done / r.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-slate-400">
          {doneQuests}/{totalQuests} quests completed across all regions.
        </div>
      </div>

      {/* Voice + Quiz stats */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="panel rounded-2xl p-5">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2 mb-3">
            <Mic className="w-4 h-4 text-cyan-300" /> Voice Practice
          </h3>
          <div className="space-y-2">
            {voiceScenarios.map((s) => (
              <div key={s.name} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{s.name}</span>
                <span className={`font-bold ${s.best > 0 ? 'text-emerald-300' : 'text-slate-500'}`}>
                  {s.best > 0 ? `${s.best}%` : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-2xl p-5">
          <h3 className="font-display text-base font-bold text-white flex items-center gap-2 mb-3">
            <Swords className="w-4 h-4 text-cyan-300" /> Arena Record
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Mini label="Matches" value={String(progress.quizGames)} />
            <Mini label="Wins" value={String(progress.quizWins)} />
            <Mini label="Win Rate" value={`${quizWinRate}%`} />
            <Mini label="Best Score" value={String(progress.quizBestScore)} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-300">
            <Trophy className="w-4 h-4" />
            {progress.quizWins} {progress.quizWins === 1 ? 'victory' : 'victories'} earned
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="panel rounded-2xl p-5">
        <h3 className="font-display text-base font-bold text-white flex items-center gap-2 mb-3">
          <Award className="w-4 h-4 text-amber-300" /> Achievements
        </h3>
        <div className="grid sm:grid-cols-3 gap-2">
          <Achievement label="First Quest" desc="Complete a quest" done={doneQuests >= 1} emoji="🗺️" />
          <Achievement label="Explorer" desc="Finish all woods quests" done={questStats[0].done === questStats[0].total} emoji="🌲" />
          <Achievement label="City Speaker" desc="Finish all metro quests" done={questStats[1].done === questStats[1].total} emoji="🌃" />
          <Achievement label="Scholar" desc="Finish all spires quests" done={questStats[2].done === questStats[2].total} emoji="🎓" />
          <Achievement label="Arena Champion" desc="Win a quiz match" done={progress.quizWins >= 1} emoji="🏆" />
          <Achievement label="Polyglot" desc="Reach B2 (750 XP)" done={progress.xp >= 750} emoji="🗣️" />
        </div>
      </div>

      <PrivacyNoticeCard />

      {/* Reset */}
      <div className="flex justify-center">
        <button
          onClick={() => {
            sfx.click();
            if (confirm('Reset all progress? This cannot be undone.')) {
              onReset();
            }
          }}
          className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-4 py-2 text-sm font-semibold transition"
        >
          <RotateCcw className="w-4 h-4" /> Reset Progress
        </button>
      </div>
    </div>
  );
}

function PrivacyNoticeCard() {
  return (
    <section className="panel rounded-2xl p-5">
      <h3 className="font-display text-base font-bold text-white">Privacy & support</h3>
      <div className="mt-3 space-y-3 text-sm text-slate-300">
        <p><span className="font-semibold text-white">Data Collected:</span> Email address, practice statistics, node progress, and optional gender preferences.</p>
        <p><span className="font-semibold text-white">Retention & Deletion:</span> Account data is retained until account deletion is triggered from profile settings.</p>
        <p><span className="font-semibold text-white">Contact & Support:</span> <a href="mailto:support@fluencyquest.app" className="text-cyan-300 underline">support@fluencyquest.app</a></p>
      </div>
    </section>
  );
}

function AccountCard({
  auth,
  syncStatus,
  onRetrySync,
  onReset,
}: {
  auth: AuthState;
  syncStatus: GameState['syncStatus'];
  onRetrySync: () => void;
  onReset: () => void;
}) {
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'reset' | 'recovery'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (auth.recoverySession) setMode('recovery');
  }, [auth.recoverySession]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      if (mode === 'sign-in') {
        await auth.signIn(email, password);
        setMessage('You are signed in. Your progress will sync to your account.');
      } else if (mode === 'sign-up') {
        await auth.signUp(email, password);
        setMessage('Check your email to confirm your account, then sign in.');
      } else if (mode === 'reset') {
        await auth.sendPasswordReset(email);
        setMessage('If an account exists for that email, a password reset link is on its way.');
      } else {
        await auth.updatePassword(password);
        setPassword('');
        setMessage('Your password has been updated.');
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to complete that account request.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSignOut() {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await auth.signOut();
      setMessage('Signed out. This device will keep its local progress.');
    } catch (signOutError) {
      setError(signOutError instanceof Error ? signOutError.message : 'Unable to sign out.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Permanently delete your account and cloud progress? This cannot be undone.')) return;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await auth.deleteAccount();
      onReset();
      setMessage('Your account and cloud progress have been deleted.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete your account.');
    } finally {
      setBusy(false);
    }
  }

  const syncLabels = {
    local: 'Saved on this device',
    loading: 'Loading account progress…',
    syncing: 'Syncing progress…',
    synced: 'Cloud progress is up to date',
    error: 'Cloud sync needs attention',
  };

  return (
    <section className="panel rounded-2xl p-5" aria-labelledby="account-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="account-title" className="font-display text-base font-bold text-white">Account & cloud save</h2>
          <p className="mt-1 text-sm text-slate-400">
            {auth.user ? auth.user.email : 'Create an account to access your learning progress across devices.'}
          </p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs ${
          syncStatus === 'error'
            ? 'border-rose-400/30 bg-rose-400/10 text-rose-200'
            : syncStatus === 'synced'
              ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200'
              : 'border-slate-600 bg-slate-800 text-slate-300'
        }`}>
          {syncLabels[syncStatus]}
        </span>
      </div>

      {auth.loading ? (
        <p className="mt-4 text-sm text-slate-400" role="status">Checking your account…</p>
      ) : !auth.configured ? (
        <p className="mt-4 rounded-lg border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-100">
          {auth.configError} Progress is currently saved only in this browser.
        </p>
      ) : auth.user && !auth.recoverySession ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-300">Your progress is linked to this account.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void handleSignOut()} disabled={busy}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-white transition hover:border-cyan-400/50 disabled:opacity-50">
              {busy ? 'Please wait…' : 'Sign out'}
            </button>
            <button type="button" onClick={() => void handleDeleteAccount()} disabled={busy}
              className="rounded-lg border border-rose-500/40 px-3 py-2 text-sm text-rose-200 transition hover:bg-rose-500/10 disabled:opacity-50">
              Delete account
            </button>
          </div>
        </div>
      ) : (
        <form className="mt-4 space-y-3" onSubmit={(event) => void handleSubmit(event)}>
          {mode !== 'recovery' && (
            <label className="block text-sm text-slate-300">
              Email
              <input type="email" autoComplete="email" required maxLength={254} value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-white outline-none focus:border-cyan-400/60" />
            </label>
          )}
          {(mode === 'sign-in' || mode === 'sign-up' || mode === 'recovery') && (
            <label className="block text-sm text-slate-300">
              {mode === 'recovery' ? 'New password' : 'Password'}
              <input type="password" autoComplete={mode === 'recovery' ? 'new-password' : mode === 'sign-in' ? 'current-password' : 'new-password'}
                required minLength={8} maxLength={128} value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-white outline-none focus:border-cyan-400/60" />
            </label>
          )}
          {error && <p className="text-sm text-rose-300" role="alert">{error}</p>}
          {message && <p className="text-sm text-emerald-300" role="status">{message}</p>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" disabled={busy || auth.loading}
              className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50">
              {busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : mode === 'sign-up' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Update password'}
            </button>
            {mode === 'sign-in' && (
              <>
                <button type="button" onClick={() => { setMode('sign-up'); setError(''); setMessage(''); }}
                  className="rounded-lg border border-slate-600 px-3 py-2.5 text-sm text-slate-200 hover:border-cyan-400/50">Create account</button>
                <button type="button" onClick={() => { setMode('reset'); setError(''); setMessage(''); }}
                  className="px-2 py-2 text-sm text-cyan-300 hover:text-cyan-200">Forgot password?</button>
              </>
            )}
            {mode !== 'sign-in' && mode !== 'recovery' && (
              <button type="button" onClick={() => { setMode('sign-in'); setError(''); setMessage(''); }}
                className="px-2 py-2 text-sm text-cyan-300 hover:text-cyan-200">Back to sign in</button>
            )}
          </div>
        </form>
      )}
      {auth.error && auth.configured && (
        <p className="mt-3 text-sm text-rose-300" role="alert">Account status could not be loaded: {auth.error}</p>
      )}
      {syncStatus === 'error' && auth.user && (
        <button type="button" onClick={onRetrySync}
          className="mt-3 rounded-lg border border-rose-400/30 px-3 py-2 text-sm text-rose-200 hover:bg-rose-400/10">
          Retry cloud sync
        </button>
      )}
      {auth.recoverySession && (
        <div className="mt-4 rounded-lg border border-cyan-400/20 bg-cyan-400/5 p-3 text-sm text-cyan-100">
          Set a new password for your account.
        </div>
      )}
      {message && auth.user && !auth.recoverySession && <p className="mt-3 text-sm text-emerald-300" role="status">{message}</p>}
    </section>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  sub: string;
  color: 'cyan' | 'amber' | 'orange' | 'emerald';
}) {
  const colorMap = {
    cyan: 'text-cyan-300',
    amber: 'text-amber-300',
    orange: 'text-orange-300',
    emerald: 'text-emerald-300',
  };
  return (
    <div className="panel rounded-xl p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${colorMap[color]}`} />
        <span className="text-[11px] uppercase tracking-wider text-slate-400">{label}</span>
      </div>
      <div className="font-display text-xl font-bold text-white">{value}</div>
      <div className="text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-800/40 border border-slate-700 px-3 py-2">
      <div className="text-[11px] uppercase tracking-wider text-slate-400">{label}</div>
      <div className="font-display text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function Achievement({ label, desc, done, emoji }: { label: string; desc: string; done: boolean; emoji: string }) {
  return (
    <div className={`rounded-xl border p-3 ${done ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-700 bg-slate-800/30 opacity-60'}`}>
      <div className="text-2xl mb-1">{done ? emoji : '🔒'}</div>
      <div className="text-sm font-bold text-white">{label}</div>
      <div className="text-[11px] text-slate-400">{desc}</div>
    </div>
  );
}
