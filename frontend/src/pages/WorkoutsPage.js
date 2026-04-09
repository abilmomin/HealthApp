import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Plus, Trash2, Dumbbell, Clock, Search, ChevronDown, ChevronUp, Share2, X, Info } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WorkoutsPage() {
  const { getHeaders } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [bodyParts, setBodyParts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterGroup, setFilterGroup] = useState('');
  const [searchEx, setSearchEx] = useState('');
  const [selectedExDetail, setSelectedExDetail] = useState(null);
  const [form, setForm] = useState({ name: '', duration_minutes: 30, notes: '', exercises: [] });
  const [currentExercise, setCurrentExercise] = useState({ name: '', sets: 3, reps: 10, weight: 0 });

  const fetchWorkouts = useCallback(async () => {
    try { const res = await axios.get(`${API}/workouts?limit=50`, { headers: getHeaders() }); setWorkouts(res.data); } catch (e) { console.error(e); }
    setLoading(false);
  }, [getHeaders]);
  const fetchBodyParts = useCallback(async () => {
    try { const res = await axios.get(`${API}/exercises/bodyparts`); setBodyParts(res.data || []); } catch (e) { console.error(e); }
  }, []);
  const fetchExercises = useCallback(async () => {
    try {
      let url = `${API}/exercises?limit=20`;
      if (filterGroup) url += `&muscle_group=${encodeURIComponent(filterGroup)}`;
      if (searchEx) url += `&q=${encodeURIComponent(searchEx)}`;
      const res = await axios.get(url); setExercises(res.data);
    } catch (e) { console.error(e); }
  }, [filterGroup, searchEx]);
  useEffect(() => { fetchWorkouts(); fetchBodyParts(); }, [fetchWorkouts, fetchBodyParts]);
  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const addExercise = () => { if (!currentExercise.name) return; setForm(f => ({ ...f, exercises: [...f.exercises, { ...currentExercise, id: Date.now() }] })); setCurrentExercise({ name: '', sets: 3, reps: 10, weight: 0 }); };
  const removeExercise = (id) => { setForm(f => ({ ...f, exercises: f.exercises.filter(e => e.id !== id) })); };
  const handleSubmit = async (e) => { e.preventDefault(); if (!form.name) return; try { await axios.post(`${API}/workouts`, form, { headers: getHeaders() }); setForm({ name: '', duration_minutes: 30, notes: '', exercises: [] }); setShowForm(false); fetchWorkouts(); } catch (e) { console.error(e); } };
  const deleteWorkout = async (id) => { try { await axios.delete(`${API}/workouts/${id}`, { headers: getHeaders() }); setWorkouts(w => w.filter(x => x.id !== id)); } catch (e) { console.error(e); } };
  const shareWorkout = async (id) => { try { await axios.post(`${API}/social/share/${id}`, {}, { headers: getHeaders() }); fetchWorkouts(); } catch (e) { console.error(e); } };

  return (
    <div className="space-y-6" data-testid="workouts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-['Barlow_Condensed'] uppercase tracking-tighter text-white">Workouts</h1>
          <p className="text-[#94a3b8] font-['Manrope'] mt-1">{workouts.length} workouts logged</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-[#5b9a3c] hover:bg-[#4a8530] text-white px-5 py-3 rounded-lg font-bold font-['Barlow_Condensed'] uppercase tracking-wider transition-colors" data-testid="new-workout-button">
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'New Workout'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-6" data-testid="workout-form">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="Workout Name (e.g. Push Day)" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="workout-name-input" />
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#5a6a5a]" />
                <input type="number" placeholder="Duration (min)" value={form.duration_minutes} onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} className="flex-1 bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="workout-duration-input" />
              </div>
              <input placeholder="Notes (optional)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-4 py-3 text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="workout-notes-input" />
            </div>
            <div className="border-t border-[#5b9a3c]/10 pt-4">
              <h4 className="text-sm uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope'] mb-3">Exercise Library</h4>
              <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto pb-2">
                <button type="button" onClick={() => setFilterGroup('')} className={`px-3 py-1.5 rounded-lg text-xs font-['Manrope'] whitespace-nowrap transition-colors ${!filterGroup ? 'bg-[#5b9a3c] text-white' : 'bg-[#5b9a3c]/10 text-[#7a8a7a] hover:text-white'}`}>All</button>
                {bodyParts.map(g => (<button key={g} type="button" onClick={() => setFilterGroup(g)} className={`px-3 py-1.5 rounded-lg text-xs font-['Manrope'] capitalize whitespace-nowrap transition-colors ${filterGroup === g ? 'bg-[#5b9a3c] text-white' : 'bg-[#5b9a3c]/10 text-[#7a8a7a] hover:text-white'}`}>{g}</button>))}
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a6a5a]" />
                <input placeholder="Search exercises..." value={searchEx} onChange={e => setSearchEx(e.target.value)} className="w-full bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="exercise-search-input" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto mb-3">
                {exercises.slice(0, 16).map((ex, idx) => (
                  <div key={ex.id || ex.name + idx} className={`relative text-left px-3 py-2 rounded-lg text-xs font-['Manrope'] transition-colors cursor-pointer group ${currentExercise.name === ex.name ? 'bg-[#5b9a3c] text-white' : 'bg-[#5b9a3c]/10 text-[#c0ccb8] hover:bg-[#5b9a3c]/20'}`}>
                    <div className="flex items-start gap-2" onClick={() => setCurrentExercise(c => ({ ...c, name: ex.name }))}>
                      {ex.gif_url && <img src={ex.gif_url} alt={ex.name} className="w-10 h-10 rounded object-cover flex-shrink-0" loading="lazy" />}
                      <div className="min-w-0">
                        <p className="truncate font-medium">{ex.name}</p>
                        <span className="text-[#7a8a7a] text-[10px] capitalize">{ex.muscle_group || ex.target}</span>
                      </div>
                    </div>
                    {ex.instructions && ex.instructions.length > 0 && (
                      <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedExDetail(selectedExDetail?.name === ex.name ? null : ex); }} className="absolute top-1 right-1 p-1 text-[#5a6a5a] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"><Info className="w-3 h-3" /></button>
                    )}
                  </div>
                ))}
              </div>
              {selectedExDetail && (
                <div className="bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg p-4 mb-3">
                  <div className="flex items-start gap-4">
                    {selectedExDetail.gif_url && <img src={selectedExDetail.gif_url} alt={selectedExDetail.name} className="w-24 h-24 rounded-lg object-cover" />}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-white font-['Manrope'] font-medium">{selectedExDetail.name}</h5>
                      <div className="flex flex-wrap gap-2 mt-1 mb-2">
                        <span className="text-[10px] px-2 py-0.5 bg-[#5b9a3c]/20 text-[#8bc34a] rounded capitalize">{selectedExDetail.muscle_group}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-[#4fc3f7]/20 text-[#4fc3f7] rounded capitalize">{selectedExDetail.equipment}</span>
                      </div>
                      {selectedExDetail.instructions?.length > 0 && (
                        <ol className="text-xs text-[#7a8a7a] font-['Manrope'] space-y-1 list-decimal list-inside max-h-20 overflow-y-auto">
                          {selectedExDetail.instructions.map((step, i) => (<li key={i}>{step}</li>))}
                        </ol>
                      )}
                    </div>
                    <button type="button" onClick={() => setSelectedExDetail(null)} className="text-[#5a6a5a] hover:text-white"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-3 items-end">
                <input placeholder="Exercise name" value={currentExercise.name} onChange={e => setCurrentExercise(c => ({ ...c, name: e.target.value }))} className="flex-1 min-w-[150px] bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#5a6a5a] font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="exercise-name-input" />
                <div className="flex items-center gap-1"><label className="text-xs text-[#7a8a7a] font-['Manrope']">Sets</label><input type="number" value={currentExercise.sets} onChange={e => setCurrentExercise(c => ({ ...c, sets: parseInt(e.target.value) || 0 }))} className="w-16 bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-2 py-2 text-sm text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="exercise-sets-input" /></div>
                <div className="flex items-center gap-1"><label className="text-xs text-[#7a8a7a] font-['Manrope']">Reps</label><input type="number" value={currentExercise.reps} onChange={e => setCurrentExercise(c => ({ ...c, reps: parseInt(e.target.value) || 0 }))} className="w-16 bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-2 py-2 text-sm text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="exercise-reps-input" /></div>
                <div className="flex items-center gap-1"><label className="text-xs text-[#7a8a7a] font-['Manrope']">Wt(lbs)</label><input type="number" value={currentExercise.weight} onChange={e => setCurrentExercise(c => ({ ...c, weight: parseFloat(e.target.value) || 0 }))} className="w-20 bg-[#0f1a14] border border-[#5b9a3c]/15 rounded-lg px-2 py-2 text-sm text-white font-['Manrope'] focus:outline-none focus:border-[#5b9a3c]" data-testid="exercise-weight-input" /></div>
                <button type="button" onClick={addExercise} className="bg-[#8bc34a] hover:bg-[#7cb342] text-white px-4 py-2 rounded-lg text-sm font-['Manrope'] font-medium" data-testid="add-exercise-button">Add</button>
              </div>
            </div>
            {form.exercises.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs uppercase tracking-[0.15em] text-[#7a8a7a] font-['Manrope']">Added ({form.exercises.length})</h4>
                {form.exercises.map((ex) => (<div key={ex.id} className="flex items-center justify-between bg-[#5b9a3c]/10 px-4 py-2 rounded-lg"><span className="text-sm text-white font-['Manrope']">{ex.name} - {ex.sets}x{ex.reps} @ {ex.weight}lbs</span><button type="button" onClick={() => removeExercise(ex.id)} className="text-[#7a8a7a] hover:text-red-400"><Trash2 className="w-4 h-4" /></button></div>))}
              </div>
            )}
            <button type="submit" className="bg-[#5b9a3c] hover:bg-[#4a8530] text-white px-6 py-3 rounded-lg font-bold font-['Barlow_Condensed'] uppercase tracking-wider" data-testid="save-workout-button">Save Workout</button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><div className="w-8 h-8 border-2 border-[#5b9a3c] border-t-transparent rounded-full animate-spin" /></div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16"><Dumbbell className="w-16 h-16 text-[#2d4a2d] mx-auto mb-4" /><p className="text-[#5a6a5a] font-['Manrope']">No workouts yet. Start your first one!</p></div>
      ) : (
        <div className="space-y-3" data-testid="workouts-list">
          {workouts.map(w => (
            <div key={w.id} className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg hover:border-[#5b9a3c]/30 transition-all">
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5b9a3c]/10 flex items-center justify-center"><Dumbbell className="w-5 h-5 text-[#5b9a3c]" /></div>
                  <div><p className="text-white font-['Manrope'] font-medium">{w.name}</p><p className="text-xs text-[#7a8a7a] font-['Manrope']">{w.date} - {w.exercises?.length || 0} exercises - {w.duration_minutes}min</p></div>
                </div>
                <div className="flex items-center gap-2">
                  {w.shared ? (<span className="text-[10px] px-2 py-1 bg-[#8bc34a]/20 text-[#8bc34a] rounded font-['Manrope']">Shared</span>) : (<button onClick={(e) => { e.stopPropagation(); shareWorkout(w.id); }} className="p-2 text-[#7a8a7a] hover:text-[#8bc34a]" data-testid={`share-workout-${w.id}`}><Share2 className="w-4 h-4" /></button>)}
                  <button onClick={(e) => { e.stopPropagation(); deleteWorkout(w.id); }} className="p-2 text-[#7a8a7a] hover:text-red-400" data-testid={`delete-workout-${w.id}`}><Trash2 className="w-4 h-4" /></button>
                  {expandedId === w.id ? <ChevronUp className="w-5 h-5 text-[#7a8a7a]" /> : <ChevronDown className="w-5 h-5 text-[#7a8a7a]" />}
                </div>
              </div>
              {expandedId === w.id && w.exercises?.length > 0 && (
                <div className="border-t border-[#5b9a3c]/10 p-4 space-y-2">
                  {w.exercises.map((ex, i) => (<div key={i} className="flex justify-between text-sm font-['Manrope']"><span className="text-[#c0ccb8]">{ex.name}</span><span className="text-[#7a8a7a]">{ex.sets}x{ex.reps} @ {ex.weight}lbs</span></div>))}
                  {w.notes && <p className="text-xs text-[#5a6a5a] mt-2 font-['Manrope']">Notes: {w.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
