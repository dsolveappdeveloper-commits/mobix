import client from './client';

export const getShop = () => client.get('/shop');
export const updateShop = (data) => client.put('/shop', data);
