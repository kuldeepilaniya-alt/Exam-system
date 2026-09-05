import React, { useState } from 'react';
import {
  Check,
  Edit2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  Key,
  Phone,
  Plus,
  RefreshCw,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { TeacherUser } from '../types';
import { ORDERED_CLASSES } from '../data/mockDatabase';
import { ConfirmationModal } from './ConfirmationModal';

interface TeachersManagerProps {
  teachers: TeacherUser[];
  activeTeacher: TeacherUser;
  onUpdateTeachers: (teachers: TeacherUser[]) => void;
  onSaveToDatabase?: () => void;
  isSyncing?: boolean;
}

export const TeachersManager: React.FC<TeachersManagerProps> = ({
  teachers,
  activeTeacher,
  onUpdateTeachers,
  onSaveToDatabase,
  isSyncing = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherUser | null>(null);
  const [deleteTargetTeacher, setDeleteTargetTeacher] = useState<TeacherUser | null>(null);

  // Form states for Add / Edit
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [assignedClass, setAssignedClass] = useState('All Classes');
  const [role, setRole] = useState<'Teacher' | 'Principal' | 'Admin'>('Teacher');

  // Show / Hide PINs in table
  const [showPins, setShowPins] = useState<{ [id: string]: boolean }>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const togglePinVisibility = (id: string) => {
    setShowPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddModal = () => {
    setName('');
    setMobile('');
    setPin(Math.floor(1000 + Math.random() * 9000).toString());
    setAssignedClass('10A');
    setRole('Teacher');
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (teacher: TeacherUser) => {
    setEditingTeacher(teacher);
    setName(teacher.name);
    setMobile(teacher.mobile);
    setPin(teacher.pin);
    setAssignedClass(teacher.assignedClass || 'All Classes');
    setRole(teacher.role);
  };

  const handleSaveAddTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !pin.trim()) return;

    // Check duplicate mobile
    if (teachers.some((t) => t.mobile === mobile.trim())) {
      alert('A teacher with this mobile number already exists.');
      return;
    }

    const newTeacher: TeacherUser = {
      id: `TCH-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      mobile: mobile.trim(),
      pin: pin.trim(),
      assignedClass: assignedClass,
      role: role,
    };

    const updated = [...teachers, newTeacher];
    onUpdateTeachers(updated);
    setIsAddModalOpen(false);
    setFeedbackMessage(`✓ Added teacher "${newTeacher.name}" successfully.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleSaveEditTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    if (!name.trim() || !mobile.trim() || !pin.trim()) return;

    // Check duplicate mobile with another teacher
    if (teachers.some((t) => t.id !== editingTeacher.id && t.mobile === mobile.trim())) {
      alert('Another teacher is already using this mobile number.');
      return;
    }

    const updated = teachers.map((t) => {
      if (t.id === editingTeacher.id) {
        return {
          ...t,
          name: name.trim(),
          mobile: mobile.trim(),
          pin: pin.trim(),
          assignedClass: assignedClass,
          role: role,
        };
      }
      return t;
    });

    onUpdateTeachers(updated);
    setEditingTeacher(null);
    setFeedbackMessage(`✓ Updated details for "${name.trim()}".`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleConfirmDeleteTeacher = () => {
    if (!deleteTargetTeacher) return;
    if (teachers.length <= 1) {
      alert('Cannot delete the only remaining teacher account.');
      setDeleteTargetTeacher(null);
      return;
    }

    const targetName = deleteTargetTeacher.name;
    const updated = teachers.filter((t) => t.id !== deleteTargetTeacher.id);
    onUpdateTeachers(updated);
    setDeleteTargetTeacher(null);
    setFeedbackMessage(`✓ Teacher "${targetName}" removed from staff list.`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.mobile.includes(searchQuery) ||
      (t.assignedClass && t.assignedClass.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = selectedRoleFilter === 'ALL' || t.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight sm:text-2xl">
                  Teacher &amp; Staff Management
                </h2>
                <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-black text-indigo-800">
                  {teachers.length} Faculty
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 font-medium">
                Manage educator accounts, class assignments, 4-digit secure access PINs, and administrative permissions.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onSaveToDatabase && (
              <button
                type="button"
                onClick={onSaveToDatabase}
                disabled={isSyncing}
                id="sync-teachers-sheet-btn"
                className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-sm active:scale-95 transition disabled:opacity-60"
              >
                <FileSpreadsheet className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing to Sheets...' : 'Save & Sync to Google Sheets'}</span>
              </button>
            )}
            <button
              type="button"
              id="add-teacher-btn"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-slate-800 active:scale-95 transition"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add New Teacher</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedbackMessage && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 animate-fadeIn">
            {feedbackMessage}
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 pt-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1">
              Role:
            </span>
            {['ALL', 'Principal', 'Teacher', 'Admin'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setSelectedRoleFilter(r)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedRoleFilter === r
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : r}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teacher by name, mobile, class..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-3 pr-8 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Editable Table Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-3.5 px-5">Teacher</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Assigned Class</th>
                <th className="py-3.5 px-4">Mobile (Login)</th>
                <th className="py-3.5 px-4">Security PIN</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-medium text-xs">
                    No faculty found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((t) => {
                  const isCurrentUser = activeTeacher && activeTeacher.id === t.id;
                  const isVisible = showPins[t.id];

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                      {/* Name & ID */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-black text-slate-700 text-xs uppercase">
                            {t.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{t.name}</span>
                              {isCurrentUser && (
                                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[9px] font-black uppercase text-indigo-700">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400">{t.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider ${
                            t.role === 'Principal'
                              ? 'bg-amber-100 text-amber-800'
                              : t.role === 'Admin'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {t.role === 'Principal' && <ShieldCheck className="h-3 w-3" />}
                          {t.role}
                        </span>
                      </td>

                      {/* Assigned Class */}
                      <td className="py-4 px-4">
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          {t.assignedClass || 'All Classes'}
                        </span>
                      </td>

                      {/* Mobile */}
                      <td className="py-4 px-4 font-mono font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{t.mobile}</span>
                        </div>
                      </td>

                      {/* PIN */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-1 rounded-lg text-slate-800">
                            {isVisible ? t.pin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinVisibility(t.id)}
                            className="text-slate-400 hover:text-slate-600 p-1"
                            title={isVisible ? 'Hide PIN' : 'Show PIN'}
                          >
                            {isVisible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(t)}
                            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition"
                          >
                            <Edit2 className="h-3 w-3 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            disabled={isCurrentUser || teachers.length <= 1}
                            onClick={() => setDeleteTargetTeacher(t)}
                            title={
                              isCurrentUser
                                ? 'Cannot delete your active login account'
                                : 'Delete teacher account'
                            }
                            className={`flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition ${
                              isCurrentUser || teachers.length <= 1
                                ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                                : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:border-rose-300'
                            }`}
                          >
                            <Trash2 className="h-3 w-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Add New Teacher / Staff
                  </h3>
                  <p className="text-xs text-slate-500">Create login credentials and class access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddTeacher} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Narendra Singh Chauhan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Mobile Number (Login ID) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    4-Digit Access PIN *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="e.g. 1234"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'Teacher' | 'Principal' | 'Admin')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-bold"
                  >
                    <option value="Teacher">Teacher (Class Incharge)</option>
                    <option value="Principal">Principal (Full Access)</option>
                    <option value="Admin">Admin (System Manager)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Assigned Class *
                  </label>
                  <select
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-bold"
                  >
                    <option value="All Classes">All Classes (Full Oversight)</option>
                    {ORDERED_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Create Teacher Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Edit2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    Edit Teacher Details
                  </h3>
                  <p className="text-xs text-slate-500">{editingTeacher.name} ({editingTeacher.id})</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTeacher} className="mt-4 space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Mobile Number (Login ID) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    4-Digit Access PIN *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-mono font-bold text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'Teacher' | 'Principal' | 'Admin')}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-bold"
                  >
                    <option value="Teacher">Teacher (Class Incharge)</option>
                    <option value="Principal">Principal (Full Access)</option>
                    <option value="Admin">Admin (System Manager)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                    Assigned Class *
                  </label>
                  <select
                    value={assignedClass}
                    onChange={(e) => setAssignedClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-hidden transition font-bold"
                  >
                    <option value="All Classes">All Classes (Full Oversight)</option>
                    {ORDERED_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deleteTargetTeacher}
        title="Delete Teacher Account?"
        message={`Are you sure you want to permanently remove "${deleteTargetTeacher?.name}" (${deleteTargetTeacher?.mobile}) from the faculty roster?`}
        confirmLabel="Delete Teacher"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteTeacher}
        onCancel={() => setDeleteTargetTeacher(null)}
      />
    </div>
  );
};
