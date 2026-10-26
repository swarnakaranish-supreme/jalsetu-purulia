import React, { useState } from 'react';
import type { Asset, AssetType, AssetCondition, MaintenanceStatus } from '../types';
import { generateId, exportAssetsToCSV } from '../lib/storage';
import { ConfirmModal } from '../components/ConfirmModal';
import { NoticeBanner } from '../components/NoticeBanner';

interface AssetRegisterPageProps {
  assets: Asset[];
  onSaveAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  isSimulated: boolean;
}

const EMPTY_ASSET: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  type: 'rooftop_rwh',
  block: '',
  village: '',
  latitude: null,
  longitude: null,
  installationDate: '',
  condition: 'good',
  responsibleOrg: '',
  maintenanceStatus: 'none_required',
  storageCapacityLitres: null,
  catchmentAreaSqm: null,
  tankLengthM: null,
  tankWidthM: null,
  tankDepthM: null,
  notes: '',
  dataSource: 'Not verified / demonstration entry',
  isSimulated: false,
};

export const AssetRegisterPage: React.FC<AssetRegisterPageProps> = ({
  assets,
  onSaveAsset,
  onDeleteAsset,
  isSimulated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_ASSET);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<Asset | null>(null);

  // Filtered Assets
  const filteredAssets = assets.filter(a => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.block.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = filterType === 'all' || a.type === filterType;
    const matchesCondition = filterCondition === 'all' || a.condition === filterCondition;

    return matchesSearch && matchesType && matchesCondition;
  });

  const handleOpenCreate = () => {
    setFormData(EMPTY_ASSET);
    setEditingAssetId(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setFormData({
      name: asset.name,
      type: asset.type,
      block: asset.block,
      village: asset.village,
      latitude: asset.latitude,
      longitude: asset.longitude,
      installationDate: asset.installationDate,
      condition: asset.condition,
      responsibleOrg: asset.responsibleOrg,
      maintenanceStatus: asset.maintenanceStatus,
      storageCapacityLitres: asset.storageCapacityLitres,
      catchmentAreaSqm: asset.catchmentAreaSqm,
      tankLengthM: asset.tankLengthM,
      tankWidthM: asset.tankWidthM,
      tankDepthM: asset.tankDepthM,
      notes: asset.notes,
      dataSource: asset.dataSource,
      isSimulated: asset.isSimulated,
    });
    setEditingAssetId(asset.id);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Asset name is required.');
      return;
    }

    const assetToSave: Asset = {
      ...formData,
      id: editingAssetId || `asset-${generateId().substring(0, 8)}`,
      createdAt: editingAssetId
        ? assets.find(a => a.id === editingAssetId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveAsset(assetToSave);
    setIsModalOpen(false);
  };

  const handleDownloadCSV = () => {
    const csvContent = exportAssetsToCSV();
    if (!csvContent) {
      alert('No asset records to export.');
      return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jalsetu_purulia_assets_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const jsonContent = JSON.stringify(assets, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jalsetu_purulia_assets_${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Water Conservation Asset Register</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Local registry of existing rainwater structures, ponds, check dams, and storage tanks.
          </p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadCSV}>
            Export CSV
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleDownloadJSON}>
            Export JSON
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            + Register New Asset
          </button>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Local Storage Clarification Banner */}
        <div style={{ background: '#e8f4f8', border: '1px solid #b8dae6', padding: '0.65rem 1rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', color: '#1a5276', marginBottom: '1.25rem' }}>
          <strong>Local Storage Architecture: </strong>
          All records shown below are saved directly into your current web browser's local storage (`localStorage`).
          They do not require internet access or an account, but are private to this machine and browser instance.
        </div>

        {/* Search & Filters */}
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="search-input">Search Assets</label>
              <input
                id="search-input"
                type="text"
                placeholder="Search by name, block, village, or ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-type">Filter by Asset Type</label>
              <select
                id="filter-type"
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="rooftop_rwh">Rooftop RWH</option>
                <option value="pond">Pond / Tank</option>
                <option value="farm_pond">Farm Pond</option>
                <option value="check_dam">Check Dam</option>
                <option value="percolation_tank">Percolation Tank</option>
                <option value="recharge_shaft">Recharge Shaft</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="filter-condition">Filter by Condition</label>
              <select
                id="filter-condition"
                value={filterCondition}
                onChange={e => setFilterCondition(e.target.value)}
              >
                <option value="all">All Conditions</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
                <option value="non_functional">Non-functional</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assets Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Registered Assets ({filteredAssets.length})</h2>
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Showing {filteredAssets.length} of {assets.length} total
            </span>
          </div>

          {filteredAssets.length === 0 ? (
            <div className="empty-state">
              <p>No matching asset records found.</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleOpenCreate}>
                Register First Asset
              </button>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset ID / Name</th>
                    <th>Type</th>
                    <th>Location (Block / Village)</th>
                    <th>Condition</th>
                    <th>Maintenance</th>
                    <th>Capacity / Dims</th>
                    <th>Responsible Person / Org</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => (
                    <tr key={asset.id}>
                      <td>
                        <strong>{asset.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          ID: {asset.id}
                        </div>
                        {asset.isSimulated && (
                          <span className="badge badge--simulated" style={{ marginTop: '3px' }}>Simulated</span>
                        )}
                      </td>
                      <td>{asset.type.replace('_', ' ')}</td>
                      <td>
                        {asset.block || '—'}{asset.village ? `, ${asset.village}` : ''}
                        {asset.latitude !== null && asset.longitude !== null && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {asset.latitude.toFixed(4)}, {asset.longitude.toFixed(4)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge badge--${asset.condition}`}>
                          {asset.condition}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${asset.maintenanceStatus}`}>
                          {asset.maintenanceStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        {asset.storageCapacityLitres
                          ? `${asset.storageCapacityLitres.toLocaleString()} L`
                          : asset.tankLengthM && asset.tankWidthM && asset.tankDepthM
                          ? `${asset.tankLengthM}m × ${asset.tankWidthM}m × ${asset.tankDepthM}m`
                          : '—'}
                      </td>
                      <td>{asset.responsibleOrg || '—'}</td>
                      <td>
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedAssetDetail(asset)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEdit(asset)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteTargetId(asset.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAssetDetail && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: '580px' }}>
            <h2>Asset Details: {selectedAssetDetail.name}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', lineHeight: 1.6 }}>
              <p><strong>Asset ID:</strong> {selectedAssetDetail.id}</p>
              <p><strong>Type:</strong> {selectedAssetDetail.type.replace('_', ' ')}</p>
              <p><strong>Location:</strong> {selectedAssetDetail.block || 'Unspecified'}, {selectedAssetDetail.village || ''}</p>
              <p><strong>Coordinates:</strong> {selectedAssetDetail.latitude ?? '—'}, {selectedAssetDetail.longitude ?? '—'}</p>
              <p><strong>Condition:</strong> {selectedAssetDetail.condition}</p>
              <p><strong>Maintenance Status:</strong> {selectedAssetDetail.maintenanceStatus}</p>
              <p><strong>Storage Capacity:</strong> {selectedAssetDetail.storageCapacityLitres ? `${selectedAssetDetail.storageCapacityLitres} Litres` : 'Not calibrated'}</p>
              {selectedAssetDetail.tankLengthM && selectedAssetDetail.tankWidthM && (
                <p><strong>Tank Dimensions (L × W × D):</strong> {selectedAssetDetail.tankLengthM}m × {selectedAssetDetail.tankWidthM}m × {selectedAssetDetail.tankDepthM ?? '?'}m</p>
              )}
              <p><strong>Responsible Entity:</strong> {selectedAssetDetail.responsibleOrg || 'None recorded'}</p>
              <p><strong>Installation Date:</strong> {selectedAssetDetail.installationDate || 'Unknown'}</p>
              <p><strong>Data Source:</strong> {selectedAssetDetail.dataSource}</p>
              <p><strong>Notes:</strong> {selectedAssetDetail.notes || 'No notes'}</p>
            </div>
            <div className="btn-group" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedAssetDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editingAssetId ? 'Edit Water Asset' : 'Register New Water Asset'}</h2>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label htmlFor="modal-asset-name">Asset Name *</label>
                <input
                  id="modal-asset-name"
                  type="text"
                  required
                  placeholder="e.g. Village Primary School Tank, North Nala Check Dam"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-asset-type">Asset Type</label>
                  <select
                    id="modal-asset-type"
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as AssetType })}
                  >
                    <option value="rooftop_rwh">Rooftop RWH</option>
                    <option value="pond">Pond / Tank</option>
                    <option value="farm_pond">Farm Pond</option>
                    <option value="check_dam">Check Dam</option>
                    <option value="percolation_tank">Percolation Tank</option>
                    <option value="recharge_shaft">Recharge Shaft</option>
                    <option value="channel">Drainage Channel</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="modal-condition">Condition</label>
                  <select
                    id="modal-condition"
                    value={formData.condition}
                    onChange={e => setFormData({ ...formData, condition: e.target.value as AssetCondition })}
                  >
                    <option value="good">Good</option>
                    <option value="fair">Fair (Desilting/repair needed)</option>
                    <option value="poor">Poor (Breached/heavily silted)</option>
                    <option value="non_functional">Non-functional</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-block">Block</label>
                  <input
                    id="modal-block"
                    type="text"
                    placeholder="e.g. Purulia-I, Balarampur, Kashipur"
                    value={formData.block}
                    onChange={e => setFormData({ ...formData, block: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-village">Village / Locality</label>
                  <input
                    id="modal-village"
                    type="text"
                    value={formData.village}
                    onChange={e => setFormData({ ...formData, village: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-lat">Latitude</label>
                  <input
                    id="modal-lat"
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 23.3320"
                    value={formData.latitude ?? ''}
                    onChange={e =>
                      setFormData({ ...formData, latitude: e.target.value === '' ? null : parseFloat(e.target.value) })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-lon">Longitude</label>
                  <input
                    id="modal-lon"
                    type="number"
                    step="0.0001"
                    placeholder="e.g. 86.3650"
                    value={formData.longitude ?? ''}
                    onChange={e =>
                      setFormData({ ...formData, longitude: e.target.value === '' ? null : parseFloat(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-capacity">Storage Capacity (Litres, if known)</label>
                  <input
                    id="modal-capacity"
                    type="number"
                    min="0"
                    placeholder="e.g. 10000"
                    value={formData.storageCapacityLitres ?? ''}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        storageCapacityLitres: e.target.value === '' ? null : parseFloat(e.target.value),
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-maint-status">Maintenance Status</label>
                  <select
                    id="modal-maint-status"
                    value={formData.maintenanceStatus}
                    onChange={e =>
                      setFormData({ ...formData, maintenanceStatus: e.target.value as MaintenanceStatus })
                    }
                  >
                    <option value="none_required">None Required</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="overdue">Overdue</option>
                    <option value="in_progress">In Progress</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '0.75rem', background: 'var(--color-sand)', borderRadius: 'var(--radius)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                  Tank Internal Dimensions (For vertical-sided rectangular tanks only)
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="tank-len" style={{ fontSize: '0.75rem' }}>Length (m)</label>
                    <input
                      id="tank-len"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.tankLengthM ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          tankLengthM: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="tank-wid" style={{ fontSize: '0.75rem' }}>Width (m)</label>
                    <input
                      id="tank-wid"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.tankWidthM ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          tankWidthM: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label htmlFor="tank-dep" style={{ fontSize: '0.75rem' }}>Max Depth (m)</label>
                    <input
                      id="tank-dep"
                      type="number"
                      step="0.1"
                      min="0"
                      value={formData.tankDepthM ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          tankDepthM: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-resp-org">Responsible Organisation / Caretaker</label>
                  <input
                    id="modal-resp-org"
                    type="text"
                    placeholder="e.g. Gram Panchayat, School Committee, WUA"
                    value={formData.responsibleOrg}
                    onChange={e => setFormData({ ...formData, responsibleOrg: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="modal-inst-date">Installation / Construction Date</label>
                  <input
                    id="modal-inst-date"
                    type="date"
                    value={formData.installationDate}
                    onChange={e => setFormData({ ...formData, installationDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="modal-source-cat">Data Source / Verification Standard</label>
                  <select
                    id="modal-source-cat"
                    value={
                      formData.dataSource.startsWith('Field visit') ? 'Field visit assessment' :
                      formData.dataSource.startsWith('Not verified') ? 'Not verified / demonstration entry' :
                      formData.dataSource.startsWith('Gram Panchayat') ? 'Gram Panchayat records' :
                      formData.dataSource.startsWith('Public GIS') ? 'Public GIS / Bhuvan portal' :
                      formData.dataSource.startsWith('Community') ? 'Community consultation' :
                      'Other / Custom'
                    }
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'Other / Custom') {
                        setFormData({ ...formData, dataSource: 'Custom source entry' });
                      } else {
                        setFormData({ ...formData, dataSource: val });
                      }
                    }}
                  >
                    <option value="Not verified / demonstration entry">Not verified / demonstration entry</option>
                    <option value="Field visit assessment">Field visit assessment</option>
                    <option value="Gram Panchayat records">Gram Panchayat records</option>
                    <option value="Public GIS / Bhuvan portal">Public GIS / Bhuvan portal</option>
                    <option value="Community consultation">Community consultation</option>
                    <option value="Other / Custom">Other / Custom</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="modal-source-val">Source Specification / Field Notes</label>
                  <input
                    id="modal-source-val"
                    type="text"
                    placeholder="e.g. Demonstration record, or GP survey ref 2026-Q1"
                    value={formData.dataSource}
                    onChange={e => setFormData({ ...formData, dataSource: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="modal-notes">Condition Notes &amp; Observations</label>
                <textarea
                  id="modal-notes"
                  placeholder="e.g. Silt depth 0.4m, masonry wall intact, requires filter replacement"
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="btn-group" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAssetId ? 'Update Asset' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteTargetId !== null}
        title="Confirm Asset Deletion"
        message="Are you sure you want to delete this water conservation asset? This action will permanently remove it from your local browser database."
        onConfirm={() => {
          if (deleteTargetId) {
            onDeleteAsset(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
