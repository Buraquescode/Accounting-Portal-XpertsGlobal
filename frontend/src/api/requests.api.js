import client, { API_URL } from './axiosClient';

const unwrap = (r) => r.data; // { success, data, meta }
const act = (id, action, comment) => client.post(`/requests/${id}/${action}`, comment ? { comment } : {}).then(unwrap);

export const list = (params) => client.get('/requests', { params }).then(unwrap);
export const get = (id) => client.get(`/requests/${id}`).then(unwrap);
export const create = (formData) => client.post('/requests', formData).then(unwrap); // axios sets the multipart boundary
export const startReview = (id, comment) => act(id, 'start-review', comment);
export const forward = (id, comment) => act(id, 'forward', comment);
export const reject = (id, comment) => act(id, 'reject', comment);
export const approve = (id, comment) => act(id, 'approve', comment);
export const markPaid = (id, comment) => act(id, 'mark-paid', comment);
// Opened with the session cookie, so the browser sends credentials automatically for same-site API calls.
export const fileUrl = (id) => `${API_URL}/requests/${id}/file`;
