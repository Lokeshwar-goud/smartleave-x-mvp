import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Leave {
  leave_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
  days?: number;
}

interface DashboardProps {
  userEmail: string;
  onApplyNewLeave: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userEmail,
  onApplyNewLeave,
}) => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLeavesAndBalance();
  }, []);

  const fetchLeavesAndBalance = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch leaves
      const leavesResponse = await axios.get(
        'https://uu4sqg74bl5fhcootcp5xs7ddq0hbjqe.lambda-url.us-east-1.on.aws/',
        {
          params: { email: userEmail },
        }
      );

      setLeaves(leavesResponse.data);

      // Fetch balance (you'll need to create a get-balance Lambda)
      // For now, we'll show default 20 if no balance record exists
      try {
        // This endpoint will be created in next step
        const balanceResponse = await axios.get(
          'https://ypgampwc6k2os77vzhzfzatms40ueaag.lambda-url.us-east-1.on.aws/',
          {
            params: { email: userEmail },
          }
        );
        setBalance(balanceResponse.data.balance || 20);
      } catch (err) {
        // Default to 20 if balance Lambda not available yet
        setBalance(20);
      }
    } catch (err: any) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return '#51cf66';
      case 'rejected':
        return '#ff6b6b';
      default:
        return '#ffa500';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Leave Dashboard</h1>
        <button onClick={onApplyNewLeave} style={styles.applyButton}>
          + Apply New Leave
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : (
        <>
          {/* Leave Balance Card */}
          <div style={styles.balanceCard}>
            <h3 style={styles.balanceTitle}>Available Leave Balance</h3>
            <div style={styles.balanceValue}>{balance} days</div>
            <p style={styles.balanceSubtext}>Annual leave remaining</p>
          </div>

          {/* Leaves Table */}
          {leaves.length === 0 ? (
            <p style={styles.noData}>No leaves applied yet</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Start Date</th>
                    <th style={styles.th}>End Date</th>
                    <th style={styles.th}>Days</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.leave_id} style={styles.tableRow}>
                      <td style={styles.td}>{leave.start_date}</td>
                      <td style={styles.td}>{leave.end_date}</td>
                      <td style={styles.td}>{leave.days || '-'}</td>
                      <td style={styles.td}>{leave.reason}</td>
                      <td style={styles.td}>
                        <span
                          style={{
                            color: getStatusColor(leave.status),
                            fontWeight: 'bold',
                          }}
                        >
                          {leave.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={styles.td}>
                        {new Date(leave.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 20px',
    maxWidth: '1000px',
    margin: '0 auto',
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    borderBottom: '2px solid #667eea',
    paddingBottom: '20px',
  } as React.CSSProperties,
  headerTitle: {
    color: '#333',
    fontSize: '24px',
  } as React.CSSProperties,
  applyButton: {
    background: '#51cf66',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  balanceCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '30px',
    borderRadius: '8px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  balanceTitle: {
    margin: 0,
    marginBottom: '10px',
    fontSize: '16px',
    opacity: 0.9,
  } as React.CSSProperties,
  balanceValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    margin: '10px 0',
  } as React.CSSProperties,
  balanceSubtext: {
    margin: 0,
    opacity: 0.8,
    fontSize: '14px',
  } as React.CSSProperties,
  error: {
    background: '#ff6b6b',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  } as React.CSSProperties,
  loading: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
  } as React.CSSProperties,
  noData: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
  } as React.CSSProperties,
  tableWrapper: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    overflowX: 'auto',
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  } as React.CSSProperties,
  tableHeader: {
    background: '#f5f5f5',
  } as React.CSSProperties,
  th: {
    padding: '12px',
    textAlign: 'left',
    color: '#333',
    fontWeight: '600',
    borderBottom: '2px solid #ddd',
  } as React.CSSProperties,
  tableRow: {
    borderBottom: '1px solid #ddd',
  } as React.CSSProperties,
  td: {
    padding: '12px',
    color: '#666',
  } as React.CSSProperties,
};
  