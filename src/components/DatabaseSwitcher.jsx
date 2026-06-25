import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../config/apiConfig';
import './DatabaseSwitcher.css';

const DATABASE_OPTIONS = [
  { value: 'local_sqlite', label: 'Local SQLite' },
  { value: 'local_postgres', label: 'Local PostgreSQL' },
  { value: 'cloud_postgres', label: 'Cloud PostgreSQL' },
];

const DEFAULT_FORMS = {
  local_postgres: {
    host: 'localhost',
    port: '5432',
    database: 'warehouse_dev',
    username: 'postgres',
    password: 'postgres',
    ssl: false,
  },
  cloud_postgres: {
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
    ssl: true,
  },
};

const parseError = async (response) => {
  try {
    const data = await response.json();
    return data.error || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
};

export default function DatabaseSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState('local_sqlite');
  const [forms, setForms] = useState(DEFAULT_FORMS);
  const [status, setStatus] = useState('');
  const [activeDatabase, setActiveDatabase] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  const isPostgres = selectedType === 'local_postgres' || selectedType === 'cloud_postgres';
  const selectedForm = forms[selectedType] || {};

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/db/status`);
        if (!response.ok) throw new Error(await parseError(response));
        const data = await response.json();
        setActiveDatabase(data.database?.config?.type || data.database?.dialect || '');
      } catch (error) {
        setActiveDatabase('unavailable');
        setStatus(error instanceof Error ? error.message : 'DB status unavailable');
      }
    };

    loadStatus();
  }, []);

  const updateField = (field, value) => {
    setForms((current) => ({
      ...current,
      [selectedType]: {
        ...current[selectedType],
        [field]: value,
      },
    }));
  };

  const buildPayload = () => {
    if (selectedType === 'local_sqlite') {
      return { type: 'local_sqlite' };
    }

    return {
      type: selectedType,
      host: selectedForm.host,
      port: selectedForm.port,
      database: selectedForm.database,
      username: selectedForm.username,
      password: selectedForm.password,
      ssl: Boolean(selectedForm.ssl),
    };
  };

  const sendDatabaseRequest = async (path) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload()),
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return response.json();
  };

  const testConnection = async ({ quiet = false } = {}) => {
    setIsBusy(true);
    if (!quiet) setStatus('測試連接中...');

    try {
      const data = await sendDatabaseRequest('/db/test');
      const dialect = data.database?.dialect || 'database';
      if (!quiet) setStatus(`連接成功: ${dialect}`);
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : '連接失敗';
      setStatus(`無法連接: ${message}`);
      return { ok: false };
    } finally {
      setIsBusy(false);
    }
  };

  const switchDatabase = async () => {
    setIsBusy(true);
    setStatus(selectedType === 'local_sqlite' ? '切換 SQLite 中...' : '測試連接中...');

    try {
      if (isPostgres) {
        const testResult = await sendDatabaseRequest('/db/test')
          .then(() => ({ ok: true }))
          .catch((error) => {
            const message = error instanceof Error ? error.message : '連接失敗';
            setStatus(`無法連接: ${message}`);
            return { ok: false };
          });

        if (!testResult.ok) return;
      }

      setStatus('切換 DB 中...');
      await sendDatabaseRequest('/db/switch');
      setStatus('切換成功，重新載入畫面...');

      window.setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : '切換失敗';
      setStatus(`切換失敗: ${message}`);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="db-switcher">
      <button
        className="db-switcher__trigger"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
      >
        DB
      </button>

      {isOpen && (
        <div className="db-switcher__panel">
          <div className="db-switcher__header">
            <span className="db-switcher__title">Database</span>
            <span className="db-switcher__status">Current: {activeDatabase || 'loading'}</span>
          </div>

          <label className="db-switcher__field">
            <span>DB Type</span>
            <select
              value={selectedType}
              onChange={(event) => {
                setSelectedType(event.target.value);
                setStatus('');
              }}
            >
              {DATABASE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {isPostgres && (
            <div className="db-switcher__fields">
              <label className="db-switcher__field">
                <span>Host</span>
                <input
                  value={selectedForm.host}
                  onChange={(event) => updateField('host', event.target.value)}
                  placeholder="localhost"
                />
              </label>
              <label className="db-switcher__field">
                <span>Port</span>
                <input
                  value={selectedForm.port}
                  onChange={(event) => updateField('port', event.target.value)}
                  placeholder="5432"
                />
              </label>
              <label className="db-switcher__field">
                <span>Database</span>
                <input
                  value={selectedForm.database}
                  onChange={(event) => updateField('database', event.target.value)}
                  placeholder="warehouse_dev"
                />
              </label>
              <label className="db-switcher__field">
                <span>User</span>
                <input
                  value={selectedForm.username}
                  onChange={(event) => updateField('username', event.target.value)}
                  placeholder="postgres"
                />
              </label>
              <label className="db-switcher__field">
                <span>Password</span>
                <input
                  type="password"
                  value={selectedForm.password}
                  onChange={(event) => updateField('password', event.target.value)}
                />
              </label>
              <label className="db-switcher__check">
                <input
                  type="checkbox"
                  checked={Boolean(selectedForm.ssl)}
                  onChange={(event) => updateField('ssl', event.target.checked)}
                />
                <span>Use SSL</span>
              </label>
            </div>
          )}

          <div className="db-switcher__actions">
            {isPostgres && (
              <button type="button" onClick={() => testConnection()} disabled={isBusy}>
                測試連接
              </button>
            )}
            <button
              className="db-switcher__switch"
              type="button"
              onClick={switchDatabase}
              disabled={isBusy}
            >
              切換DB
            </button>
          </div>

          {status && <p className="db-switcher__message">{status}</p>}
        </div>
      )}
    </div>
  );
}
