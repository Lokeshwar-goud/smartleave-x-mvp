import React, { useState, useEffect } from 'react';
import axios from 'axios';
// 1. Import the CSS module
import styles from './Dashboard.module.css';
import { apiEndpoints } from '../amplify-config';

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
  }, [userEmail]); // Added userEmail as a dependency

  const fetchLeavesAndBalance = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch leaves
      const leavesResponse = await axios.get(
        apiEndpoints.getLeaves,
        {
          params: { email: userEmail },
        }
      );

      setLeaves(leavesResponse.data);

      // Fetch balance
      try {
        const balanceResponse = await axios.get(
          apiEndpoints.getBalance,
          {
            params: { email: userEmail },
          }
        );
        setBalance(balanceResponse.data.balance || 20);
      } catch (err) {
        // Default to 20 if balance Lambda fails or is not found
        console.warn('Balance endpoint failed, defaulting to 20.');
        setBalance(20);
      }
    } catch (err: any) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Helper function now returns a CSS class name
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return styles.statusApproved;
      case 'rejected':
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  return (
    // 3. Use `className` instead of `style`
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Leave Dashboard</h1>
        <button onClick={onApplyNewLeave} className={styles.applyButton}>
          + Apply New Leave
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <>
          {/* Leave Balance Card */}
          <div className={styles.balanceCard}>
            <h3 className={styles.balanceTitle}>Available Leave Balance</h3>
            <div className={styles.balanceValue}>{balance} days</div>
            <p className={styles.balanceSubtext}>Annual leave remaining</p>
          </div>

          {/* Leaves Table */}
          {leaves.length === 0 ? (
            <p className={styles.noData}>No leaves applied yet</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.th}>Start Date</th>
                    <th className={styles.th}>End Date</th>
                    <th className={styles.th}>Days</th>
                    <th className={styles.th}>Reason</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave.leave_id} className={styles.tableRow}>
                      <td className={styles.td}>{leave.start_date}</td>
                      <td className={styles.td}>{leave.end_date}</td>
                      <td className={styles.td}>{leave.days || '-'}</td>
                      <td className={styles.td}>{leave.reason}</td>
                      <td className={styles.td}>
                        {/* 4. Apply the dynamic status class */}
                        <span className={getStatusClass(leave.status)}>
                          {leave.status.toUpperCase()}
                        </span>
                      </td>
                      <td className={styles.td}>
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