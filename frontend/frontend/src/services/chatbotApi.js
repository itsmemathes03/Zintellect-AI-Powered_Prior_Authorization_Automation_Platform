/**
 * CareBridge AI Chatbot API Client
 *
 * This module provides a dedicated axios instance for communicating
 * with the CareBridge AI backend running on a separate port.
 *
 * The Zintellect backend (VITE_API_URL) and CareBridge AI backend
 * (VITE_CHATBOT_API_URL) are independent services.
 */

import axios from "axios";

const chatbotApi = axios.create({
  baseURL: import.meta.env.VITE_CHATBOT_API_URL || "http://localhost:8001",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000, // 30-second timeout for LLM responses
});

/**
 * Send a chat message to the CareBridge AI backend.
 *
 * @param {string} message - The user's message
 * @param {Array<{role: string, content: string}>} history - Conversation history
 * @returns {Promise<{response: string}>} AI-generated answer
 */
export const sendChatMessage = async (message, history = []) => {
  const response = await chatbotApi.post("/chat", {
    message,
    history,
  });
  return response.data;
};

export default chatbotApi;
