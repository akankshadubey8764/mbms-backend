const Tesseract = require('tesseract.js');
const cloudinary = require('cloudinary').v2;
const { Buffer } = require('buffer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dqavcvrhz",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class VerificationService {

    /**
     * Extracts text from a base64 image using Tesseract.js.
     * Completely free, runs locally on your server, no API key needed.
     */
    async extractTextFromImage(base64Data, mimeType = "image/jpeg") {
        try {
            const imageBuffer = Buffer.from(base64Data, 'base64');
            console.log("[OCR] Starting Tesseract text extraction...");

            const result = await Tesseract.recognize(imageBuffer, 'eng', {
                logger: () => { } // suppress verbose logs
            });

            const text = result.data.text || "";
            console.log("[OCR] Extracted text length:", text.length);
            console.log("[OCR] Extracted text preview:", text.slice(0, 300));
            return text;
        } catch (err) {
            console.error("[OCR] Tesseract failed:", err.message);
            return "";
        }
    }

    /**
     * Parses OCR text to pull out amount, transaction ID, and date.
     * Handles PhonePe, GPay, Paytm, BHIM, bank screenshots, etc.
     */
    parseReceiptData(text) {
        const result = {
            amountFound: 0,
            transactionId: "Not found",
            paymentDate: "Not found",
        };

        if (!text) return result;

        const normalizedText = text.replace(/\s+/g, ' ');
        const upper = normalizedText.toUpperCase();

        // ── Amount Detection ──────────────────────────────────────────────
        // Covers: ₹3,000 | Rs. 2500 | INR 1500 | "Paid 3000" | "Amount: 2,500.00"
        const amountPatterns = [
            /(?:₹|RS\.?|INR)\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
            /(?:AMOUNT|PAID|TOTAL|DEBIT(?:ED)?|CREDIT(?:ED)?)\s*:?\s*(?:₹|RS\.?|INR)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/gi,
            /([0-9][0-9,]{2,}(?:\.[0-9]{1,2})?)\s*(?:₹|RS\.?|INR|RUPEES?)/gi,
        ];

        for (const pattern of amountPatterns) {
            const matches = [...upper.matchAll(pattern)];
            for (const match of matches) {
                const raw = (match[1] || "").replace(/,/g, "");
                const cleaned = raw
                    .replace(/[^\d.]/g, '') // remove junk
                    .replace(/^2(?=\d{4,})/, ''); // fix OCR issue like 29000 -> 9000
                const num = parseFloat(cleaned);
                if (!isNaN(num) && num >= 100 && num <= 50000) {
                    result.amountFound = num;
                    break;
                }
            }
            if (result.amountFound > 0) break;
        }

        // ── Transaction ID Detection ──────────────────────────────────────
        const txnPatterns = [
            /(?:UPI\s*REF(?:ERENCE)?\s*(?:NO\.?|ID\.?)?|UTR\s*(?:NO\.?)?|TXN\s*(?:ID|NO)?|TRANSACTION\s*(?:ID|NO|REF)\.?|REF\.?\s*(?:NO\.?|ID\.?)?)\s*:?\s*([A-Z0-9]{8,20})/gi,
            /(?:ORDER\s*ID|PAYMENT\s*ID)\s*:?\s*([A-Z0-9\-]{6,20})/gi,
        ];

        for (const pattern of txnPatterns) {
            const match = pattern.exec(upper);
            if (match && match[1]) {
                result.transactionId = match[1];
                break;
            }
        }

        // ── Date Detection ────────────────────────────────────────────────
        const datePatterns = [
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
            /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i,
            /(\d{4}-\d{2}-\d{2})/,
        ];

        for (const pattern of datePatterns) {
            const match = text.match(pattern);
            if (match && match[1]) {
                result.paymentDate = match[1];
                break;
            }
        }

        return result;
    }

    /**
     * Checks if extracted text looks like a payment receipt.
     * Requires at least 2 payment-related keywords.
     */
    isReceiptText(text) {
        if (!text || text.trim().length < 20) return false;

        const upper = text.toUpperCase();
        const paymentKeywords = [
            'PAID', 'PAYMENT', 'SUCCESS', 'SUCCESSFUL',
            'CREDITED', 'DEBITED', 'TRANSFERRED',
            'TRANSACTION', 'RECEIPT', 'UPI', 'NEFT',
            'IMPS', 'RTGS', 'PHONEPE', 'GPAY', 'GOOGLE PAY',
            'PAYTM', 'BHIM', 'BANK', 'AMOUNT', 'RUPEE',
            '₹', 'INR', 'RS.'
        ];

        const found = paymentKeywords.filter(kw => upper.includes(kw));
        console.log("[OCR] Payment keywords found:", found);
        return found.length >= 2;
    }

    /**
     * Main entry point. Verifies a payment receipt image using local OCR.
     * No external API. No rate limits. Completely free.
     *
     * Returns:
     *   { success: true, message, data, usedModel }         — verified OK
     *   { success: false, message: "..error.." }            — clear rejection
     *   { success: false, message: "quota_exceeded", data } — needs manual review
     */
    async verifyBase64Receipt(base64Data, mimeType, expectedAmount) {
        if (!base64Data) {
            return { success: false, message: "No image data provided." };
        }

        try {
            // Step 1: OCR
            const extractedText = await this.extractTextFromImage(base64Data, mimeType);

            if (!extractedText || extractedText.trim().length < 10) {
                return {
                    success: false,
                    message: "Could not read the image. Please upload a clearer, well-lit screenshot of your payment receipt."
                };
            }

            // Step 2: Is it a receipt?
            const looksLikeReceipt = this.isReceiptText(extractedText);
            if (!looksLikeReceipt) {
                return {
                    success: false,
                    message: "This does not look like a payment receipt. Please upload a UPI payment screenshot or bank transfer confirmation."
                };
            }

            // Step 3: Parse amounts, txn ID, date
            const parsed = this.parseReceiptData(extractedText);
            console.log("[OCR] Parsed data:", parsed);

            const expected = parseFloat(expectedAmount) || 0;

            // If receipt is valid but amount not readable — send for manual review
            if (expected > 0 && parsed.amountFound === 0) {
                console.warn("[OCR] Receipt looks valid but amount unreadable. Flagging for manual review.");
                return {
                    success: false,
                    message: "amount not found",
                    data: {
                        ...parsed,
                        note: "Receipt detected but amount could not be read automatically. Pending admin review."
                    }
                };
            }

            // Amount found — check it matches
            if (expected > 0 && parsed.amountFound > 0) {
                const diff = Math.abs(parsed.amountFound - expected);
                if (diff > 20) {
                    return {
                        success: false,
                        message: `Amount mismatch. Receipt shows ₹${parsed.amountFound}, but your mess bill is ₹${expected}. Please upload the correct receipt.`,
                        data: parsed
                    };
                }
            }

            // All good
            return {
                success: true,
                message: "Receipt verified successfully.",
                data: {
                    isValid: true,
                    amountFound: parsed.amountFound,
                    transactionId: parsed.transactionId,
                    paymentDate: parsed.paymentDate,
                    reasoning: `OCR verified. Amount ₹${parsed.amountFound} matches expected ₹${expected}.`
                },
                usedModel: "tesseract-ocr-local"
            };

        } catch (err) {
            console.error("[OCR] Unexpected error:", err.message);
            // Unknown error — allow upload, flag for manual review
            return {
                success: false,
                message: "quota_exceeded",
                data: { note: "Verification error: " + err.message }
            };
        }
    }

    /**
     * Uploads a base64 image to Cloudinary.
     */
    async uploadToCloudinary(base64Data, mimeType = "image/jpeg") {
        try {
            console.log("[Cloudinary] Starting upload...");
            const dataUri = `data:${mimeType};base64,${base64Data}`;
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: "mess_receipts",
                resource_type: "image",
                unique_filename: true
            });
            console.log("[Cloudinary] ✅ Upload successful:", result.secure_url);
            return { success: true, url: result.secure_url };
        } catch (error) {
            console.error("[Cloudinary] Upload error:", error.message);
            return {
                success: false,
                message: "Failed to save image to cloud storage: " + error.message
            };
        }
    }
}

module.exports = new VerificationService();