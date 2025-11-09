import React, { useState, useEffect } from 'react';
import axios from 'axios';
// 1. Import the CSS module
import styles from './AdminDashboard.module.css';

interface Leave {
  leave_id: string;
  employee_email: string;
  approver_email: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  created_at: string;
  days?: number;
}

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchEmail, setSearchEmail] = useState('');

  useEffect(() => {
    fetchAllLeaves();
  }, []);

  useEffect(() => {
    filterLeaves();
  }, [leaves, filterStatus, searchEmail]);

  const fetchAllLeaves = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(
        'https://kupmf6cwzajwp4xhcb56bydwni0cdzpm.lambda-url.us-east-1.on.aws/'
      );

      setLeaves(response.data);
    } catch (err: any) {
      setError('Failed to fetch leaves');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filterLeaves = () => {
    let filtered = leaves;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((leave) => leave.status === filterStatus);
    }

    // Filter by email search
    if (searchEmail) {
      filtered = filtered.filter((leave) =>
        leave.employee_email.toLowerCase().includes(searchEmail.toLowerCase())
      );
    }

    setFilteredLeaves(filtered);
  };

  // 2. Helper function to return a CSS class instead of a color
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

  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;
  const pendingCount = leaves.filter((l) => l.status === 'pending').length;

  return (
    // 3. Use `className` instead of `style`
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>Admin Dashboard - All Leaves</h1>
        <button onClick={onBack} className={styles.backButton}>
          ← Back
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p className={styles.loading}>Loading...</p>
      ) : (
        <>
          {/* Statistics Cards */}
          <div className={styles.statsContainer}>
            {/* 4. Combine classes for dynamic styles */}
            <div className={`${styles.statCard} ${styles.statPending}`}>
              <div className={styles.statValue}>{pendingCount}</div>
              <div className={styles.statLabel}>Pending</div>
            </div>
            <div className={`${styles.statCard} ${styles.statApproved}`}>
              <div className={styles.statValue}>{approvedCount}</div>
              <div className={styles.statLabel}>Approved</div>
            </div>
            <div className={`${styles.statCard} ${styles.statRejected}`}>
              <div className={styles.statValue}>{rejectedCount}</div>
              <div className={styles.statLabel}>Rejected</div>
            </div>
            <div className={`${styles.statCard} ${styles.statTotal}`}>
              <div className={styles.statValue}>{leaves.length}</div>
              <div className={styles.statLabel}>Total</div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.filterContainer}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
                className={styles.select}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Search by Email:</label>
              <input
                type="text"
                placeholder="Employee email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          {/* Leaves Table */}
          {filteredLeaves.length === 0 ? (
            <p className={styles.noData}>No leaves found</p>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr className={styles.tableHeader}>
                    <th className={styles.th}>Employee Email</th>
                    <th className={styles.th}>Approver Email</th>
                    <th className={styles.th}>Start Date</th>
                    <th className={styles.th}>End Date</th>
                    <th className={styles.th}>Days</th>
                    <th className={styles.th}>Reason</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th}>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.leave_id} className={styles.tableRow}>
                      <td className={styles.td}>{leave.employee_email}</td>
                      <td className={styles.td}>{leave.approver_email}</td>
                      <td className={styles.td}>{leave.start_date}</td>
                      <td className={styles.td}>{leave.end_date}</td>
                      <td className={styles.td}>{leave.days || '-'}</td>
                      <td className={styles.td}>{leave.reason}</td>
                      <td className={styles.td}>
                        {/* 5. Apply the dynamic status class */}
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