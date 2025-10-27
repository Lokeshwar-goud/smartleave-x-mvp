import React, { useState } from 'react';
import axios from 'axios';

interface LeaveFormProps {
  userEmail: string;
  onSubmitSuccess: () => void;
  onBack: () => void;
}

export const LeaveForm: React.FC<LeaveFormProps> = ({
  userEmail,
  onSubmitSuccess,
  onBack,
}) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [approverEmail, setApproverEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate || !reason || !approverEmail) {
      setError('All fields are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.post(
        'https://5qcpamlbqz4wx2iytom4ijfwie0ejjzp.lambda-url.us-east-1.on.aws/',
        {
          employee_email: userEmail,
          approver_email: approverEmail,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess('Leave application submitted successfully!');
      setStartDate('');
      setEndDate('');
      setReason('');
      setApproverEmail('');

      // Go back to dashboard after 2 seconds
      setTimeout(() => {
        onSubmitSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to apply leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>Apply for Leave</h2>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Your Email:</label>
            <input
              type="email"
              value={userEmail}
              disabled
              style={{ ...styles.input, backgroundColor: '#f5f5f5' }}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Approver Email:</label>
            <input
              type="email"
              placeholder="Approver email"
              value={approverEmail}
              onChange={(e) => setApproverEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Reason:</label>
            <textarea
              placeholder="Reason for leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ ...styles.input, minHeight: '100px' }}
              required
            />
          </div>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Applying...' : 'Apply for Leave'}
          </button>

          <button
            type="button"
            onClick={onBack}
            style={{ ...styles.button, background: '#a6a6a6' }}
          >
            Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '0 auto',
  } as React.CSSProperties,
  box: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
  } as React.CSSProperties,
  title: {
    color: '#333',
    marginBottom: '30px',
    textAlign: 'center',
  } as React.CSSProperties,
  formGroup: {
    marginBottom: '20px',
  } as React.CSSProperties,
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#333',
    fontWeight: '500',
  } as React.CSSProperties,
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
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
  success: {
    background: '#51cf66',
    color: 'white',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '20px',
  } as React.CSSProperties,
};