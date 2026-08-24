import { useState, useEffect, useCallback } from 'react';
import { taskService } from '../services/taskService';

/**
 * Custom hook to manage Tasks for a selected day & global progress stats
 * Includes Optimistic UI toggling with automatic rollback on error.
 * @param {string} selectedDayId
 * @param {string} userId
 */
export const useTasks = (selectedDayId, userId) => {
  const [tasks, setTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  // Fetch tasks for current selected day
  const fetchDayTasks = useCallback(async () => {
    if (!selectedDayId || !userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await taskService.getDayTasks(selectedDayId, userId);
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDayId, userId]);

  // Fetch global task count across all days for overall progress
  const fetchAllTasks = useCallback(async () => {
    if (!userId) {
      setAllTasks([]);
      return;
    }
    try {
      const globalTasks = await taskService.getAllTasks(userId);
      setAllTasks(globalTasks);
    } catch (err) {
      console.error('Error fetching global task counts:', err);
    }
  }, [userId]);

  useEffect(() => {
    fetchDayTasks();
  }, [fetchDayTasks]);

  useEffect(() => {
    fetchAllTasks();
  }, [fetchAllTasks, tasks]);

  /**
   * Optimistic Toggle Task Checkbox
   */
  const toggleTask = async (taskId, currentCompletedState) => {
    if (!userId || !taskId) return;
    if (updatingTaskId === taskId) return; // Prevent rapid double-clicks on same task

    const targetCompletedState = !currentCompletedState;
    const nowIso = new Date().toISOString();

    // 1. Save snapshot for rollback
    const previousTasks = [...tasks];
    const previousAllTasks = [...allTasks];

    // 2. Optimistic local state update
    setUpdatingTaskId(taskId);
    setError(null);

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: targetCompletedState,
              completed_at: targetCompletedState ? nowIso : null,
            }
          : t
      )
    );

    setAllTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: targetCompletedState,
              completed_at: targetCompletedState ? nowIso : null,
            }
          : t
      )
    );

    // 3. Database operation
    try {
      const updatedTask = await taskService.toggleTask(taskId, targetCompletedState, userId);

      // Confirm state with authoritative server record
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
      setAllTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
    } catch (err) {
      // 4. Rollback state on failure
      setTasks(previousTasks);
      setAllTasks(previousAllTasks);
      setError('Unable to save this change. Please try again.');
      console.error('Task toggle failed:', err);
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const addTask = async ({ title, description }) => {
    if (!userId || !selectedDayId) return;
    setError(null);
    try {
      const position = tasks.length + 1;
      const newTask = await taskService.createTask({
        userId,
        dayId: selectedDayId,
        title,
        description,
        position,
      });

      setTasks((prev) => [...prev, newTask]);
      setAllTasks((prev) => [...prev, newTask]);
      return newTask;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateTask = async (taskId, { title, description }) => {
    if (!userId || !taskId) return;
    setError(null);
    try {
      const updated = await taskService.updateTask(taskId, userId, { title, description });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteTask = async (taskId) => {
    if (!userId || !taskId) return;
    setError(null);
    try {
      await taskService.deleteTask(taskId, userId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Day Statistics
  const dayTotal = tasks.length;
  const dayCompleted = tasks.filter((t) => t.completed).length;
  const dayPending = dayTotal - dayCompleted;

  // Global Overall Statistics
  const globalTotal = allTasks.length;
  const globalCompleted = allTasks.filter((t) => t.completed).length;
  const globalPending = globalTotal - globalCompleted;

  return {
    tasks,
    loading,
    error,
    updatingTaskId,
    toggleTask,
    addTask,
    updateTask,
    deleteTask,
    refreshTasks: fetchDayTasks,
    stats: {
      dayTotal,
      dayCompleted,
      dayPending,
      globalTotal,
      globalCompleted,
      globalPending,
    },
  };
};
