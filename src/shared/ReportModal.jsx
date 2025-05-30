import React, { useState, useEffect } from 'react';
import './ReportModal.css'; // Θα δημιουργήσουμε αυτό το αρχείο CSS

const REPORT_REASONS = [
  "Spam",
  "Harassment or Hateful Speech",
  "Inappropriate Content (e.g., nudity, violence)",
  "Misinformation or Fake News",
  "Copyright Infringement",
  "Self-harm or Suicidal Content",
  "Impersonation",
  "Other (please specify in notes)"
];

function ReportModal({ show, onClose, onSubmit, itemType, itemId }) {
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Reset form when modal is shown for a new item
    if (show) {
      setReason('');
      setNotes('');
      setError('');
    }
  }, [show, itemId]); // Reset if show changes or if it's for a new item

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for the report.');
      return;
    }
    if (reason === "Other (please specify in notes)" && !notes.trim()) {
      setError('Please provide details in the notes for "Other" reason.');
      return;
    }
    onSubmit({ reason, notes });
    onClose(); // Κλείσιμο του modal μετά την υποβολή
  };

  if (!show) {
    return null;
  }

  return (
    <div className="report-modal-overlay">
      <div className="report-modal-content">
        <h2>Report {itemType}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="report-reason">Reason:</label>
            <select
              id="report-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(''); // Clear error when reason changes
              }}
              required
            >
              <option value="" disabled>Select a reason</option>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="report-notes">Additional Notes (Optional):</label>
            <textarea
              id="report-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={`Provide more details about why you are reporting this ${itemType}.`}
            />
          </div>
          {error && <p className="report-error-message">{error}</p>}
          <div className="report-modal-actions">
            <button type="submit" className="submit-report-button">Submit Report</button>
            <button type="button" onClick={onClose} className="cancel-report-button">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReportModal;