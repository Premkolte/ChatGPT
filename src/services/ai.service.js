const {GoogleGenAI} = require("@google/genai");

async function generateResponse(content) {
    try {
        console.log('Attempting to generate response with content:', content);
        
        const genAI = new GoogleGenAI({
            apiKey: process.env.GOOGLE_API_KEY
        });
        
        // Use the available model names from the API list
        const modelNames = [
            "models/gemini-2.0-flash-exp",
            "models/gemini-flash-latest",
            "models/gemini-pro-latest", 
            "models/gemini-2.5-flash-lite",
            "models/gemini-2.0-flash-thinking-exp",
            "models/learnlm-2.0-flash-experimental"
        ];
        
        for (const modelName of modelNames) {
            try {
                console.log(`Trying model: ${modelName}`);
                
                const result = await genAI.models.generateContent({
                    model: modelName,
                    contents: [{
                        parts: [{
                            text: content
                        }]
                    }]
                });
                
                console.log(`Success with model ${modelName}!`);
                console.log('Raw API response:', JSON.stringify(result, null, 2));
                
                // Handle different response structures
                if (result && result.candidates && result.candidates[0]) {
                    const responseText = result.candidates[0].content.parts[0].text;
                    console.log('Successfully extracted response:', responseText);
                    return responseText;
                } else if (result.response && result.response.text) {
                    return result.response.text();
                } else if (result.text) {
                    return result.text;
                } else if (typeof result === 'string') {
                    return result;
                }
                
                console.log('Unexpected response format from', modelName, ':', result);
                
            } catch (modelError) {
                console.log(`Model ${modelName} failed:`, modelError.message);
                continue; // Try next model
            }
        }
        
        return "I apologize, but none of the available AI models are working. Please try again later.";
        
    } catch (error) {
        console.error("Detailed error generating text:", error);
        console.error("Error stack:", error.stack);
        
        // Check if it's an authentication error
        if (error.message.includes('credentials') || error.message.includes('authentication')) {
            return "API authentication failed. Please check your Google API key configuration.";
        } else if (error.message.includes('quota') || error.message.includes('limit')) {
            return "API quota exceeded. Please try again later.";
        } else if (error.message.includes('model')) {
            return "The requested AI model is not available. Please try again.";
        }
        
        return "I'm sorry, I encountered an error while generating a response. Please try again.";
    }
}

module.exports = { generateResponse };
