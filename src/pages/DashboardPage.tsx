import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AppData } from '../types';
import { NoticeBanner } from '../components/NoticeBanner';
import { AssetMap } from '../components/AssetMap';
import { screenSite } from '../lib/screening';

interface DashboardPageProps {
  data: AppData;
  isSimulated: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ data, isSimulated }) => {
  const navigate = useNavigate();
  const { assets, siteAssessments, observations, maintenanceIssues } = data;

  // Filter States
  const [selectedBlock, setSelectedBlock] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');

  const handlePlanSiteFromMap = (lat: number, lng: number) => {
    navigate(`/sites?lat=${lat}&lng=${lng}&action=new`);
  };

  // Extract unique blocks
  const allBlocks = useMemo(() => {
    const blockSet = new Set<string>();
    assets.forEach(a => { if (a.block) blockSet.add(a.block); });
    siteAssessments.forEach(s => { if (s.block) blockSet.add(s.block); });
    return Array.from(blockSet).sort();
  }, [assets, siteAssessments]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchBlock = selectedBlock === 'all' || a.block.toLowerCase() === selectedBlock.toLowerCase();
      const matchType = selectedType === 'all' || a.type === selectedType;
      const matchCondition = selectedCondition === 'all' || a.condition === selectedCondition;
      return matchBlock && matchType && matchCondition;
    });
  }, [assets, selectedBlock, selectedType, selectedCondition]);

  // Filtered Sites
  const filteredSites = useMemo(() => {
    return siteAssessments.filter(s => {
      const matchBlock = selectedBlock === 'all' || s.block.toLowerCase() === selectedBlock.toLowerCase();
      const matchType = selectedType === 'all' || s.siteType === selectedType;
      return matchBlock && matchType;
    });
  }, [siteAssessments, selectedBlock, selectedType]);

  // Screen all candidate sites
  const siteScreeningSummary = useMemo(() => {
    let favourable = 0;
    let moderate = 0;
    let severe = 0;
    let insufficient = 0;

    filteredSites.forEach(s => {
      const res = screenSite(s);
      if (res.isInsufficient) {
        insufficient++;
      } else if (res.status === 'favourable') {
        favourable++;
      } else if (res.status === 'moderate_constraints') {
        moderate++;
      } else {
        severe++;
      }
    });

    return { favourable, moderate, severe, insufficient, total: filteredSites.length };
  }, [filteredSites]);

  // Real-time calculations from the current dataset
  const totalAssets = filteredAssets.length;
  const goodAssets = filteredAssets.filter(a => a.condition === 'good').length;
  const overdueOrPoor = filteredAssets.filter(
    a => a.maintenanceStatus === 'overdue' || a.condition === 'poor'
  ).length;

  const openMaintenanceIssues = useMemo(() => {
    return maintenanceIssues.filter(m => {
      if (selectedBlock === 'all') return m.status === 'open';
      const relatedAsset = assets.find(a => a.id === m.assetId);
      return m.status === 'open' && relatedAsset && relatedAsset.block.toLowerCase() === selectedBlock.toLowerCase();
    });
  }, [maintenanceIssues, assets, selectedBlock]);

  const criticalIssuesCount = openMaintenanceIssues.filter(m => m.priority === 'critical').length;

  // Filtered observations
  const filteredObs = useMemo(() => {
    if (selectedBlock === 'all') return observations;
    return observations.filter(o => {
      const asset = assets.find(a => a.id === o.assetId);
      return asset && asset.block.toLowerCase() === selectedBlock.toLowerCase();
    });
  }, [observations, assets, selectedBlock]);

  // Latest observation
  const sortedObs = useMemo(() => {
    return [...filteredObs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [filteredObs]);

  const latestObs = sortedObs[0] || null;

  // Chart data from observations
  const chartData = useMemo(() => {
    return [...filteredObs]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-15)
      .map(o => ({
        date: o.timestamp.substring(5, 10),
        rainfall: o.rainfallMm ?? 0,
        waterLevel: o.waterLevelM !== null ? o.waterLevelM * 100 : null, // cm
        volumeKL: o.calculatedVolumeLitres !== null ? Math.round(o.calculatedVolumeLitres / 1000) : null,
      }));
  }, [filteredObs]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>JalSetu Purulia &bull; Water Security Decision Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Evidence-aware planning, asset register, water monitoring, and maintenance priorities for Purulia District.
          </p>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Central Purpose & Implementation Workflow Banner */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            background: '#eaf2f8',
            border: '1px solid #aed6f1',
            padding: '1.15rem 1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.1rem' }}>💧</span>
                <h2 style={{ fontSize: '1rem', color: '#1b4f72', margin: 0 }}>
                  JalSetu Purulia Purpose &amp; Planning Mission
                </h2>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#2c3e50', marginTop: '0.35rem', lineHeight: 1.5, marginBottom: 0 }}>
                <strong>“JalSetu Purulia helps users assess candidate locations, estimate rainwater-harvesting potential, plan preliminary storage requirements, compare suitable structures, and monitor implementation.”</strong>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/sites" className="btn btn-primary btn-sm">
                + Assess a New Site
              </Link>
              <Link to="/calculator" className="btn btn-secondary btn-sm">
                Rainwater Calculator
              </Link>
              <Link to="/interventions" className="btn btn-secondary btn-sm">
                Compare Structures
              </Link>
              <Link
                to="/working-model"
                className="btn btn-secondary btn-sm"
                style={{ background: '#8e44ad', color: '#fff', border: 'none' }}
              >
                📡 Working Model &amp; Live Telemetry
              </Link>
            </div>
          </div>
        </div>

        {/* Regional Water-Security Context Panel */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            background: '#fcfbf8',
            borderLeft: '4px solid var(--color-primary)',
            padding: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.05rem', color: 'var(--color-primary-dark)' }}>
              Regional Water Security Context &bull; Purulia &amp; The Eastern Plateau
            </h2>
            <span style={{ fontSize: '0.75rem', background: 'var(--color-sand)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
              Source: CGWB NAQUIM Report (2022) &amp; IMD
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.55, marginTop: '0.5rem' }}>
            Purulia receives an average of <strong>1,100 to 1,300 mm</strong> of annual monsoon precipitation, yet parts of the district suffer acute pre-monsoon water distress.
            Water insecurity is driven not solely by precipitation volume, but by <strong>short monsoon concentration (~45 rainy days)</strong>, rapid surface runoff over impermeable <strong>crystalline granite-gneiss hard rock</strong>, limited weathered-mantle storage, and <strong>widespread siltation of existing water bodies</strong>.
            JalSetu prioritises <strong>restoring existing bandhs and ponds</strong>, auditing critical maintenance backlogs, and screening new interventions against verified ground evidence.
          </p>
        </div>

        {/* Decision Filters Bar */}
        <div
          className="card"
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: 'var(--color-surface)',
            display: 'flex',
            gap: '1rem',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Filter Records:
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="filter-block" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Block:
            </label>
            <select
              id="filter-block"
              value={selectedBlock}
              onChange={e => setSelectedBlock(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '4px 8px', borderRadius: 'var(--radius)' }}
            >
              <option value="all">All Blocks ({allBlocks.length > 0 ? allBlocks.length : 'Purulia'})</option>
              {allBlocks.map(b => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="filter-type" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Asset Type:
            </label>
            <select
              id="filter-type"
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '4px 8px', borderRadius: 'var(--radius)' }}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label htmlFor="filter-condition" style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Condition:
            </label>
            <select
              id="filter-condition"
              value={selectedCondition}
              onChange={e => setSelectedCondition(e.target.value)}
              style={{ fontSize: '0.8125rem', padding: '4px 8px', borderRadius: 'var(--radius)' }}
            >
              <option value="all">All Conditions</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
              <option value="non_functional">Non-functional</option>
            </select>
          </div>

          {(selectedBlock !== 'all' || selectedType !== 'all' || selectedCondition !== 'all') && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ fontSize: '0.75rem', padding: '3px 8px' }}
              onClick={() => {
                setSelectedBlock('all');
                setSelectedType('all');
                setSelectedCondition('all');
              }}
            >
              Reset Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Showing {totalAssets} assets &bull; {filteredSites.length} candidate sites
          </div>
        </div>

        {/* Primary Decision Metrics Grid */}
        <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
          {/* Card 1: Registered Assets */}
          <div className="stat-card">
            <div className="stat-label">Registered Water Assets</div>
            <div className="stat-value">{totalAssets}</div>
            <div className="stat-detail">
              {totalAssets > 0 ? `${goodAssets} in good functional condition` : 'No assets recorded'}
            </div>
          </div>

          {/* Card 2: Candidate Sites & Screening Status */}
          <div className="stat-card">
            <div className="stat-label">Candidate Sites Assessed</div>
            <div className="stat-value">{siteScreeningSummary.total}</div>
            <div className="stat-detail">
              {siteScreeningSummary.insufficient > 0 ? (
                <span style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                  {siteScreeningSummary.insufficient} need critical field data
                </span>
              ) : siteScreeningSummary.total > 0 ? (
                `${siteScreeningSummary.favourable} preliminarily favourable`
              ) : (
                'No candidate sites logged'
              )}
            </div>
          </div>

          {/* Card 3: Actionable Maintenance Backlog */}
          <div className="stat-card">
            <div className="stat-label">Maintenance Issues Open</div>
            <div
              className="stat-value"
              style={{ color: criticalIssuesCount > 0 ? 'var(--color-danger)' : openMaintenanceIssues.length > 0 ? 'var(--color-warning)' : 'inherit' }}
            >
              {openMaintenanceIssues.length}
            </div>
            <div className="stat-detail">
              {criticalIssuesCount > 0 ? (
                <strong style={{ color: 'var(--color-danger)' }}>{criticalIssuesCount} CRITICAL priority</strong>
              ) : overdueOrPoor > 0 ? (
                `${overdueOrPoor} assets in poor/overdue state`
              ) : (
                'All reported issues resolved'
              )}
            </div>
          </div>

          {/* Card 4: Monitoring / Freshness */}
          <div className="stat-card">
            <div className="stat-label">Latest Recorded Rainfall</div>
            <div className="stat-value">
              {latestObs && latestObs.rainfallMm !== null ? `${latestObs.rainfallMm} mm` : 'Insufficient data'}
            </div>
            <div className="stat-detail">
              {latestObs ? (
                <span>
                  Logged {latestObs.timestamp.substring(0, 10)} ({latestObs.dataSource.replace('_', ' ')})
                </span>
              ) : (
                'No observation logs entered'
              )}
            </div>
          </div>
        </div>

        {/* Candidate Site Screening Status Breakdown */}
        {siteScreeningSummary.total > 0 && (
          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                Candidate Site Screening Status Breakdown
              </h2>
              <Link to="/sites" className="btn btn-secondary btn-sm">
                View Site Assessments &rarr;
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: '#eafaf1', padding: '10px 14px', borderRadius: 'var(--radius)', borderLeft: '4px solid #27864a' }}>
                <div style={{ fontSize: '0.75rem', color: '#145a32', textTransform: 'uppercase', fontWeight: 600 }}>Favourable (70%+)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#145a32' }}>{siteScreeningSummary.favourable}</div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>Ready for engineering survey</div>
              </div>

              <div style={{ background: '#fef9e7', padding: '10px 14px', borderRadius: 'var(--radius)', borderLeft: '4px solid #b7791f' }}>
                <div style={{ fontSize: '0.75rem', color: '#7d6608', textTransform: 'uppercase', fontWeight: 600 }}>Moderate Constraints (40–69%)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#7d6608' }}>{siteScreeningSummary.moderate}</div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>Soil, slope or access mitigation needed</div>
              </div>

              <div style={{ background: '#fdedec', padding: '10px 14px', borderRadius: 'var(--radius)', borderLeft: '4px solid #c0392b' }}>
                <div style={{ fontSize: '0.75rem', color: '#78281f', textTransform: 'uppercase', fontWeight: 600 }}>Severe Constraints (&lt;40%)</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#78281f' }}>{siteScreeningSummary.severe}</div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>Disputed land or extreme slope</div>
              </div>

              <div style={{ background: '#ebf5fb', padding: '10px 14px', borderRadius: 'var(--radius)', borderLeft: '4px solid #2980b9' }}>
                <div style={{ fontSize: '0.75rem', color: '#1b4f72', textTransform: 'uppercase', fontWeight: 600 }}>Insufficient Information</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: '#1b4f72' }}>{siteScreeningSummary.insufficient}</div>
                <div style={{ fontSize: '0.75rem', color: '#555' }}>Critical parameters missing (No arbitrary score)</div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Navigation Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Link to="/sites" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Site Screening Form
          </Link>
          <Link to="/interventions" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Compare 10 Interventions
          </Link>
          <Link to="/assets" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Asset Register &amp; Audit
          </Link>
          <Link to="/calculator" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Rainwater Calculator
          </Link>
          <Link to="/monitoring" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Water &amp; Quality Logs
          </Link>
          <Link to="/reports" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Planning Reports &amp; Export
          </Link>
          <Link
            to="/working-model"
            className="btn btn-secondary"
            style={{ justifyContent: 'center', borderColor: '#8e44ad', color: '#6c3483' }}
          >
            &rarr; Working Model Telemetry
          </Link>
        </div>

        {/* Map & Trend Observations Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Map Section */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2>Geographic Asset &amp; Candidate Site Map</h2>
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                  Interactive markers mapped within Purulia district coordinates. Click anywhere on the map to pin candidate coordinates and launch a site assessment.
                </p>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {filteredAssets.filter(a => a.latitude !== null).length} assets &bull; {filteredSites.filter(s => s.latitude !== null).length} sites
              </span>
            </div>
            <AssetMap
              assets={filteredAssets}
              sites={filteredSites}
              height="350px"
              filterBlock={selectedBlock}
              filterType={selectedType}
              onPlanSite={handlePlanSiteFromMap}
            />
          </div>

          {/* Observations Chart */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Water Observations &amp; Rainfall History</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Event rainfall (mm) and storage tank water level (cm) across the latest logged entries.
              </p>
            </div>
            {chartData.length > 0 ? (
              <div style={{ width: '100%', height: 280 }} aria-label="Observations trend line chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="date" stroke="#666" fontSize={12} />
                    <YAxis yAxisId="left" stroke="var(--color-primary)" fontSize={12} unit="mm" />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-teal)" fontSize={12} unit="cm" />
                    <Tooltip
                      formatter={(val: any, name: any) => {
                        if (name === 'Rainfall') return [`${val} mm`, name];
                        if (name === 'Water Level') return [`${val} cm`, name];
                        return [val, name];
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="rainfall"
                      name="Rainfall"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="waterLevel"
                      name="Water Level"
                      stroke="var(--color-teal)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="empty-state">
                <p>No observations recorded yet. Enter manual readings or import CSV data in the Water Monitoring page.</p>
              </div>
            )}
          </div>
        </div>

        {/* Priority Action Issues */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>Maintenance &amp; Inspection Priorities</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.2rem' }}>
                Open defects, desiltation requirements, and overdue inspections requiring attention.
              </p>
            </div>
            <Link to="/maintenance" className="btn btn-secondary btn-sm">
              View All ({maintenanceIssues.length})
            </Link>
          </div>

          {openMaintenanceIssues.length > 0 ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date Reported</th>
                    <th>Asset</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {openMaintenanceIssues.slice(0, 5).map(issue => {
                    const relatedAsset = assets.find(a => a.id === issue.assetId);
                    return (
                      <tr key={issue.id}>
                        <td>{issue.dateReported}</td>
                        <td>
                          <strong>{relatedAsset?.name || issue.assetId}</strong>
                          {relatedAsset && <div style={{ fontSize: '0.75rem', color: '#666' }}>{relatedAsset.block}</div>}
                        </td>
                        <td>{issue.category.replace('_', ' ')}</td>
                        <td>
                          <span className={`badge badge--${issue.priority}`}>{issue.priority}</span>
                        </td>
                        <td>
                          <span className={`badge badge--${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                        </td>
                        <td style={{ maxWidth: '300px' }}>{issue.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--color-text-muted)' }}>
                No open maintenance issues matching current filters. All reported structures are operational.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
