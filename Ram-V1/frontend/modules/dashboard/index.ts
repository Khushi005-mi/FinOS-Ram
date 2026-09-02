/**
 * Dashboard Module Barrel File
 * Uses explicit exports to eliminate Webpack client-component star-export symbol collisions.
 */
export { KpiSummaryGrid } from "./components/KpiSummaryGrid";
export { RevenueVsCostChart } from "./components/RevenueVsCostChart";
export { UniversalCostBreakdownWidget } from "./components/UniversalCostBreakdownWidget";
export { ExecutiveInsightsWidget } from "./components/ExecutiveInsightsWidget";
export { RunwayBurnWidget } from "./components/RunwayBurnWidget";
export { ScenarioSimulatorWidget } from "./components/ScenarioSimulatorWidget";
export { DatasetVaultDrawer } from "./components/DatasetVaultDrawer";
export { RecentLedgerActivity } from "./components/RecentLedgerActivity";
export { AnomalyRadarWidget } from "./components/AnomalyRadarWidget";

export { dashboardApi } from "./api/dashboardApi";
