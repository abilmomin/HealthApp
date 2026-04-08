import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Search, Plus, Trash2, Apple, X } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function NutritionPage() {
  const { getHeaders } = useAuth();
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const fetchLogs = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/nutrition/logs?date=${selectedDate}`, { headers: getHeaders() });
      setLogs(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [getHeaders, selectedDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const searchFood = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await axios.get(`${API}/nutrition/search?q=${encodeURIComponent(searchQuery)}`, { headers: getHeaders() });
      setSearchResults(res.data.items || []);
    } catch (e) { console.error(e); }
    setSearching(false);
  };

  const logFood = async (food) => {
    try {
      await axios.post(`${API}/nutrition/logs`, {
        food_name: food.name,
        calories: food.calories || 0,
        protein_g: food.protein_g || 0,
        carbs_g: food.carbohydrates_total_g || 0,
        fat_g: food.fat_total_g || 0,
        serving_size: `${food.serving_size_g || 100}g`,
        date: selectedDate,
      }, { headers: getHeaders() });
      fetchLogs();
      setSearchResults([]);
      setSearchQuery('');
      setShowSearch(false);
    } catch (e) { console.error(e); }
  };

  const deleteLog = async (id) => {
    try {
      await axios.delete(`${API}/nutrition/logs/${id}`, { headers: getHeaders() });
      setLogs(l => l.filter(x => x.id !== id));
    } catch (e) { console.error(e); }
  };

  const totals = logs.reduce((acc, l) => ({
    calories: acc.calories + (l.calories || 0),
    protein: acc.protein + (l.protein_g || 0),
    carbs: acc.carbs + (l.carbs_g || 0),
    fat: acc.fat + (l.fat_g || 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  return (
    <div className="space-y-6" data-testid="nutrition-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black font-['Barlow_Condensed'] uppercase tracking-tighter text-white">Nutrition</h1>
          <p className="text-zinc-400 font-['Manrope'] mt-1">Track your daily intake</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-[#161618] border border-white/10 rounded-md px-3 py-2 text-sm text-white font-['Manrope'] focus:outline-none focus:border-[#FF3B30]"
            data-testid="nutrition-date-picker"
          />
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="flex items-center gap-2 bg-[#FF3B30] hover:bg-[#FF1A0D] text-white px-5 py-3 rounded-md font-bold font-['Barlow_Condensed'] uppercase tracking-wider transition-colors"
            data-testid="add-food-button"
          >
            {showSearch ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showSearch ? 'Cancel' : 'Add Food'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="nutrition-totals">
        {[
          { label: 'Calories', value: Math.round(totals.calories), unit: 'kcal', color: '#FF3B30' },
          { label: 'Protein', value: Math.round(totals.protein), unit: 'g', color: '#007AFF' },
          { label: 'Carbs', value: Math.round(totals.carbs), unit: 'g', color: '#FF9F0A' },
          { label: 'Fat', value: Math.round(totals.fat), unit: 'g', color: '#34C759' },
        ].map(m => (
          <div key={m.label} className="bg-[#161618] border border-white/10 rounded-md p-4">
            <span className="text-xs tracking-[0.15em] uppercase text-zinc-400 font-['Manrope']">{m.label}</span>
            <p className="text-3xl font-bold font-['Barlow_Condensed'] mt-1" style={{ color: m.color }}>
              {m.value}<span className="text-sm text-zinc-500 ml-1">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {showSearch && (
        <div className="bg-[#161618] border border-white/10 rounded-md p-6" data-testid="food-search-panel">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input
                placeholder="Search foods (e.g. 1 cup rice, chicken breast)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && searchFood()}
                className="w-full bg-[#0f0f10] border border-white/10 rounded-md pl-11 pr-4 py-3 text-white placeholder:text-zinc-500 font-['Manrope'] focus:outline-none focus:border-[#FF3B30]"
                data-testid="food-search-input"
              />
            </div>
            <button
              onClick={searchFood}
              disabled={searching}
              className="bg-[#007AFF] hover:bg-[#0056CC] text-white px-6 py-3 rounded-md font-['Manrope'] font-medium disabled:opacity-50"
              data-testid="search-food-button"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((food, i) => (
                <div key={i} className="flex items-center justify-between bg-white/5 p-3 rounded-md hover:bg-white/10 transition-colors">
                  <div>
                    <p className="text-white font-['Manrope'] font-medium capitalize">{food.name}</p>
                    <p className="text-xs text-zinc-500 font-['Manrope']">
                      {Math.round(food.calories)} cal - P: {Math.round(food.protein_g)}g - C: {Math.round(food.carbohydrates_total_g)}g - F: {Math.round(food.fat_total_g)}g ({food.serving_size_g}g serving)
                    </p>
                  </div>
                  <button
                    onClick={() => logFood(food)}
                    className="bg-[#34C759] hover:bg-[#2DB84D] text-white px-3 py-1 rounded-md text-sm font-['Manrope']"
                    data-testid={`log-food-${i}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <Apple className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 font-['Manrope']">No meals logged for this date. Add some food!</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="nutrition-logs-list">
          {logs.map(l => (
            <div key={l.id} className="bg-[#161618] border border-white/10 rounded-md p-4 flex items-center justify-between hover:border-white/20 transition-all">
              <div>
                <p className="text-white font-['Manrope'] font-medium capitalize">{l.food_name}</p>
                <p className="text-xs text-zinc-500 font-['Manrope'] mt-1">
                  {Math.round(l.calories)} cal - P: {Math.round(l.protein_g)}g - C: {Math.round(l.carbs_g)}g - F: {Math.round(l.fat_g)}g - {l.serving_size}
                </p>
              </div>
              <button onClick={() => deleteLog(l.id)} className="p-2 text-zinc-500 hover:text-red-400" data-testid={`delete-nutrition-${l.id}`}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
