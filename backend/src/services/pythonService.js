const axios = require('axios');

const pythonServiceApi = axios.create({
  baseURL: process.env.PYTHON_SERVICE_URL,
});

const analyzeClick = async (clickData) => {
  try {
    const response = await pythonServiceApi.post('/analyze/click', clickData);
    return response.data;
  } catch (error) {
    console.error('Error calling Python service:', error.message);
    return {
        geo: {},
        device: {},
        browser: {},
        os: {},
        isBot: false,
    };
  }
};

module.exports = {
  analyzeClick,
};
