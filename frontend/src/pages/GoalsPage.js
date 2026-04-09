import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Target, Plus, Trash2, Check, X, Edit2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const goalTypes = [
  { value: 'weight_loss', label: 'Weight Loss' }, { value: 'weight_gain', label: 'Weight Gain' },
  { value: 'workout_count', label: 'Workout Count' }, { value: 'calories_daily', label: 'Daily Calorie Target' },
  { value: 'protein_daily', label: 'Daily Protein Target' }, { value: 'streak', label: 'Workout Streak' },
  { value: 'custom', label: 'Custom Goal' },
];

export default function GoalsPage() {
  const { getHeaders } = useAuth();
  const [goals, setGoals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState(0);
  const [form, setForm] = useState({ title: '', goal_type: 'workout_count', target_value: 0, current_value: 0, unit: '', deadline: '' });

  const fetchGoals = useCallback(async () => { try { const res = await axios.get(`${API}/goals`, { headers: getHeaders() }); setGoals(res.data); } catch (e) { console.error(e); } setLoading(false); }, [getHeaders]);
  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const handleSubmit = async (e) => { e.preventDefault(); if (!form.title) return; try { await axios.post(`${API}/goals`, form, { headers: getHeaders() }); setForm({ title: '', goal_type: 'workout_count', target_value: 0, current_value: 0, unit: '', deadline: '' }); setShowForm(false); fetchGoals(); } catch (e) { console.error(e); } };
  const updateProgress = async (id) => { try { await axios.put(`${API}/goals/${id}`, { current_value: editValue }, { headers: getHeaders() }); setEditingId(null); fetchGoals(); } catch (e) { console.error(e); } };
  const completeGoal = async (id) => { try { await axios.put(`${API}/goals/${id}`, { completed: true }, { headers: getHeaders() }); fetchGoals(); } catch (e) { console.error(e); } };
  const deleteGoal = async (id) => { try { await axios.delete(`${API}/goals/${id}`, { headers: getHeaders() }); setGoals(g => g.filter(x => x.id !== id)); } catch (e) { console.error(e); } };

  const activeGoals = goals.filter(g => !g.completed);
  const completedGoals = goals.filter(g => g.completed);

  return (
    <div className="space-y-6" data-testid="goals-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-['Barlow_Condensed'] uppercase tracking-tighter text-white">Goals</h1>
          <p className="text-[#94a3b8] font-['Manrope'] mt-1">{activeGoals.length} active goals</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#5b9a3c] hover:bg-[#4a8530] text-white px-5 py-3 rounded-lg font-bold font-['Barlow_Condensed'] uppercase tracking-wider transition-colors" data-testid="new-goal-button">
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />} {showForm ? 'Cancel' : 'New Goal'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-6" data-testid="goal-form">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input placeholder="Goal Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="goal-title-input" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select value={form.goal_type} onChange={e => setForm(f => ({ ...f, goal_type: e.target.value }))} className="bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="goal-type-select">
                {goalTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <input type="number" placeholder="Target Value" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: parseFloat(e.target.value) || 0 }))} className="bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="goal-target-input" />
              <input placeholder="Unit (e.g. lbs, workouts)" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="goal-unit-input" />
              <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="goal-deadline-input" />
            </div>
            <button type="submit" className="bg-[#5b9a3c] hover:bg-[#4a8530] text-white px-6 py-3 rounded-lg font-bold font-['Barlow_Condensed'] uppercase tracking-wider" data-testid="save-goal-button">Save Goal</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-[#5b9a3c] border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {activeGoals.length === 0 && completedGoals.length === 0 ? (
            <div className="text-center py-16"><Target className="w-16 h-16 text-[#2d4a2d] mx-auto mb-4" /><p className="text-[#5a6a5a] font-['Manrope']">No goals yet. Set your first target!</p></div>
          ) : (
            <>
              {activeGoals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope']">Active Goals</h3>
                  {activeGoals.map(g => {
                    const pct = g.target_value > 0 ? Math.min(100, (g.current_value / g.target_value) * 100) : 0;
                    return (
                      <div key={g.id} className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-4 hover:border-[#5b9a3c]/30 transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-white font-['Manrope'] font-medium">{g.title}</p>
                            <p className="text-xs text-[#7a8a7a] font-['Manrope']">{goalTypes.find(t => t.value === g.goal_type)?.label} {g.deadline ? `- Due: ${g.deadline}` : ''}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {editingId === g.id ? (
                              <>
                                <input type="number" value={editValue} onChange={e => setEditValue(parseFloat(e.target.value) || 0)} className="w-20 bg-[#0f1a14] border border-[#5b9a3c]/15 rounded px-2 py-1 text-sm text-white font-['Manrope']" />
                                <button onClick={() => updateProgress(g.id)} className="text-[#5b9a3c] hover:text-[#8bc34a]"><Check className="w-4 h-4" /></button>
                                <button onClick={() => setEditingId(null)} className="text-[#7a8a7a] hover:text-white"><X className="w-4 h-4" /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingId(g.id); setEditValue(g.current_value); }} className="p-1 text-[#7a8a7a] hover:text-[#8bc34a]"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => completeGoal(g.id)} className="p-1 text-[#7a8a7a] hover:text-[#5b9a3c]"><Check className="w-4 h-4" /></button>
                                <button onClick={() => deleteGoal(g.id)} className="p-1 text-[#7a8a7a] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-[#5b9a3c]/10 rounded-full overflow-hidden">
                            <div className="h-full bg-[#5b9a3c] rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-['Barlow_Condensed'] font-bold text-white">{Math.round(pct)}%</span>
                        </div>
                        <p className="text-xs text-[#7a8a7a] font-['Manrope'] mt-2">{g.current_value} / {g.target_value} {g.unit}</p>
                      </div>
                    );
                  })}
                </div>
              )}
              {completedGoals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope']">Completed</h3>
                  {completedGoals.map(g => (
                    <div key={g.id} className="bg-[#162618] border border-[#5b9a3c]/20 rounded-lg p-4 opacity-70">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3"><Check className="w-5 h-5 text-[#5b9a3c]" /><p className="text-white font-['Manrope'] font-medium line-through">{g.title}</p></div>
                        <button onClick={() => deleteGoal(g.id)} className="p-1 text-[#7a8a7a] hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
