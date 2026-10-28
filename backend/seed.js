require('dotenv').config();
const dbConfig = require('./config/db');
const Scheme = require('./models/Scheme');
const fs = require('fs');
const path = require('path');

const schemesData = [
  // 1. STUDENT / EDUCATION SCHEMES
  {
    title: "National Scholarship Portal (NSP) - Central Sector Scheme for College Students",
    description: "Financial assistance to meritorious students from low-income families to meet a part of their day-to-day expenses while pursuing higher education.",
    category: "Education",
    state: "All",
    ministry: "Ministry of Education",
    benefits: "₹12,000 per annum at Graduation level for first 3 years and ₹20,000 per annum at Post-Graduation level.",
    eligibility: { ageMin: 17, ageMax: 26, gender: "All", incomeMax: 450000, occupation: ["Student"], category: ["All"], disability: false, student: true },
    requiredDocuments: ["Aadhaar Card", "Class 12th Marksheet", "Income Certificate", "Bank Passbook"],
    applicationMethod: "Online via National Scholarship Portal",
    applyUrl: "https://scholarships.gov.in/",
    officialSource: "https://www.myscheme.gov.in/schemes/csis",
  },
  {
    title: "Post-Matric Scholarship Scheme for SC / ST / OBC / EWS Students",
    description: "Centrally sponsored scheme providing financial support to SC/ST/OBC students studying at post-matriculation or post-secondary stages.",
    category: "Education",
    state: "All",
    ministry: "Ministry of Social Justice and Empowerment",
    benefits: "100% compulsory non-refundable fees coverage plus monthly maintenance allowance up to ₹1,200/month.",
    eligibility: { ageMin: 15, ageMax: 30, gender: "All", incomeMax: 250000, occupation: ["Student"], category: ["SC", "ST", "OBC", "EWS"], disability: false, student: true },
    requiredDocuments: ["Caste Certificate", "Income Certificate", "Marksheet", "Aadhaar Card"],
    applicationMethod: "Online via NSP or State Scholarship Portals",
    applyUrl: "https://scholarships.gov.in/",
    officialSource: "https://socialjustice.gov.in/",
  },

  // 2. LAPTOP / DIGITAL EDUCATION SCHEMES
  {
    title: "Uttar Pradesh Free Laptop & Tablet Distribution Scheme (Swami Vivekanand Yuva Empowerment)",
    description: "State government initiative distributing free smartphones and tablets to final-year undergraduate and diploma students in UP.",
    category: "Digital Education",
    state: "Uttar Pradesh",
    ministry: "Department of IT and Electronics, UP",
    benefits: "Free branded Tablet or Smartphone for digital learning and e-exam access.",
    eligibility: { ageMin: 17, ageMax: 28, gender: "All", incomeMax: 400000, occupation: ["Student"], category: ["All"], disability: false, student: true },
    requiredDocuments: ["Domicile Certificate of UP", "College Student ID", "Aadhaar Card", "Marksheet"],
    applicationMethod: "Automatic nomination through college DigiShakti portal portal",
    applyUrl: "https://digishakti.up.gov.in/",
    officialSource: "https://up.gov.in/",
  },
  {
    title: "Free Laptop Scheme for Meritorious Students (Madhya Pradesh)",
    description: "Financial award of ₹25,000 for purchasing laptops awarded to MP Board Class 12 students scoring above 75% marks.",
    category: "Digital Education",
    state: "Madhya Pradesh",
    ministry: "School Education Department, MP",
    benefits: "₹25,000 direct bank transfer to purchase a personal laptop for higher studies.",
    eligibility: { ageMin: 15, ageMax: 22, gender: "All", incomeMax: 600000, occupation: ["Student"], category: ["All"], disability: false, student: true },
    requiredDocuments: ["Class 12th MP Board Marksheet (75%+)", "Samagra ID", "Aadhaar Linked Bank Account"],
    applicationMethod: "Direct DBT via Shiksha Portal MP",
    applyUrl: "https://shikshaportal.mp.gov.in/",
    officialSource: "https://mp.gov.in/",
  },

  // 3. MERITORIOUS STUDENTS / AWARDS
  {
    title: "PM-USP Central Sector Scheme for Meritorious Girls (Pragati & Saksham)",
    description: "Special AICTE scholarship empowering meritorious female students and differently-abled students pursuing degree or diploma technical education.",
    category: "Merit Awards",
    state: "All",
    ministry: "AICTE & Ministry of Education",
    benefits: "₹50,000 per annum for college fees, laptop purchase, books, and educational software.",
    eligibility: { ageMin: 16, ageMax: 25, gender: "Female", incomeMax: 800000, occupation: ["Student"], category: ["All"], disability: false, student: true },
    requiredDocuments: ["AICTE College Admission Letter", "Family Income Certificate", "Aadhaar Card"],
    applicationMethod: "Online application via National Scholarship Portal",
    applyUrl: "https://scholarships.gov.in/",
    officialSource: "https://www.aicte-india.org/",
  },

  // 4. FARMER SCHEMES
  {
    title: "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
    description: "Direct income support scheme providing ₹6,000 per year in three equal installments to all landholding farmer families across India.",
    category: "Farmers",
    state: "All",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    benefits: "₹6,000 per year transferred directly in 3 installments of ₹2,000 every 4 months.",
    eligibility: { ageMin: 18, ageMax: 100, gender: "All", incomeMax: 500000, occupation: ["Farmer"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Land Records (Khatauni/Patta)", "Aadhaar Card", "Bank Passbook"],
    applicationMethod: "Online via PM-KISAN Portal or local CSC Centers",
    applyUrl: "https://pmkisan.gov.in/",
    officialSource: "https://www.myscheme.gov.in/schemes/pm-kisan",
  },
  {
    title: "Kisan Credit Card (KCC) Scheme",
    description: "Comprehensive credit support scheme for farmers providing timely access to short-term loans for agriculture and allied activities at subsidized interest rates.",
    category: "Farmers",
    state: "All",
    ministry: "Ministry of Agriculture & RBI",
    benefits: "Revolving credit line up to ₹3 Lakh at 4% effective interest rate with prompt repayment incentive.",
    eligibility: { ageMin: 18, ageMax: 75, gender: "All", incomeMax: 1000000, occupation: ["Farmer"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Land Ownership Documents", "Aadhaar Card", "PAN Card", "Passport Photograph"],
    applicationMethod: "Commercial Banks, Regional Rural Banks, or PM-KISAN portal linkage",
    applyUrl: "https://pmkisan.gov.in/",
    officialSource: "https://www.nabard.org/",
  },

  // 5. AGRICULTURE SECTION
  {
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    description: "Comprehensive crop insurance cover against crop loss due to non-preventable natural risks, drought, floods, pests, and severe weather.",
    category: "Agriculture",
    state: "All",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    benefits: "Full crop sum insured claim payout with low farmer premium (1.5% for Rabi, 2% for Kharif crops).",
    eligibility: { ageMin: 18, ageMax: 100, gender: "All", incomeMax: 1000000, occupation: ["Farmer"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Land Sowing Certificate", "Aadhaar Card", "Bank Passbook Details"],
    applicationMethod: "Online via PMFBY portal, Banks, or CSC Centres",
    applyUrl: "https://pmfby.gov.in/",
    officialSource: "https://pmfby.gov.in/",
  },
  {
    title: "National Agriculture Market (e-NAM)",
    description: "Pan-India electronic trading portal networking existing APMC mandis to create a unified national market for agricultural commodities.",
    category: "Agriculture",
    state: "All",
    ministry: "Ministry of Agriculture and Farmers Welfare",
    benefits: "Direct online transparent bidding, higher crop price realization, and online payment directly to bank accounts.",
    eligibility: { ageMin: 18, ageMax: 100, gender: "All", incomeMax: 10000000, occupation: ["Farmer"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Mandi Registration / Farmer ID", "Aadhaar Card", "Bank Account Details"],
    applicationMethod: "Online via e-NAM portal or Mandi Helpdesk",
    applyUrl: "https://www.enam.gov.in/",
    officialSource: "https://www.enam.gov.in/",
  },

  // 6. HEALTHCARE GOVERNMENT SCHEMES
  {
    title: "Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)",
    description: "The world's largest health assurance scheme providing ₹5 Lakh health cover per family per year for secondary and tertiary care hospitalization.",
    category: "Healthcare",
    state: "All",
    ministry: "National Health Authority & Ministry of Health",
    benefits: "Cashless and paperless medical treatment up to ₹5,000,000 per family per year in over 27,000 empanelled hospitals.",
    eligibility: { ageMin: 0, ageMax: 120, gender: "All", incomeMax: 250000, occupation: ["Laborer", "Unemployed", "Domestic Worker", "Any"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Aadhaar Card", "Ration Card / SECC Data Verification"],
    applicationMethod: "Empanelled Hospital Ayushman Mitra Desk or PMJAY Portal",
    applyUrl: "https://pmjay.gov.in/",
    officialSource: "https://nha.gov.in/",
  },
  {
    title: "Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)",
    description: "Government scheme providing quality generic medicines at 50% to 90% lower prices compared to branded medicines through dedicated Jan Aushadhi Kendras.",
    category: "Healthcare",
    state: "All",
    ministry: "Department of Pharmaceuticals, Ministry of Chemicals & Fertilizers",
    benefits: "Access to over 1,800 generic medicines and 290 surgical items at ultra-affordable subsidized rates.",
    eligibility: { ageMin: 0, ageMax: 120, gender: "All", incomeMax: 10000000, occupation: ["Any"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Valid Doctor Prescription"],
    applicationMethod: "Walk-in to any PMBJP Jan Aushadhi Kendra across India",
    applyUrl: "https://janaushadhi.gov.in/",
    officialSource: "https://janaushadhi.gov.in/",
  },

  // 7. INSURANCE SCHEMES
  {
    title: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
    description: "Accidental insurance scheme offering financial coverage against accidental death or permanent full/partial disability.",
    category: "Insurance",
    state: "All",
    ministry: "Ministry of Finance",
    benefits: "₹2 Lakh coverage for accidental death or total permanent disability; ₹1 Lakh for partial disability at an annual premium of just ₹20.",
    eligibility: { ageMin: 18, ageMax: 70, gender: "All", incomeMax: 10000000, occupation: ["Any"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Savings Bank Account with Auto-Debit facility", "Aadhaar Card"],
    applicationMethod: "Online netbanking or physical form submission at participating bank branch",
    applyUrl: "https://www.jansuraksha.gov.in/",
    officialSource: "https://financialservices.gov.in/",
  },
  {
    title: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
    description: "One-year life insurance scheme renewable annually offering life cover for death due to any reason.",
    category: "Insurance",
    state: "All",
    ministry: "Ministry of Finance",
    benefits: "₹2 Lakh life coverage payable to nominee upon death of insured due to any reason for ₹436 annual premium.",
    eligibility: { ageMin: 18, ageMax: 50, gender: "All", incomeMax: 10000000, occupation: ["Any"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Savings Bank Account", "Aadhaar Card", "Nominee Details"],
    applicationMethod: "Bank Netbanking / Bank Branch Auto-Debit Consent",
    applyUrl: "https://www.jansuraksha.gov.in/",
    officialSource: "https://financialservices.gov.in/",
  },
  {
    title: "Atal Pension Yojana (APY)",
    description: "Guaranteed social security pension scheme primarily targeted at unorganized sector workers.",
    category: "Insurance",
    state: "All",
    ministry: "PFRDA & Ministry of Finance",
    benefits: "Guaranteed minimum monthly pension ranging from ₹1,000 to ₹5,000 per month starting at age 60.",
    eligibility: { ageMin: 18, ageMax: 40, gender: "All", incomeMax: 800000, occupation: ["Any", "Laborer"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Savings Bank Account", "Aadhaar Card", "Mobile Number"],
    applicationMethod: "Bank Branch / APY Online Portal via Bank Account",
    applyUrl: "https://www.npscra.nsdl.co.in/",
    officialSource: "https://www.pfrda.org.in/",
  },

  // 8. WOMEN / CHILD / NUTRITION SCHEMES
  {
    title: "Pradhan Mantri Matru Vandana Yojana (PMMVY / Poshan 2.0)",
    description: "Maternity benefit program providing cash incentives to pregnant women and lactating mothers for health and nutrition support.",
    category: "Women & Children",
    state: "All",
    ministry: "Ministry of Women and Child Development",
    benefits: "Direct cash assistance of ₹5,000 in installments upon fulfilling antenatal & child immunization milestones.",
    eligibility: { ageMin: 19, ageMax: 45, gender: "Female", incomeMax: 800000, occupation: ["Any"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Mother-Child Protection (MCP) Card", "Aadhaar Card", "Bank Account Details"],
    applicationMethod: "Anganwadi Centre (AWC) or PMMVY Online Portal",
    applyUrl: "https://pmmvy.wcd.gov.in/",
    officialSource: "https://wcd.nic.in/",
  },
  {
    title: "Sukanya Samriddhi Yojana (SSY)",
    description: "Small deposit savings scheme targeted at parents of girl children providing high government-backed interest rate and tax tax exemption under 80C.",
    category: "Women & Children",
    state: "All",
    ministry: "Ministry of Finance",
    benefits: "High compounding interest rate (currently 8.2% p.a.) with tax-free returns for higher education/marriage of girl child.",
    eligibility: { ageMin: 0, ageMax: 10, gender: "Female", incomeMax: 10000000, occupation: ["Student", "Child"], category: ["All"], disability: false, student: true },
    requiredDocuments: ["Birth Certificate of Girl Child", "Guardian's Aadhaar & PAN Card"],
    applicationMethod: "Post Office or Authorized Commercial Banks",
    applyUrl: "https://www.indiapost.gov.in/",
    officialSource: "https://www.nsiindia.gov.in/",
  },

  // 9. TECHNICAL / ENGINEERING / SKILL SCHEMES
  {
    title: "PM Kaushal Vikas Yojana (PMKVY 4.0 - Skill India)",
    description: "Flagship skill certification scheme enabling Indian youth to take up industry-relevant skill training for better livelihoods.",
    category: "Technical & Skill",
    state: "All",
    ministry: "Ministry of Skill Development and Entrepreneurship",
    benefits: "Free certified technical skill training, assessment allowance, placement assistance, and NCVT Certificate.",
    eligibility: { ageMin: 15, ageMax: 45, gender: "All", incomeMax: 1000000, occupation: ["Student", "Unemployed", "Any"], category: ["All"], disability: false, student: false },
    requiredDocuments: ["Aadhaar Card", "Bank Account Details", "Educational Marksheet"],
    applicationMethod: "Skill India Digital Portal registration",
    applyUrl: "https://www.skillindiadigital.gov.in/",
    officialSource: "https://www.msde.gov.in/",
  },
  {
    title: "National Apprenticeship Training Scheme (NATS)",
    description: "Government bridge program for diploma holders and engineering graduates providing practical industry apprenticeship training.",
    category: "Technical & Skill",
    state: "All",
    ministry: "Ministry of Education & Board of Practical Training",
    benefits: "Monthly stipend up to ₹9,000/month co-funded by Government of India with 1-year hands-on industry training.",
    eligibility: { ageMin: 18, ageMax: 28, gender: "All", incomeMax: 1000000, occupation: ["Student", "Graduate"], category: ["All"], disability: false, student: true },
    requiredDocuments: ["Degree / Diploma Certificate", "Aadhaar Card", "Bank Details"],
    applicationMethod: "Online registration via NATS 2.0 portal",
    applyUrl: "https://nats.education.gov.in/",
    officialSource: "https://nats.education.gov.in/",
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
