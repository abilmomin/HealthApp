import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Plus, Trash2, Dumbbell, Clock, Search, ChevronDown, ChevronUp, Share2, X } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WorkoutsPage() {
  const { getHeaders } = useAuth();
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [filterGroup, setFilterGroup] = useState('');
  const [searchEx, setSearchEx] = useState('');

  const [form, setForm] = useState({ name: '', duration_minutes: 30, notes: '', exercises: [] });
  const [currentExercise, setCurrentExercise] = useState({ name: '', sets: 3, reps: 10, weight: 0 });

  const fetchWorkouts = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/workouts?limit=50`, { headers: getHeaders() });
      setWorkouts(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [getHeaders]);

  const fetchExercises = useCallback(async () => {
    try {
      let url = `${API}/exercises`;
      const params = [];
      if (filterGroup) params.push(`muscle_group=${filterGroup}`);
      if (searchEx) params.push(`q=${searchEx}`);
      if (params.length) url += `?${params.join('&')}`;
      const res = await axios.get(url);
      setExercises(res.data);
    } catch (e) { console.error(e); }
  }, [filterGroup, searchEx]);

  useEffect(() => { fetchWorkouts(); }, [fetchWorkouts]);
  useEffect(() => { fetchExercises(); }, [fetchExercises]);

  const addExercise = () => {
    if (!currentExercise.name) return;
    setForm(f => ({ ...f, exercises: [...f.exercises, { ...currentExercise, id: Date.now() }] }));
    setCurrentExercise({ name: '', sets: 3, reps: 10, weight: 0 });
  };

  const removeExercise = (id) => {
    setForm(f => ({ ...f, exercises: f.exercises.filter(e => e.id !== id) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    try {
      await axios.post(`${API}/workouts`, form, { headers: getHeaders() });
      setForm({ name: '', duration_minutes: 30, notes: '', exercises: [] });
      setShowForm(false);
      fetchWorkouts();
    } catch (e) { console.error(e); }
  };

  const deleteWorkout = async (id) => {
    try {
      await axios.delete(`${API}/workouts/${id}`, { headers: getHeaders() });
      setWorkouts(w => w.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  const shareWorkout = async (id) => {
    try {
      await axios.post(`${API}/social/share/${id}`, {}, { headers: getHeaders() });
      fetchWorkouts();
    } catch (e) { console.error(e); }
  };

  const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio', 'Full Body'];

  return (
    <div className="space-y-6" data-testid="workouts-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-['Barlow_Condensed'] uppercase tracking-tighter text-white">Workouts</h1>
          <p className="text-zinc-400 font-['Manrope'] mt-1">{workouts.length} workouts logged</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-[#FF3B30] hover:bg-[#FF1A0D] text-white px-5 py-3 rounded-md font-bold font-['Barlow_Condensed'] uppercase tracking-wider transition-colors"
          data-testid="new-workout-button"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancel' : 'New Workout'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#161618] border border-white/10 rounded-md p-6" data-testid="workout-form">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                placeholder="Workout Name (e.g. Push Day)"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="bg-[#0f0f10] border border-white/10 rounded-md px-4 py-3 text-white placeholder:text-zinc-500 font-['Manrope'] focus:outline-none focus:border-[#FF3B30]"
                data-testid="workout-name-input"
              />
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-500" />
                <input
                  type="number"
                  placeholder="Duration (min)"
                  value={form.duration_minutes}
                  onChange={e => setForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
                  className="flex-1 bg-[#0f0f10] border border-white/10 rounded-md px-4 py-3 text-white placeholder:text-zinc-500 font-['Manrope'] focus:outline-none focus:border-[#FF3B30]"
                  data-testid="workout-duration-input"
                />
              </div>
              <input
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="bg-[#0f0f10] border border-white/10 rounded-md px-4 py-3 text-white placeholder:text-zinc-500 font-['Manrope'] focus:outline-none focus:border-[#FF3B30]"
                data-testid="workout-notes-input"
              />
            </div>

            <div className="border-t border-white/10 pt-4">
              <h4 className="text-sm uppercase tracking-[0.15em] text-zinc-400 font-['Manrope'] mb-3">Add Exercises</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                <button type="button" onClick={() => setFilterGroup('')} className={`px-3 py-1 rounded-md text-xs font-['Manrope'] ${!filterGroup ? 'bg-[#FF3B30] text-white' : 'bg-white/5 text-zinc-400 hover:text-white'}`}>All</button>
                {muscleGroups.map(g => (
                  <button key={g} type="button" onClick={() => setFilterGroup(g)} className={`px-3 py-1 rounded-md text-xs font-['Manrope'] ${filterGroup === g ? 'bg-[#FF3B30] text-white' : 'bg-white/5 text-zinc-400 hover:text-white'}`}>{g}</button>
                ))}
              </div>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  placeholder="Search exercises..."
                  value={searchEx}
                  onChange={e => setSearchEx(e.target.value)}
                  className="w-full bg-[#0f0f10] border border-white/10 rounded-md pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-500 font-['Manrope'] focus:outline-none focus:border-[#FF3B30]"
                  data-testid="exercise-search-input"
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto mb-3">
                {exercises.slice(0, 12).map(ex => (
                  <button
                    key={ex.name}
                    type="button"
                    onClick={() => setCurrentExercise(c => ({ ...c, name: ex.name }))}
                    className={`text-left px-3 py-2 rounded-md text-xs font-['Manrope'] transition-colors ${currentExercise.name === ex.name ? 'bg-[#FF3B30] text-white' : 'bg-white/5 text-zinc-300 hover:bg-white/10'}`}
                  >
                    {ex.name}
                    <span className="block text-zinc-500 text-[10px]">{ex.muscle_group}</span>
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <input placeholder="Exercise name" value={currentExercise.name} onChange={e => setCurrentExercise(c => ({ ...c, name: e.target.value }))} className="flex-1 min-w-[150px] bg-[#0f0f10] border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-500 font-['Manrope'] focus:outline-none focus:border-[#FF3B30]" data-testid="exercise-name-input" />
                <div className="flex items-center gap-1">
                  <label className="text-xs text-zinc-500 font-['Manrope']">Sets</label>
                  <input type="number" value={currentExercise.sets} onChange={e => setCurrentExercise(c => ({ ...c, sets: parseInt(e.target.value) || 0 }))} className="w-16 bg-[#0f0f10] border border-white/10 rounded-md px-2 py-2 text-sm text-white font-['Manrope'] focus:outline-none focus:border-[#FF3B30]" data-testid="exercise-sets-input" />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-zinc-500 font-['Manrope']">Reps</label>
                  <input type="number" value={currentExercise.reps} onChange={e => setCurrentExercise(c => ({ ...c, reps: parseInt(e.target.value) || 0 }))} className="w-16 bg-[#0f0f10] border border-white/10 rounded-md px-2 py-2 text-sm text-white font-['Manrope'] focus:outline-none focus:border-[#FF3B30]" data-testid="exercise-reps-input" />
                </div>
                <div className="flex items-center gap-1">
                  <label className="text-xs text-zinc-500 font-['Manrope']">Wt(lbs)</label>
                  <input type="number" value={currentExercise.weight} onChange={e => setCurrentExercise(c => ({ ...c, weight: parseFloat(e.target.value) || 0 }))} className="w-20 bg-[#0f0f10] border border-white/10 rounded-md px-2 py-2 text-sm text-white font-['Manrope'] focus:outline-none focus:border-[#FF3B30]" data-testid="exercise-weight-input" />
                </div>
                <button type="button" onClick={addExercise} className="bg-[#007AFF] hover:bg-[#0056CC] text-white px-4 py-2 rounded-md text-sm font-['Manrope'] font-medium" data-testid="add-exercise-button">Add</button>
              </div>
            </div>

            {form.exercises.length > 0 && (
              <div className="space-y-2">
                {form.exercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-md">
                    <span className="text-sm text-white font-['Manrope']">{ex.name} - {ex.sets}x{ex.reps} @ {ex.weight}lbs</span>
                    <button type="button" onClick={() => removeExercise(ex.id)} className="text-zinc-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" className="bg-[#FF3B30] hover:bg-[#FF1A0D] text-white px-6 py-3 rounded-md font-bold font-['Barlow_Condensed'] uppercase tracking-wider" data-testid="save-workout-button">
              Save Workout
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 font-['Manrope']">No workouts yet. Start your first one!</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="workouts-list">
          {workouts.map(w => (
            <div key={w.id} className="bg-[#161618] border border-white/10 rounded-md hover:border-white/20 transition-all">
              <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => setExpandedId(expandedId === w.id ? null : w.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-[#FF3B30]/10 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-[#FF3B30]" />
                  </div>
                  <div>
                    <p className="text-white font-['Manrope'] font-medium">{w.name}</p>
                    <p className="text-xs text-zinc-500 font-['Manrope']">{w.date} - {w.exercises?.length || 0} exercises - {w.duration_minutes}min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!w.shared && (
                    <button onClick={(e) => { e.stopPropagation(); shareWorkout(w.id); }} className="p-2 text-zinc-500 hover:text-[#007AFF]" data-testid={`share-workout-${w.id}`}>
                      <Share2 className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); deleteWorkout(w.id); }} className="p-2 text-zinc-500 hover:text-red-400" data-testid={`delete-workout-${w.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {expandedId === w.id ? <ChevronUp className="w-5 h-5 text-zinc-500" /> : <ChevronDown className="w-5 h-5 text-zinc-500" />}
                </div>
              </div>
              {expandedId === w.id && w.exercises?.length > 0 && (
                <div className="border-t border-white/5 p-4 space-y-2">
                  {w.exercises.map((ex, i) => (
                    <div key={i} className="flex justify-between text-sm font-['Manrope']">
                      <span className="text-zinc-300">{ex.name}</span>
                      <span className="text-zinc-500">{ex.sets}x{ex.reps} @ {ex.weight}lbs</span>
                    </div>
                  ))}
                  {w.notes && <p className="text-xs text-zinc-500 mt-2 font-['Manrope']">Notes: {w.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
