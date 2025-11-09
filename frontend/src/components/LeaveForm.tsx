import React, { useState } from 'react';
import axios from 'axios';
// 1. Import the CSS module
import styles from './LeaveForm.module.css';

import { apiEndpoints } from '../amplify-config';

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
        apiEndpoints.createLeave,
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

      console.log('Response:', response.data);

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
      console.error('Error details:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        setError(err.response.data?.error || `Server error: ${err.response.status}`);
      } else if (err.request) {
        console.error('Request made but no response received');
        setError('No response from server. Please try again.');
      } else {
        console.error('Error setting up request:', err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    // 2. Use `className` instead of `style`
    <div className={styles.container}>
      <div className={styles.box}>
        <h2 className={styles.title}>Apply for Leave</h2>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Your Email:</label>
            <input
              type="email"
              value={userEmail}
              disabled
              // 3. Combine classes for special cases
              className={`${styles.input} ${styles.disabledInput}`}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Approver Email:</label>
            <input
              type="email"
              placeholder="Approver email"
              value={approverEmail}
              onChange={(e) => setApproverEmail(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Start Date:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>End Date:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Reason:</label>
            <textarea
              placeholder="Reason for leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              // 3. Combine classes for special cases
              className={`${styles.input} ${styles.textarea}`}
              required
            />
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Applying...' : 'Apply for Leave'}
          </button>

          <button
            type="button"
            onClick={onBack}
            // 3. Combine classes for special cases
            className={`${styles.button} ${styles.backButton}`}
          >
            Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
};