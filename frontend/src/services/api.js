import axios from 'axios';

const api = axios.create({
  baseURL: 'https://localhost:7204/api'
});

export default api;
