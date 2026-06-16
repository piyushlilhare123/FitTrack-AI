"use client";
import React, { useState, useEffect } from 'react';
import useWorkoutStore from '@/store/workoutStore';
import useAuthStore from '@/store/authStore';
import Card from '@/components/ui/Card';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Send, 
  Flame, 
  Award, 
  Dumbbell,
  CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Community() {
  const { user } = useAuthStore() as any;
  const { 
    feedPosts, 
    leaderboard,
    workouts, 
    fetchFeed, 
    fetchLeaderboard,
    createPost, 
    toggleLikePost, 
    addComment 
  } = useWorkoutStore() as any;

  const [postContent, setPostContent] = useState('');
  const [selectedWorkout, setSelectedWorkout] = useState('');
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchFeed();
    fetchLeaderboard();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return toast.error('Post content cannot be empty.');

    const res = await createPost({
      content: postContent,
      workoutId: selectedWorkout || null
    });

    if (res.success) {
      toast.success('Activity shared to community!');
      setPostContent('');
      setSelectedWorkout('');
    } else {
      toast.error(res.error || 'Failed to create post.');
    }
  };

  const handleLike = async (postId: string) => {
    const res = await toggleLikePost(postId);
    if (!res.success) {
      toast.error(res.error || 'Failed to toggle like.');
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const commentText = commentInputs[postId];
    if (!commentText || !commentText.trim()) return;

    const res = await addComment(postId, commentText);
    if (res.success) {
      toast.success('Comment posted!');
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
    } else {
      toast.error(res.error || 'Failed to post comment.');
    }
  };

  const handleCommentInputChange = (postId: string, text: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: text }));
  };

  // Dynamic Score Calculation for Active Challenges
  const activeWorkoutCount = workouts?.length || 0;
  const currentStreak = user?.streak || 0;

  // Render leaderboard ranks dynamically
  const displayLeaderboard = (leaderboard || []).map((item: any, index: number) => ({
    ...item,
    rank: index + 1
  }));

  // Dynamic active challenges
  const challenges = [
    { 
      id: '1', 
      title: 'Summer Shred Challenge', 
      target: '20 Workouts in 30 days', 
      time: '12d 4h remaining',
      progress: Math.min(100, (activeWorkoutCount / 20) * 100)
    },
    { 
      id: '2', 
      title: 'Consistency Streak Shield', 
      target: 'Keep 14-day streak active', 
      time: '3d 8h remaining',
      progress: Math.min(100, (currentStreak / 14) * 100)
    },
  ];

  // Feed displays all users
  const activeFeed = feedPosts || [];

  return (
    <div className="space-y-8 pb-12 select-none">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-accentCyan" />
          <span>Community Feed</span>
        </h2>
        <p className="text-xs text-mutedText mt-0.5 font-sans">Share logged workouts, celebrate milestones, and compete on leaderboards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Feed & Composer */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Composer Box */}
          <Card className="space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Share Your Workout</h3>
            
            <form onSubmit={handleCreatePost} className="space-y-4 font-sans">
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What did you achieve today? Hit a new PR, logged a morning run?"
                className="w-full h-20 bg-[#0F1928] border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-3 px-4 text-xs text-white resize-none"
              />

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {/* Select workout reference */}
                <select
                  value={selectedWorkout}
                  onChange={(e) => setSelectedWorkout(e.target.value)}
                  className="bg-[#0F1928] border border-white/5 focus:border-cyan/30 text-xs text-mutedText focus:text-white rounded-xl py-2 px-3 focus:outline-none"
                >
                  <option value="">Attach Workout Log (Optional)</option>
                  {workouts.slice(0, 5).map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.duration} min) - {new Date(w.date).toLocaleDateString()}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-bg bg-[#39FF14] hover:bg-[#39FF14]/90 glow-green transition-transform hover:scale-105"
                >
                  Post Activity
                </button>
              </div>
            </form>
          </Card>

          {/* Posts Feed list */}
          <div className="space-y-6">
            {activeFeed.length > 0 ? (
              activeFeed.map((post: any) => {
                const isLiked = post.likes.some((like: any) => (like._id || like) === user?._id);

                return (
                  <Card key={post._id} className="space-y-4">
                    {/* Author block */}
                    <div className="flex items-center space-x-3 border-b border-white/5 pb-3.5">
                      <img
                        src={post.userId?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${post.userId?.name || 'User'}`}
                        alt="Avatar"
                        className="w-10 h-10 rounded-full border border-white/10"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-white">{post.userId?.name || 'Fit Member'}</h4>
                        <p className="text-[9px] text-mutedText mt-0.5">{new Date(post.date).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Post content */}
                    <div className="space-y-4">
                      <p className="text-xs text-[#C4CDD8] leading-relaxed font-sans">{post.content}</p>

                      {/* Optional workout log card attachment */}
                      {post.workoutId && (
                        <div className="p-4 rounded-2xl bg-white/[0.01] border border-cyan/20 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan">
                              <Dumbbell className="w-4.5 h-4.5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-white">{post.workoutId.name}</h5>
                              <p className="text-[10px] text-mutedText mt-0.5 font-sans">{post.workoutId.duration} min • {post.workoutId.totalCalories} kcal burned</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-actionGreen bg-actionGreen/10 border border-actionGreen/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions panel */}
                    <div className="flex flex-col space-y-2 pt-2 text-[10px] font-bold text-mutedText uppercase tracking-wider border-t border-white/5 font-sans">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <button 
                            onClick={() => handleLike(post._id)}
                            className={`flex items-center space-x-1.5 transition-colors ${isLiked ? 'text-red-400' : 'hover:text-white'}`}
                          >
                            <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-400 text-red-400' : ''}`} />
                            <span>{post.likes.length} Likes</span>
                          </button>

                          <div className="flex items-center space-x-1.5">
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments.length} Comments</span>
                          </div>
                        </div>
                      </div>

                      {post.likes.length > 0 && (
                        <div className="text-[9px] text-mutedText/60 lowercase normal-case tracking-normal">
                          Liked by: <span className="text-white/60 font-medium">{post.likes.map((l: any) => l.name || 'someone').join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Comments list */}
                    {post.comments.length > 0 && (
                      <div className="bg-white/[0.01] rounded-2xl p-4 space-y-3.5 border border-white/5 font-sans">
                        {post.comments.map((comment: any, cIdx: number) => (
                          <div key={cIdx} className="text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">{comment.name}</span>
                              <span className="text-[8px] text-mutedText font-mono">{new Date(comment.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-mutedText leading-relaxed">{comment.text}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Post Comment Input Form */}
                    <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="relative pt-2 font-sans">
                      <input
                        type="text"
                        value={commentInputs[post._id] || ''}
                        onChange={(e) => handleCommentInputChange(post._id, e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full bg-[#0F1928]/45 border border-white/5 focus:border-cyan/30 focus:outline-none rounded-xl py-2.5 pl-4 pr-10 text-[11px] text-white"
                      />
                      <button
                        type="submit"
                        className="absolute right-1 top-3 w-8 h-8 rounded-full flex items-center justify-center text-cyan hover:text-white hover:scale-105 transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </Card>
                );
              })
            ) : (
              <div className="glass-card border border-white/5 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-mutedText">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-white">No post shares yet</h4>
                  <p className="text-xs text-mutedText max-w-sm">Be the first to share your fitness streak log above!</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Leaderboard & Challenges sidebar */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Leaderboard Card */}
          <Card className="space-y-4">
            <div className="border-b border-white/5 pb-3 flex items-center space-x-2">
              <Award className="w-4.5 h-4.5 text-actionGreen" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Leaderboard</h3>
            </div>

            <div className="space-y-3.5 pt-2">
              {displayLeaderboard.map((item: any) => (
                <div 
                  key={item.rank} 
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    item.name.includes('You') 
                      ? 'bg-[#00F5FF]/10 border-[#00F5FF]/20 text-[#00F5FF]' 
                      : 'bg-white/[0.01] border-white/5'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-[10px] font-mono font-bold text-mutedText bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
                      #{item.rank}
                    </span>
                    <img
                      src={item.avatar}
                      alt="avatar"
                      className="w-7 h-7 rounded-full border border-white/10"
                    />
                    <span className="text-xs font-bold">{item.name}</span>
                  </div>

                  <span className="text-xs font-mono font-bold text-white">
                    {item.score} pts
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Challenges Card */}
          <Card className="space-y-4">
            <div className="border-b border-white/5 pb-3 flex items-center space-x-2 font-sans">
              <Flame className="w-4.5 h-4.5 text-red-500 animate-pulse" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Active Challenges</h3>
            </div>

            <div className="space-y-4 pt-2 font-sans">
              {challenges.map((ch) => (
                <div 
                  key={ch.id}
                  className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors space-y-1.5"
                >
                  <h4 className="text-xs font-bold text-white leading-snug">{ch.title}</h4>
                  <p className="text-[10px] text-mutedText">{ch.target}</p>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2 mb-3">
                    <div className="h-full bg-cyan transition-all duration-1000" style={{ width: `${ch.progress}%` }} />
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[9px]">
                    <span className="text-[#00F5FF] font-bold uppercase tracking-widest">Time Remaining</span>
                    <span className="text-actionGreen font-mono font-bold">{ch.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

        </div>

      </div>

    </div>
  );
}
