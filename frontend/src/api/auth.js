import { post } from './client.js';

export const register = (email, password) => post('/auth/register', { email, password });
export const login = (email, password) => post('/auth/login', { email, password });
