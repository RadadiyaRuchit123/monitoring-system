import { useState, useEffect, useCallback } from 'react';
import { dayService } from '../services/dayService';

/**
 * Custom hook to manage User Days state
 * @param {string} userId
 */
export const useDays = (userId) => {
  const [days, setDays] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDays = useCallback(async () => {
    if (!userId) {
      setDays([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await dayService.getDays(userId);
      setDays(data);
      if (data.length > 0) {
        // Default to first day if none selected or selected day no longer exists
        setSelectedDayId((prev) => {
          if (prev && data.some((d) => d.id === prev)) return prev;
          return data[0].id;
        });
      } else {
        setSelectedDayId(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDays();
  }, [fetchDays]);

  const selectDay = (dayId) => {
    setSelectedDayId(dayId);
  };

  const addDay = async ({ title, description }) => {
    if (!userId) return;
    setError(null);
    try {
      const nextDayNumber = days.length > 0 ? Math.max(...days.map((d) => d.day_number)) + 1 : 1;
      const newDay = await dayService.createDay({
        userId,
        day_number: nextDayNumber,
        title: title || `Day ${nextDayNumber}`,
        description,
      });
      setDays((prev) => [...prev, newDay]);
      setSelectedDayId(newDay.id);
      return newDay;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateDay = async (dayId, { title, description }) => {
    if (!userId || !dayId) return;
    setError(null);
    try {
      const updated = await dayService.updateDay(dayId, userId, { title, description });
      setDays((prev) => prev.map((d) => (d.id === dayId ? updated : d)));
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const deleteDay = async (dayId) => {
    if (!userId || !dayId) return;
    setError(null);
    try {
      await dayService.deleteDay(dayId, userId);
      setDays((prev) => prev.filter((d) => d.id !== dayId));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const selectedDay = days.find((d) => d.id === selectedDayId) || null;

  return {
    days,
    selectedDay,
    selectedDayId,
    loading,
    error,
    selectDay,
    addDay,
    updateDay,
    deleteDay,
    refreshDays: fetchDays,
  };
};
