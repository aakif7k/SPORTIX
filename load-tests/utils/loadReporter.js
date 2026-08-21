/**
 * load-tests/utils/loadReporter.js
 * Generates an executive-grade Excel (.xlsx) analysis report for Baseline Load Testing.
 */

const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const config = require('../config/loadConfig');

async function generateLoadReport(stats) {
  if (!fs.existsSync(config.reportsDir)) {
    fs.mkdirSync(config.reportsDir, { recursive: true });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SPORTiX Performance & Reliability Engineering';
  workbook.created = new Date();

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. EXECUTIVE DASHBOARD SHEET
  // ═══════════════════════════════════════════════════════════════════════════
  const summarySheet = workbook.addWorksheet('Executive Dashboard', {
    views: [{ showGridLines: true }],
  });

  // Title Banner
  summarySheet.mergeCells('B2:H3');
  const titleCell = summarySheet.getCell('B2');
  titleCell.value = '⚡ SPORTIX ENTERPRISE SYSTEM BASELINE & LOAD TEST REPORT';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Dark slate
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Subtitle / Meta
  summarySheet.mergeCells('B4:H4');
  const metaCell = summarySheet.getCell('B4');
  metaCell.value = `Load Profile: 100 Concurrent Users (1 min continuous)  |  Web: ${config.webBaseUrl}  |  API: ${config.apiBaseUrl}  |  Generated: ${new Date().toUTCString()}`;
  metaCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
  metaCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // 4 Top KPI Cards
  // KPI 1: Concurrency & Duration
  summarySheet.mergeCells('B6:C7');
  const kpiVus = summarySheet.getCell('B6');
  kpiVus.value = `CONCURRENT USERS (VUs)\n${stats.concurrency} Users (60s Duration)`;
  kpiVus.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF1E293B' } };
  kpiVus.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  kpiVus.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // KPI 2: Total Requests Handled
  summarySheet.mergeCells('D6:E7');
  const kpiTotal = summarySheet.getCell('D6');
  kpiTotal.value = `TOTAL REQUESTS\n${stats.totalRequests.toLocaleString()} Reqs`;
  kpiTotal.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } };
  kpiTotal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  kpiTotal.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // KPI 3: Requests Per Second (RPS)
  summarySheet.mergeCells('F6:G7');
  const kpiRps = summarySheet.getCell('F6');
  kpiRps.value = `THROUGHPUT (RPS)\n${stats.averageRps.toFixed(1)} req/sec`;
  kpiRps.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF047857' } }; // Green
  kpiRps.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
  kpiRps.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // KPI 4: Success Rate
  summarySheet.mergeCells('H6:H7');
  const kpiSuccess = summarySheet.getCell('H6');
  kpiSuccess.value = `SUCCESS RATE\n${stats.successRate.toFixed(1)}%`;
  kpiSuccess.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF15803D' } };
  kpiSuccess.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
  kpiSuccess.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // Response Time Breakdown KPIs (Row 9-10)
  summarySheet.mergeCells('B9:C10');
  const kpiAvgLat = summarySheet.getCell('B9');
  kpiAvgLat.value = `AVERAGE RESPONSE TIME\n${stats.latency.avg.toFixed(1)} ms`;
  kpiAvgLat.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0284C7' } };
  kpiAvgLat.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0F2FE' } };
  kpiAvgLat.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  summarySheet.mergeCells('D9:E10');
  const kpiMinLat = summarySheet.getCell('D9');
  kpiMinLat.value = `FASTEST RESPONSE (MIN)\n${stats.latency.min.toFixed(1)} ms`;
  kpiMinLat.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF15803D' } };
  kpiMinLat.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
  kpiMinLat.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  summarySheet.mergeCells('F9:G10');
  const kpiP95Lat = summarySheet.getCell('F9');
  kpiP95Lat.value = `95th PERCENTILE (p95)\n${stats.latency.p95.toFixed(1)} ms`;
  kpiP95Lat.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF7C3AED' } };
  kpiP95Lat.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E8FF' } };
  kpiP95Lat.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  summarySheet.mergeCells('H9:H10');
  const kpiMaxLat = summarySheet.getCell('H9');
  kpiMaxLat.value = `SLOWEST RESPONSE (MAX)\n${stats.latency.max.toFixed(1)} ms`;
  kpiMaxLat.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFB45309' } };
  kpiMaxLat.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
  kpiMaxLat.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

  // Percentiles Table
  summarySheet.getCell('B12').value = 'LATENCY PERCENTILES BREAKDOWN';
  summarySheet.getCell('B12').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };

  const percHeaders = ['Metric', 'Min', 'p50 (Median)', 'p75', 'p90', 'p95', 'p99', 'Max', 'Average'];
  percHeaders.forEach((h, idx) => {
    const cell = summarySheet.getCell(13, idx + 2);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  const percRow = summarySheet.getRow(14);
  percRow.getCell(2).value = 'Response Time (ms)';
  percRow.getCell(3).value = `${stats.latency.min.toFixed(1)} ms`;
  percRow.getCell(4).value = `${stats.latency.p50.toFixed(1)} ms`;
  percRow.getCell(5).value = `${stats.latency.p75.toFixed(1)} ms`;
  percRow.getCell(6).value = `${stats.latency.p90.toFixed(1)} ms`;
  percRow.getCell(7).value = `${stats.latency.p95.toFixed(1)} ms`;
  percRow.getCell(8).value = `${stats.latency.p99.toFixed(1)} ms`;
  percRow.getCell(9).value = `${stats.latency.max.toFixed(1)} ms`;
  percRow.getCell(10).value = `${stats.latency.avg.toFixed(1)} ms`;

  for (let c = 2; c <= 10; c++) {
    const cell = percRow.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: c > 2 };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }

  // Endpoint Breakdown Table
  summarySheet.getCell('B16').value = 'ENDPOINT PERFORMANCE MATRIX';
  summarySheet.getCell('B16').font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FF0F172A' } };

  const epHeaders = ['Target Endpoint Name', 'Service', 'HTTP Method & Path', 'Total Reqs', 'RPS', 'Avg (ms)', 'Min (ms)', 'p95 (ms)', 'Max (ms)', 'Success Rate'];
  epHeaders.forEach((h, idx) => {
    const cell = summarySheet.getCell(17, idx + 2);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  let epRowIdx = 18;
  stats.endpointStats.forEach((ep) => {
    const row = summarySheet.getRow(epRowIdx);
    row.getCell(2).value = ep.name;
    row.getCell(3).value = ep.service;
    row.getCell(4).value = `${ep.method} ${ep.path}`;
    row.getCell(5).value = ep.totalRequests;
    row.getCell(6).value = `${(ep.totalRequests / stats.duration).toFixed(1)} req/s`;
    row.getCell(7).value = `${ep.avgLatency.toFixed(1)} ms`;
    row.getCell(8).value = `${ep.minLatency.toFixed(1)} ms`;
    row.getCell(9).value = `${ep.p95Latency.toFixed(1)} ms`;
    row.getCell(10).value = `${ep.maxLatency.toFixed(1)} ms`;
    row.getCell(11).value = `${ep.successRate.toFixed(1)}%`;

    for (let c = 2; c <= 11; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Calibri', size: 10 };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
      if (c >= 5) cell.alignment = { horizontal: 'center' };
    }
    epRowIdx++;
  });

  // Set column widths
  summarySheet.getColumn(1).width = 4;
  summarySheet.getColumn(2).width = 24;
  summarySheet.getColumn(3).width = 16;
  summarySheet.getColumn(4).width = 28;
  summarySheet.getColumn(5).width = 14;
  summarySheet.getColumn(6).width = 16;
  summarySheet.getColumn(7).width = 14;
  summarySheet.getColumn(8).width = 14;
  summarySheet.getColumn(9).width = 14;
  summarySheet.getColumn(10).width = 14;
  summarySheet.getColumn(11).width = 16;

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. SECOND-BY-SECOND TIME SERIES SHEET
  // ═══════════════════════════════════════════════════════════════════════════
  const timeSheet = workbook.addWorksheet('Second-by-Second Timeline', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
  });

  timeSheet.columns = [
    { header: 'Timeline Second (s)', key: 'second', width: 20 },
    { header: 'Active Users (VUs)', key: 'vus', width: 18 },
    { header: 'Requests Completed', key: 'reqs', width: 20 },
    { header: 'Instantaneous RPS', key: 'rps', width: 18 },
    { header: 'Avg Latency (ms)', key: 'avg', width: 18 },
    { header: 'Min Latency (ms)', key: 'min', width: 18 },
    { header: 'p95 Latency (ms)', key: 'p95', width: 18 },
    { header: 'Max Latency (ms)', key: 'max', width: 18 },
    { header: 'Success Rate (%)', key: 'success', width: 18 },
    { header: 'Error Count', key: 'errors', width: 15 },
  ];

  const tHeaderRow = timeSheet.getRow(1);
  tHeaderRow.height = 24;
  tHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  stats.secondBySecond.forEach((s, idx) => {
    const row = timeSheet.addRow({
      second: `T + ${s.second}s`,
      vus: s.vus,
      reqs: s.requests,
      rps: s.rps,
      avg: s.avgLatency.toFixed(1),
      min: s.minLatency.toFixed(1),
      p95: s.p95Latency.toFixed(1),
      max: s.maxLatency.toFixed(1),
      success: `${s.successRate.toFixed(1)}%`,
      errors: s.errors,
    });

    row.height = 19;
    row.eachCell((cell, colNum) => {
      cell.alignment = { horizontal: 'center' };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      }
    });
  });

  timeSheet.autoFilter = 'A1:J1';

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. DETAILED REQUEST SAMPLES LOG SHEET
  // ═══════════════════════════════════════════════════════════════════════════
  const samplesSheet = workbook.addWorksheet('Sample Request Log', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1, showGridLines: true }],
  });

  samplesSheet.columns = [
    { header: 'Sample ID', key: 'id', width: 14 },
    { header: 'Timestamp', key: 'timestamp', width: 22 },
    { header: 'Virtual User ID', key: 'vu', width: 18 },
    { header: 'Target Service', key: 'service', width: 16 },
    { header: 'Endpoint Name', key: 'name', width: 26 },
    { header: 'HTTP Method & URL', key: 'url', width: 35 },
    { header: 'HTTP Status', key: 'status', width: 14 },
    { header: 'Response Time (ms)', key: 'latency', width: 20 },
    { header: 'Result', key: 'result', width: 14 },
  ];

  const sHeaderRow = samplesSheet.getRow(1);
  sHeaderRow.height = 24;
  sHeaderRow.eachCell((cell) => {
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  stats.sampleLogs.forEach((sample, idx) => {
    const row = samplesSheet.addRow({
      id: sample.id,
      timestamp: sample.timestamp,
      vu: sample.vu,
      service: sample.service,
      name: sample.name,
      url: `${sample.method} ${sample.url}`,
      status: sample.status,
      latency: sample.latency.toFixed(1),
      result: sample.status >= 200 && sample.status < 400 ? 'SUCCESS' : 'FAIL',
    });

    row.height = 19;
    const resultCell = row.getCell('result');
    const statusCell = row.getCell('status');

    if (sample.status >= 200 && sample.status < 400) {
      resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
      resultCell.font = { name: 'Calibri', bold: true, color: { argb: 'FF15803D' } };
      statusCell.font = { name: 'Calibri', bold: true, color: { argb: 'FF15803D' } };
    } else {
      resultCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      resultCell.font = { name: 'Calibri', bold: true, color: { argb: 'FFB91C1C' } };
    }

    row.getCell('id').alignment = { horizontal: 'center' };
    row.getCell('vu').alignment = { horizontal: 'center' };
    row.getCell('status').alignment = { horizontal: 'center' };
    row.getCell('result').alignment = { horizontal: 'center' };
    row.getCell('latency').alignment = { horizontal: 'right' };
  });

  samplesSheet.autoFilter = 'A1:I1';

  const outputPath = path.join(config.reportsDir, config.reportFileName);
  await workbook.xlsx.writeFile(outputPath);
  console.log(`\n📊 Excel Baseline Load Testing Report generated at: ${outputPath}`);
  return outputPath;
}

module.exports = { generateLoadReport };
