import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { databaseService } from '../../services/databaseService';
import { AuditLog } from '../../types';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void databaseService.getAuditLogs().then((rows) => {
      if (active) {
        setLoadError(null);
        setLogs(rows);
      }
    }).catch((error: unknown) => {
      console.error('Failed to load audit logs:', error);
      if (active) setLoadError(error instanceof Error ? error.message : 'Audit logs are unavailable.');
    });
    return () => { active = false; };
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      (l.actor_name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Security & Audit Trail</h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable event log of administrative modifications, credential resets, and venue creations
        </p>
      </div>

      {loadError && <p role="alert" className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">{loadError}</p>}

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-subtle flex items-center justify-between">
        <div className="w-full sm:w-80">
          <Input
            placeholder="Search audit trail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="py-1.5 text-xs"
          />
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {filteredLogs.length} events logged
        </span>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-5">Actor</th>
                <th className="py-3.5 px-5">Action</th>
                <th className="py-3.5 px-5">Target Entity</th>
                <th className="py-3.5 px-5">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-5 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="py-3.5 px-5 font-sans">
                    <span className="font-semibold text-slate-800">{log.actor_name || 'System'}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge variant="primary" size="sm">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-5 text-slate-600">
                    {log.entity_type} ({log.entity_id.substring(0, 8)}...)
                  </td>
                  <td className="py-3.5 px-5 text-slate-500 text-[11px] max-w-xs truncate font-mono">
                    {JSON.stringify(log.metadata || {})}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
