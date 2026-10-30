import React, { useState } from 'react';
import type { MaintenanceIssue, Asset, IssueCategory, IssuePriority, IssueStatus } from '../types';
import { generateId, exportMaintenanceToCSV } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';
import { NoticeBanner } from '../components/NoticeBanner';

interface MaintenancePageProps {
  maintenanceIssues: MaintenanceIssue[];
  assets: Asset[];
  onSaveIssue: (issue: MaintenanceIssue) => void;
  onDeleteIssue: (id: string) => void;
  isSimulated: boolean;
}

const EMPTY_ISSUE: Omit<MaintenanceIssue, 'id' | 'createdAt' | 'updatedAt'> = {
  assetId: '',
  dateReported: new Date().toISOString().substring(0, 10),
  category: 'blockage',
  description: '',
  priority: 'medium',
  assignedTo: '',
  status: 'open',
  actionTaken: '',
  resolutionDate: '',
  isSimulated: false,
};

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  maintenanceIssues,
  assets,
  onSaveIssue,
  onDeleteIssue,
  isSimulated,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterAsset, setFilterAsset] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_ISSUE);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Quick Stats
  const openCount = maintenanceIssues.filter(m => m.status === 'open').length;
  const inProgressCount = maintenanceIssues.filter(m => m.status === 'in_progress').length;
  const resolvedCount = maintenanceIssues.filter(m => m.status === 'resolved').length;
  const criticalCount = maintenanceIssues.filter(m => m.priority === 'critical' && m.status !== 'resolved').length;

  // Filtered list
  const filteredIssues = maintenanceIssues.filter(issue => {
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || issue.priority === filterPriority;
    const matchesAsset = filterAsset === 'all' || issue.assetId === filterAsset;
    const matchesCategory = filterCategory === 'all' || issue.category === filterCategory;
    return matchesStatus && matchesPriority && matchesAsset && matchesCategory;
  });

  const handleOpenCreate = () => {
    setFormData({
      ...EMPTY_ISSUE,
      assetId: assets.length > 0 ? assets[0].id : '',
    });
    setEditingIssueId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (issue: MaintenanceIssue) => {
    setFormData({
      assetId: issue.assetId,
      dateReported: issue.dateReported,
      category: issue.category,
      description: issue.description,
      priority: issue.priority,
      assignedTo: issue.assignedTo,
      status: issue.status,
      actionTaken: issue.actionTaken,
      resolutionDate: issue.resolutionDate,
      isSimulated: issue.isSimulated,
    });
    setEditingIssueId(issue.id);
    setIsModalOpen(true);
  };

  const handleQuickResolve = (issue: MaintenanceIssue) => {
    const action = prompt('Enter description of action taken to resolve this issue:', issue.actionTaken || 'Inspected and repaired');
    if (action === null) return; // User cancelled

    const updated: MaintenanceIssue = {
      ...issue,
      status: 'resolved',
      actionTaken: action,
      resolutionDate: new Date().toISOString().substring(0, 10),
      updatedAt: new Date().toISOString(),
    };
    onSaveIssue(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId) {
      alert('Please select an associated asset.');
      return;
    }
    if (!formData.description.trim()) {
      alert('Please provide an issue description.');
      return;
    }

    const issueToSave: MaintenanceIssue = {
      ...formData,
      id: editingIssueId || `issue-${generateId().substring(0, 8)}`,
      createdAt: editingIssueId
        ? maintenanceIssues.find(i => i.id === editingIssueId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveIssue(issueToSave);
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const csv = exportMaintenanceToCSV();
    if (!csv) {
      alert('No maintenance records to export.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jalsetu_purulia_maintenance_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Maintenance &amp; Inspection Tracking</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Record, triage, and follow up on siltation, blockages, leaks, and scheduled inspections.
          </p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            Export Maintenance CSV
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            + Log Maintenance Issue
          </button>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Realistic Responsibility Notice */}
        <div style={{ background: '#f5f0e8', border: '1px solid #d5d0c8', padding: '0.65rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', color: '#5d4037', marginBottom: '1.25rem' }}>
          <strong>Operational Workflow Notice: </strong>
          This application records and assists in monitoring maintenance obligations.
          It does not automatically repair infrastructure. Physical desilting, leak repairs, and pipe clearances
          require allocated community labor, Panchayat action, or scheme funding.
        </div>

        {/* Status Counters */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Open Issues</div>
            <div className="stat-value" style={{ color: openCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {openCount}
            </div>
            <div className="stat-detail">Awaiting physical action</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">In Progress</div>
            <div className="stat-value" style={{ color: inProgressCount > 0 ? 'var(--color-warning)' : 'inherit' }}>
              {inProgressCount}
            </div>
            <div className="stat-detail">Assigned and underway</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Resolved Issues</div>
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              {resolvedCount}
            </div>
            <div className="stat-detail">Completed with logged actions</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Critical Priority</div>
            <div className="stat-value" style={{ color: criticalCount > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {criticalCount}
            </div>
            <div className="stat-detail">Immediate hazard or failure</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-status">Status</label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses ({maintenanceIssues.length})</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-priority">Priority</label>
              <select
                id="filter-priority"
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-asset">Asset</label>
              <select
                id="filter-asset"
                value={filterAsset}
                onChange={e => setFilterAsset(e.target.value)}
              >
                <option value="all">All Assets</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-category">Category</label>
              <select
                id="filter-category"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="siltation">Siltation / Sediment</option>
                <option value="blockage">Inlet / Gutter Blockage</option>
                <option value="leakage">Leakage / Seepage</option>
                <option value="structural">Structural Breach</option>
                <option value="vegetation">Vegetation / Weed Infestation</option>
                <option value="damaged_component">Damaged Component</option>
                <option value="inspection_overdue">Inspection Overdue</option>
                <option value="sensor_failure">Sensor / Gauge Failure</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Maintenance Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Issues &amp; Inspection Records ({filteredIssues.length})</h2>
          </div>

          {filteredIssues.length === 0 ? (
            <div className="empty-state">
              <p>No maintenance issues match the selected filters.</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleOpenCreate}>
                Log an Issue
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date Reported</th>
                    <th>Related Asset</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Description &amp; Action Taken</th>
                    <th>Assigned Owner</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIssues.map(issue => {
                    const relatedAsset = assets.find(a => a.id === issue.assetId);
                    return (
                      <tr key={issue.id}>
                        <td>
                          {issue.dateReported}
                          {issue.isSimulated && (
                            <span className="badge badge--simulated" style={{ marginLeft: '4px' }}>Sim</span>
                          )}
                        </td>
                        <td>
                          <strong>{relatedAsset?.name || issue.assetId}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {relatedAsset?.block || ''}
                          </div>
                        </td>
                        <td>{issue.category.replace('_', ' ')}</td>
                        <td>
                          <span className={`badge badge--${issue.priority}`}>{issue.priority}</span>
                        </td>
                        <td>
                          <span className={`badge badge--${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                        </td>
                        <td style={{ maxWidth: '320px' }}>
                          <div>{issue.description}</div>
                          {issue.actionTaken && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '0.25rem' }}>
                              <strong>Action:</strong> {issue.actionTaken}
                              {issue.resolutionDate && ` (${issue.resolutionDate})`}
                            </div>
                          )}
                        </td>
                        <td>{issue.assignedTo || 'Unassigned'}</td>
                        <td>
                          <div className="btn-group">
                            {issue.status !== 'resolved' && (
                              <button
                                type="button"
                                className="btn btn-success btn-sm"
                                onClick={() => handleQuickResolve(issue)}
                              >
                                Mark Resolved
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenEdit(issue)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setDeleteTargetId(issue.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: '580px' }}>
            <h2>{editingIssueId ? 'Edit Maintenance Record' : 'Log Maintenance or Inspection Issue'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="issue-asset">Related Asset *</label>
                <select
                  id="issue-asset"
                  required
                  value={formData.assetId}
                  onChange={e => setFormData({ ...formData, assetId: e.target.value })}
                >
                  <option value="">Select an asset...</option>
                  {assets.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.type.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="issue-date">Date Reported</label>
                  <input
                    id="issue-date"
                    type="date"
                    required
                    value={formData.dateReported}
                    onChange={e => setFormData({ ...formData, dateReported: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="issue-cat">Issue Category</label>
                  <select
                    id="issue-cat"
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value as IssueCategory })}
                  >
                    <option value="blockage">Inlet / Pipe Blockage</option>
                    <option value="siltation">Siltation / Sedimentation</option>
                    <option value="damaged_component">Damaged Component / Filter</option>
                    <option value="leakage">Leakage / Seepage</option>
                    <option value="structural">Bund / Wall Structural Issue</option>
                    <option value="vegetation">Vegetation / Weed Infestation</option>
                    <option value="sensor_failure">Sensor Malfunction / Battery</option>
                    <option value="inspection_overdue">Scheduled Inspection Overdue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="issue-priority">Priority</label>
                  <select
                    id="issue-priority"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as IssuePriority })}
                  >
                    <option value="low">Low (Routine observation)</option>
                    <option value="medium">Medium (Requires attention soon)</option>
                    <option value="high">High (Capacity significantly compromised)</option>
                    <option value="critical">Critical (Immediate breach or hazard)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="issue-status">Status</label>
                  <select
                    id="issue-status"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as IssueStatus })}
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="issue-desc">Description *</label>
                <textarea
                  id="issue-desc"
                  required
                  placeholder="Describe the issue, location on the structure, and observed symptoms..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="issue-owner">Assigned Person / Committee</label>
                  <input
                    id="issue-owner"
                    type="text"
                    placeholder="e.g. Gram Panchayat Pradhan, Caretaker"
                    value={formData.assignedTo}
                    onChange={e => setFormData({ ...formData, assignedTo: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="issue-res-date">Resolution Date (if resolved)</label>
                  <input
                    id="issue-res-date"
                    type="date"
                    value={formData.resolutionDate}
                    onChange={e => setFormData({ ...formData, resolutionDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="issue-action">Action Taken / Resolution Notes</label>
                <textarea
                  id="issue-action"
                  placeholder="Record what repair or desilting was performed..."
                  value={formData.actionTaken}
                  onChange={e => setFormData({ ...formData, actionTaken: e.target.value })}
                />
              </div>

              <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingIssueId ? 'Update Record' : 'Log Issue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Confirm Issue Deletion"
        message="Are you sure you want to delete this maintenance record?"
        onConfirm={() => {
          if (deleteTargetId) {
            onDeleteIssue(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
