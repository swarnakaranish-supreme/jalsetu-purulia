import React, { useState, useMemo } from 'react';
import type { AppData, SiteAssessment } from '../types';
import {
  exportAssetsToCSV,
  exportSitesToCSV,
  exportObservationsToCSV,
  exportMaintenanceToCSV,
  exportToJSON,
} from '../lib/storage';
import { screenSite } from '../lib/screening';
import {
  validateCoordinates,
  calculateRainwaterHarvest,
  calculateRectangularTankDimensions,
  calculateTrapezoidalPondDimensions,
  estimatePreliminaryCost,
  RUNOFF_COEFFICIENTS,
} from '../lib/calculations';
import { evaluateInterventionsForSite } from '../lib/interventions';
import { NoticeBanner } from '../components/NoticeBanner';

interface ReportsPageProps {
  data: AppData;
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

export const ReportsPage: React.FC<ReportsPageProps> = ({ data, isSimulated }) => {
  const { assets, siteAssessments, observations, maintenanceIssues } = data;

  // Report Type: Site-Specific 20-Section Feasibility Report vs Block Executive Summary
  const [reportType, setReportType] = useState<'site_feasibility' | 'block_summary'>('site_feasibility');
  const [selectedSiteId, setSelectedSiteId] = useState<string>(() => {
    return siteAssessments.length > 0 ? siteAssessments[0].id : '';
  });

  const [filterBlock, setFilterBlock] = useState<string>('all');
  const [generatedDate] = useState(
    new Date().toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );

  // Selected site for Feasibility Report
  const selectedSite: SiteAssessment | undefined = useMemo(() => {
    return siteAssessments.find(s => s.id === selectedSiteId) || siteAssessments[0];
  }, [siteAssessments, selectedSiteId]);

  // Derived calculations for selected site
  const siteCalculations = useMemo(() => {
    if (!selectedSite) return null;

    const rain = selectedSite.rainfallMm ?? 1240;
    const area = selectedSite.catchmentAreaSqm ?? 100;
    const coeff = selectedSite.siteType === 'rooftop' ? 0.85 : 0.40;

    const harvest = calculateRainwaterHarvest({
      rainfallMm: rain,
      catchmentAreaSqm: area,
      collectionEfficiency: coeff,
      storageCapacityLitres: selectedSite.preliminaryDimensions?.usableVolumeLitres || 15000,
      firstFlushMm: 1.0,
      demandDailyLitres: 100,
      demandPeriodDays: 90,
    });

    const screening = screenSite(selectedSite);
    const interventions = evaluateInterventionsForSite(selectedSite);
    const coordCheck = validateCoordinates(selectedSite.latitude, selectedSite.longitude);

    const dimensions =
      selectedSite.preliminaryDimensions ||
      (selectedSite.siteType === 'existing_pond' || selectedSite.siteType === 'agricultural_land'
        ? calculateTrapezoidalPondDimensions({ targetUsableLitres: 25000, waterDepthM: 2.0 })
        : calculateRectangularTankDimensions({ targetUsableLitres: 15000, waterDepthM: 1.8 }));

    const costEst =
      selectedSite.preliminaryCostEstimate ||
      estimatePreliminaryCost({
        structureType: dimensions.structureType,
        usableCapacityLitres: dimensions.usableVolumeLitres,
        catchmentAreaSqm: area,
      });

    return {
      rain,
      area,
      coeff,
      harvest,
      screening,
      interventions,
      coordCheck,
      dimensions,
      costEst,
    };
  }, [selectedSite]);

  // Filtered collections for block summary
  const filteredAssets = useMemo(() => {
    return assets.filter(
      a => filterBlock === 'all' || a.block.toLowerCase() === filterBlock.toLowerCase()
    );
  }, [assets, filterBlock]);

  const filteredSites = useMemo(() => {
    return siteAssessments.filter(
      s => filterBlock === 'all' || s.block.toLowerCase() === filterBlock.toLowerCase()
    );
  }, [siteAssessments, filterBlock]);

  const filteredIssues = useMemo(() => {
    return maintenanceIssues.filter(m => {
      if (filterBlock === 'all') return true;
      const related = assets.find(a => a.id === m.assetId);
      return related && related.block.toLowerCase() === filterBlock.toLowerCase();
    });
  }, [maintenanceIssues, assets, filterBlock]);

  const filteredObservations = useMemo(() => {
    return observations.filter(o => {
      if (filterBlock === 'all') return true;
      const related = assets.find(a => a.id === o.assetId);
      return related && related.block.toLowerCase() === filterBlock.toLowerCase();
    });
  }, [observations, assets, filterBlock]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportJSON = () => {
    const json = exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jalsetu_database_${new Date().toISOString().substring(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = (type: 'assets' | 'sites' | 'observations' | 'maintenance') => {
    let csv = '';
    let filename = '';
    const date = new Date().toISOString().substring(0, 10);
    if (type === 'assets') {
      csv = exportAssetsToCSV();
      filename = `jalsetu_assets_${date}.csv`;
    } else if (type === 'sites') {
      csv = exportSitesToCSV();
      filename = `jalsetu_sites_${date}.csv`;
    } else if (type === 'observations') {
      csv = exportObservationsToCSV();
      filename = `jalsetu_observations_${date}.csv`;
    } else {
      csv = exportMaintenanceToCSV();
      filename = `jalsetu_maintenance_${date}.csv`;
    }

    if (!csv) {
      alert(`No ${type} records available to export.`);
      return;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Planning, Screening &amp; Feasibility Reports</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
            Generate traceable, evidence-grounded preliminary feasibility dossiers for Gram Panchayats, block engineers, and technical evaluators.
          </p>
        </div>
        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-sm ${reportType === 'site_feasibility' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('site_feasibility')}
          >
            Site Feasibility Report (20 Sections)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${reportType === 'block_summary' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setReportType('block_summary')}
          >
            Block-Level Executive Summary
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportJSON}>
            Export Database JSON
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
            🖨️ Print / Save PDF
          </button>
        </div>
      </div>

      <div className="page-body">
        <NoticeBanner isSimulated={isSimulated} />

        {/* Clear Mandatory Disclaimer */}
        <div
          className="notice notice--warning"
          style={{
            marginBottom: '1.5rem',
            borderLeft: '4px solid #b7791f',
            background: '#fef9e7',
            padding: '1rem',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: '#7d6608', lineHeight: 1.5 }}>
            <strong>IMPORTANT REGULATORY NOTICE &bull; PRELIMINARY DIGITAL ASSESSMENT: </strong>
            This feasibility dossier is generated by <strong>JalSetu Purulia</strong> as an evidence-aware decision-support prototype.
            <strong> It is a preliminary planning assessment — NOT a construction-ready engineering design or certified DPR (Detailed Project Report).</strong>
            Actual civil execution, desilting tenders, or borewell recharge requires statutory approvals, soil geotechnical verification, and site inspections by competent authorities (WRIDD / CGWA / P&amp;RD).
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* REPORT VIEW 1: SITE-LEVEL 20-SECTION FEASIBILITY REPORT           */}
        {/* ----------------------------------------------------------------- */}
        {reportType === 'site_feasibility' && (
          <div>
            {/* Site Selector Toolbar */}
            <div
              className="card"
              style={{
                marginBottom: '1.5rem',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                background: '#f8f9fa',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <label htmlFor="select-report-site" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-dark)' }}>
                  Select Candidate Assessment Site:
                </label>
                <select
                  id="select-report-site"
                  value={selectedSiteId}
                  onChange={e => setSelectedSiteId(e.target.value)}
                  style={{ fontSize: '0.85rem', padding: '5px 10px', borderRadius: 'var(--radius)', minWidth: '280px' }}
                >
                  {siteAssessments.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.block}{s.village ? `, ${s.village}` : ''})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                {selectedSite ? `Site ID: ${selectedSite.id} • Assessed ${selectedSite.assessmentDate}` : 'No site selected'}
              </div>
            </div>

            {selectedSite && siteCalculations ? (
              <div className="card" style={{ padding: '2.5rem', background: '#ffffff', boxShadow: 'var(--shadow-md)' }}>
                {/* Dossier Header */}
                <div style={{ borderBottom: '3px solid var(--color-primary)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', color: '#666', fontWeight: 600 }}>
                        JalSetu Purulia &bull; Rainwater Harvesting Feasibility Dossier
                      </span>
                      <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary-dark)', margin: '0.25rem 0' }}>
                        {selectedSite.name}
                      </h2>
                      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                        {selectedSite.block} Block &bull; {selectedSite.village || 'Purulia District'}, West Bengal &bull; Generated: {generatedDate}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          backgroundColor: selectedSite.isSimulated ? '#fcf3cf' : '#d4efdf',
                          color: selectedSite.isSimulated ? '#7d6608' : '#145a32',
                          border: '1px solid currentColor',
                          fontWeight: 600,
                        }}
                      >
                        {selectedSite.isSimulated ? 'SIMULATED DEMO RECORD' : 'FIELD GROUND-TRUTHED'}
                      </span>
                      <div style={{ fontSize: '0.75rem', color: '#888', marginTop: '4px' }}>
                        Dossier Ref: JS-RWH-{selectedSite.id.substring(0, 8).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 20 STRUCTURED SECTIONS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                  {/* 1. Location & Administration */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      1. Site Identification &amp; Administrative Context
                    </h3>
                    <p style={{ margin: 0 }}>
                      The candidate site <strong>{selectedSite.name}</strong> is situated in <strong>{selectedSite.village || 'Lagda/Laghu mouza'}</strong>, <strong>{selectedSite.block} Block</strong>, Purulia District, West Bengal.
                      Administrative planning level: Gram Panchayat local jurisdiction. Assessor: <strong>{selectedSite.assessorName || 'Junior Engineer / Field Surveyor'}</strong> ({selectedSite.assessorRole || 'Technical Planning Staff'}).
                    </p>
                  </div>

                  {/* 2. Coordinates & Geolocation */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      2. Geographical Coordinates &amp; Context Verification
                    </h3>
                    <p style={{ margin: 0 }}>
                      <strong>Latitude:</strong> {selectedSite.latitude !== null ? `${selectedSite.latitude.toFixed(4)}° N` : 'Unrecorded'} &bull;
                      <strong> Longitude:</strong> {selectedSite.longitude !== null ? `${selectedSite.longitude.toFixed(4)}° E` : 'Unrecorded'}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: siteCalculations.coordCheck.inPuruliaDistrict ? '#27864a' : '#d35400' }}>
                      {siteCalculations.coordCheck.inPuruliaDistrict
                        ? '✓ Verified within Purulia District geographic bounding envelope (22.70°–23.85° N, 85.80°–87.05° E).'
                        : '⚠️ Warning: Coordinates fall outside standard Purulia district perimeter.'}
                    </p>
                  </div>

                  {/* 3. Catchment Surface & Runoff Efficiency */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      3. Catchment Surface &amp; Runoff Coefficient (C)
                    </h3>
                    <p style={{ margin: 0 }}>
                      <strong>Morphology:</strong> {selectedSite.siteType.replace('_', ' ').toUpperCase()} &bull;
                      <strong> Effective Surface Area:</strong> {siteCalculations.area.toLocaleString()} m² ({selectedSite.catchmentSource || 'Visual inspection'}).
                      Assigned Runoff Coefficient: <strong>C = {siteCalculations.coeff}</strong>.
                      Surface retains approximately {Math.round((1 - siteCalculations.coeff) * 100)}% of incident rainfall via depression storage, micro-roughness, and initial wetting.
                    </p>
                  </div>

                  {/* 4. Local Rainfall Assessment */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      4. Rainfall Assessment &amp; Climatological Period
                    </h3>
                    <p style={{ margin: 0 }}>
                      Design Precipitation: <strong>{siteCalculations.rain} mm/year</strong>. Source: <em>{selectedSite.rainfallSource || 'IMD 30-year normal for Purulia District (~1,240–1,346 mm)'}</em>.
                      Rainfall in Purulia is severely concentrated, with &gt;80% occurring in the monsoon months (June to September).
                    </p>
                  </div>

                  {/* 5. Calculation Formula */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      5. Calculation Methodology &amp; Hydrological Formula
                    </h3>
                    <p style={{ margin: 0 }}>
                      Theoretical runoff is governed by the standard rational rainwater equation:
                    </p>
                    <div style={{ background: '#f8f9fa', padding: '8px 12px', borderRadius: '4px', margin: '6px 0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      V = P × A × C
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#555' }}>
                      Where V = Gross volume (Litres), P = Precipitation depth ({siteCalculations.rain} mm), A = Catchment area ({siteCalculations.area} m²), and C = Runoff coefficient ({siteCalculations.coeff}).
                      (1 mm over 1 m² = 1 Litre).
                    </p>
                  </div>

                  {/* 6. Theoretical Gross Runoff & Net Yield */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      6. Theoretical Gross Runoff &amp; Harvest Potential
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', margin: '6px 0' }}>
                      <div style={{ background: '#f8f9fa', padding: '8px 12px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#666' }}>Gross Incident Runoff</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                          {siteCalculations.harvest.grossRunoffLitres?.toLocaleString()} Litres
                        </div>
                        <small style={{ color: '#666' }}>{(siteCalculations.harvest.grossRunoffLitres! / 1000).toFixed(1)} m³ before pre-treatment losses</small>
                      </div>
                      <div style={{ background: '#eafaf1', padding: '8px 12px', borderRadius: '4px' }}>
                        <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: '#145a32' }}>Net Clean Harvest Potential</span>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#145a32' }}>
                          {siteCalculations.harvest.harvestableVolumeLitres.toLocaleString()} Litres
                        </div>
                        <small style={{ color: '#145a32' }}>{siteCalculations.harvest.harvestableVolumeM3.toFixed(1)} m³ usable water volume</small>
                      </div>
                    </div>
                  </div>

                  {/* 7. First-Flush Diversion & Losses */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      7. First-Flush Diversion &amp; Modelled Conveyance Losses
                    </h3>
                    <p style={{ margin: 0 }}>
                      An initial first-flush diversion depth of <strong>1.0 mm</strong> is explicitly modelled to wash bird droppings, foliage dust, and loose particulate soot.
                      Total first-flush diverted volume: <strong>{siteCalculations.harvest.firstFlushDivertedLitres?.toLocaleString()} Litres</strong> (diverted safely to garden or percolation bed).
                    </p>
                  </div>

                  {/* 8. Water Demand & Intended Beneficiaries */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      8. Water Demand &amp; Target Beneficiaries
                    </h3>
                    <p style={{ margin: 0 }}>
                      <strong>Design Demand:</strong> {selectedSite.waterDemand || 'Drinking and cooking supply during dry periods'} &bull;
                      <strong> Target Beneficiaries:</strong> {selectedSite.intendedBeneficiaries || 'Local community & school pupils'} &bull;
                      <strong> Equity Priority:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedSite.equityPriority || 'Standard'}</span>
                    </p>
                  </div>

                  {/* 9. Storage Capacity & Security Assessment */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      9. Storage Sizing &amp; Dry-Period Security Assessment
                    </h3>
                    <p style={{ margin: 0 }}>
                      At a benchmark consumption of 100 L/day, the proposed storage reservoir provides approximately <strong>{siteCalculations.harvest.daysOfSupplySupported ?? 90} days of water security</strong>,
                      substantially mitigating household water transport hardship between February and May.
                    </p>
                  </div>

                  {/* 10. Selected Preliminary Structure Type */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      10. Selected Preliminary Structure Type
                    </h3>
                    <p style={{ margin: 0 }}>
                      Recommended Structural Measure: <strong>{siteCalculations.dimensions.structureType.replace(/_/g, ' ').toUpperCase()}</strong>.
                      Category: {selectedSite.siteType === 'existing_pond' ? 'Restoration-First Water Body' : 'Rooftop Rainwater Harvesting Storage'}.
                    </p>
                  </div>

                  {/* 11. Preliminary Dimensions & Land Footprint */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      11. Preliminary Dimensions &amp; Total Land Footprint
                    </h3>
                    <div style={{ background: '#f8f9fa', padding: '10px 14px', borderRadius: '4px', margin: '6px 0' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        <div><strong>Internal Sizing:</strong> {siteCalculations.dimensions.lengthM}m (L) × {siteCalculations.dimensions.widthM}m (W)</div>
                        <div><strong>Total Depth:</strong> {siteCalculations.dimensions.depthM}m (inc. {siteCalculations.dimensions.freeboardM}m freeboard)</div>
                        <div><strong>Usable Capacity:</strong> {siteCalculations.dimensions.usableVolumeLitres.toLocaleString()} L</div>
                        <div><strong>Internal Footprint:</strong> {siteCalculations.dimensions.internalFootprintSqm} m²</div>
                        <div><strong>Structure Footprint:</strong> {siteCalculations.dimensions.externalStructureFootprintSqm} m²</div>
                        <div style={{ color: '#1a5276' }}>
                          <strong>Total Land Area:</strong> <strong>{siteCalculations.dimensions.totalLandRequirementSqm} m²</strong> (includes {siteCalculations.dimensions.maintenanceClearanceBufferM}m access buffer)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 12. Land Ownership & Permissions */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      12. Land Availability, Tenure &amp; Permissions
                    </h3>
                    <p style={{ margin: 0 }}>
                      Ownership Category: <strong>{selectedSite.ownershipStatus.replace(/_/g, ' ').toUpperCase()}</strong>.
                      {selectedSite.ownershipStatus === 'government' || selectedSite.ownershipStatus === 'community'
                        ? ' Favourable for public and panchayat water security infrastructure.'
                        : ' Written consent and formal Gram Sabha resolution required before civil commitment.'}
                    </p>
                  </div>

                  {/* 13. Intervention Comparison */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      13. Intervention Suitability Ranking
                    </h3>
                    <ul style={{ margin: '4px 0 0 1.2rem', padding: 0 }}>
                      {siteCalculations.interventions.slice(0, 3).map(ci => (
                        <li key={ci.intervention.id}>
                          <strong>{ci.intervention.name}</strong> ({ci.recommendationStatus.replace(/_/g, ' ')}): {ci.suitabilityReason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 14. Preliminary Itemized Cost Estimate */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      14. Preliminary Cost Estimate &amp; Material Assumptions
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 12px', background: '#eafaf1', borderRadius: '4px', marginBottom: '6px' }}>
                      <strong>Estimated Total Capital Cost: ₹{siteCalculations.costEst.capitalCostINR.toLocaleString()}</strong>
                      <span>Annual Upkeep: ₹{siteCalculations.costEst.annualMaintenanceINR.toLocaleString()}/yr</span>
                      <span>Unit Cost: ₹{siteCalculations.costEst.costPerLitresUsableINR} / Litre</span>
                    </div>
                    <small style={{ color: '#666', fontStyle: 'italic' }}>
                      Based on West Bengal PWD SOR 2023–24 indicative schedule. Excludes land acquisition; includes 15% labour and pre-treatment filtration kit.
                    </small>
                  </div>

                  {/* 15. Implementation-Gap Diagnosis */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      15. Implementation-Gap Diagnosis &amp; Bottlenecks
                    </h3>
                    {selectedSite.implementationGap && selectedSite.implementationGap.identifiedGaps.length > 0 ? (
                      <p style={{ margin: 0 }}>
                        Identified Bottlenecks: <strong>{selectedSite.implementationGap.identifiedGaps.map(g => g.replace(/_/g, ' ')).join(', ')}</strong>.
                      </p>
                    ) : (
                      <p style={{ margin: 0, color: '#666' }}>
                        No acute physical or institutional bottlenecks flagged; candidate site is standard category.
                      </p>
                    )}
                  </div>

                  {/* 16. Missing Data & Field Investigations */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      16. Missing Information &amp; Field Verification Checklist
                    </h3>
                    {siteCalculations.screening.missingData.length > 0 ? (
                      <ul style={{ margin: '4px 0 0 1.2rem', padding: 0, color: '#c0392b' }}>
                        {siteCalculations.screening.missingData.map((m, idx) => (
                          <li key={idx}>{m}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, color: '#27864a' }}>
                        ✓ All mandatory baseline parameters recorded for preliminary screening.
                      </p>
                    )}
                  </div>

                  {/* 17. Water Quality Assessment */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      17. Water Quality Context &amp; IS 10500:2012 Compliance
                    </h3>
                    <p style={{ margin: 0 }}>
                      Local Quality Context: <strong>{selectedSite.waterQualityConcerns || 'Not tested'}</strong>.
                      Harvested roof rainwater is naturally low in Total Dissolved Solids (&lt;100 mg/L) and free of geological fluoride, making it an ideal drinking alternative to contaminated hard-rock tubewells, provided first-flush diversion and basic filtration are maintained.
                    </p>
                  </div>

                  {/* 18. Maintenance Considerations */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      18. Maintenance &amp; Pre-Monsoon Protocol
                    </h3>
                    <p style={{ margin: 0 }}>
                      1. Pre-monsoon clearing of roof and gutters (May).
                      2. Clean first-flush chamber after the first 2 rainfall events.
                      3. Wash and replace graded filter sand media annually.
                      4. Inspect tank for crack development and maintain lockable inspection hatch.
                    </p>
                  </div>

                  {/* 19. Technical Caveats */}
                  <div style={{ background: '#fef9e7', padding: '10px 14px', borderRadius: '4px', borderLeft: '4px solid #b7791f' }}>
                    <h3 style={{ fontSize: '1rem', color: '#7d6608', margin: '0 0 0.25rem 0' }}>
                      19. Technical Caveats &amp; Engineering Disclaimers
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', lineHeight: 1.5 }}>
                      • Calculations represent theoretical yields assuming uniform seasonal precipitation and standard surface runoff behavior.<br />
                      • Groundwater recharge into hard-rock aquifers must only occur where an unconfined weathered mantle exists, to prevent subterranean water logging.<br />
                      • This report does not constitute a sanctioned estimate or tender quotation.
                    </p>
                  </div>

                  {/* 20. References & Document Provenance */}
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', borderBottom: '1px solid #eee', paddingBottom: '3px', marginBottom: '0.5rem' }}>
                      20. Authoritative References &amp; Provenance
                    </h3>
                    <ul style={{ margin: '4px 0 0 1.2rem', padding: 0, fontSize: '0.8rem', color: '#555' }}>
                      <li><strong>CGWB (2022):</strong> Aquifer Mapping and Management of Ground Water Resources: Purulia District, West Bengal.</li>
                      <li><strong>CGWB (2024):</strong> Aquifer Management Plan for Seven Northern Blocks of Purulia District.</li>
                      <li><strong>CPWD:</strong> Rain Water Harvesting &amp; Conservation Manual, Ministry of Housing &amp; Urban Affairs.</li>
                      <li><strong>Ministry of Jal Shakti:</strong> Catch the Rain Guidelines, National Water Mission.</li>
                      <li><strong>WB PCB:</strong> Rainwater Harvesting Guidance Document.</li>
                    </ul>
                  </div>
                </div>

                {/* Dossier Footer */}
                <div style={{ marginTop: '2.5rem', paddingTop: '1rem', borderTop: '2px solid #eee', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#888' }}>
                  <span>JalSetu Purulia &bull; Student Engineering Prototype</span>
                  <span>Document Hash: {selectedSite.id} &bull; Generated {generatedDate}</span>
                </div>
              </div>
            ) : (
              <div className="card empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
                <p>No candidate sites available. Assess a candidate site first in the Site Assessment section.</p>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* REPORT VIEW 2: BLOCK & DISTRICT EXECUTIVE SUMMARY                 */}
        {/* ----------------------------------------------------------------- */}
        {reportType === 'block_summary' && (
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2>Purulia District Water Asset &amp; Maintenance Audit Summary</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                Scope: {filterBlock === 'all' ? 'Entire Purulia District' : `${filterBlock} Block`} &bull; Generated: {generatedDate}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '0.72rem', color: '#666', textTransform: 'uppercase' }}>Assets Audited</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{filteredAssets.length}</div>
              </div>
              <div style={{ background: '#eafaf1', padding: '12px', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '0.72rem', color: '#145a32', textTransform: 'uppercase' }}>Good Condition</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#145a32' }}>
                  {filteredAssets.filter(a => a.condition === 'good').length}
                </div>
              </div>
              <div style={{ background: '#fdedec', padding: '12px', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '0.72rem', color: '#c0392b', textTransform: 'uppercase' }}>Desilting Backlog</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#c0392b' }}>
                  {filteredAssets.filter(a => a.maintenanceStatus !== 'none_required').length}
                </div>
              </div>
              <div style={{ background: '#ebf5fb', padding: '12px', borderRadius: 'var(--radius)' }}>
                <span style={{ fontSize: '0.72rem', color: '#1b4f72', textTransform: 'uppercase' }}>Candidate Sites</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1b4f72' }}>{filteredSites.length}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleExportCSV('assets')}>
                Export Assets CSV
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleExportCSV('sites')}>
                Export Sites CSV
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleExportCSV('observations')}>
                Export Observations CSV
              </button>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleExportCSV('maintenance')}>
                Export Maintenance CSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
