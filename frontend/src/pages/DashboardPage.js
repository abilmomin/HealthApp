import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Dumbbell, Flame, Target, TrendingUp, Calendar, Zap } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { getHeaders, profile } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/stats/dashboard`, { headers: getHeaders() });
        setStats(res.data);
      } catch (e) {
        console.error('Failed to fetch stats:', e);
      }
      setLoading(false);
    };
    fetchStats();
  }, [getHeaders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#5b9a3c] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const metricCards = [
    { label: 'Total Workouts', value: stats?.total_workouts || 0, icon: Dumbbell, color: '#5b9a3c' },
    { label: 'This Week', value: stats?.week_workouts || 0, icon: Calendar, color: '#8bc34a' },
    { label: 'Current Streak', value: `${stats?.current_streak || 0}d`, icon: Flame, color: '#e8b931' },
    { label: "Today's Calories", value: Math.round(stats?.today_calories || 0), icon: Zap, color: '#4fc3f7' },
    { label: 'Active Goals', value: stats?.active_goals || 0, icon: Target, color: '#c0c86a' },
    { label: 'Longest Streak', value: `${stats?.longest_streak || 0}d`, icon: TrendingUp, color: '#e8b931' },
  ];

  const calData = (stats?.week_calories || []).map(d => ({
    date: d.date?.slice(5) || '',
    calories: Math.round(d.calories),
  }));

  const weightData = (stats?.weight_history || []).reverse().map(d => ({
    date: d.date?.slice(5) || '',
    weight: d.weight,
  }));

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      <div>
        <h1 className="text-4xl font-black font-['Barlow_Condensed'] uppercase tracking-tighter text-white">
          Dashboard
        </h1>
        <p className="text-[#94a3b8] font-['Manrope'] mt-1">
          Welcome back, {profile?.display_name || 'Athlete'}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" data-testid="metric-cards">
        {metricCards.map((card) => (
          <div
            key={card.label}
            className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-4 hover:-translate-y-1 hover:border-[#5b9a3c]/30 transition-all duration-200"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className="w-4 h-4" style={{ color: card.color }} />
              <span className="text-xs tracking-[0.15em] uppercase text-[#7a8a7a] font-['Manrope']">{card.label}</span>
            </div>
            <p className="text-2xl font-bold font-['Barlow_Condensed'] text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-6" data-testid="calories-chart">
          <h3 className="text-lg font-bold font-['Barlow_Condensed'] uppercase tracking-tight text-white mb-4">
            Weekly Calories
          </h3>
          {calData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={calData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,154,60,0.1)" />
                <XAxis dataKey="date" stroke="#3d5a3d" tick={{ fill: '#7a8a7a', fontSize: 12 }} />
                <YAxis stroke="#3d5a3d" tick={{ fill: '#7a8a7a', fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#162618', border: '1px solid rgba(91,154,60,0.2)', borderRadius: 6, color: '#fff' }} />
                <Bar dataKey="calories" fill="#5b9a3c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#5a6a5a] font-['Manrope'] text-sm">No calorie data this week. Start logging meals!</p>
          )}
        </div>

        <div className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-6" data-testid="weight-chart">
          <h3 className="text-lg font-bold font-['Barlow_Condensed'] uppercase tracking-tight text-white mb-4">
            Weight Trend
          </h3>
          {weightData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,154,60,0.1)" />
                <XAxis dataKey="date" stroke="#3d5a3d" tick={{ fill: '#7a8a7a', fontSize: 12 }} />
                <YAxis stroke="#3d5a3d" tick={{ fill: '#7a8a7a', fontSize: 12 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#162618', border: '1px solid rgba(91,154,60,0.2)', borderRadius: 6, color: '#fff' }} />
                <Line type="monotone" dataKey="weight" stroke="#8bc34a" strokeWidth={2} dot={{ fill: '#8bc34a', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[#5a6a5a] font-['Manrope'] text-sm">No weight data yet. Log your weight to track progress!</p>
          )}
        </div>
      </div>

      <div className="bg-[#162618] border border-[#5b9a3c]/15 rounded-lg p-6" data-testid="recent-workouts">
        <h3 className="text-lg font-bold font-['Barlow_Condensed'] uppercase tracking-tight text-white mb-4">
          Recent Workouts
        </h3>
        {stats?.recent_workouts?.length > 0 ? (
          <div className="space-y-3">
            {stats.recent_workouts.map((w) => (
              <div key={w.id} className="flex items-center justify-between py-3 border-b border-[#5b9a3c]/10 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#5b9a3c]/10 flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-[#5b9a3c]" />
                  </div>
                  <div>
                    <p className="text-white font-['Manrope'] font-medium">{w.name}</p>
                    <p className="text-xs text-[#7a8a7a] font-['Manrope']">{w.exercises?.length || 0} exercises - {w.duration_minutes}min</p>
                  </div>
                </div>
                <span className="text-xs text-[#7a8a7a] font-['Manrope']">{w.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#5a6a5a] font-['Manrope'] text-sm">No workouts yet. Hit the gym!</p>
        )}
      </div>
    </div>
  );
}
