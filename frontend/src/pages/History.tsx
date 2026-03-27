import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { listHistory, deleteHistory } from '@/api/files';
import { useSynthesisStore } from '@/stores/synthesis';
import { useToast } from '@/components/Toast';
import { HistoryRow } from '@/components/HistoryRow';
import type { HistoryRecord } from '@/api/types';

export function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const navigate = useNavigate();
  const { setParams, setParam, setText } = useSynthesisStore();
  const { showToast } = useToast();

  const refresh = useCallback(() => {
    listHistory().then(setRecords).catch(console.error);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleUseSettings = (record: HistoryRecord) => {
    setParams(record.params);
    setText(record.text);
    if (record.params.seed !== null) {
      setParam('seed', record.params.seed);
    }
    showToast('Settings loaded. Navigating to Synthesis.', 'success');
    navigate('/');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteHistory(id);
      showToast('History entry deleted.', 'success');
      refresh();
    } catch (err) {
      showToast(`Failed to delete: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  return (
    <>
      <header className="hero">
        <h1 className="hero-title">Generation History</h1>
        <p className="hero-sub">Browse and replay your past alchemical transmutations.</p>
      </header>

      {records.length === 0 ? (
        <p style={{ color: 'var(--on-surface-muted)' }}>No generations yet. Head to Synthesis to create your first one.</p>
      ) : (
        records.map((record) => (
          <HistoryRow
            key={record.id}
            record={record}
            onUseSettings={handleUseSettings}
            onDelete={handleDelete}
          />
        ))
      )}
    </>
  );
}
