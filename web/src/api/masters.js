import client from './client';

export const listDeviceTypes = (params) => client.get('/device-types', { params });
export const createDeviceType = (data) => client.post('/device-types', data);
export const updateDeviceType = (id, data) => client.put(`/device-types/${id}`, data);
export const deleteDeviceType = (id) => client.delete(`/device-types/${id}`);

export const listBrands = (params) => client.get('/brands', { params });
export const createBrand = (data) => client.post('/brands', data);
export const updateBrand = (id, data) => client.put(`/brands/${id}`, data);
export const deleteBrand = (id) => client.delete(`/brands/${id}`);

export const listModels = (params) => client.get('/models', { params });
export const createModel = (data) => client.post('/models', data);
export const updateModel = (id, data) => client.put(`/models/${id}`, data);
export const deleteModel = (id) => client.delete(`/models/${id}`);
