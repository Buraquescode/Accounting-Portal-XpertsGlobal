import client from './axiosClient';

export const approvers = () => client.get('/users/approvers').then((r) => r.data);
