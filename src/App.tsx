import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import type { AppData, Asset, SiteAssessment, MonitoringObservation, MaintenanceIssue } from './types';
import {
  loadAllData,
  saveAllData,
  saveAsset,
  deleteAsset,
  saveSiteAssessment,
  deleteSiteAssessment,
  saveObservation,
  deleteObservation,
  saveMaintenanceIssue,
  deleteMaintenanceIssue,
  hasAnyData,
  isAllSimulated,
  clearAllData,
} from './lib/storage';
import { SAMPLE_DATA, loadSampleData } from './lib/sampleData';

import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { SiteAssessmentPage } from './pages/SiteAssessmentPage';
import { InterventionPage } from './pages/InterventionPage';
import { AssetRegisterPage } from './pages/AssetRegisterPage';
import { WaterMonitoringPage } from './pages/WaterMonitoringPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { ReportsPage } from './pages/ReportsPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  const [data, setData] = useState<AppData>(() => {
    // If no data exists in localStorage, initialize with sample demonstration data
    if (!hasAnyData()) {
      saveAllData(SAMPLE_DATA);
      return SAMPLE_DATA;
    }
    return loadAllData();
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSimulated, setIsSimulated] = useState<boolean>(() => isAllSimulated());

  useEffect(() => {
    setIsSimulated(isAllSimulated());
  }, [data]);

  const refreshData = () => {
    setData(loadAllData());
  };

  const handleSaveAsset = (asset: Asset) => {
    saveAsset(asset);
    refreshData();
  };

  const handleDeleteAsset = (id: string) => {
    deleteAsset(id);
    refreshData();
  };

  const handleSaveSite = (site: SiteAssessment) => {
    saveSiteAssessment(site);
    refreshData();
  };

  const handleDeleteSite = (id: string) => {
    deleteSiteAssessment(id);
    refreshData();
  };

  const handleSaveObservation = (obs: MonitoringObservation) => {
    saveObservation(obs);
    refreshData();
  };

  const handleDeleteObservation = (id: string) => {
    deleteObservation(id);
    refreshData();
  };

  const handleSaveIssue = (issue: MaintenanceIssue) => {
    saveMaintenanceIssue(issue);
    refreshData();
  };

  const handleDeleteIssue = (id: string) => {
    deleteMaintenanceIssue(id);
    refreshData();
  };

  const handleResetDemoData = () => {
    if (confirm('Reset database to the simulated demonstration dataset? Any unexported local changes will be replaced.')) {
      loadSampleData();
      refreshData();
    }
  };

  const handleClearAllData = () => {
    if (confirm('Clear all local assets, observations, and maintenance records? This will leave your local database empty.')) {
      clearAllData();
      setData({
        assets: [],
        siteAssessments: [],
        observations: [],
        maintenanceIssues: [],
      });
    }
  };

  return (
    <div className="app-layout">
      {/* Mobile menu button */}
      <button
        type="button"
        className="mobile-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle Navigation Menu"
      >
        &#9776; Menu
      </button>

      {/* Navigation sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onResetData={handleResetDemoData}
        onClearData={handleClearAllData}
        isSimulated={isSimulated}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<DashboardPage data={data} isSimulated={isSimulated} />} />
          <Route
            path="/sites"
            element={
              <SiteAssessmentPage
                sites={data.siteAssessments}
                onSaveSite={handleSaveSite}
                onDeleteSite={handleDeleteSite}
                isSimulated={isSimulated}
              />
            }
          />
          <Route path="/interventions" element={<InterventionPage isSimulated={isSimulated} />} />
          <Route
            path="/assets"
            element={
              <AssetRegisterPage
                assets={data.assets}
                onSaveAsset={handleSaveAsset}
                onDeleteAsset={handleDeleteAsset}
                isSimulated={isSimulated}
              />
            }
          />
          <Route
            path="/monitoring"
            element={
              <WaterMonitoringPage
                observations={data.observations}
                assets={data.assets}
                onSaveObservation={handleSaveObservation}
                onDeleteObservation={handleDeleteObservation}
                isSimulated={isSimulated}
              />
            }
          />
          <Route
            path="/maintenance"
            element={
              <MaintenancePage
                maintenanceIssues={data.maintenanceIssues}
                assets={data.assets}
                onSaveIssue={handleSaveIssue}
                onDeleteIssue={handleDeleteIssue}
                isSimulated={isSimulated}
              />
            }
          />
          <Route path="/calculator" element={<CalculatorPage isSimulated={isSimulated} />} />
          <Route path="/reports" element={<ReportsPage data={data} isSimulated={isSimulated} />} />
          <Route path="/about" element={<AboutPage isSimulated={isSimulated} />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
