import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRecords } from '../hooks/useRecords';

const CATEGORIES = ['Work', 'Personal', 'Finance', 'Health', 'Education', 'Other'];
const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const emptyForm = {
  title: '',
  description: '',
  category: 'Work',
  priority: 'Medium',
};

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { records, loading, error, createRecord, updateRecord, deleteRecord } =
    useRecords();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [banner, setBanner] = useState({ type: null, text: '' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const showSuccess = useCallback((text) => {
    setBanner({ type: 'success', text });
  }, []);

  useEffect(() => {
    if (banner.type !== 'success' || !banner.text) return undefined;
    const t = setTimeout(() => setBanner({ type: null, text: '' }), 3000);
    return () => clearTimeout(t);
  }, [banner]);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setFormError('');
  }

  function startEdit(record) {
    setEditingId(record.id);
    setForm({
      title: record.title || '',
      description: record.description || '',
      category: record.category || 'Other',
      priority: record.priority || 'Medium',
    });
    setFormError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) {
      setFormError('Title is required');
      return;
    }
    setSaving(true);
    setBanner({ type: null, text: '' });
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        category: form.category,
        priority: form.priority,
      };
      if (editingId) {
        await updateRecord(editingId, payload);
        showSuccess('Record updated.');
      } else {
        await createRecord(payload);
        showSuccess('Record created.');
      }
      resetForm();
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Something went wrong',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    setBanner({ type: null, text: '' });
    try {
      await deleteRecord(id);
      if (editingId === id) resetForm();
      showSuccess('Record deleted.');
    } catch (err) {
      setBanner({
        type: 'error',
        text: err.response?.data?.error || err.message || 'Delete failed',
      });
    }
  }

  function signOut() {
    logout();
    navigate('/login', { replace: true });
  }

  const formatDate = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-nav">
        <span className="brand">My CRUD App</span>
        <div className="user-meta">
          <span>
            Hi, <strong>{user?.first_name || 'there'}</strong>
          </span>
          <button type="button" className="btn btn-ghost" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <section className="panel">
          <h3>{editingId ? 'Edit Record' : 'Add New Record'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="rec-title">Title</label>
              <input
                id="rec-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="rec-desc">Description (optional)</label>
              <textarea
                id="rec-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: 'var(--bg)',
                  color: 'var(--text)',
                  resize: 'vertical',
                }}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rec-cat">Category</label>
                <select
                  id="rec-cat"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="rec-pri">Priority</label>
                <select
                  id="rec-pri"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {formError ? <div className="msg-error">{formError}</div> : null}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: 'auto' }}>
                {saving ? 'Saving…' : editingId ? 'Update' : 'Save'}
              </button>
              {editingId ? (
                <button type="button" className="btn btn-ghost" onClick={resetForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
          {banner.type === 'success' ? <div className="msg-success">{banner.text}</div> : null}
          {banner.type === 'error' ? <div className="msg-error">{banner.text}</div> : null}
        </section>

        <section className="panel">
          <h3>Your records</h3>
          {loading ? (
            <div className="page-center" style={{ minHeight: 120 }}>
              <div className="spinner" aria-label="Loading records" />
            </div>
          ) : null}
          {!loading && records.length === 0 ? (
            <div className="empty-state">No records yet. Add one above.</div>
          ) : null}
          {!loading && records.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id}>
                      <td>{r.title}</td>
                      <td>{r.category || '—'}</td>
                      <td>{r.priority || '—'}</td>
                      <td>{formatDate(r.created_at)}</td>
                      <td>
                        <div className="actions-cell">
                          <button type="button" className="btn-sm" onClick={() => startEdit(r)}>
                            Edit
                          </button>
                          <button type="button" className="btn-danger" onClick={() => handleDelete(r.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {error && !loading ? <div className="msg-error" style={{ marginTop: '1rem' }}>{error}</div> : null}
        </section>
      </main>
    </div>
  );
}
