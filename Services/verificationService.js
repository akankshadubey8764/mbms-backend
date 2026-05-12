const { GoogleGenerativeAI } = require("@google/generative-ai");

class VerificationService {
    constructor() {
        if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        }
    }

    /**
     * Verifies a receipt image using Gemini AI
     * @param {string} receiptUrl - URL of the receipt image
     * @param {number} expectedAmount - The amount that should have been paid
     * @returns {Object} { success, message, extractedData }
     */
    async verifyReceipt(receiptUrl, expectedAmount) {
        if (!this.model) {
            return { success: false, message: "AI Verification service not configured (Missing API Key)" };
        }

        try {
            // In a real scenario, we would fetch the image data from the URL
            // Since we are in a backend environment, we assume the URL is accessible
            // For now, we'll use a prompt that asks Gemini to analyze the image at the URL
            
            const prompt = `
                You are a financial auditor for TPGIT Hostel. Analyze the image at this URL: ${receiptUrl}
                
                The expected payment is: ₹${expectedAmount}
                
                YOUR TASK:
                1. Determine if this is a valid payment receipt (GPay, PhonePe, Bank Transfer, or Official Paper Receipt).
                2. If it is a screenshot, ensure it shows a 'Successful' or 'Completed' status.
                3. Extract the Amount, Date, and Transaction ID.
                4. Compare the found amount with the expected amount of ₹${expectedAmount}.

                Return ONLY a JSON object with this structure:
                {
                    "isReceipt": boolean,
                    "paymentStatus": "SUCCESS" | "FAILED" | "PENDING",
                    "amountFound": number,
                    "transactionId": "string",
                    "date": "string",
                    "confidence": number (0-1),
                    "matchesExpectedAmount": boolean,
                    "reasoning": "Short explanation of why you verified or rejected it"
                }
            `;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Clean the response (sometimes AI wraps in ```json ... ```)
            const jsonStr = text.replace(/```json|```/g, "").trim();
            const data = JSON.parse(jsonStr);

            if (!data.isReceipt) {
                return { success: false, message: "Uploaded file does not appear to be a valid receipt.", extractedData: data };
            }

            if (data.matchesExpectedAmount || Math.abs(data.amountFound - expectedAmount) < 1) {
                return { success: true, message: "AI verified the payment successfully.", extractedData: data };
            } else {
                return { success: false, message: `Amount mismatch. Found ${data.amountFound}, expected ${expectedAmount}.`, extractedData: data };
            }

        } catch (error) {
            console.error("AI Verification Error:", error);
            return { success: false, message: "Failed to process receipt with AI." };
        }
    }
}

module.exports = new VerificationService();
