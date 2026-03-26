import React, { useState } from 'react';
import { UserPlus, Users, Trash2, ShieldCheck, Mail, ArrowLeft, LogOut } from 'lucide-react';

export default function AdminConsole({ onBack }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('STANDARD');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [users, setUsers] = useState([
    { email: 'admin@snowslice.io', role: 'ADMIN', status: 'Active' },
    { email: 'analyst_01@enterprise.com', role: 'STANDARD', status: 'Active' },
    { email: 'dev_lead@internal.cloud', role: 'STANDARD', status: 'Pending' },
  ]);

  const handleProvision = async (e) => {
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
      
      if (data.status === 'success') {
        // Correctly add the new user to the UI list
        setUsers(prev => [{ email, role, status: 'Active' }, ...prev]);
        setEmail('');
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message || 'Provisioning failed' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Server connection failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (emailToDelete) => {
    if (window.confirm(`Are you sure you want to delete ${emailToDelete}?`)) {
      setUsers(users.filter(u => u.email !== emailToDelete));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminUser');
    window.location.href = '/admin-login';
  };

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '40px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ backgroundColor: '#4f46e5', padding: '10px', borderRadius: '12px', color: 'white' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#111827' }}>Admin Console</h1>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Manage cloud environment access</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button 
              onClick={onBack}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '8px', color: '#374151', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              <ArrowLeft size={16} /> Dashboard
            </button>
            <button 
              onClick={handleLogout}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fee2e2', border: 'none', padding: '8px 16px', borderRadius: '8px', color: '#dc2626', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'start' }}>
          
          {/* Create User Form */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#111827', padding: '20px 30px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} color="#818cf8" />
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Provision New User</span>
            </div>
            
            <form onSubmit={handleProvision} style={{ padding: '30px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#d1d5db' }} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@enterprise.com"
                    required
                    style={{ width: '100%', padding: '12px 15px 12px 45px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase', marginBottom: '8px' }}>Security Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ width: '100%', padding: '12px 15px', border: '1px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', backgroundColor: '#f9fafb', cursor: 'pointer' }}
                >
                  <option value="STANDARD">STANDARD USER</option>
                  <option value="ADMIN">ADMINISTRATOR</option>
                </select>
              </div>

              {message && (
                <div style={{ 
                  padding: '12px', 
                  borderRadius: '8px', 
                  fontSize: '12px', 
                  fontWeight: 700, 
                  marginBottom: '20px',
                  backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2',
                  color: message.type === 'success' ? '#059669' : '#dc2626',
                  border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
                }}>
                  {message.text}
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  backgroundColor: '#4f46e5', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '10px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Processing...' : 'Provision User'}
              </button>
            </form>
          </div>

          {/* User Table */}
          <div style={{ backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 30px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color="#4f46e5" />
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#111827' }}>Authorized Users</span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb' }}>
                    <th style={{ padding: '15px 25px', textAlign: 'left', fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>User</th>
                    <th style={{ padding: '15px 25px', textAlign: 'center', fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Role</th>
                    <th style={{ padding: '15px 25px', textAlign: 'right', fontSize: '10px', fontWeight: 800, color: '#9ca3af', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '15px 25px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{u.email}</div>
                        <div style={{ fontSize: '10px', color: '#10b981' }}>● {u.status}</div>
                      </td>
                      <td style={{ padding: '15px 25px', textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '10px', 
                          fontWeight: 800, 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          backgroundColor: u.role === 'ADMIN' ? '#eef2ff' : '#f3f4f6',
                          color: u.role === 'ADMIN' ? '#4f46e5' : '#6b7280'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '15px 25px', textAlign: 'right' }}>
                        <button 
                          onClick={() => handleDelete(u.email)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
