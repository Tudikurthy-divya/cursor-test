import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function GoogleSignInButton({ label = 'Continue with Google', setError }) {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const googleBtn = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError?.('');
      try {
        const at = tokenResponse.access_token;
        if (!at) {
          setError?.(
            'Google did not return an access token. Check OAuth client configuration.'
          );
          return;
        }
        await googleLogin(at);
        navigate('/dashboard', { replace: true });
      } catch (e) {
        setError?.(e.response?.data?.error || 'Google sign-in failed');
      }
    },
    onError: () => setError?.('Google sign-in was cancelled or failed'),
    scope: 'openid email profile',
  });

  return (
    <button type="button" className="btn btn-google" onClick={() => googleBtn()}>
      {label}
    </button>
  );
}
