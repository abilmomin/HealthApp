import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Users, Search, UserPlus, UserMinus, Dumbbell, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SocialPage() {
  const { getHeaders } = useAuth();
  const [tab, setTab] = useState('feed');
  const [feed, setFeed] = useState([]);
  const [following, setFollowing] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState(new Set());

  const fetchData = useCallback(async () => {
    try {
      const [feedRes, followingRes, followersRes] = await Promise.all([
        axios.get(`${API}/social/feed`, { headers: getHeaders() }),
        axios.get(`${API}/social/following`, { headers: getHeaders() }),
        axios.get(`${API}/social/followers`, { headers: getHeaders() }),
      ]);
      setFeed(feedRes.data);
      setFollowing(followingRes.data);
      setFollowers(followersRes.data);
      setFollowingIds(new Set(followingRes.data.map(u => u.uid)));
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [getHeaders]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const searchUsers = async () => {
    if (!searchQ.trim()) return;
    try {
      const res = await axios.get(`${API}/users/search?q=${encodeURIComponent(searchQ)}`, { headers: getHeaders() });
      setSearchResults(res.data);
    } catch (e) { console.error(e); }
  };

  const followUser = async (uid) => {
    try {
      await axios.post(`${API}/social/follow/${uid}`, {}, { headers: getHeaders() });
      setFollowingIds(s => new Set([...s, uid]));
      fetchData();
    } catch (e) { console.error(e); }
  };

  const unfollowUser = async (uid) => {
    try {
      await axios.delete(`${API}/social/unfollow/${uid}`, { headers: getHeaders() });
      setFollowingIds(s => { const n = new Set(s); n.delete(uid); return n; });
      fetchData();
    } catch (e) { console.error(e); }
  };

  const tabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'following', label: `Following (${following.length})` },
    { id: 'followers', label: `Followers (${followers.length})` },
    { id: 'discover', label: 'Discover' },
  ];

  return (
    <div className="space-y-6" data-testid="social-page">
      <h1 className="text-4xl font-black font-['Barlow_Condensed'] uppercase tracking-tighter text-white">Social</h1>

      <div className="flex gap-2 border-b border-white/10 pb-3">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-md text-sm font-['Manrope'] font-medium transition-colors ${tab === t.id ? 'bg-[#FF3B30] text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
            data-testid={`social-tab-${t.id}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-[#FF3B30] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'feed' && (
            <div className="space-y-4" data-testid="social-feed">
              {feed.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
                  <p className="text-zinc-500 font-['Manrope']">No activity yet. Follow people or share your workouts!</p>
                </div>
              ) : (
                feed.map(item => (
                  <div key={item.id} className="bg-[#161618] border border-white/10 rounded-md p-5 hover:border-white/20 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      {item.user?.photo_url ? (
                        <img src={item.user.photo_url} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#FF3B30]/20 flex items-center justify-center text-[#FF3B30] font-bold text-sm">
                          {(item.user?.display_name || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-['Manrope'] font-medium">{item.user?.display_name || 'User'}</p>
                        <p className="text-xs text-zinc-500 font-['Manrope']">shared a workout - {item.created_at?.slice(0, 10)}</p>
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-md p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Dumbbell className="w-4 h-4 text-[#FF3B30]" />
                        <span className="text-white font-['Manrope'] font-medium">{item.workout?.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-400 font-['Manrope']">
                        <span>{item.workout?.exercises?.length || 0} exercises</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.workout?.duration_minutes}min</span>
                      </div>
                      {item.workout?.exercises?.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.workout.exercises.slice(0, 3).map((ex, i) => (
                            <p key={i} className="text-xs text-zinc-500 font-['Manrope']">{ex.name} - {ex.sets}x{ex.reps}</p>
                          ))}
                          {item.workout.exercises.length > 3 && (
                            <p className="text-xs text-zinc-600 font-['Manrope']">+{item.workout.exercises.length - 3} more</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'following' && (
            <div className="space-y-3" data-testid="following-list">
              {following.length === 0 ? (
                <p className="text-zinc-500 font-['Manrope'] text-center py-8">Not following anyone yet</p>
              ) : following.map(u => (
                <UserCard key={u.uid} user={u} isFollowing={true} onUnfollow={() => unfollowUser(u.uid)} />
              ))}
            </div>
          )}

          {tab === 'followers' && (
            <div className="space-y-3" data-testid="followers-list">
              {followers.length === 0 ? (
                <p className="text-zinc-500 font-['Manrope'] text-center py-8">No followers yet</p>
              ) : followers.map(u => (
                <UserCard key={u.uid} user={u} isFollowing={followingIds.has(u.uid)} onFollow={() => followUser(u.uid)} onUnfollow={() => unfollowUser(u.uid)} />
              ))}
            </div>
          )}

          {tab === 'discover' && (
            <div className="space-y-4" data-testid="discover-users">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input
                    placeholder="Search users by name or email..."
                    value={searchQ}
                    onChange={e => setSearchQ(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchUsers()}
                    className="w-full bg-[#161618] border border-white/10 rounded-md pl-11 pr-4 py-3 text-white placeholder:text-zinc-500 font-['Manrope'] focus:outline-none focus:border-[#FF3B30]"
                    data-testid="user-search-input"
                  />
                </div>
                <button onClick={searchUsers} className="bg-[#007AFF] hover:bg-[#0056CC] text-white px-6 py-3 rounded-md font-['Manrope'] font-medium" data-testid="search-users-button">Search</button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map(u => (
                    <UserCard key={u.uid} user={u} isFollowing={followingIds.has(u.uid)} onFollow={() => followUser(u.uid)} onUnfollow={() => unfollowUser(u.uid)} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function UserCard({ user, isFollowing, onFollow, onUnfollow }) {
  return (
    <div className="bg-[#161618] border border-white/10 rounded-md p-4 flex items-center justify-between hover:border-white/20 transition-all">
      <div className="flex items-center gap-3">
        {user.photo_url ? (
          <img src={user.photo_url} alt="" className="w-10 h-10 rounded-full" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#FF3B30]/20 flex items-center justify-center text-[#FF3B30] font-bold text-sm">
            {(user.display_name || 'U')[0].toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-white font-['Manrope'] font-medium">{user.display_name}</p>
          <p className="text-xs text-zinc-500 font-['Manrope']">{user.email}</p>
        </div>
      </div>
      {isFollowing ? (
        <button onClick={onUnfollow} className="flex items-center gap-1 px-3 py-2 bg-white/5 text-zinc-400 rounded-md text-sm font-['Manrope'] hover:bg-red-500/10 hover:text-red-400 transition-colors" data-testid={`unfollow-${user.uid}`}>
          <UserMinus className="w-4 h-4" /> Unfollow
        </button>
      ) : (
        <button onClick={onFollow} className="flex items-center gap-1 px-3 py-2 bg-[#007AFF] text-white rounded-md text-sm font-['Manrope'] hover:bg-[#0056CC] transition-colors" data-testid={`follow-${user.uid}`}>
          <UserPlus className="w-4 h-4" /> Follow
        </button>
      )}
    </div>
  );
}
