import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  Calendar,
  CheckCircle,
  XCircle,
  Check,
  X,
  Plus,
  Trash2,
  Clock,
  IndianRupee,
  Briefcase
} from 'lucide-react';
import { Staff, Attendance, LanguageType } from '../types';
import { translations } from '../translations';

interface StaffAttendanceViewProps {
  staff: Staff[];
  attendance: Attendance[];
  onAddStaff: (name: string, role: string, salary: number) => void;
  onDeleteStaff: (id: string) => void;
  onSaveAttendance: (date: string, status: Record<string, 'Present' | 'Absent'>) => void;
  lang: LanguageType;
}

export default function StaffAttendanceView({
  staff,
  attendance,
  onAddStaff,
  onDeleteStaff,
  onSaveAttendance,
  lang,
}: StaffAttendanceViewProps) {
  const t = translations[lang];

  // UI state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [successMsg, setSuccessMsg] = useState('');

  // Form Fields - New Staff
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('');
  const [staffSalary, setStaffSalary] = useState('');

  // Local Attendance Marking Map
  // staffId -> 'Present' | 'Absent'
  const [dailyStatus, setDailyStatus] = useState<Record<string, 'Present' | 'Absent'>>({});

  // When date or staff list changes, load existing attendance if logged
  useEffect(() => {
    const existingLog = attendance.find((a) => a.date === selectedDate);
    const initialMap: Record<string, 'Present' | 'Absent'> = {};

    staff.forEach((member) => {
      if (existingLog && existingLog.status[member.id]) {
        initialMap[member.id] = existingLog.status[member.id];
      } else {
        // Default to Present
        initialMap[member.id] = 'Present';
      }
    });

    setDailyStatus(initialMap);
  }, [selectedDate, staff, attendance]);

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffRole.trim()) return;
    onAddStaff(staffName.trim(), staffRole.trim(), parseFloat(staffSalary) || 0);
    setStaffName('');
    setStaffRole('');
    setStaffSalary('');
    setIsAddOpen(false);
  };

  const toggleStatus = (staffId: string) => {
    setDailyStatus((prev) => ({
      ...prev,
      [staffId]: prev[staffId] === 'Present' ? 'Absent' : 'Present',
    }));
  };

  const handleSaveDailyAttendance = () => {
    onSaveAttendance(selectedDate, dailyStatus);
    setSuccessMsg(t.attendanceSaved);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200/60 p-6 rounded-2xl shadow-sm shadow-slate-100/50">
        <h2 className="text-xl font-serif font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Users className="w-5 h-5 text-[#B48243]" />
          <span>{lang === 'Telugu' ? 'సిబ్బంది రిజిస్టర్ & హాజరు లెడ్జర్' : 'Staff Attendance Ledger'}</span>
        </h2>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold bg-[#B48243] hover:bg-[#A2784C] text-white rounded-xl transition-all shadow-md shadow-amber-800/10 cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-[#FAF3EA]" />
          <span>{t.addStaff}</span>
        </button>
      </div>

      {/* Add Staff form */}
      <AnimatePresence>
        {isAddOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-slate-200 p-5 rounded-xl shadow-md overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                {lang === 'Telugu' ? 'సిబ్బంది సభ్యుడిని చేర్చండి' : 'Add New Staff Member'}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.staffName} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.role} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouse Supervisor"
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 block">{t.salary} *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="Monthly salary"
                    value={staffSalary}
                    onChange={(e) => setStaffSalary(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg cursor-pointer"
                >
                  {t.add}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Staff Directory on Left, Daily Attendance on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Staff Directory Table (Left columns 1, 2, 3) */}
        <div className="lg:col-span-3 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm shadow-slate-100/50 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider">
              {lang === 'Telugu' ? 'సిబ్బంది రికార్డులు' : 'Staff Profiles Directory'}
            </h3>
          </div>

          {staff.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {t.noStaff}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table id="staff_table" className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3">{t.staffName}</th>
                    <th className="px-4 py-3">{t.role}</th>
                    <th className="px-4 py-3 text-right">{t.salary}</th>
                    <th className="px-4 py-3 text-center">{t.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors text-slate-600">
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{s.name}</td>
                      <td className="px-4 py-3.5">
                        <span className="flex items-center space-x-1 text-slate-500">
                          <Briefcase className="w-3.5 h-3.5 text-[#B48243] opacity-70" />
                          <span>{s.role}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-[#B48243]">
                        ₹{s.salary.toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => onDeleteStaff(s.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Delete Staff member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Attendance Marker Grid (Right columns 4, 5) */}
        <div className="lg:col-span-2 bg-white border border-slate-200/60 p-5 rounded-2xl shadow-sm shadow-slate-100/50 space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-serif font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-[#B48243]" />
              <span>{t.attendanceFor}</span>
            </h3>
            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-[#B48243]"
            />
          </div>

          {staff.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {lang === 'Telugu' ? 'సిబ్బందిని చేర్చిన తరువాతే హాజరు మార్క్ చేయగలరు.' : 'Register staff members first to mark daily attendance.'}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">{t.markAttendance}</span>
                <div id="attendance_checklist" className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
                  {staff.map((member) => {
                    const status = dailyStatus[member.id] || 'Present';
                    return (
                      <div key={member.id} className="flex items-center justify-between py-2.5">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{member.name}</p>
                          <p className="text-[10px] text-slate-400">{member.role}</p>
                        </div>
                        
                        {/* Attendance Toggle Switches */}
                        <div className="flex items-center space-x-1">
                          <button
                            type="button"
                            onClick={() => setDailyStatus((p) => ({ ...p, [member.id]: 'Present' }))}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-l border transition-all cursor-pointer ${
                              status === 'Present'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {t.present}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDailyStatus((p) => ({ ...p, [member.id]: 'Absent' }))}
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-r border transition-all cursor-pointer ${
                              status === 'Absent'
                                ? 'bg-rose-50 border-rose-200 text-rose-600'
                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:text-slate-600'
                            }`}
                          >
                            {t.absent}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status alerts */}
              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs rounded-lg flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="button"
                onClick={handleSaveDailyAttendance}
                className="w-full flex items-center justify-center space-x-1.5 py-2.5 text-xs font-semibold bg-[#B48243] hover:bg-[#A2784C] text-white rounded-xl transition-all shadow-md shadow-amber-800/10 cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#FAF3EA]" />
                <span>{lang === 'Telugu' ? 'హాజరు సమర్పించండి' : 'Save Daily Attendance'}</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
