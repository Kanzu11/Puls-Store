import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAdminUsers,
  updateAdminUserRole,
  createOrPromoteAdminUser,
} from '../lib/api';
import { toast } from '../components/Toaster';
import {
  Shield,
  ShieldCheck,
  UserPlus,
  Loader2,
  X,
  Search,
  AtSign,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import type { UserDTO, Role } from '../types';

const inputClass =
  'w-full border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs bg-white text-zinc-950 focus:outline-none focus:border-zinc-950 transition-colors placeholder:text-zinc-400';

export function Users() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    telegramUsername: '',
    role: 'ADMIN' as Role,
  });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: fetchAdminUsers,
    refetchInterval: 15_000,
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: Role }) => updateAdminUserRole(id, role),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success(
        vars.role === 'ADMIN' ? 'Admin Promoted' : 'Admin Revoked',
        `User permissions updated to ${vars.role}`
      );
    },
    onError: () => toast.error('Update Failed', 'Could not update user role'),
  });

  const addMutation = useMutation({
    mutationFn: createOrPromoteAdminUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      qc.invalidateQueries({ queryKey: ['admin-stats'] });
      toast.success('Permissions Saved', `Authorized ${form.telegramUsername || form.email}`);
      setShowAddModal(false);
      setForm({ name: '', email: '', telegramUsername: '', role: 'ADMIN' });
    },
    onError: () => toast.error('Save Failed', 'Could not authorize user'),
  });

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name || '').toLowerCase().includes(q) ||
      (u.telegramUsername || '').toLowerCase().includes(q)
    );
  });

  const adminsCount = users.filter(u => u.role === 'ADMIN').length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Access Control · {adminsCount} Admin(s)
          </p>
          <h2 className="text-sm font-bold text-zinc-950">
            Registered Users ({users.length})
          </h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-zinc-950 text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Admin</span>
        </button>
      </div>

      {/* Primary Owner Notice */}
      <div className="bg-zinc-950 text-white rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs font-bold">Role-Based Access Control</p>
            <p className="text-[11px] text-zinc-400">
              Synchronized with Telegram Bot & Storefront DB
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, or @telegram..."
          className="w-full pl-9 pr-4 py-2.5 text-xs bg-white border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-950"
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-zinc-200 rounded-2xl p-12 text-center text-xs text-zinc-400">
          No matching users found.
        </div>
      ) : (
        <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden divide-y divide-zinc-100 shadow-sm">
          {filtered.map((user: UserDTO) => {
            const isAdmin = user.role === 'ADMIN';
            const isProtectedOwner = isAdmin && adminsCount <= 1;

            return (
              <div
                key={user.id}
                className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-zinc-950 truncate">
                      {user.name || user.email.split('@')[0]}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAdmin
                          ? 'bg-zinc-950 text-white'
                          : 'bg-zinc-100 text-zinc-600'
                      }`}
                    >
                      {isAdmin && <Shield className="w-2.5 h-2.5" />}
                      {user.role}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-500 truncate mt-0.5">{user.email}</p>

                  <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                    {user.telegramUsername && (
                      <span className="font-mono font-semibold text-zinc-700">
                        @{user.telegramUsername}
                      </span>
                    )}
                    <span>·</span>
                    <span>{user.orderCount ?? 0} order(s)</span>
                    <span>·</span>
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isAdmin ? (
                    <button
                      disabled={isProtectedOwner || roleMutation.isPending}
                      onClick={() => roleMutation.mutate({ id: user.id, role: 'CUSTOMER' })}
                      className="px-3 py-1.5 rounded-xl border border-zinc-200 text-[11px] font-semibold text-zinc-700 hover:border-rose-300 hover:text-rose-700 disabled:opacity-40 transition-colors"
                    >
                      {isProtectedOwner ? 'Owner' : 'Revoke Admin'}
                    </button>
                  ) : (
                    <button
                      disabled={roleMutation.isPending}
                      onClick={() => roleMutation.mutate({ id: user.id, role: 'ADMIN' })}
                      className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white text-[11px] font-semibold hover:bg-zinc-800 disabled:opacity-40 transition-colors shadow-sm"
                    >
                      Make Admin
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Promote Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-zinc-950/40 z-50 flex items-end justify-center backdrop-blur-[2px]">
          <div className="bg-white w-full max-w-lg rounded-t-3xl max-h-[90vh] overflow-y-auto animate-slide-up shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 sticky top-0 bg-white z-10">
              <h3 className="font-bold text-sm text-zinc-950">Authorize User / Admin</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-100 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                addMutation.mutate(form);
              }}
              className="p-6 space-y-4"
            >
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Operator Name"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Telegram Username
                </label>
                <div className="relative">
                  <AtSign className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={form.telegramUsername}
                    onChange={e => setForm(p => ({ ...p, telegramUsername: e.target.value }))}
                    placeholder="username"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com"
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Assigned Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['ADMIN', 'CUSTOMER'] as Role[]).map(r => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setForm(p => ({ ...p, role: r }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                        form.role === r
                          ? 'bg-zinc-950 text-white border-zinc-950'
                          : 'bg-white text-zinc-700 border-zinc-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={addMutation.isPending || (!form.email && !form.telegramUsername)}
                className="w-full bg-zinc-950 text-white py-3.5 rounded-xl font-semibold text-xs hover:bg-zinc-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {addMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save User Permissions</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

