import client from './client';

export const listRoles = () => client.get('/roles');
export const createRole = (data) => client.post('/roles', data);
export const renameRole = (id, data) => client.put(`/roles/${id}`, data);
export const deleteRole = (id) => client.delete(`/roles/${id}`);
export const savePermissions = (id, permissions) =>
  client.put(`/roles/${id}/permissions`, { permissions });