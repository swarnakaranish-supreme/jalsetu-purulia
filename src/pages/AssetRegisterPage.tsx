import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { Asset, AssetType, AssetCondition, MaintenanceStatus } from '../types';
import { generateId, exportAssetsToCSV } from '../lib/storage';
import { validateCoordinates } from '../lib/calculations';
import { ConfirmModal } from '../components/ConfirmModal';
import { NoticeBanner } from '../components/NoticeBanner';

interface AssetRegisterPageProps {
  assets: Asset[];
  onSaveAsset: (asset: Asset) => void;
  onDeleteAsset: (id: string) => void;
  isSimulated: boolean;
}

const PURULIA_BLOCKS = [
  'Arsha',
  'Baghmundi',
  'Balarampur',
  'Barabazar',
  'Bundwan',
  'Hura',
  'Jaipur',
  'Jhalda-I',
  'Jhalda-II',
  'Kashipur',
  'Manbazar-I',
  'Manbazar-II',
  'Neturia',
  'Para',
  'Puncha',
  'Purulia-I',
  'Purulia-II',
  'Raghunathpur-I',
  'Raghunathpur-II',
  'Santuri',
];

const EMPTY_ASSET: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  type: 'rooftop_rwh',
  block: 'Purulia-I',
  village: '',
  latitude: null,
  longitude: null,
  installationDate: '',
  commissioningAuthority: '',
  lastInspectionDate: '',
  nextInspectionDate: '',
  evidenceSource: 'Field GPS survey and physical inspection',
  condition: 'good',
  responsibleOrg: '',
  maintenanceStatus: 'none_required',
  storageCapacityLitres: null,
  catchmentAreaSqm: null,
  tankLengthM: null,
  tankWidthM: null,
  tankDepthM: null,
  notes: '',
  dataSource: 'Field visit register',
  isSimulated: false,
};

export const AssetRegisterPage: React.FC<AssetRegisterPageProps> = ({
  assets,
  onSaveAsset,
  onDeleteAsset,
  isSimulated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBlock, setFilterBlock] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [filterInspection, setFilterInspection] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_ASSET);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [selectedAssetDetail, setSelectedAssetDetail] = useState<Asset | null>(null);

  const todayStr = new Date().toISOString().substring(0, 10);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.block.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBlock = filterBlock === 'all' || a.block.toLowerCase() === filterBlock.toLowerCase();
      const matchesType = filterType === 'all' || a.type === filterType;
      const matchesCondition = filterCondition === 'all' || a.condition === filterCondition;

      let matchesInspection = true;
      if (filterInspection === 'overdue') {
        matchesInspection =
          a.maintenanceStatus === 'overdue' ||
          (!!a.nextInspectionDate && a.nextInspectionDate < todayStr);
      } else if (filterInspection === 'scheduled') {
        matchesInspection =
          a.maintenanceStatus === 'scheduled' ||
          (!!a.nextInspectionDate && a.nextInspectionDate >= todayStr);
      }

      return matchesSearch && matchesBlock && matchesType && matchesCondition && matchesInspection;
    });
  }, [assets, searchQuery, filterBlock, filterType, filterCondition, filterInspection, todayStr]);

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
      commissioningAuthority: asset.commissioningAuthority || '',
      lastInspectionDate: asset.lastInspectionDate || '',
      nextInspectionDate: asset.nextInspectionDate || '',
      evidenceSource: asset.evidenceSource || 'Field GPS survey and physical inspection',
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
      id: editingAssetId || generateId(),
      createdAt: editingAssetId
        ? assets.find(a => a.id === editingAssetId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveAsset(assetToSave);
    setIsModalOpen(false);
  };

  const handleExportCSV = () => {
    const csv = exportAssetsToCSV();
    if (!csv) {
      alert('No assets to export.');
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jalsetu_asset_register_${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Form coordinate check
  const coordCheck = validateCoordinates(formData.latitude, formData.longitude);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Water Asset Register</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Comprehensive registry of water harvesting, storage, and conservation structures across Purulia District.
          </p>
        </div>
        <div className="btn-group">
          <button type="button" className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            + Register New Asset
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            Export CSV
          </button>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Filter Controls Bar */}
        <div
          className="card"
          style={{
            marginBottom: '1.25rem',
            padding: '1rem',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          {/* Search */}
          <div style={{ flex: '1 1 200px' }}>
            <input
              type="text"
              placeholder="Search by name, block, village, or ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', fontSize: '0.8125rem' }}
            />
          </div>

          {/* Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="filter-asset-block" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Block:
            </label>
            <select
              id="filter-asset-block"
              value={filterBlock}
              onChange={e => setFilterBlock(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '3px 8px', borderRadius: 'var(--radius)' }}
            >
              <option value="all">All Blocks</option>
              {PURULIA_BLOCKS.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="filter-asset-type" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Type:
            </label>
            <select
              id="filter-asset-type"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '3px 8px', borderRadius: 'var(--radius)' }}
            >
              <option value="all">All Types</option>
              <option value="rooftop_rwh">Rooftop RWH</option>
              <option value="pond">Pond / Traditional Bandh</option>
              <option value="farm_pond">Farm Pond (Hapa)</option>
              <option value="check_dam">Check Dam</option>
              <option value="percolation_tank">Percolation Tank</option>
              <option value="contour_trench">Contour Trench</option>
            </select>
          </div>

          {/* Condition */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="filter-asset-cond" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Condition:
            </label>
            <select
              id="filter-asset-cond"
              value={filterCondition}
              onChange={e => setFilterCondition(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '3px 8px', borderRadius: 'var(--radius)' }}
            >
              <option value="all">All Conditions</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="non_functional">Non-functional</option>
            </select>
          </div>

          {/* Inspection Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <label htmlFor="filter-asset-insp" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Inspection:
            </label>
            <select
              id="filter-asset-insp"
              value={filterInspection}
              onChange={e => setFilterInspection(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '3px 8px', borderRadius: 'var(--radius)' }}
            >
              <option value="all">All Inspection Statuses</option>
              <option value="overdue">Overdue for Inspection</option>
              <option value="scheduled">Scheduled / Up to date</option>
            </select>
          </div>

          <div style={{ marginLeft: 'auto', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Showing {filteredAssets.length} of {assets.length} assets
          </div>
        </div>

        {/* Asset Table */}
        <div className="card">
          {filteredAssets.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Capacity / Dimensions</th>
                    <th>Condition</th>
                    <th>Inspection &amp; Maintenance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map(asset => {
                    const isOverdue =
                      asset.maintenanceStatus === 'overdue' ||
                      (asset.nextInspectionDate && asset.nextInspectionDate < todayStr);

                    return (
                      <tr key={asset.id}>
                        <td>
                          <strong>{asset.name}</strong>
                          {asset.isSimulated && (
                            <span style={{ marginLeft: '6px', fontSize: '10px', background: '#fcf3cf', color: '#7d6608', padding: '1px 4px', borderRadius: '3px' }}>
                              SIMULATED
                            </span>
                          )}
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>ID: {asset.id}</div>
                        </td>
                        <td>{asset.type.replace('_', ' ')}</td>
                        <td>
                          {asset.block}
                          {asset.village ? `, ${asset.village}` : ''}
                          {asset.latitude !== null && (
                            <div style={{ fontSize: '0.725rem', color: '#888' }}>
                              {asset.latitude.toFixed(3)}°N, {asset.longitude?.toFixed(3)}°E
                            </div>
                          )}
                        </td>
                        <td>
                          {asset.storageCapacityLitres ? `${asset.storageCapacityLitres.toLocaleString()} L` : '—'}
                          {asset.catchmentAreaSqm && (
                            <div style={{ fontSize: '0.725rem', color: '#666' }}>
                              Catchment: {asset.catchmentAreaSqm} m²
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`badge badge--${asset.condition}`}>
                            {asset.condition}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge--${isOverdue ? 'overdue' : asset.maintenanceStatus}`}>
                            {isOverdue ? 'Inspection Overdue' : asset.maintenanceStatus.replace('_', ' ')}
                          </span>
                          {asset.nextInspectionDate && (
                            <div style={{ fontSize: '0.725rem', color: isOverdue ? '#c0392b' : '#666', marginTop: '2px' }}>
                              Next: {asset.nextInspectionDate}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => setSelectedAssetDetail(asset)}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-secondary"
                              onClick={() => handleOpenEdit(asset)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ color: '#c0392b' }}
                              onClick={() => setDeleteTargetId(asset.id)}
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
          ) : (
            <div className="empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p>No water assets match the selected filters or search query.</p>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ marginTop: '0.75rem' }}
                onClick={handleOpenCreate}
              >
                Register First Asset
              </button>
            </div>
          )}
        </div>

        {/* Modal: Create or Edit Asset */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: '740px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--color-primary-dark)' }}>
                  {editingAssetId ? 'Edit Water Asset Record' : 'Register New Water Asset'}
                </h2>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleFormSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Name */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label htmlFor="asset-name">Asset Name *</label>
                    <input
                      id="asset-name"
                      type="text"
                      required
                      placeholder="e.g. Lagda High School Rooftop RWH, Sirkabad Community Bandh"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  {/* Type */}
                  <div className="form-group">
                    <label htmlFor="asset-type">Asset Type *</label>
                    <select
                      id="asset-type"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value as AssetType })}
                    >
                      <option value="rooftop_rwh">Rooftop Rainwater Harvesting</option>
                      <option value="pond">Pond / Traditional Bandh</option>
                      <option value="farm_pond">Farm Pond (Hapa)</option>
                      <option value="check_dam">Check Dam / Nala Bund</option>
                      <option value="percolation_tank">Percolation Tank</option>
                      <option value="recharge_shaft">Recharge Shaft / Injection Well</option>
                      <option value="contour_trench">Contour Trench / Gully Check</option>
                      <option value="other">Other Water Structure</option>
                    </select>
                  </div>

                  {/* Block */}
                  <div className="form-group">
                    <label htmlFor="asset-block">Block *</label>
                    <select
                      id="asset-block"
                      value={formData.block}
                      onChange={e => setFormData({ ...formData, block: e.target.value })}
                    >
                      {PURULIA_BLOCKS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Village */}
                  <div className="form-group">
                    <label htmlFor="asset-village">Village / Hamlet</label>
                    <input
                      id="asset-village"
                      type="text"
                      placeholder="e.g. Lagda, Sirkabad"
                      value={formData.village}
                      onChange={e => setFormData({ ...formData, village: e.target.value })}
                    />
                  </div>

                  {/* Commissioning Authority */}
                  <div className="form-group">
                    <label htmlFor="asset-comm">Commissioning Authority / Scheme</label>
                    <input
                      id="asset-comm"
                      type="text"
                      placeholder="e.g. MGNREGS, Jal Dharo-Jal Bharo, Untied Fund"
                      value={formData.commissioningAuthority || ''}
                      onChange={e => setFormData({ ...formData, commissioningAuthority: e.target.value })}
                    />
                  </div>

                  {/* Coordinates */}
                  <div className="form-group">
                    <label htmlFor="asset-lat">Latitude (°N)</label>
                    <input
                      id="asset-lat"
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 23.3320"
                      value={formData.latitude ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          latitude: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset-lon">Longitude (°E)</label>
                    <input
                      id="asset-lon"
                      type="number"
                      step="0.0001"
                      placeholder="e.g. 86.3650"
                      value={formData.longitude ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          longitude: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                {/* Coordinate feedback */}
                {formData.latitude !== null && formData.longitude !== null && (
                  <div
                    style={{
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      marginBottom: '1rem',
                      background: coordCheck.inPuruliaDistrict ? '#eafaf1' : '#fef9e7',
                      color: coordCheck.inPuruliaDistrict ? '#145a32' : '#7d6608',
                      border: '1px solid currentColor',
                    }}
                  >
                    📍 {coordCheck.message}
                  </div>
                )}

                {/* Dimensions & Capacity */}
                <h3 style={{ fontSize: '0.95rem', marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  Capacity &amp; Physical Dimensions
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="asset-cap">Capacity (Litres)</label>
                    <input
                      id="asset-cap"
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
                    <label htmlFor="asset-catchment">Catchment Area (m²)</label>
                    <input
                      id="asset-catchment"
                      type="number"
                      min="0"
                      placeholder="e.g. 200"
                      value={formData.catchmentAreaSqm ?? ''}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          catchmentAreaSqm: e.target.value === '' ? null : parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset-depth">Max Depth (metres)</label>
                    <input
                      id="asset-depth"
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="e.g. 2.5"
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

                {/* Condition & Maintenance Status */}
                <h3 style={{ fontSize: '0.95rem', marginTop: '1rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
                  Condition, Inspection &amp; Governance
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="asset-condition">Physical Condition *</label>
                    <select
                      id="asset-condition"
                      value={formData.condition}
                      onChange={e => setFormData({ ...formData, condition: e.target.value as AssetCondition })}
                    >
                      <option value="good">Good (Fully functional)</option>
                      <option value="fair">Fair (Minor upkeep needed)</option>
                      <option value="poor">Poor (Requires desiltation or repair)</option>
                      <option value="non_functional">Non-functional / Abandoned</option>
                      <option value="unknown">Unknown / Unassessed</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset-maint-status">Maintenance Status *</label>
                    <select
                      id="asset-maint-status"
                      value={formData.maintenanceStatus}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          maintenanceStatus: e.target.value as MaintenanceStatus,
                        })
                      }
                    >
                      <option value="none_required">None Required</option>
                      <option value="scheduled">Scheduled for Maintenance</option>
                      <option value="overdue">Overdue / Backlog</option>
                      <option value="in_progress">Work In Progress</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset-last-insp">Last Inspection Date</label>
                    <input
                      id="asset-last-insp"
                      type="date"
                      value={formData.lastInspectionDate || ''}
                      onChange={e => setFormData({ ...formData, lastInspectionDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset-next-insp">Next Inspection Date</label>
                    <input
                      id="asset-next-insp"
                      type="date"
                      value={formData.nextInspectionDate || ''}
                      onChange={e => setFormData({ ...formData, nextInspectionDate: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset-org">Responsible Organisation / Caretaker</label>
                    <input
                      id="asset-org"
                      type="text"
                      placeholder="e.g. Gram Panchayat, School Committee, WUA"
                      value={formData.responsibleOrg}
                      onChange={e => setFormData({ ...formData, responsibleOrg: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="asset-evidence">Evidence Source</label>
                    <input
                      id="asset-evidence"
                      type="text"
                      placeholder="e.g. Field GPS survey, Panchayat asset register"
                      value={formData.evidenceSource || ''}
                      onChange={e => setFormData({ ...formData, evidenceSource: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label htmlFor="asset-notes">Field Notes &amp; Observations</label>
                  <textarea
                    id="asset-notes"
                    rows={2}
                    placeholder="e.g. Rooftop downpipes in good shape; first-flush diverter cleaned in June."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                  <button type="submit" className="btn btn-primary">
                    {editingAssetId ? 'Update Asset' : 'Save Asset to Register'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: View Asset Detail Card */}
        {selectedAssetDetail && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem',
            }}
            onClick={() => setSelectedAssetDetail(null)}
          >
            <div
              className="card"
              style={{
                maxWidth: '650px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.5rem',
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary-dark)' }}>
                    {selectedAssetDetail.name}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                    {selectedAssetDetail.type.replace('_', ' ')} &bull; {selectedAssetDetail.block}, {selectedAssetDetail.village || 'Purulia'}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => setSelectedAssetDetail(null)}
                >
                  ✕ Close
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1rem' }}>
                <div><strong>Condition:</strong> <span className={`badge badge--${selectedAssetDetail.condition}`}>{selectedAssetDetail.condition}</span></div>
                <div><strong>Maintenance:</strong> <span className={`badge badge--${selectedAssetDetail.maintenanceStatus}`}>{selectedAssetDetail.maintenanceStatus.replace('_', ' ')}</span></div>
                <div><strong>Capacity:</strong> {selectedAssetDetail.storageCapacityLitres ? `${selectedAssetDetail.storageCapacityLitres.toLocaleString()} L` : 'Unspecified'}</div>
                <div><strong>Catchment:</strong> {selectedAssetDetail.catchmentAreaSqm ? `${selectedAssetDetail.catchmentAreaSqm} m²` : 'Unspecified'}</div>
                <div><strong>Last Inspected:</strong> {selectedAssetDetail.lastInspectionDate || 'Not recorded'}</div>
                <div><strong>Next Inspection:</strong> {selectedAssetDetail.nextInspectionDate || 'Not scheduled'}</div>
                <div><strong>Responsible Org:</strong> {selectedAssetDetail.responsibleOrg || 'Not specified'}</div>
                <div><strong>Scheme / Authority:</strong> {selectedAssetDetail.commissioningAuthority || 'Not specified'}</div>
                <div><strong>Coordinates:</strong> {selectedAssetDetail.latitude !== null ? `${selectedAssetDetail.latitude.toFixed(4)}°N, ${selectedAssetDetail.longitude?.toFixed(4)}°E` : 'Unmapped'}</div>
                <div><strong>Evidence Source:</strong> {selectedAssetDetail.evidenceSource || selectedAssetDetail.dataSource}</div>
              </div>

              {selectedAssetDetail.notes && (
                <div style={{ background: 'var(--color-sand)', padding: '0.75rem', borderRadius: 'var(--radius)', fontSize: '0.8125rem', marginBottom: '1rem' }}>
                  <strong>Field Notes:</strong>
                  <p style={{ marginTop: '0.25rem' }}>{selectedAssetDetail.notes}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                <Link to="/maintenance" className="btn btn-secondary btn-sm">
                  View Maintenance Issues &rarr;
                </Link>
                <Link to="/monitoring" className="btn btn-secondary btn-sm">
                  View Water Levels &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteTargetId !== null}
          title="Delete Registered Asset"
          message="Are you sure you want to permanently delete this water asset record? This will also affect linked observations and maintenance records."
          confirmLabel="Delete Asset"
          onConfirm={() => {
            if (deleteTargetId) {
              onDeleteAsset(deleteTargetId);
              setDeleteTargetId(null);
            }
          }}
          onCancel={() => setDeleteTargetId(null)}
        />
      </div>
    </div>
  );
};
