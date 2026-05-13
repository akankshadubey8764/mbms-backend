const { GoogleGenerativeAI } = require("@google/generative-ai");
const KNOWLEDGE_BASE = require("../constants/knowledgeBase");

class ChatController {
    async handleChat(request, reply) {
        const { message, history = [] } = request.body;
        
        if (!process.env.GEMINI_API_KEY) {
            return reply.send({ 
                response: "I'm currently in 'Offline Mode' because the Gemini API Key is missing. However, I can tell you that I am the TPGIT Assistant! Please ask your Admin to configure the API key." 
            });
        }

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            
            const systemPrompt = `
                You are the TPGIT Hostel Assistant. Your goal is to help students with information about the college and the Mess Management Portal.
                
                KNOWLEDGE BASE:
                ${JSON.stringify(KNOWLEDGE_BASE, null, 2)}

                GUIDELINES:
                1. Be polite, professional, and helpful. You are the official TPGIT Hostel Assistant.
                2. Use the "KNOWLEDGE BASE" above to answer queries. It contains structured "chunks" and "faqs" about the college.
                3. If a student asks a general question (e.g., "What is the mess rate?", "How many hostels?", "Who is the placement officer?"), answer it directly and accurately.
                4. DO NOT encourage them to 'Raise a Query' for things you can answer using the knowledge base.
                5. Only tell them to 'Raise a Query' in the portal if they have a specific, individual problem (e.g., broken equipment in their room, payment discrepancy, missing mess card) that requires administrative action.
                6. Formatting: ALWAYS use Markdown for structure. Use bullet points for lists, bold text for emphasis, and clear spacing between paragraphs. This makes your answers easy to read.
                7. If the information is not in the knowledge base, politely ask them to contact the Hostel Office or college administration.
            `;

            const model = genAI.getGenerativeModel({ 
                model: "gemini-2.0-flash",
                systemInstruction: systemPrompt 
            });

            // Filter history to ensure it starts with 'user' and alternates roles
            // The frontend might include the initial 'bot' greeting which we should skip 
            // if it breaks the user-first sequence required by some versions of the API.
            const validHistory = history
                .filter((h, index) => {
                    // Skip the very first message if it's from 'model' (initial greeting)
                    if (index === 0 && h.role === 'model') return false;
                    return true;
                })
                .map(h => ({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.content }]
                }));

            const chat = model.startChat({
                history: validHistory,
                generationConfig: {
                    maxOutputTokens: 1000,
                },
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            const text = response.text();

            return reply.send({ response: text });
        } catch (error) {
            console.error("Gemini API Error:", error);
            let errorMessage = "Sorry, I'm having trouble thinking right now.";
            
            if (error.message && error.message.includes("API_KEY_INVALID")) {
                errorMessage = "The Gemini API Key provided is invalid. Please double-check it in your .env file.";
            } else if (error.message && error.message.includes("quota")) {
                errorMessage = "The AI is a bit overwhelmed right now (Rate limit reached). Please try again in a minute.";
            }
            
            return reply.status(500).send({ 
                response: errorMessage + " (Technical Error: " + error.message + ")",
                error: error.message 
            });
        }
    }
}

module.exports = new ChatController();
