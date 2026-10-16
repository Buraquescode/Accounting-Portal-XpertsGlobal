import client from './axiosClient';

export const login = (email, password) => client.post('/auth/login', { email, password }).then((r) => r.data);
export const logout = () => client.post('/auth/logout').then((r) => r.data);
export const me = () => client.get('/auth/me').then((r) => r.data);
