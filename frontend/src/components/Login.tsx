import React, { useState } from 'react';
import { signUp, signIn, confirmSignUp } from 'aws-amplify/auth';

interface LoginProps {
  onLoginSuccess: (email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');

  const handleSignUp = async () => {
    try {
      setLoading(true);
      setError('');

      await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            name: fullName,
          },
        },
      });

      setShowConfirm(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSignUp = async () => {
    try {
      setLoading(true);
      setError('');

    await confirmSignUp({ username: email, confirmationCode: confirmCode });

      setShowConfirm(false);
      setIsSignUp(false);
      setEmail('');
      setPassword('');
      setFullName('');
      setConfirmCode('');
      alert('Email verified! Now you can login.');
    } catch (err: any) {
      setError(err.message || 'Confirmation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError('');

    await signIn({ username: email, password: password });

      onLoginSuccess(email);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (showConfirm) {
      handleConfirmSignUp();
    } else if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h1 style={styles.title}>SmartLeaveX</h1>
        <h2 style={styles.subtitle}>
          {showConfirm ? 'Verify Email' : isSignUp ? 'Create Account' : 'Login'}
        </h2>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!showConfirm && isSignUp && (
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              style={styles.input}
              required
            />
          )}

          {!showConfirm && (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
            </>
          )}

          {showConfirm && (
            <input
              type="text"
              placeholder="Confirmation Code (from email)"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              style={styles.input}
              required
            />
          )}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Loading...' : showConfirm ? 'Verify' : isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>

        {!showConfirm && (
          <p style={styles.toggleText}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={styles.toggleButton}
            >
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  } as React.CSSProperties,
  box: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
    width: '100%',
    maxWidth: '400px',
  } as React.CSSProperties,
  title: {
    color: '#667eea',
    marginBottom: '10px',
    textAlign: 'center',
  } as React.CSSProperties,
  subtitle: {
    color: '#333',
    marginBottom: '30px',
    textAlign: 'center',
    fontSize: '20px',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '15px',
    boxSizing: 'border-box',
  } as React.CSSProperties,
  button: {
    width: '100%',
    padding: '12px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
  } as React.CSSProperties,
  error: {
    background: '#ff6b6b',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  } as React.CSSProperties,
  toggleText: {
    marginTop: '20px',
    textAlign: 'center',
    color: '#666',
  } as React.CSSProperties,
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
    fontSize: '14px',
  } as React.CSSProperties,
};
