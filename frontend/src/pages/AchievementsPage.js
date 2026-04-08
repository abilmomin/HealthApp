import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Award, Flame, Trophy, Medal, Crown, Target, Users, Dumbbell, Apple, Lock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const iconMap = {
  dumbbell: Dumbbell,
  flame: Flame,
  fire: Flame,
  trophy: Trophy,
  medal: Medal,
  crown: Crown,
  target: Target,
  users: Users,
  apple: Apple,
};

export default function AchievementsPage() {
  const { getHeaders } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreaks = async () => {
      try {
        const res = await axios.get(`${API}/stats/streaks`, { headers: getHeaders() });
        setData(res.data);
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchStreaks();
  }, [getHeaders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const streak = data?.streak || {};
  const badges = data?.badges || [];
  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <div className="space-y-6" data-testid="achievements-page">
      <h1 className="text-4xl font-black font-['Barlow_Condensed'] uppercase tracking-tighter text-white">Achievements</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#161618] border border-white/10 rounded-md p-6 text-center">
          <Flame className="w-12 h-12 text-[#FF9F0A] mx-auto mb-3" />
          <p className="text-4xl font-black font-['Barlow_Condensed'] text-white">{streak.current_streak || 0}</p>
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-400 font-['Manrope'] mt-1">Current Streak</p>
        </div>
        <div className="bg-[#161618] border border-white/10 rounded-md p-6 text-center">
          <Trophy className="w-12 h-12 text-[#FF3B30] mx-auto mb-3" />
          <p className="text-4xl font-black font-['Barlow_Condensed'] text-white">{streak.longest_streak || 0}</p>
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-400 font-['Manrope'] mt-1">Longest Streak</p>
        </div>
        <div className="bg-[#161618] border border-white/10 rounded-md p-6 text-center">
          <Dumbbell className="w-12 h-12 text-[#007AFF] mx-auto mb-3" />
          <p className="text-4xl font-black font-['Barlow_Condensed'] text-white">{streak.total_workouts || 0}</p>
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-400 font-['Manrope'] mt-1">Total Workouts</p>
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-[0.15em] text-zinc-400 font-['Manrope'] mb-4">Earned Badges ({earnedBadges.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {earnedBadges.map(badge => {
              const Icon = iconMap[badge.icon] || Award;
              return (
                <div key={badge.id} className="bg-[#161618] border border-[#FF3B30]/30 rounded-md p-5 text-center hover:-translate-y-1 transition-all duration-200" style={{ boxShadow: '0 0 15px rgba(255,59,48,0.15)' }}>
                  <Icon className="w-10 h-10 text-[#FF3B30] mx-auto mb-3" />
                  <p className="text-white font-['Manrope'] font-medium text-sm">{badge.name}</p>
                  <p className="text-xs text-zinc-500 font-['Manrope'] mt-1">{badge.description}</p>
                  <p className="text-[10px] text-[#FF3B30] font-['Manrope'] mt-2">Earned {badge.earned_at?.slice(0, 10)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-sm uppercase tracking-[0.15em] text-zinc-400 font-['Manrope'] mb-4">Locked ({lockedBadges.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lockedBadges.map(badge => (
              <div key={badge.id} className="bg-[#161618] border border-white/5 rounded-md p-5 text-center opacity-40">
                <Lock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400 font-['Manrope'] font-medium text-sm">{badge.name}</p>
                <p className="text-xs text-zinc-600 font-['Manrope'] mt-1">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
