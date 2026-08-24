require('dotenv').config();
const dbConfig = require('./config/db');
const Scheme = require('./models/Scheme');
const fs = require('fs');
const path = require('path');

const schemesData = [
  {
    title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    description: "An initiative by the Government of India that provides up to ₹6,000 per year in three equal installments to all small and marginal farmers.",
    category: "Agriculture",
    state: "All",
    benefits: "Direct income support of ₹6,000 per year in three equal installments of ₹2,000 directly into the bank accounts of farmers.",
    eligibility: {
      ageMin: 18,
      ageMax: 100,
      gender: "All",
      incomeMax: 300000,
      occupation: ["Farmer", "Agriculture Work"],
      category: ["All"],
      disability: false,
      student: false
    },
    applyUrl: "https://pmkisan.gov.in/"
  },
  {
    title: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
    description: "The largest health assurance scheme in the world, aiming to provide a health cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization.",
    category: "Healthcare",
    state: "All",
    benefits: "Health cover of ₹5,000,000 per family per year. Cashless and paperless access to services at empanelled hospitals.",
    eligibility: {
      ageMin: 0,
      ageMax: 120,
      gender: "All",
      incomeMax: 250000,
      occupation: ["Laborer", "Unemployed", "Domestic Worker", "Any"],
      category: ["All"],
      disability: false,
      student: false
    },
    applyUrl: "https://pmjay.gov.in/"
  },
  {
    title: "Pradhan Mantri Awas Yojana (PMAY-U/G)",
    description: "Government program to provide affordable housing for the rural and urban poor with a target of building 2 crore affordable houses.",
    category: "Housing",
    state: "All",
    benefits: "Financial assistance for house construction and interest subsidy on home loans starting from 3% to 6.5%.",
    eligibility: {
      ageMin: 18,
      ageMax: 99,
      gender: "All",
      incomeMax: 600000,
      occupation: ["Any"],
      category: ["All"],
      disability: false,
      student: false
    },
    applyUrl: "https://pmaymis.gov.in/"
  },
  {
    title: "Post Matric Scholarship Scheme for SC Students",
    description: "A centrally sponsored scheme that provides financial assistance to Scheduled Caste students studying at post-matriculation or post-secondary stages.",
    category: "Education",
    state: "All",
    benefits: "100% funding for compulsory non-refundable fees, and a monthly maintenance allowance up to ₹1,200 depending on the course.",
    eligibility: {
      ageMin: 15,
      ageMax: 30,
      gender: "All",
      incomeMax: 250000,
      occupation: ["Any"],
      category: ["SC"],
      disability: false,
      student: true
    },
    applyUrl: "https://scholarships.gov.in/"
  },
  {
    title: "Stand-Up India Scheme",
    description: "Promotes entrepreneurship among women and Scheduled Castes or Scheduled Tribes by providing bank loans between ₹10 lakh and ₹1 crore.",
    category: "Business",
    state: "All",
    benefits: "Composite bank loans from ₹10 lakh to ₹1 crore for setting up a greenfield enterprise in manufacturing, services or trading.",
    eligibility: {
      ageMin: 18,
      ageMax: 100,
      gender: "Female",
      incomeMax: 9999999,
      occupation: ["Business Owner", "Unemployed", "Any"],
      category: ["SC", "ST", "OBC", "General"], // Targets SC/ST and women of any category
      disability: false,
      student: false
    },
    applyUrl: "https://www.standupmitra.in/"
  },
  {
    title: "Indira Gandhi National Old Age Pension Scheme (IGNOAPS)",
    description: "A non-contributory old age pension scheme that provides monthly pension to senior citizens belonging to below poverty line households.",
    category: "Pension",
    state: "All",
    benefits: "Monthly pension of ₹200 for ages 60-79, and ₹500 for senior citizens aged 80 years and above.",
    eligibility: {
      ageMin: 60,
      ageMax: 120,
      gender: "All",
      incomeMax: 100000,
      occupation: ["Retired", "Any"],
      category: ["All"],
      disability: false,
      student: false
    },
    applyUrl: "https://nsap.nic.in/"
  },
  {
    title: "Ladli Behna Yojana (Madhya Pradesh)",
    description: "State-specific initiative to enhance economic independence of women, improve health and nutrition status and strengthen their role in family decisions.",
    category: "Welfare",
    state: "Madhya Pradesh",
    benefits: "Direct monthly transfer of ₹1,250 to the bank accounts of eligible women in the state.",
    eligibility: {
      ageMin: 21,
      ageMax: 60,
      gender: "Female",
      incomeMax: 250000,
      occupation: ["Any", "Housewife"],
      category: ["All"],
      disability: false,
      student: false
    },
    applyUrl: "https://cmladlibahna.mp.gov.in/"
  },
  {
    title: "AICTE Pragati Scholarship for Girl Students",
    description: "An initiative to provide assistance and encouragement to meritorious girl students to pursue technical education.",
    category: "Education",
    state: "All",
    benefits: "₹50,000 per annum for every year of study as lump sum amount for college fee, computer purchase, stationery, books, etc.",
    eligibility: {
      ageMin: 16,
      ageMax: 25,
      gender: "Female",
      incomeMax: 800000,
      occupation: ["Any"],
      category: ["All"],
      disability: false,
      student: true
    },
    applyUrl: "https://www.aicte-india.org/schemes/students-development-schemes/pragati-scholarship-scheme"
  }
];

const mockNotifications = [
  {
    title: "New Agriculture Subsidy for Rabi Crops",
    content: "The Ministry of Agriculture has announced a new subsidy of up to 40% on tractor and drip irrigation systems purchase for farmers in Maharashtra and MP.",
    state: "All",
    category: "Agriculture",
    date: new Date().toISOString()
  },
  {
    title: "Aadhaar-PAN Linking Deadline Extended",
    content: "The Income Tax Department has extended the deadline to link Aadhaar with PAN card to September 30, 2026. Avoid penality by linking online now.",
    state: "All",
    category: "Services",
    date: new Date().toISOString()
  },
  {
    title: "UP Scholarship Portal Open for 2026-27 Applications",
    content: "Students in Uttar Pradesh can now register for pre-matric and post-matric scholarship programs on the state scholarship website.",
    state: "Uttar Pradesh",
    category: "Education",
    date: new Date().toISOString()
  },
  {
    title: "Mega Health Camp in Delhi Municipal Clinics",
    content: "Free check-ups, diagnostic services, and medicines will be distributed under the Ayushman campaign at municipal offices across Delhi this weekend.",
    state: "Delhi",
    category: "Healthcare",
    date: new Date().toISOString()
  }
];

const seed = async () => {
  await dbConfig.connectDB();

  if (dbConfig.isMock) {
    console.log("Seeding local JSON database...");
    const mockDbPath = path.join(__dirname, 'db_fallback.json');
    try {
      const data = JSON.parse(fs.readFileSync(mockDbPath, 'utf8'));
      data.schemes = schemesData.map((s, idx) => ({ ...s, _id: `scheme_${idx + 1}`, createdAt: new Date().toISOString() }));
      data.notifications = mockNotifications.map((n, idx) => ({ ...n, _id: `notif_${idx + 1}`, createdAt: new Date().toISOString() }));
      fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
      console.log("✅ Seed completed for JSON database successfully.");
    } catch (e) {
      console.error("Failed to seed JSON database:", e);
    }
  } else {
    console.log("Seeding MongoDB database...");
    try {
      // Clear existing schemes
      await Scheme.deleteMany({});
      console.log("Cleared existing schemes");

      // Insert schemes
      await Scheme.insertMany(schemesData);
      console.log("✅ Seeded schemes successfully into MongoDB");

      // Seed notifications (we'll save in collection notifications, using Mongoose raw connection for flexibility)
      const db = mongoose.connection.db;
      await db.collection('notifications').deleteMany({});
      await db.collection('notifications').insertMany(mockNotifications);
      console.log("✅ Seeded notifications successfully into MongoDB");
    } catch (err) {
      console.error("Error seeding MongoDB:", err);
    }
  }
  process.exit();
};

seed();
