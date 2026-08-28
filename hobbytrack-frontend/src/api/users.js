import client from './client';
import { authHeader } from './authHeader';

export const searchUsers = (q) =>
  client.get('/users/search', { params: { q } });

export const getUser = (id) =>
  client.get(`/users/${id}`);

export const getFollowers = (id) =>
  client.get(`/users/${id}/followers`);

export const getFollowing = (id) =>
  client.get(`/users/${id}/following`);

export const followUser = (token, id) =>
  client.post(`/users/${id}/follow`, {}, authHeader(token));

export const unfollowUser = (token, id) =>
  client.delete(`/users/${id}/unfollow`, authHeader(token));