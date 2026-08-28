import client from './client';
import { authHeader } from './authHeader';

export const getLogsForMedia = (mediaId, page, limit) =>
  client.get(`/logs/media/${mediaId}`, { params: { page, limit } });

export const getLogsForUser = (userId, page, limit) =>
  client.get(`/logs/user/${userId}`, { params: { page, limit } });

export const createLog = (token, { mediaId, rating, loggedDate, notes }) =>
  client.post('/logs', { mediaId, rating: rating || null, loggedDate, notes }, authHeader(token));

export const updateLog = (token, logId, { rating, loggedDate, notes }) =>
  client.put(`/logs/${logId}`, { rating: rating || null, loggedDate, notes }, authHeader(token));

export const deleteLog = (token, logId) =>
  client.delete(`/logs/${logId}`, authHeader(token));