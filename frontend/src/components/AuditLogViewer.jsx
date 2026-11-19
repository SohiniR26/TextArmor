import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, FileSpreadsheet, Search, Filter, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export default function AuditLogViewer({ triggerRefresh }) {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterDecision, setFilterDecision] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const decisionParam = filterDecision !== 'ALL' ? `&decision=${filterDecision}` : '';
      const res = await fetch(`${API_BASE_URL}/api/audit/logs?limit=50${decisionParam}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.warn('[Text Armor] Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterDecision, triggerRefresh]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/export`);
      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `textarmor_compliance_report_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert('Failed to export compliance report: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredLogs = logs.filter(item => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      item.scan_id?.toLowerCase().includes(query) ||
      item.text_preview?.toLowerCase().includes(query) ||
      item.client_source?.toLowerCase().includes(query) ||
      item.flagged_tokens?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="bg-white border border-[#DFD8CD] shadow-sm rounded-2xl p-6 space-y-5">
      {/* Top Header & Export Controls */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-4 border-b border-[#DFD8CD]">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-[#C5A880]" />
            <h3 className="text-sm font-bold tracking-wider text-[#2C2623] uppercase font-mono">
              Enterprise Audit & Compliance Registry
            </h3>
          </div>
          <p className="text-xs text-[#7A7067] mt-1 font-sans">
            Immutable telemetry records tracking all screening transactions across Web & Active Shield Chrome Extension.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={fetchLogs}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#DFD8CD] text-xs text-[#2C2623] hover:bg-white hover:border-[#C5A880] transition-colors disabled:opacity-50 font-mono shadow-sm"
            title="Refresh logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#C5A880] ${isLoading ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#B59468] text-[#1F1A18] text-xs font-mono font-bold tracking-wider uppercase transition shadow-sm hover:shadow-md disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-[#1F1A18]" />
            <span>{isExporting ? 'Generating...' : 'Export Compliance CSV'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#7A7067] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Scan ID, text preview, or client..."
            className="w-full bg-[#FAF8F5] border border-[#DFD8CD] rounded-xl pl-9 pr-3 py-2 text-xs text-[#2C2623] placeholder-[#9E948B] focus:bg-white focus:outline-none focus:border-[#C5A880] font-mono shadow-inner-soft"
          />
        </div>

        {/* Decision Filters */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-xs">
          <Filter className="w-3.5 h-3.5 text-[#C5A880] mr-1" />
          {['ALL', 'ALLOW', 'FLAG_FOR_REVIEW', 'RESTRICT'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterDecision(status)}
              className={`px-2.5 py-1 rounded-lg border transition-colors ${
                filterDecision === status
                  ? 'bg-[#F7F2EA] border-[#C5A880] text-[#1F1A18] font-bold shadow-sm'
                  : 'bg-[#FAF8F5] border-[#DFD8CD] text-[#7A7067] hover:text-[#2C2623] hover:bg-white'
              }`}
            >
              {status.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-x-auto rounded-xl border border-[#DFD8CD] shadow-sm">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#DFD8CD] text-[#7A7067] text-[10px] uppercase tracking-wider">
              <th className="py-3 px-3">Scan ID</th>
              <th className="py-3 px-3">Timestamp (UTC)</th>
              <th className="py-3 px-3">Client</th>
              <th className="py-3 px-3">Decision</th>
              <th className="py-3 px-3">Threat Index</th>
              <th className="py-3 px-3">Flagged Vectors</th>
              <th className="py-3 px-3">Text Sample</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DFD8CD]/60 bg-white">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log) => {
                let badgeClass = "bg-[#EBF4EE] border-[#C2DFCE] text-[#24593E]";
                let icon = <CheckCircle2 className="w-3 h-3 text-[#24593E]" />;

                if (log.moderation_decision === 'RESTRICT') {
                  badgeClass = "bg-[#FAEAEA] border-[#E8C2C2] text-[#8C3535]";
                  icon = <ShieldAlert className="w-3 h-3 text-[#8C3535]" />;
                } else if (log.moderation_decision === 'FLAG_FOR_REVIEW') {
                  badgeClass = "bg-[#FAF3E3] border-[#EBD6B0] text-[#8A5D19]";
                  icon = <AlertTriangle className="w-3 h-3 text-[#8A5D19]" />;
                }

                return (
                  <tr key={log.id} className="hover:bg-[#FAF8F5] transition-colors">
                    <td className="py-2.5 px-3 text-[#2C2623] font-bold whitespace-nowrap">
                      {log.scan_id}
                    </td>
                    <td className="py-2.5 px-3 text-[#7A7067] whitespace-nowrap">
                      {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : '--'}
                    </td>
                    <td className="py-2.5 px-3 text-[#2C2623] whitespace-nowrap">
                      <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#DFD8CD] text-[10px] text-[#2C2623]">
                        {log.client_source || 'web_portal'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold shadow-sm ${badgeClass}`}>
                        {icon}
                        <span>{log.moderation_decision}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-[#2C2623] whitespace-nowrap">
                      {log.risk_score} <span className="text-[10px] text-[#7A7067] font-normal">/100</span>
                    </td>
                    <td className="py-2.5 px-3 text-[#2C2623] max-w-xs truncate">
                      {log.flagged_tokens !== 'None' ? (
                        <span className="font-semibold text-[#8A5D19]">{log.flagged_tokens}</span>
                      ) : (
                        <span className="text-[#7A7067]/60">Zero vectors</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[#7A7067] max-w-xs truncate" title={log.full_text}>
                      {log.text_preview}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#7A7067]">
                  {isLoading ? 'Loading compliance registry...' : 'No telemetry records matching filter criteria.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center text-[10px] font-mono text-[#7A7067] px-1">
        <span>Showing {filteredLogs.length} of {logs.length} logged screening events</span>
        <span>RFC 4180 Validated Export</span>
      </div>
    </div>
  );
}
