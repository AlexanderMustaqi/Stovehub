import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api.js';
import { UserContext } from '../App.jsx';
import './AdminPanel.css';

function ReportItem({ report, onHandleReport }) {
  const [showDetails, setShowDetails] = useState(false);
  const [adminAction, setAdminAction] = useState(report.status === 'pending' ? '' : report.status);
  const [adminNotes, setAdminNotes] = useState(report.admin_notes || ''); // Αν υπάρχουν ήδη σημειώσεις

  const getReportedContentLink = () => {
    if (report.reported_recipe_id) {
      return <Link to={`/home/recipes/${report.reported_recipe_id}`} target="_blank" rel="noopener noreferrer">Recipe: {report.reported_recipe_title || `ID ${report.reported_recipe_id}`}</Link>;
    }
    if (report.reported_comment_id) {
      return `Comment: "${report.reported_comment_snippet}..." (ID: ${report.reported_comment_id})`;
    }
    if (report.reported_user_id) {
      return <Link to={`/user-profile/${report.reported_user_id}`} target="_blank" rel="noopener noreferrer">User: {report.reported_username || `ID ${report.reported_user_id}`}</Link>;
    }
    return 'N/A';
  };

  const handleSubmitAction = () => {
    if (!adminAction && report.status === 'pending') { // Έλεγχos μόνο αν η αναφορά είναι pending
      alert("Please select an action for this pending report.");
      return;
    }
    // Επιτρέπουμε την υποβολή ακόμα κι αν δεν αλλάξει η ενέργεια, για ενημέρωση σημειώσεων
    onHandleReport(report.report_id, adminAction || report.status, adminNotes);
  };

  return (
    <div className={`report-item status-border-${report.status}`}>
      <div className="report-summary">
        <p><strong>Report ID:</strong> {report.report_id}</p>
        <p><strong>Reported:</strong> {getReportedContentLink()}</p>
        <p><strong>Reason:</strong> {report.reason}</p>
        <p><strong>User Notes:</strong> {report.user_notes || 'N/A'}</p>
        <p><strong>Status:</strong> <span className={`status-${report.status}`}>{report.status}</span></p>
        <p><strong>Reported by:</strong> <Link to={`/user-profile/${report.reporting_user_id}`} target="_blank" rel="noopener noreferrer">{report.reporting_username}</Link> (ID: {report.reporting_user_id})</p>
        <p><strong>Date:</strong> {new Date(report.report_created_at).toLocaleString()}</p>
        <button onClick={() => setShowDetails(!showDetails)} className="details-button">
          {showDetails ? 'Hide Actions' : 'Show Actions'}
        </button>
      </div>
      {showDetails && (
        <div className="report-details-modal"> 
          <h4>Handle Report ID: {report.report_id}</h4>
          <div className="admin-actions">
            <label htmlFor={`action-select-${report.report_id}`}>Set Status:</label>
            <select id={`action-select-${report.report_id}`} value={adminAction} onChange={(e) => setAdminAction(e.target.value)} >
              {report.status === 'pending' && <option value="">Select Action</option>}
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
              <option value="action_taken">Action Taken</option>
            </select>
            <label htmlFor={`admin-notes-${report.report_id}`}>Admin Notes:</label>
            <textarea id={`admin-notes-${report.report_id}`} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Optional notes for this action..." />
            <button onClick={handleSubmitAction} className="submit-action-button">Update Report Status</button>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminPanel() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useContext(UserContext);

  console.log("AdminPanel component IS RENDERING!");
  console.log("Current Admin User in AdminPanel:", currentUser);


  const fetchReports = async () => {
    console.log("[AdminPanel] fetchReports called. CurrentUser:", currentUser);
    if (!currentUser || currentUser.rank !== 'admin') {
      console.error("[AdminPanel] Access Denied or currentUser not admin.");
      setError("Access Denied. Admin privileges required.");
      setLoading(false);
      return;
    }
    const token = sessionStorage.getItem('authToken');
    console.log("[AdminPanel] Token for fetching reports:", token);
    if (!token) {
        console.error("[AdminPanel] Auth token not found in session storage.");
        setError("Authentication token not found.");
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
      console.log("[AdminPanel] Attempting to fetch /api/admin/reports");
      const response = await api.get('/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("[AdminPanel] Reports fetched successfully:", response.data);
      setReports(response.data);
      setError(null);
    } catch (err) {
      console.error("[AdminPanel] Error fetching reports:", err);
      setError(err.response?.data?.message || "Failed to fetch reports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("[AdminPanel] useEffect triggered. Fetching reports.");
    fetchReports();
  }, [currentUser]); // Εξαρτάται από το currentUser για να ξαναφορτώσει αν αλλάξει ο χρήστης

  const handleReportAction = async (reportId, action, adminNotes) => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
        alert("Authentication token not found.");
        return;
    }
    console.log(`[AdminPanel] Handling report ${reportId} with action: ${action}`);
    try {
      await api.post(`/admin/reports/${reportId}/handle`,
        { action, adminNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Report ${reportId} status updated to ${action}.`);
      fetchReports(); // Επαναφόρτωση των αναφορών για να αντικατοπτριστεί η αλλαγή
    } catch (err) {
      console.error("[AdminPanel] Error handling report:", err);
      alert(err.response?.data?.message || "Failed to handle report.");
    }
  };

  if (loading) return <div className="admin-panel-container"><p>Loading reports...</p></div>;
  if (error) return <div className="admin-panel-container error-message"><p>Error: {error}</p> <Link to="/home">Go to Home</Link></div>;

  return (
    <div className="admin-panel-container">
      <h1>Admin Panel - Reports</h1>
      {reports.length > 0 ? (
        <div className="reports-list">
          {reports.map(report => (
            <ReportItem key={report.report_id} report={report} onHandleReport={handleReportAction} />
          ))}
        </div>
      ) : (
        <p>No reports found.</p>
      )}
      <Link to="/home">Go back to Home</Link>
    </div>
  );
}

export default AdminPanel;