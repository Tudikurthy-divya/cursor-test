import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { HAS_GOOGLE_AUTH } from '../config/google';
import GoogleSignInButton from '../components/GoogleSignInButton';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password) {
      setError('Password is required');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <h1>My CRUD App</h1>
        <p>
          Sign in to manage your personal records with categories and priorities. Secure
          authentication with email or Google.
        </p>
      </div>
      <div className="auth-panel">
        <div className="auth-card">
          <h2>Sign in</h2>
          {error ? <div className="auth-error">{error}</div> : null}
          {HAS_GOOGLE_AUTH ? (
            <>
              <GoogleSignInButton setError={setError} />
              <div className="divider">or</div>
            </>
          ) : null}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
          <div className="auth-footer">
            No account? <Link to="/signup">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
