export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Convert data URL to base64
    const base64Data = imageData.split(',')[1];
    
    const requestBody = {
      contents: [{
        parts: [
          {
            text: "You are an AI art critic and drawing enhancer. Analyze this hand-drawn sketch and provide a detailed, professional description of how it could be enhanced and improved. Focus on: 1) What you see in the drawing, 2) Artistic improvements that could be made, 3) Technical suggestions for better composition, lines, shading, and details, 4) Professional artistic advice. Provide a comprehensive response that would help someone understand how to make their drawing more refined and professional-looking. Be encouraging and constructive."
          },
          {
            inline_data: {
              mime_type: "image/png",
              data: base64Data
            }
          }
        ]
      }]
    };

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const enhancedDescription = data.candidates[0].content.parts[0].text;
      res.json({ success: true, enhancedDescription });
    } else {
      throw new Error('Invalid response format from Gemini API');
    }

  } catch (error) {
    console.error('Enhancement error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to process with Gemini AI' 
    });
  }
}