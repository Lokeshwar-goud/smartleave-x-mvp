import React, { useState, useEffect } from 'react';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { configureAmplify } from './amplify-config';
import { Login } from './components/Login';
import { LeaveForm } from './components/LeaveForm';
import { Dashboard } from './components/Dashboard';
import { AdminDashboard } from './components/AdminDashboard';

type View = 'login' | 'dashboard' | 'apply-leave' | 'admin-dashboard';

function App() {
  const [currentView, setCurrentView] = useState<View>('login');
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      configureAmplify();
      const user = await getCurrentUser();
      if (user) {
        const userEmail = user.username;
        setUserEmail(userEmail);
        if (userEmail === 'dlokeshwargoud@gmail.com') {
          setCurrentView('admin-dashboard');
        } else {
          setCurrentView('dashboard');
        }
      } else {
        setCurrentView('login');
      }
    } catch (err) {
      console.error('Error initializing app:', err);
      setCurrentView('login');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    if (email === 'dlokeshwargoud@gmail.com') {
      setCurrentView('admin-dashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setUserEmail('');
      setCurrentView('login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <h1 style={styles.logo}>SmartLeaveX</h1>
        {userEmail && (
          <div style={styles.headerRight}>
            <span style={styles.userEmail}>{userEmail}</span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </div>
        )}
      </header>

      <main style={styles.main}>
        {currentView === 'login' && (
          <Login onLoginSuccess={handleLoginSuccess} />
        )}

        {currentView === 'dashboard' && userEmail !== 'dlokeshwargoud@gmail.com' && (
          <Dashboard
            userEmail={userEmail}
            onApplyNewLeave={() => setCurrentView('apply-leave')}
          />
        )}

        {currentView === 'apply-leave' && userEmail !== 'dlokeshwargoud@gmail.com' && (
          <LeaveForm
            userEmail={userEmail}
            onSubmitSuccess={() => setCurrentView('dashboard')}
            onBack={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'admin-dashboard' && userEmail === 'dlokeshwargoud@gmail.com' && (
          <AdminDashboard />
        )}
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  } as React.CSSProperties,
  header: {
    background: 'rgba(0, 0, 0, 0.1)',
    color: 'white',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  } as React.CSSProperties,
  headerRight: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
  } as React.CSSProperties,
  userEmail: {
    fontSize: '14px',
  } as React.CSSProperties,
  logoutBtn: {
    background: '#ff6b6b',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  adminButton: {
    background: '#667eea',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '20px',
    display: 'block',
    margin: '20px auto 0',
  } as React.CSSProperties,
  main: {
    padding: '40px 20px',
    minHeight: 'calc(100vh - 80px)',
  } as React.CSSProperties,
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  } as React.CSSProperties,
  loadingText: {
    fontSize: '18px',
    color: 'white',
  } as React.CSSProperties,
};

export default App;