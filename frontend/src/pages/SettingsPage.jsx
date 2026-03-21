import { useState } from 'react';
import {
  DEFAULT_APP_SETTINGS,
  loadAppSettings,
  saveAppSettings,
} from '../utils/appSettings';

function SettingsPage() {
  const [form, setForm] = useState(loadAppSettings());
  const [message, setMessage] = useState('');

  function handleChange(key, value) {
    setMessage('');
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave(event) {
    event.preventDefault();
    const normalized = saveAppSettings({
      ...form,
      gstRate: Number(form.gstRate || 0),
    });
    setForm(normalized);
    setMessage('Settings saved successfully.');
  }

  function handleReset() {
    setMessage('');
    setForm({ ...DEFAULT_APP_SETTINGS });
    saveAppSettings(DEFAULT_APP_SETTINGS);
    setMessage('Settings reset to defaults.');
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Configure GST and restaurant details used in billing and print.</p>
      </header>

      <section className="panel-card">
        <form onSubmit={handleSave} style={{ display: 'grid', gap: '12px', maxWidth: '520px' }}>
          <label style={{ display: 'grid', gap: '6px' }}>
            <span>Restaurant Name</span>
            <input
              type="text"
              value={form.restaurantName}
              onChange={(event) => handleChange('restaurantName', event.target.value)}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: '6px' }}>
            <span>Restaurant Number</span>
            <input
              type="text"
              value={form.restaurantPhone}
              onChange={(event) => handleChange('restaurantPhone', event.target.value)}
            />
          </label>

          <label className="checkbox-field" style={{ width: 'fit-content' }}>
            <input
              type="checkbox"
              checked={Boolean(form.gstEnabled)}
              onChange={(event) => handleChange('gstEnabled', event.target.checked)}
            />
            Apply GST in billing
          </label>

          {form.gstEnabled ? (
            <label style={{ display: 'grid', gap: '6px' }}>
              <span>GST %</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={form.gstRate}
                onChange={(event) => handleChange('gstRate', event.target.value)}
                required
              />
            </label>
          ) : null}

          <button type="submit" className="primary-btn" style={{ width: 'fit-content' }}>
            Save Settings
          </button>
        </form>

        <div className="action-buttons" style={{ marginTop: '10px' }}>
          <button type="button" className="secondary-btn" onClick={handleReset}>
            Reset Defaults
          </button>
        </div>

        {message ? <p className="success-text">{message}</p> : null}
      </section>
    </main>
  );
}

export default SettingsPage;
