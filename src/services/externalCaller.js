const axios = require('axios');

async function callWithRetry(url, options = {}, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Bridge] Attempt ${attempt}/${retries} -> ${url}`);
      const response = await axios({
        url,
        timeout: 5000,
        ...options
      });
      return response.data;
    } catch (error) {
      const isLastAttempt = attempt === retries;
      console.warn(`[Bridge] Failed: ${error.message}`);
      
      if (isLastAttempt) throw new Error(`Failed after ${retries} tries: ${error.message}`);
      
      // Exponential backoff: 1s, 2s, 3s
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

module.exports = { callWithRetry };