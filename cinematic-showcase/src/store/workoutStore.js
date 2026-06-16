import { create } from 'zustand';
import api from '../lib/api';

export const useWorkoutStore = create((set, get) => ({
  workouts: [],
  todayNutrition: { meals: [], totalCalories: 0 },
  nutritionHistory: [],
  progressHistory: [],
  feedPosts: [],
  leaderboard: [],
  
  isLoading: false,
  isGeneratingWorkout: false,
  isGeneratingMealPlan: false,
  error: null,

  // --- WORKOUTS ---
  fetchWorkouts: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/api/workouts/history');
      set({ workouts: res.data });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch workouts' });
    } finally {
      set({ isLoading: false });
    }
  },

  logWorkout: async (workoutData) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/api/workouts/log', workoutData);
      set((state) => ({ workouts: [res.data, ...state.workouts] }));
      return { success: true, workout: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to log workout' };
    } finally {
      set({ isLoading: false });
    }
  },

  toggleWorkoutComplete: async (workoutId, isCompleted) => {
    try {
      set({ isLoading: true });
      const res = await api.put(`/api/workouts/${workoutId}`, { isCompleted });
      set((state) => ({
        workouts: state.workouts.map((w) => w._id === workoutId ? res.data : w)
      }));
      return { success: true, workout: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update workout' };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteWorkout: async (workoutId) => {
    try {
      set({ isLoading: true });
      await api.delete(`/api/workouts/${workoutId}`);
      set((state) => ({
        workouts: state.workouts.filter((w) => w._id !== workoutId)
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete workout' };
    } finally {
      set({ isLoading: false });
    }
  },

  generateWorkout: async (generatorConfig) => {
    try {
      set({ isGeneratingWorkout: true });
      const res = await api.post('/api/workouts/generate', generatorConfig);
      return { success: true, plan: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to generate workout' };
    } finally {
      set({ isGeneratingWorkout: false });
    }
  },

  // --- NUTRITION ---
  fetchTodayNutrition: async (dateString) => {
    try {
      set({ isLoading: true });
      const url = dateString ? `/api/nutrition/today?date=${dateString}` : '/api/nutrition/today';
      const res = await api.get(url);
      set({ todayNutrition: res.data });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch nutrition log' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchNutritionHistory: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/api/nutrition/history');
      set({ nutritionHistory: res.data });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch nutrition history' });
    } finally {
      set({ isLoading: false });
    }
  },

  logMeal: async (mealData) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/api/nutrition/log', mealData);
      set({ todayNutrition: res.data });
      get().fetchNutritionHistory();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to log meal' };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteMeal: async (mealId, dateString) => {
    try {
      set({ isLoading: true });
      const url = dateString 
        ? `/api/nutrition/log/${mealId}?date=${dateString}` 
        : `/api/nutrition/log/${mealId}`;
      const res = await api.delete(url);
      set({ todayNutrition: res.data });
      get().fetchNutritionHistory();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to delete meal' };
    } finally {
      set({ isLoading: false });
    }
  },

  updateWater: async (waterGlasses, dateString) => {
    try {
      set({ isLoading: true });
      const payload = dateString ? { waterGlasses, date: dateString } : { waterGlasses };
      const res = await api.put('/api/nutrition/water', payload);
      set({ todayNutrition: res.data });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to update water' };
    } finally {
      set({ isLoading: false });
    }
  },

  generateMealPlan: async () => {
    try {
      set({ isGeneratingMealPlan: true });
      const res = await api.post('/api/nutrition/meal-plan');
      return { success: true, plan: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to generate meal plan' };
    } finally {
      set({ isGeneratingMealPlan: false });
    }
  },

  // --- PROGRESS ---
  fetchProgressHistory: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/api/progress/history');
      set({ progressHistory: res.data });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch progress logs' });
    } finally {
      set({ isLoading: false });
    }
  },

  logProgress: async (progressData) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/api/progress/log', progressData);
      set((state) => ({ progressHistory: [...state.progressHistory, res.data] }));
      return { success: true, entry: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to log progress' };
    } finally {
      set({ isLoading: false });
    }
  },

  uploadProgressPhoto: async (formData) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/api/progress/photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return { success: true, photoUrl: res.data.photoUrl };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to upload photo' };
    } finally {
      set({ isLoading: false });
    }
  },

  // --- COMMUNITY FEED ---
  fetchFeed: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/api/feed');
      set({ feedPosts: res.data });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch community feed' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchLeaderboard: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/api/leaderboard');
      set({ leaderboard: res.data });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch leaderboard' });
    } finally {
      set({ isLoading: false });
    }
  },

  createPost: async (postData) => {
    try {
      set({ isLoading: true });
      const res = await api.post('/api/posts/create', postData);
      set((state) => ({ feedPosts: [res.data, ...state.feedPosts] }));
      return { success: true, post: res.data };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to create post' };
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLikePost: async (postId) => {
    try {
      const res = await api.post(`/api/posts/${postId}/like`);
      set((state) => ({
        feedPosts: state.feedPosts.map((post) => 
          post._id === postId ? { ...post, likes: res.data.likes } : post
        ),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to like post' };
    }
  },

  addComment: async (postId, commentText) => {
    try {
      const res = await api.post(`/api/posts/${postId}/comment`, { text: commentText });
      set((state) => ({
        feedPosts: state.feedPosts.map((post) => 
          post._id === postId ? res.data : post
        ),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.message || 'Failed to add comment' };
    }
  },
}));
export default useWorkoutStore;
