import { useEffect, useState } from 'react';
import { userApi } from '../services/api';

const roles = ['admin', 'cashier', 'waiter', 'kitchen'];

function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [nextRole, setNextRole] = useState('waiter');
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    password: '',
    role: 'waiter',
    is_active: true,
  });

  async function loadUsers() {
    try {
      setLoading(true);
      setError('');
      const response = await userApi.getUsers();
      setUsers(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreateUser(event) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError('');
      setSuccessMessage('');

      await userApi.createUser({
        full_name: formData.full_name.trim(),
        username: formData.username.trim(),
        password: formData.password,
        role: formData.role,
        is_active: formData.is_active,
      });

      setFormData({
        full_name: '',
        username: '',
        password: '',
        role: 'waiter',
        is_active: true,
      });

      setSuccessMessage('User created successfully.');
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateUser(userId, payload, successText = '') {
    try {
      setError('');
      setSuccessMessage('');
      await userApi.updateUser(userId, payload);
      if (successText) {
        setSuccessMessage(successText);
      }
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to update user');
    }
  }

  function openRoleModal(user) {
    setRoleModalUser(user);
    setNextRole(user.role);
  }

  async function handleSubmitRoleUpdate() {
    if (!roleModalUser) return;
    await handleUpdateUser(roleModalUser.id, { role: nextRole }, 'User role updated.');
    setRoleModalUser(null);
  }

  function openPasswordModal(user) {
    setPasswordModalUser(user);
    setPasswordForm({ password: '', confirmPassword: '' });
    setError('');
    setSuccessMessage('');
  }

  async function handleSubmitPasswordUpdate() {
    if (!passwordModalUser) return;

    const nextPassword = passwordForm.password.trim();
    const confirmPassword = passwordForm.confirmPassword.trim();

    if (!nextPassword || !confirmPassword) {
      setError('Both password fields are required.');
      return;
    }

    if (nextPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (nextPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    await handleUpdateUser(
      passwordModalUser.id,
      { password: nextPassword },
      'Password updated successfully.'
    );
    setPasswordModalUser(null);
    setPasswordForm({ password: '', confirmPassword: '' });
  }

  return (
    <main className="page-shell">
      <header className="page-header">
        <h1>Admin - Users & Permissions</h1>
        <p>Create users and assign role permissions for cashier, waiter, kitchen, and admin.</p>
      </header>

      <section className="admin-form-card">
        <h2>Create User</h2>
        <form className="user-form" onSubmit={handleCreateUser}>
          <input
            type="text"
            placeholder="Full name"
            value={formData.full_name}
            onChange={(event) => setFormData((prev) => ({ ...prev, full_name: event.target.value }))}
            required
          />

          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(event) => setFormData((prev) => ({ ...prev, username: event.target.value }))}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(event) => setFormData((prev) => ({ ...prev, password: event.target.value }))}
            required
          />

          <select
            value={formData.role}
            onChange={(event) => setFormData((prev) => ({ ...prev, role: event.target.value }))}
          >
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.checked }))}
            />
            Active
          </label>

          <button type="submit" className="primary-btn" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </section>

      {loading ? <p className="info-text">Loading users...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {successMessage ? <p className="success-text">{successMessage}</p> : null}

      {!loading ? (
        <section className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>{user.username}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    <span className={user.is_active ? 'paid-text' : 'error-text'}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="users-table-actions">
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => openRoleModal(user)}
                      >
                        Change Role
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => openPasswordModal(user)}
                      >
                        Change Password
                      </button>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() =>
                          handleUpdateUser(
                            user.id,
                            {
                              is_active: !user.is_active,
                            },
                            `User ${user.is_active ? 'disabled' : 'enabled'}.`
                          )
                        }
                      >
                        {user.is_active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {roleModalUser ? (
        <div className="checkout-overlay" role="dialog" aria-modal="true" aria-label="Change role">
          <button
            type="button"
            className="checkout-overlay-backdrop"
            onClick={() => setRoleModalUser(null)}
            aria-label="Close role dialog"
          />
          <div className="checkout-overlay-panel">
            <section className="admin-form-card">
              <h2>Change Role</h2>
              <p className="muted-text">{roleModalUser.full_name} ({roleModalUser.username})</p>
              <div className="user-role-modal-row">
                <select value={nextRole} onChange={(event) => setNextRole(event.target.value)}>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <button type="button" className="primary-btn" onClick={handleSubmitRoleUpdate}>
                  Save Role
                </button>
                <button type="button" className="secondary-btn" onClick={() => setRoleModalUser(null)}>
                  Cancel
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {passwordModalUser ? (
        <div className="checkout-overlay" role="dialog" aria-modal="true" aria-label="Change password">
          <button
            type="button"
            className="checkout-overlay-backdrop"
            onClick={() => setPasswordModalUser(null)}
            aria-label="Close password dialog"
          />
          <div className="checkout-overlay-panel">
            <section className="admin-form-card">
              <h2>Change Password</h2>
              <p className="muted-text">
                {passwordModalUser.full_name} ({passwordModalUser.username})
              </p>
              <div className="user-role-modal-row">
                <input
                  type="password"
                  placeholder="New password"
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, password: event.target.value }))
                  }
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                  }
                />
                <button type="button" className="primary-btn" onClick={handleSubmitPasswordUpdate}>
                  Save Password
                </button>
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setPasswordModalUser(null)}
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default UsersPage;
