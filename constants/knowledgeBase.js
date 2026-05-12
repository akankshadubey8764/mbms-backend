const TPGIT_KNOWLEDGE_BASE = {
    collegeName: "Thanthai Periyar Government Institute of Technology (TPGIT)",
    location: "Bagayam, Vellore, Tamil Nadu - 632002",
    established: 1990,
    type: "Government Engineering College",
    affiliation: "Anna University",
    departments: [
        "Civil Engineering",
        "Mechanical Engineering",
        "Electronics and Communication Engineering (ECE)",
        "Electrical and Electronics Engineering (EEE)",
        "Computer Science and Engineering (CSE)",
        "Robotics and Automation Engineering",
        "Master of Computer Applications (MCA)"
    ],
    hostel: {
        facilities: [
            "RO Purified Water",
            "24/7 Electricity and Water Supply",
            "CCTV Surveillance",
            "Mini Gym",
            "Common Study Areas",
            "Indoor Games (TV, Table Tennis)"
        ],
        mess: {
            system: "Dividing System",
            dailyRate: "₹300 per day",
            billingRule: "If absent for 7 or more days, only present days are charged. Otherwise, the full month is charged."
        }
    },
    portalFAQ: {
        registrationApproval: "Admin typically approves registration requests within 24-48 hours.",
        queryResolution: "Queries are usually resolved within 48 hours. If a query is open for more than 48 hours, it is flagged as 'OVERDUE' for urgent attention.",
        paymentVerification: "After you upload a payment screenshot, the Admin will manually verify it. Once verified, your bill status will change to 'PAID'.",
        billPublication: "Bills are usually published at the end of every month."
    },
    sillyQueryFiltering: "If a user asks about rules or general info, answer them here. Only encourage them to 'Raise a Query' for specific physical issues like leaking taps, electrical faults, or missing items."
};

module.exports = TPGIT_KNOWLEDGE_BASE;
