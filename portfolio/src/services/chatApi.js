import axios from 'axios';

const API_URL = import.meta.env.VITE_CHATBOT_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Send a chat message and get AI response
 * @param {string} sessionId - The session ID
 * @param {string} message - The user's message
 * @returns {Promise} Response with AI message and potential lead info
 */
export const sendMessage = async (sessionId, message) => {
  try {
    const response = await api.post('/chat', {
      session_id: sessionId,
      message,
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Get chat history for a session
 * @param {string} sessionId - The session ID
 * @returns {Promise} Array of messages
 */
export const getMessages = async (sessionId) => {
  try {
    const response = await api.get(`/messages/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

/**
 * Save lead information
 * @param {Object} leadData - Lead information (name, email, phone, shoot_type, etc.)
 * @returns {Promise} Success response
 */
export const saveLead = async (leadData) => {
  try {
    const response = await api.post('/leads', leadData);
    return response.data;
  } catch (error) {
    console.error('Error saving lead:', error);
    throw error;
  }
};

/**
 * Get portfolio items
 * @returns {Promise} Array of portfolio items
 */
export const getPortfolio = async () => {
  try {
    const response = await api.get('/portfolio');
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    throw error;
  }
};

/**
 * Get photography packages
 * @returns {Promise} Array of packages
 */
export const getPackages = async () => {
  try {
    const response = await api.get('/packages');
    return response.data;
  } catch (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }
};

export default {
  sendMessage,
  getMessages,
  saveLead,
  getPortfolio,
  getPackages,
};
