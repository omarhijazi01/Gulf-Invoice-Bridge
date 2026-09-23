import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AUTH_URL, auth } from '../services/auth';
import './sign-in.css';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+[1-9]\d{7,14}$/;

export function SignIn() {
  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [register, setRegister] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [phoneChallenge, setPhoneChallenge] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const destination =
    typeof location.state?.from === 'string' && location.state.from.startsWith('/')
      ? location.state.from
      : '/app';

  async function sendCode(event: FormEvent) {
    event.preventDefault();
    if (!auth) return setMessage('Sign in is temporarily unavailable.');
    if (mode === 'email' && !emailPattern.test(identifier.trim()))
      return setMessage('Enter a valid email address.');
    if (mode === 'phone' && !phonePattern.test(identifier.trim()))
      return setMessage('Enter a phone number in international format, such as +962790000000.');
    if (register && phone.trim() && !phonePattern.test(phone.trim()))
      return setMessage('Enter your phone number in international format.');
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'phone') {
        const response = await fetch(`${AUTH_URL}/functions/v1/phone-email-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey:
              import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
              'sb_publishable_ec793prvOcdrz_76wd8k8A_bEaKYKdU',
          },
          body: JSON.stringify({ action: 'send', phone: identifier.trim() }),
        });
        if (!response.ok)
          throw new Error('Unable to send a code right now. Try your email address.');
        const data = await response.json();
        setPhoneChallenge(data.challenge);
        setMessage('If this phone is linked to a verified account, a code was sent to its email.');
        return;
      }
      const email = identifier.trim().toLowerCase();
      const { error } = await auth.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: register,
          ...(register && phone.trim() ? { data: { phone_alias: phone.trim() } } : {}),
        },
      });
      if (error) throw error;
      setPendingEmail(email);
      setMessage('Check your email for the six-digit verification code.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (!auth) return;
    const email = pendingEmail || identifier.trim().toLowerCase();
    if (mode === 'email' && !emailPattern.test(email))
      return setMessage('Enter your email address.');
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'phone') {
        const response = await fetch(`${AUTH_URL}/functions/v1/phone-email-otp`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'verify', challenge: phoneChallenge, code: code.trim() }),
        });
        if (!response.ok) throw new Error('Invalid or expired code.');
        const tokens = await response.json();
        const { error } = await auth.auth.setSession(tokens);
        if (error) throw error;
      } else {
        const { error } = await auth.auth.verifyOtp({ email, token: code.trim(), type: 'email' });
        if (error) throw error;
      }
      navigate(destination, { replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The code could not be verified.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <Link className="auth-home" to="/">
        ← Gulf Invoice Bridge
      </Link>
      <div className="auth-card">
        <span className="auth-eyebrow">LIMITED BETA</span>
        <h1>{register ? 'Create your account' : 'Sign in'}</h1>
        <p>Access is available to approved team email addresses. Your code is sent by email.</p>
        <div className="auth-tabs" aria-label="Sign in method">
          <button
            type="button"
            aria-pressed={mode === 'email'}
            onClick={() => {
              setMode('email');
              setIdentifier('');
              setPendingEmail('');
              setPhoneChallenge('');
              setCode('');
              setMessage('');
            }}
          >
            Email
          </button>
          <button
            type="button"
            aria-pressed={mode === 'phone'}
            disabled={register}
            onClick={() => {
              setMode('phone');
              setIdentifier('');
              setPendingEmail('');
              setPhoneChallenge('');
              setCode('');
              setMessage('');
            }}
          >
            Phone
          </button>
        </div>
        <form onSubmit={sendCode}>
          <label htmlFor="identifier">{mode === 'email' ? 'Email address' : 'Phone number'}</label>
          <input
            id="identifier"
            type={mode === 'email' ? 'email' : 'tel'}
            autoComplete={mode === 'email' ? 'email' : 'tel'}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            required
          />
          {register && (
            <>
              <label htmlFor="phone">Phone number (optional), including country code</label>
              <input
                id="phone"
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+962790000000"
              />
            </>
          )}
          <button className="auth-submit" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : 'Send verification code'}
          </button>
        </form>
        {(pendingEmail || phoneChallenge) && (
          <form onSubmit={verifyCode}>
            <label htmlFor="code">Six-digit code</label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              required
            />
            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : 'Verify and continue'}
            </button>
          </form>
        )}
        {message && (
          <p className="auth-message" role="status">
            {message}
          </p>
        )}
        <button
          className="auth-switch"
          type="button"
          onClick={() => {
            setRegister(!register);
            setMode('email');
            setPendingEmail('');
            setPhoneChallenge('');
            setCode('');
            setMessage('');
          }}
        >
          {register
            ? 'Already have an account? Sign in'
            : 'Approved team member? Create an account'}
        </button>
      </div>
    </main>
  );
}
