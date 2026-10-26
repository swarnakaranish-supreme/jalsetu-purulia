import React from 'react';
import { Link } from 'react-router-dom';
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

interface DashboardPageProps {
  data: AppData;
  isSimulated: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ data, isSimulated }) => {
  const { assets, observations, maintenanceIssues } = data;

  // Real-time calculations from the current dataset
  const totalAssets = assets.length;
  const assetsRequiringInspection = assets.filter(
    a => a.maintenanceStatus === 'overdue' || a.maintenanceStatus === 'scheduled' || a.condition === 'poor'
  ).length;
  const openMaintenanceIssues = maintenanceIssues.filter(m => m.status === 'open').length;

  // Latest observations
  const sortedObs = [...observations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const latestObs = sortedObs[0] || null;

  // Prepare chart data from observations
  const chartData = [...observations]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .slice(-15)
    .map(o => ({
      date: o.timestamp.substring(5, 10),
      rainfall: o.rainfallMm ?? 0,
      waterLevel: o.waterLevelM !== null ? o.waterLevelM * 100 : null, // cm
      volumeKL: o.calculatedVolumeLitres !== null ? Math.round(o.calculatedVolumeLitres / 1000) : null,
    }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>JalSetu Purulia &bull; Overview Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Rainwater harvesting planning, asset registry, and storage monitoring for Purulia District, West Bengal.
          </p>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Concise Project Mission Box */}
        <div className="card" style={{ marginBottom: '1.5rem', background: '#fcfbf8', borderLeft: '4px solid var(--color-primary)' }}>
          <h2 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--color-primary)' }}>
            About This Practical Workflow Tool
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
            Water conservation and rainwater harvesting are established practices in Purulia's undulating hard-rock terrain.
            JalSetu Purulia is designed as a local-first planning assistant to help panchayats, student teams, and field workers
            <strong> record existing structures</strong>, <strong>prioritise restoration before new excavation</strong>,
            log <strong>maintenance needs</strong>, and observe <strong>water storage levels</strong> where sensors or manual gauges exist.
          </p>
          <p style={{ fontSize: '0.785rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Reference context: CGWB Aquifer Mapping &amp; Management Plan for Purulia (2022). All metrics below reflect current stored browser records.
          </p>
        </div>

        {/* Dataset Summary Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Registered Assets</div>
            <div className="stat-value">{totalAssets}</div>
            <div className="stat-detail">
              {assets.filter(a => a.condition === 'good').length} in good condition
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Needing Inspection / Action</div>
            <div className="stat-value" style={{ color: assetsRequiringInspection > 0 ? 'var(--color-warning)' : 'inherit' }}>
              {assetsRequiringInspection}
            </div>
            <div className="stat-detail">Overdue or scheduled for review</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Open Maintenance Issues</div>
            <div className="stat-value" style={{ color: openMaintenanceIssues > 0 ? 'var(--color-danger)' : 'inherit' }}>
              {openMaintenanceIssues}
            </div>
            <div className="stat-detail">
              {maintenanceIssues.filter(m => m.status === 'in_progress').length} in progress
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Latest Recorded Rainfall</div>
            <div className="stat-value">
              {latestObs && latestObs.rainfallMm !== null ? `${latestObs.rainfallMm} mm` : 'No data'}
            </div>
            <div className="stat-detail">
              {latestObs ? `Recorded ${latestObs.timestamp.substring(0, 10)}` : 'Awaiting readings'}
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <Link to="/sites" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Site Screening Form
          </Link>
          <Link to="/interventions" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Compare Interventions
          </Link>
          <Link to="/assets" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Manage Assets
          </Link>
          <Link to="/monitoring" className="btn btn-secondary" style={{ justifyContent: 'center' }}>
            &rarr; Log Water Levels
          </Link>
        </div>

        {/* Map & Trend Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Map Preview */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Geographic Asset Map (Purulia)</h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                {assets.filter(a => a.latitude !== null).length} mapped assets
              </span>
            </div>
            <AssetMap assets={assets} sites={data.siteAssessments} height="320px" />
          </div>

          {/* Observations Chart */}
          <div className="card">
            <div className="card-header">
              <h2>Recent Observation Trends</h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                Rainfall events (mm) and tank water level (cm) across the latest 15 logged entries.
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
                <p>No observations recorded yet. Enter manual readings in the Water Monitoring page.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Maintenance & Inspection History */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Recent Maintenance &amp; Inspection Issues</h2>
            <Link to="/maintenance" className="btn btn-secondary btn-sm">
              View All ({maintenanceIssues.length})
            </Link>
          </div>
          {maintenanceIssues.length > 0 ? (
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
                  {maintenanceIssues.slice(0, 5).map(issue => {
                    const relatedAsset = assets.find(a => a.id === issue.assetId);
                    return (
                      <tr key={issue.id}>
                        <td>{issue.dateReported}</td>
                        <td><strong>{relatedAsset?.name || issue.assetId}</strong></td>
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
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              No maintenance issues recorded. Everything is in order.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
