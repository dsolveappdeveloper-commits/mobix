import client from './client';

export const listBranches = (params) => client.get('/branches', { params });
export const createBranch = (data) => client.post('/branches', data);
export const updateBranch = (id, data) => client.put(`/branches/${id}`, data);
export const deleteBranch = (id) => client.delete(`/branches/${id}`);