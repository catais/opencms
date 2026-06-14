'use client';

import React, { useState, useEffect } from 'react';

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  roleId: string;
  createdAt: string;
  role: Role;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Invite/create staff drawer state
  const [isInviteDrawerOpen, setIsInviteDrawerOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    roleId: '',
  });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Loading indicator for direct action items
  const [actioningUserId, setActioningUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsersAndRoles();
  }, []);

  const fetchUsersAndRoles = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/users');
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to load user and role directory');
      }
      const json = await res.json();
      if (json.success) {
        setUsers(json.data.users || []);
        setRoles(json.data.roles || []);
        if (json.data.roles && json.data.roles.length > 0 && !newUser.roleId) {
          setNewUser(prev => ({ ...prev, roleId: json.data.roles[0].id }));
        }
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error loading user listings');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, targetRoleId: string) => {
    try {
      setActioningUserId(userId);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_role',
          userId,
          roleId: targetRoleId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`User role successfully updated to "${json.data.role.name}"`);
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchUsersAndRoles();
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred updating user role');
    } finally {
      setActioningUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this staff user? This will revoke all dashboard panel access immediately.')) return;

    try {
      setActioningUserId(userId);
      setErrorMsg(null);
      setSuccessMsg(null);

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          userId,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg('Staff member removed successfully from system');
        setTimeout(() => setSuccessMsg(null), 4000);
        fetchUsersAndRoles();
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error deleting user account');
    } finally {
      setActioningUserId(null);
    }
  };

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setInviting(true);
      setInviteError(null);

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...newUser,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(`Staff profile for "${newUser.name}" successfully created!`);
        setTimeout(() => setSuccessMsg(null), 4000);
        setNewUser({
          name: '',
          email: '',
          password: '',
          roleId: roles[0]?.id || '',
        });
        setIsInviteDrawerOpen(false);
        fetchUsersAndRoles();
      } else {
        throw new Error(json.message);
      }
    } catch (e: any) {
      setInviteError(e.message || 'Error creating user profile');
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            <i className="ri-shield-user-line text-blue-600"></i>
            Users & Roles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Audit store administrators, manage content editors, re-assign group roles, and secure access permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setInviteError(null);
            setIsInviteDrawerOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
        >
          <i className="ri-user-add-line"></i> Create New Staff
        </button>
      </div>

      {/* 2. Success/Error Notifiers */}
      {successMsg && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn shadow-sm">
          <i className="ri-checkbox-circle-line text-base"></i>
          <span className="font-semibold text-xxs">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs rounded-xl flex items-center gap-2 animate-fadeIn shadow-sm">
          <i className="ri-error-warning-line text-base"></i>
          <span className="font-semibold text-xxs">{errorMsg}</span>
        </div>
      )}

      {/* 3. Users Table list */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading user profiles...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xxs uppercase tracking-wider text-slate-400 font-bold bg-slate-50/50 dark:bg-slate-950/20">
                  <th className="p-4">User Details</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Registration Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {users.map(user => {
                  const isActioning = actioningUserId === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-inner uppercase shrink-0">
                          {user.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-200">{user.name}</p>
                          <p className="text-xxs text-slate-400">{user.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          disabled={isActioning}
                          value={user.roleId}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className="bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 p-1.5 rounded-lg text-xxs text-slate-600 dark:text-slate-300 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {roles.map(r => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4 text-slate-400 text-xxs">
                        {new Date(user.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          disabled={isActioning}
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-xs disabled:opacity-40"
                          title="Delete User staff"
                        >
                          {isActioning ? (
                            <i className="ri-loader-4-line animate-spin"></i>
                          ) : (
                            <i className="ri-delete-bin-line"></i>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE STAFF DRAWER OVERLAY */}
      {isInviteDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsInviteDrawerOpen(false)} />
          
          <div className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl p-6 border-l dark:border-slate-800 flex flex-col justify-between">
            <div className="space-y-6 overflow-y-auto pr-1 flex-1">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <i className="ri-user-add-line text-blue-600"></i> Register New Staff User
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Invite store administrators, store managers, and editor nodes.</p>
                </div>
                <button
                  onClick={() => setIsInviteDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100"
                >
                  <i className="ri-close-line text-slate-500"></i>
                </button>
              </div>

              {inviteError && (
                <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xxs rounded-lg">
                  {inviteError}
                </div>
              )}

              <form onSubmit={handleInviteStaff} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Staff Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clark Kent"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="clark@opencms.com"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Temporary Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Group Role Permissions</label>
                  <select
                    value={newUser.roleId}
                    onChange={(e) => setNewUser(prev => ({ ...prev, roleId: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-2 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} — {r.description || 'No description'}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20 text-xxs flex items-center justify-center gap-1"
                >
                  {inviting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin"></i> Creating profile...
                    </>
                  ) : (
                    'Create Staff Account'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
