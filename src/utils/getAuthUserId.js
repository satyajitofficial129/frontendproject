import axios from 'axios';
import { NEXT_PUBLIC_API_BASE_URL } from './settings';

const getAuthUserId = async () => {
    try {
        const authToken = localStorage.getItem('auth-token');
        if (!authToken) {
            throw new Error('No auth token found in localStorage.');
        }
        const apiBaseUrl = NEXT_PUBLIC_API_BASE_URL;
        const tokenData = JSON.parse(authToken); 
        const token = tokenData.token;
        const userResponse = await axios.get(`${apiBaseUrl}/user`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return userResponse.data.id;
    } catch (error) {
        console.error('Error fetching user ID:', error.message);
        throw error;
    }
};

export default getAuthUserId;
