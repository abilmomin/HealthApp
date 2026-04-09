import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Save, Scale } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ProfilePage() {
  const { getHeaders, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({ display_name: '', bio: '', height: '', weight: '', age: '' });
  const [weightLog, setWeightLog] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) setForm({ display_name: profile.display_name || '', bio: profile.bio || '', height: profile.height || '', weight: profile.weight || '', age: profile.age || '' });
  }, [profile]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await axios.put(`${API}/users/me`, { display_name: form.display_name, bio: form.bio, height: form.height ? parseFloat(form.height) : null, weight: form.weight ? parseFloat(form.weight) : null, age: form.age ? parseInt(form.age) : null }, { headers: getHeaders() });
      await refreshProfile(); setSaved(true); setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const handleLogWeight = async () => {
    if (!weightLog) return;
    try { await axios.post(`${API}/weight`, { weight: parseFloat(weightLog) }, { headers: getHeaders() }); setForm(f => ({ ...f, weight: weightLog })); setWeightLog(''); await refreshProfile(); } catch (e) { console.error(e); }
  };

  return (
    <div className="space-y-6 max-w-2xl" data-testid="profile-page">
      <h1 className="text-4xl font-black font-['Barlow_Condensed'] uppercase tracking-tighter text-white">Profile</h1>

      <div className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-6">
        <div className="flex items-center gap-4 mb-6">
          {profile?.photo_url ? <img src={profile.photo_url} alt="" className="w-16 h-16 rounded-full" /> : (
            <div className="w-16 h-16 rounded-full bg-[#5b9a3c] flex items-center justify-center text-white text-2xl font-bold font-['Barlow_Condensed']">{(profile?.display_name || 'U')[0].toUpperCase()}</div>
          )}
          <div><p className="text-white font-['Manrope'] font-medium text-lg">{profile?.display_name}</p><p className="text-[#7a8a7a] font-['Manrope'] text-sm">{profile?.email}</p></div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope'] block mb-2">Display Name</label>
            <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} className="w-full bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="profile-name-input" />
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope'] block mb-2">Bio</label>
            <textarea value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} rows={3} className="w-full bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c] resize-none" data-testid="profile-bio-input" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="text-xs uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope'] block mb-2">Height (cm)</label><input type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} className="w-full bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="profile-height-input" /></div>
            <div><label className="text-xs uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope'] block mb-2">Weight (lbs)</label><input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} className="w-full bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="profile-weight-input" /></div>
            <div><label className="text-xs uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope'] block mb-2">Age</label><input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} className="w-full bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="profile-age-input" /></div>
          </div>
          <button type="submit" disabled={saving} className="flex items-center gap-2 bg-[#5b9a3c] hover:bg-[#4a8530] text-white px-6 py-3 rounded-lg font-bold font-['Barlow_Condensed'] uppercase tracking-wider transition-colors disabled:opacity-50" data-testid="save-profile-button">
            <Save className="w-5 h-5" />{saved ? 'Saved!' : saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      <div className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-6">
        <h3 className="text-lg font-bold font-['Barlow_Condensed'] uppercase tracking-tight text-white mb-4">Log Weight</h3>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5a6a5a]" />
            <input type="number" placeholder="Weight (lbs)" value={weightLog} onChange={e => setWeightLog(e.target.value)} className="w-full bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg pl-11 pr-4 py-3 text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="weight-log-input" />
          </div>
          <button onClick={handleLogWeight} className="bg-[#8bc34a] hover:bg-[#7cb342] text-white px-6 py-3 rounded-lg font-['Manrope'] font-medium" data-testid="log-weight-button">Log Weight</button>
        </div>
      </div>
    </div>
  );
}
