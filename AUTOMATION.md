# MBMS Automation Documentation

This document outlines the approach and implementation for automating the Mess Management System (MBMS) to reduce administrative overhead and improve the student experience.

## 1. Automated Mess Bill Calculation

### Current Problem
Manually calculating bills for 100+ students every month is tedious and error-prone.

### Automation Approach (Implemented)
We have implemented a **Monthly Cron Job** using `node-cron`.

- **Frequency**: Runs on the 1st of every month at 2:00 AM.
- **Logic**:
    1. Fetches all `APPROVED` students.
    2. Calculates the bill for the *previous* month.
    3. Default logic assumes full attendance (configurable).
    4. Automatically adds a new entry to the `messBills` array in the Student record.
    5. Sends a notification to the student.

### Future Real-World Enhancement
To make this fully dynamic, integrate an **Attendance Model**:
1. Create an `Attendance` schema: `{ studentId, date, status: ['Present', 'Absent'] }`.
2. Update the Cron Job to query this model for the specific month:
   ```javascript
   const attendanceRecords = await Attendance.find({ 
       studentId: student._id, 
       date: { $gte: startOfMonth, $lte: endOfMonth } 
   });
   const daysPresent = attendanceRecords.filter(r => r.status === 'Present').length;
   ```

---

## 2. Automated Payment Verification (AI-Powered)

### Current Problem
Administrators must manually check every uploaded receipt image to verify if the payment is correct.

### Automation Approach (Proposed Implementation)
Using **Google Gemini 1.5 Flash** (already available in the project), we can automate receipt analysis.

#### Workflow:
1. **Student Uploads Receipt**: When a student uploads a proof of payment, the backend triggers an AI analysis.
2. **AI Processing**:
   - The receipt URL (or base64 image) is sent to Gemini.
   - The AI extracts: **Transaction ID, Amount, Date, and Payer Name**.
3. **Verification Logic**:
   - The system compares the AI-extracted **Amount** with the `amountIssued` in the database.
   - If the amounts match and the date is valid, the bill is automatically marked as `isVerified: true` and `paymentStatus: 'PAID'`.
4. **Fallback**: If the AI is unsure (e.g., blurry image), it flags the bill as `PENDING_MANUAL_VERIFICATION` for the admin to review.

### Implementation Details
We will add a `VerificationService` that handles this logic.

```javascript
// Example Prompt for Gemini
const prompt = `
  Analyze this hostel mess bill receipt. Extract the following JSON:
  {
    "amount": number,
    "date": "string",
    "transactionId": "string",
    "isReceipt": boolean
  }
  If it's not a valid receipt, set isReceipt to false.
`;
```

---

## 3. Implementation Checklist

- [x] **Backend Fix**: Resolved `JWT_SECRET` crash on deployment by adding fallback for development and clearer error for production.
- [x] **Cron Job**: Added `jobs/cronJobs.js` monthly calculation logic.
- [ ] **AI Service**: Create `Services/verificationService.js`.
- [ ] **Trigger**: Connect `uploadPaymentProof` in `studentController.js` to the verification service.

---

## 4. How to set up in Render (Crucial)

To fix the deployment failure shown in your image:
1. Go to your **Render Dashboard**.
2. Select your `mbms-prod-api` service.
3. Go to **Settings** -> **Environment Variables**.
4. Add the following:
   - `JWT_SECRET`: (Your secret key, e.g., `your_super_secret_jwt_key_123`)
   - `GEMINI_API_KEY`: (Your Google AI API Key)
   - `NODE_ENV`: `production`
5. Click **Save Changes**. Render will automatically redeploy and the "FATAL" error will be gone.
