import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // تأكد من منفذ لارافيل عندك
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
});

export default api;