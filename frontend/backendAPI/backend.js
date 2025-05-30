import axios from "axios";

const api = axios.create({
  // For local development: http://127.0.0.1:5000
  // for production:        https://the-other-day-new.vercel.app
  baseURL: "http://127.0.0.1:5000",
});

export const refreshSession = async (session, setSession) => {
  const headers = {
    Refresh: `${session.refreshToken}`,
  };
  const response = await api.post("refresh-session", {}, { headers });
  return setSession(response.data);
};

export const backendGet = async (endpoint, params) => {
  try {
    const response = await api.get(endpoint, params);
    return response.data;
  } catch (error) {
    console.error("API error:", error);
    throw error;
  }
};

export const backendPost = async (endpoint, session, setSession, payload) => {
  const headers = {
    Authorization: `${session.accessToken}`,
    Refresh: `${session.refreshToken}`,
  };

  try {
    const response = await api.post(endpoint, payload, { headers });
    return response.data;
  } catch (error) {
    // If unauthorized (401), refresh session and retry
    if (error.response && error.response.status === 401) {
      await refreshSession(session, setSession);

      const newHeaders = {
        Authorization: `${session.accessToken}`,
        Refresh: `${session.refreshToken}`,
      };

      const retryResponse = await api.post(endpoint, payload, { headers: newHeaders });
      return retryResponse.data;
    }

    // Rethrow other errors
    throw error;
  }
};


export const auth = async (endpoint, params) => {
  const response = await api.post(endpoint, params);
  return response.data;
};
