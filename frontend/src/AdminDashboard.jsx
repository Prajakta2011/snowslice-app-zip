import React, { useState } from 'react';
import { UserPlus, Users, Loader2, ShieldCheck, Mail, ChevronRight } from 'lucide-react';

export default function AdminDashboard({ onBack }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('USER');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('http://localhost:3000/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const data = await res.json();
      setMessage({ type: data.status === 'success' ? 'success' : 'error', text: data.message || 'Operation failed' });
      if (data.status === 'success') setEmail('');
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">Admin <span className="text-indigo-600">Console</span></h1>
              <p className="text-slate-500 text-sm font-medium italic">User provisioning & access management</p>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            Return to Engine <ChevronRight className="w-4 h-4" />
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Section */}
          <div className="lg:col-span-5">
            <section className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="bg-slate-900 px-8 py-6 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <h2 className="text-white font-black uppercase text-[10px] tracking-[0.2em]">Provision New User</h2>
              </div>
              
              <form onSubmit={handleSubmit} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="email"
                        className="w-full pl-11 pr-4 py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-mono"
                        placeholder="user@enterprise.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Access Role</label>
                    <select 
                      className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-slate-700 appearance-none"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    >
                      <option value="USER">Standard User</option>
                      <option value="ADMIN">System Admin</option>
                    </select>
                  </div>
                </div>

                {message && (
                  <div className={`p-4 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                    message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'
                  }`}>
                    {message.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {message.text}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      <span className="uppercase tracking-widest text-xs">Provisioning User...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      <span className="uppercase tracking-widest text-xs">Authorize User Access</span>
                    </>
                  )}
                </button>
              </form>
            </section>
          </div>

          {/* Users List Section */}
          <div className="lg:col-span-7">
            <section className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
              <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Authorized Personnel</h2>
                </div>
                <Badge variant="light" color="indigo">Total: 3</Badge>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                      <th className="px-10 py-5">Email Identifier</th>
                      <th className="px-10 py-5 text-center">Security Role</th>
                      <th className="px-10 py-5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {[
                      { email: 'admin@snowslice.io', role: 'ADMIN', status: 'Active' },
                      { email: 'analyst_01@enterprise.com', role: 'USER', status: 'Active' },
                      { email: 'dev_lead@internal.cloud', role: 'USER', status: 'Pending' },
                    ].map((user, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-10 py-6">
                          <span className="text-xs font-black text-slate-700 font-mono tracking-tight group-hover:text-indigo-600 transition-colors">{user.email}</span>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex justify-center">
                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest ${
                              user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {user.role}
                            </span>
                          </div>
                        </td>
                        <td className="px-10 py-6">
                          <div className="flex justify-center items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{user.status}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-slate-50/50 p-6 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Encrypted Snowflake User Management Session</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
