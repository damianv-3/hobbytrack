import client from './client';
import { authHeader } from './authHeader';

export const getMediaList = (type, page, limit) =>
  client.get('/media', { params: { type, page, limit } });

export const searchMediaLibrary = (q) =>
  client.get('/media/search', { params: { q } });

export const getMediaById = (id) =>
  client.get(`/media/${id}`);

export const searchExternal = (mediaType, q) =>
  client.get(mediaType === 'album' ? '/search/albums' : '/search/books', { params: { q } });

export const addAlbumFromMusicBrainz = (token, mbid) =>
  client.post('/media/albums/from-musicbrainz', { mbid }, authHeader(token));

export const addBookFromGoogle = (token, googleBooksId) =>
  client.post('/media/books/from-google', { googleBooksId }, authHeader(token));