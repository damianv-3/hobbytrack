import client from './client';
import { authHeader } from './authHeader';

export const getFeed = (token, page, limit) =>
  client.get('/feed', { ...authHeader(token), params: { page, limit } });