import client from './client';

export const login = (formData) => client.post('/auth/login', formData);
export const register = (formData) => client.post('/auth/register', formData);