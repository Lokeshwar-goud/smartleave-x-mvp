import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

  const approvedCount = leaves.filter((l) => l.status === 'approved').length;
  const rejectedCount = leaves.filter((l) => l.status === 'rejected').length;
  const pendingCount = leaves.filter((l) => l.status === 'pending').length;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Admin Dashboard - All Leaves</h1>
        <button onClick={onBack} style={styles.backButton}>
          ← Back
        </button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : (
        <>
          {/* Statistics Cards */}
          <div style={styles.statsContainer}>
            <div style={{ ...styles.statCard, borderLeft: '4px solid #ffa500' }}>
              <div style={styles.statValue}>{pendingCount}</div>
              <div style={styles.statLabel}>Pending</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: '4px solid #51cf66' }}>
              <div style={styles.statValue}>{approvedCount}</div>
              <div style={styles.statLabel}>Approved</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: '4px solid #ff6b6b' }}>
              <div style={styles.statValue}>{rejectedCount}</div>
              <div style={styles.statLabel}>Rejected</div>
            </div>
            <div style={{ ...styles.statCard, borderLeft: '4px solid #667eea' }}>
              <div style={styles.statValue}>{leaves.length}</div>
              <div style={styles.statLabel}>Total</div>
            </div>
          </div>

          {/* Filters */}
          <div style={styles.filterContainer}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Filter by Status:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={styles.select}
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Search by Email:</label>
              <input
                type="text"
                placeholder="Employee email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          {/* Leaves Table */}
          {filteredLeaves.length === 0 ? (
            <p style={styles.noData}>No leaves found</p>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Employee Email</th>
                    <th style={styles.th}>Approver Email</th>
                    <th style={styles.th}>Start Date</th>
                    <th style={styles.th}>End Date</th>
                    <th style={styles.th}>Days</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Applied On</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map((leave) => (
                    <tr key={leave.leave_id} style={styles.tableRow}>
                      <td style={styles.td}>{leave.employee_email}</td>
                      <td style={styles.td}>{leave.approver_email}</td>
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
    maxWidth: '1200px',
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
  backButton: {
    background: '#a6a6a6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  } as React.CSSProperties,
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  } as React.CSSProperties,
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px',
  } as React.CSSProperties,
  filterContainer: {
    background: 'white',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    gap: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  } as React.CSSProperties,
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  } as React.CSSProperties,
  filterLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  } as React.CSSProperties,
  select: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
  } as React.CSSProperties,
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '200px',
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
    fontSize: '14px',
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