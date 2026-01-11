# Mess Bill Management System (MBMS) - Backend 🚀

A robust RESTful API built with **Fastify** and **Node.js** to manage student mess records, admin operations, and automated billing.

---

## 🔗 Live Links
- **Production API:** [https://mbms-prod-api.onrender.com](https://mbms-prod-api.onrender.com)
- **Interactive Documentation (Swagger):** [https://mbms-prod-api.onrender.com/docs](https://mbms-prod-api.onrender.com/docs)
- **Health Status:** [https://mbms-prod-api.onrender.com/health](https://mbms-prod-api.onrender.com/health)

---

## 🛠️ Tech Stack
* **Runtime:** Node.js
* **Framework:** Fastify (High-performance, low overhead)
* **Database:** MongoDB Atlas (Cloud NoSQL)
* **Authentication:** JWT (JSON Web Tokens)
* **Documentation:** Swagger UI (OpenAPI 3.0)
* **Deployment:** Render.com (Auto-deploy enabled)

---

## 📂 Project Structure
```text
mbms-BE/
├── config/             # Database & environment configurations
├── controllers/        # Business logic for each route
├── models/             # Mongoose schemas (Student, Admin, Bill)
├── routes/             # API route definitions
├── middleware/         # Auth guards & validation
├── server.js           # Entry point (Fastify instance)
└── .env                # Secrets (not pushed to GitHub)

**Getting Started Locally**
Prerequisites
Node.js installed

A MongoDB Atlas account or local MongoDB instance

1. Clone the repository
git clone https://github.com/akankshadubey8764/mbms-backend.git

2. Install dependencies
npm install

3. Setup Environment Variables
Create a .env file in the root folder and add:

Code snippet

MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret_key
PORT=5000
4. Run the server
npm run dev # Starts with nodemon npm start # Starts with node
