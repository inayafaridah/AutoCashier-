import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRp(val: number): string {
  return 'Rp ' + Math.round(val).toLocaleString('id-ID');
}

function formatPercent(val: number): string {
  return val.toFixed(1) + '%';
}

const PERIOD_LABEL: Record<string, string> = {
  weekly:  'Mingguan',
  monthly: 'Bulanan',
  yearly:  'Tahunan',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ReportPage() {
  const navigate   = useNavigate();
  const { user }   = useAuth();
  const hasPrinted = useRef(false);

  // Read snapshot that OverviewPage stored before navigating here
  const raw  = sessionStorage.getItem('report_snapshot');
  const snap = raw ? JSON.parse(raw) : null;

  // Auto-trigger print once, then return to overview
  useEffect(() => {
    if (!snap || hasPrinted.current) return;
    hasPrinted.current = true;

    const timer = setTimeout(() => {
      window.print();
    }, 600);

    return () => clearTimeout(timer);
  }, [snap]);

  if (!snap) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center space-y-4">
          <p className="text-gray-500 font-semibold">No report data found.</p>
          <button
            onClick={() => navigate('/overview')}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
          >
            Back to Overview
          </button>
        </div>
      </div>
    );
  }

  const { data, branchName, timeframe, selectedMonth, selectedYear, generatedAt } = snap;
  const topProducts: any[]         = data?.topProducts             ?? [];
  const productsList: any[]        = data?.productsList            ?? [];
  const categorySales: any[]       = data?.categorySalesBreakdown  ?? [];
  const chartData: any[]           = data?.chartData               ?? [];
  const totalRevenue: number       = data?.revenue                 ?? 0;
  const revenueChange: number      = data?.revenueChange           ?? 0;
  const totalTransactions: number  = data?.sales                   ?? 0;
  const totalProducts: number      = data?.inventoryCount          ?? 0;
  const totalStock: number         = data?.totalStock              ?? 0;
  const healthScore: number        = data?.healthScore             ?? 0;
  const periodLabel                = PERIOD_LABEL[timeframe] ?? timeframe;

  return (
    <>
      {/* ── Print styles ───────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'Inter', sans-serif;
          background: #f8fafc;
          color: #1e293b;
        }

        /* Screen: centred A4 card */
        .report-wrapper {
          min-height: 100vh;
          background: #f1f5f9;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          gap: 16px;
        }

        .no-print {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
        }

        .report-page {
          width: 210mm;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 30px rgba(0,0,0,0.08);
          overflow: hidden;
        }

        /* ── Sections ── */
        .report-header {
          background: linear-gradient(135deg, #1e3a5f 0%, #312e81 100%);
          color: #fff;
          padding: 40px 48px 36px;
        }

        .report-body {
          padding: 36px 48px;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        /* ── Typography ── */
        .label-xs {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #94a3b8;
        }

        .section-title {
          font-size: 13px;
          font-weight: 800;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 16px;
        }

        /* ── Summary cards ── */
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
        }

        .summary-card .val {
          font-size: 20px;
          font-weight: 900;
          color: #1e293b;
          margin-top: 6px;
          line-height: 1;
        }

        .summary-card .sub {
          font-size: 10px;
          color: #64748b;
          font-weight: 600;
          margin-top: 4px;
        }

        .badge-up   { color: #059669; font-weight: 700; font-size: 11px; }
        .badge-down { color: #dc2626; font-weight: 700; font-size: 11px; }

        /* ── Tables ── */
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
        }

        thead tr {
          background: #f1f5f9;
        }

        th {
          padding: 10px 12px;
          font-size: 9px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #64748b;
          text-align: left;
        }

        td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          font-weight: 500;
        }

        tr:last-child td { border-bottom: none; }

        .td-right { text-align: right; font-weight: 700; }
        .td-mono  { font-family: monospace; }

        .chip {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          background: #e0e7ff;
          color: #4338ca;
        }

        /* ── Category progress ── */
        .cat-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
        }

        .cat-label {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          font-weight: 600;
          color: #334155;
        }

        .cat-bar-bg {
          height: 6px;
          background: #e2e8f0;
          border-radius: 999px;
          overflow: hidden;
        }

        .cat-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: #4f46e5;
        }

        /* ── Footer ── */
        .report-footer {
          padding: 20px 48px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        /* ── Print overrides ── */
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          body { background: #fff; }

          .report-wrapper {
            background: #fff;
            padding: 0;
            display: block;
          }

          .no-print { display: none !important; }

          .report-page {
            width: 100%;
            border-radius: 0;
            box-shadow: none;
            page-break-after: avoid;
          }

          .report-body { padding: 24px 36px; gap: 20px; }
          .report-header { padding: 28px 36px 24px; }
          .report-footer { padding: 14px 36px; }
          .summary-card .val { font-size: 16px; }
        }
      `}</style>

      <div className="report-wrapper">

        {/* Screen-only toolbar */}
        <div className="no-print">
          <button
            onClick={() => { sessionStorage.removeItem('report_snapshot'); navigate('/overview'); }}
            style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: '#64748b' }}
          >
            ← Kembali
          </button>
          <button
            onClick={() => window.print()}
            style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#4f46e5', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}
          >
            🖨 Cetak / Save PDF
          </button>
        </div>

        {/* ── Report document ─────────────────────────────────────────────── */}
        <div className="report-page">

          {/* Header */}
          <div className="report-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#a5b4fc', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>
                  AutoCashier — Enterprise
                </div>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                  Summary Report
                </div>
                <div style={{ fontSize: 14, color: '#c7d2fe', marginTop: 6, fontWeight: 600 }}>
                  {branchName === 'All Branches' ? 'Semua Cabang (Konsolidasi)' : branchName}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                  Periode
                </div>
                <div style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>
                  {periodLabel}
                </div>
                {timeframe !== 'weekly' && (
                  <div style={{ fontSize: 12, color: '#c7d2fe', marginTop: 4, fontWeight: 600 }}>
                    {timeframe === 'monthly' ? `${selectedMonth} ${selectedYear}` : selectedYear}
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#818cf8', marginTop: 12, fontWeight: 600 }}>
                  Dibuat: {generatedAt}
                </div>
                <div style={{ fontSize: 10, color: '#818cf8', marginTop: 2, fontWeight: 600 }}>
                  Oleh: {user?.username ?? '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="report-body">

            {/* ── 1. Summary KPIs ── */}
            <div>
              <div className="section-title">Ringkasan Kinerja</div>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="label-xs">Total Pendapatan</div>
                  <div className="val">{formatRp(totalRevenue)}</div>
                  <div className="sub">
                    <span className={revenueChange >= 0 ? 'badge-up' : 'badge-down'}>
                      {revenueChange >= 0 ? '▲' : '▼'} {Math.abs(revenueChange).toFixed(1)}%
                    </span>
                    {' '}vs periode lalu
                  </div>
                </div>
                <div className="summary-card">
                  <div className="label-xs">Total Transaksi</div>
                  <div className="val">{totalTransactions.toLocaleString('id-ID')}</div>
                  <div className="sub">transaksi tercatat</div>
                </div>
                <div className="summary-card">
                  <div className="label-xs">Total Produk</div>
                  <div className="val">{totalProducts.toLocaleString('id-ID')}</div>
                  <div className="sub">stok: {totalStock.toLocaleString('id-ID')} unit</div>
                </div>
                <div className="summary-card">
                  <div className="label-xs">Network Health</div>
                  <div className="val" style={{ color: healthScore >= 70 ? '#059669' : healthScore >= 40 ? '#d97706' : '#dc2626' }}>
                    {healthScore}/100
                  </div>
                  <div className="sub">{healthScore >= 70 ? 'Sehat' : healthScore >= 40 ? 'Perlu Perhatian' : 'Kritis'}</div>
                </div>
              </div>
            </div>

            {/* ── 2. Revenue trend table ── */}
            {chartData.length > 0 && (
              <div>
                <div className="section-title">Tren Pendapatan per Periode</div>
                <table>
                  <thead>
                    <tr>
                      <th>Periode</th>
                      <th style={{ textAlign: 'right' }}>Pendapatan</th>
                      <th style={{ textAlign: 'right' }}>Kontribusi</th>
                      <th>Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const maxVal = Math.max(...chartData.map((d: any) => d.total), 1);
                      const grandTotal = chartData.reduce((s: number, d: any) => s + d.total, 0);
                      return chartData.map((d: any, i: number) => {
                        const pct = grandTotal > 0 ? (d.total / grandTotal) * 100 : 0;
                        const isHighest = d.total === maxVal && d.total > 0;
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 700 }}>{d.name}</td>
                            <td className="td-right td-mono">{d.total > 0 ? formatRp(d.total) : '—'}</td>
                            <td className="td-right" style={{ color: '#4f46e5', fontWeight: 700 }}>
                              {d.total > 0 ? formatPercent(pct) : '—'}
                            </td>
                            <td>
                              {isHighest && (
                                <span style={{ fontSize: 9, fontWeight: 800, color: '#059669', background: '#d1fae5', padding: '2px 8px', borderRadius: 999 }}>
                                  ★ Tertinggi
                                </span>
                              )}
                              {d.total === 0 && (
                                <span style={{ fontSize: 9, fontWeight: 700, color: '#94a3b8' }}>Tidak ada transaksi</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                    <tr style={{ background: '#f1f5f9' }}>
                      <td style={{ fontWeight: 800 }}>TOTAL</td>
                      <td className="td-right td-mono" style={{ fontWeight: 900, color: '#4f46e5' }}>
                        {formatRp(chartData.reduce((s: number, d: any) => s + d.total, 0))}
                      </td>
                      <td className="td-right" style={{ fontWeight: 800 }}>100%</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ── 3. Top products ── */}
            {topProducts.length > 0 && (
              <div>
                <div className="section-title">Top 5 Produk Terlaris</div>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Produk</th>
                      <th>Kategori</th>
                      <th>Harga</th>
                      <th>Terjual</th>
                      <th style={{ textAlign: 'right' }}>Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.slice(0, 5).map((p: any, i: number) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 800, color: '#4f46e5', width: 28 }}>{i + 1}</td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#1e293b' }}>{p.name}</div>
                          <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>SKU: {p.sku}</div>
                        </td>
                        <td><span className="chip">{p.category}</span></td>
                        <td className="td-mono">{formatRp(p.price)}</td>
                        <td style={{ fontWeight: 700, color: '#4f46e5' }}>{p.quantitySold} unit</td>
                        <td className="td-right td-mono">{formatRp(p.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── 4. Category breakdown ── */}
            {categorySales.length > 0 && (
              <div>
                <div className="section-title">Kontribusi Kategori</div>
                {categorySales.map((cat: any, i: number) => {
                  const pct = totalRevenue > 0 ? (cat.value / totalRevenue) * 100 : 0;
                  const colors = ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
                  return (
                    <div key={cat.name} className="cat-row">
                      <div className="cat-label">
                        <span>{cat.name}</span>
                        <span style={{ color: '#4f46e5', fontWeight: 700 }}>
                          {formatPercent(pct)} — {formatRp(cat.value)}
                        </span>
                      </div>
                      <div className="cat-bar-bg">
                        <div className="cat-bar-fill" style={{ width: `${pct}%`, background: colors[i % colors.length] }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── 5. Full product sales table ── */}
            {productsList.length > 0 && (
              <div>
                <div className="section-title">Tabel Penjualan Produk</div>
                <table>
                  <thead>
                    <tr>
                      <th>Produk</th>
                      <th>SKU</th>
                      <th>Kategori</th>
                      <th>Harga Dasar</th>
                      <th>Terjual</th>
                      <th style={{ textAlign: 'right' }}>Total Pendapatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsList.map((p: any) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td className="td-mono" style={{ color: '#64748b' }}>{p.sku}</td>
                        <td><span className="chip">{p.category}</span></td>
                        <td className="td-mono">{formatRp(p.price)}</td>
                        <td style={{ fontWeight: 700 }}>{p.quantitySold} unit</td>
                        <td className="td-right td-mono">{formatRp(p.revenue)}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr style={{ background: '#f1f5f9' }}>
                      <td colSpan={4} style={{ fontWeight: 800, fontSize: 11 }}>TOTAL</td>
                      <td style={{ fontWeight: 800 }}>
                        {productsList.reduce((s: number, p: any) => s + p.quantitySold, 0)} unit
                      </td>
                      <td className="td-right td-mono" style={{ fontWeight: 900, color: '#4f46e5' }}>
                        {formatRp(totalRevenue)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="report-footer">
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
              AutoCashier Enterprise · Dokumen ini dibuat otomatis oleh sistem
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
              {generatedAt} · Confidential
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
