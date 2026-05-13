const { GoogleGenerativeAI } = require("@google/generative-ai");
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dqavcvrhz",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class VerificationService {
    constructor() {
        this.modelId = "gemini-1.5-flash"; // Default
        this.initializeModel();
    }

    async initializeModel() {
        if (!process.env.GEMINI_API_KEY) return;
        
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            
            // We'll test with a very basic call to see if the model is available
            // If it fails, we'll try a list of fallbacks
            const testModel = genAI.getGenerativeModel({ model: this.modelId });
            this.model = testModel;
            console.log(`AI Verification: Initialized with ${this.modelId}`);
        } catch (err) {
            console.error("AI Initialization Error:", err.message);
        }
    }

    /**
     * Verifies receipt data from base64 buffer BEFORE uploading to Cloudinary
     */
    async verifyBase64Receipt(base64Data, mimeType, expectedAmount) {
        if (!process.env.GEMINI_API_KEY) {
            return { success: false, message: "GEMINI_API_KEY is missing in backend .env" };
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // Try these models in order of preference
        const modelsToTry = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-2.0-flash",
            "gemini-1.5-pro"
        ];

        let lastError = "";

        for (const modelName of modelsToTry) {
            try {
                console.log(`AI: Attempting verification with ${modelName}...`);
                const modelInstance = genAI.getGenerativeModel({ model: modelName });
                
                const imagePart = {
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType || "image/png"
                    }
                };

                const prompt = `
                    Analyze this payment receipt for TPGIT Hostel.
                    Expected amount: ₹${expectedAmount}.

                    TASKS:
                    1. Is this a valid successful payment receipt?
                    2. Extract the Amount paid.
                    3. Return ONLY a JSON object: {"isValid": boolean, "amountFound": number, "transactionId": "string", "reasoning": "string"}
                `;

                const result = await modelInstance.generateContent([prompt, imagePart]);
                const response = await result.response;
                const text = response.text();
                
                console.log(`AI (${modelName}) Response:`, text);

                const jsonStr = text.replace(/```json|```/g, "").trim();
                const data = JSON.parse(jsonStr);

                if (!data.isValid) {
                    return { success: false, message: data.reasoning || "Invalid receipt screenshot." };
                }

                // Verify amount (₹20 tolerance)
                if (Math.abs(data.amountFound - expectedAmount) > 20) {
                    return { success: false, message: `Amount mismatch. Receipt shows ₹${data.amountFound}, but bill is ₹${expectedAmount}.` };
                }

                return { success: true, message: "Verified", data, usedModel: modelName };
            } catch (error) {
                console.error(`AI (${modelName}) Failed:`, error.message);
                lastError = error.message;
                // Continue to next model if it's a 404 or other fetch error
            }
        }

        return { success: false, message: `AI Verification failed across all models. Last Error: ${lastError}` };
    }

    /**
     * Uploads to Cloudinary from the backend after verification
     */
    async uploadToCloudinary(base64Data) {
        try {
            console.log("Cloudinary: Starting secure backend upload...");
            const result = await cloudinary.uploader.upload(`data:image/png;base64,${base64Data}`, {
                folder: 'mess_receipts',
                resource_type: 'image'
            });
            return { success: true, url: result.secure_url };
        } catch (error) {
            console.error("Cloudinary Backend Upload Error:", error.message);
            return { success: false, message: "Cloudinary upload failed: " + error.message };
        }
    }
}

module.exports = new VerificationService();
