import client from './client';
import { authHeader } from './authHeader';

export const getClubs = (focusType, page, limit) =>
  client.get('/clubs', { params: { ...(focusType ? { focusType } : {}), page, limit } });

export const getClub = (id) =>
  client.get(`/clubs/${id}`);

export const getClubsForUser = (userId, page, limit) =>
  client.get(`/clubs/user/${userId}`, { params: { page, limit } });

export const createClub = (token, { name, description, focusType }) =>
  client.post('/clubs', { name, description, focusType }, authHeader(token));

export const joinClub = (token, id) =>
  client.post(`/clubs/${id}/join`, {}, authHeader(token));

export const leaveClub = (token, id) =>
  client.delete(`/clubs/${id}/leave`, authHeader(token));

export const deleteClub = (token, id) =>
  client.delete(`/clubs/${id}`, authHeader(token));

export const getMeetings = (clubId) =>
  client.get(`/clubs/${clubId}/meetings`);

export const scheduleMeeting = (token, clubId, { mediaId, meetingDate, notes }) =>
  client.post(`/clubs/${clubId}/meetings`, { mediaId: mediaId || null, meetingDate, notes }, authHeader(token));