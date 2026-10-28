const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
Object.defineProperty(global, 'isMock', { get: () => db.isMock, configurable: true });
Object.defineProperty(global, 'mockDb', { get: () => db.mockDb, configurable: true });
const ChatHistory = require('../models/ChatHistory');

// Keyword-based chatbot engine (fallback when Gemini key is missing or calls fail)
function getMockChatResponse(message = '', language = 'English') {
  const query = message.toLowerCase();

  const mockGuides = {
    passport: `### 🛂 Indian Passport Application Guide (${language})

Here is the official process to apply for a fresh Indian Passport:

* **Eligibility**: Citizen of India, age 18+ (adult) or minor.
* **Required Documents**:
  1. **Address Proof**: Water/Electricity bill, Bank passbook, Aadhaar card, or Rent Agreement.
  2. **Date of Birth Proof**: Birth Certificate, Matriculation transfer certificate, or PAN Card.
  3. **Non-ECR Category Proof**: 10th Standard passing certificate.
* **Fees**: ₹1,500 for normal application (36 pages); ₹3,500 for Tatkaal scheme.
* **Processing Time**: 15–30 days for Normal; 1–3 days for Tatkaal.
* **Official Process**:
  1. Register on the official Passport Seva portal (*passportindia.gov.in*).
  2. Fill the online form and pay the fee online.
  3. Book an appointment at your nearest PSK (Passport Seva Kendra) or Post Office PSK.
  4. Attend the appointment for biometric scanning and document verification.
  5. Police verification will be conducted at your registered address.
  6. The passport is delivered via Speed Post.
* **Tips**: Make sure the spellings on your Aadhaar and 10th certificate match exactly to avoid verification delays.`,

    license: `### 🚗 Driving Licence (DL) Application Guide (${language})

Here is the process to get a permanent Driving Licence in India:

* **Eligibility**: Age 18+ (16 for gearless motorcycles under 50cc). Must hold a valid Learner's Licence first.
* **Required Documents**:
  1. Learner's Licence (LL).
  2. Three passport-size photographs.
  3. Age Proof (PAN Card, Aadhaar, School Transfer Certificate).
  4. Address Proof (Aadhaar, Voter ID, Ration Card).
  5. Medical Certificate Form 1A (for transport vehicles or applicants over 40).
* **Fees**: ₹200 for Learner's Licence test; ₹700–1,000 for Permanent DL drive test and card.
* **Processing Time**: Permanent DL can be applied for 30 days after LL issue, and is delivered within 15–30 days of passing the driving test.
* **Official Process**:
  1. Apply online via the Sarathi Parivahan portal (*sarathi.parivahan.gov.in*).
  2. Upload documents and pay the learner license fee. Book a slot for the LL computer test.
  3. Pass the LL test at the RTO to obtain your Learner's Licence.
  4. Practice for 30 days. Book your permanent DL slot.
  5. Pass the physical driving test at the RTO test track.
  6. Your smart card DL will be sent by post.
* **Tips**: Bring your own vehicle with L-board plates for the driving test.`,

    aadhaar: `### 🆔 Aadhaar Card Enrolment & Update Guide (${language})

Aadhaar is a 12-digit unique identity number issued by UIDAI:

* **Eligibility**: All residents of India (including infants).
* **Required Documents**:
  1. **Proof of Identity (POI)**: PAN Card, Passport, Voter ID, or DL.
  2. **Proof of Address (POA)**: Bank statement, electricity/water bill, passport.
  3. **Proof of Relationship (POR)**: Birth certificate or PDS card (for family links).
* **Fees**: Free for fresh enrolment. ₹50 for demographic updates; ₹100 for biometric updates.
* **Processing Time**: 30–90 days for fresh registration or updates.
* **Official Process**:
  1. Find a UIDAI-authorized Aadhaar Enrolment Centre online.
  2. Fill out the enrolment form. Hand in proofs.
  3. Provide biometrics (fingerprints, iris scan, and photo).
  4. Collect the acknowledgement slip containing the EID.
  5. Track status online on *uidai.gov.in* and download e-Aadhaar.
* **Tips**: Keep your mobile number updated in Aadhaar to access all online civic portals.`,

    pension: `### 👴 National Pension Schemes (IGNOAPS) (${language})

Details on the Indira Gandhi National Old Age Pension Scheme:

* **Eligibility**: Age 60+ and must belong to a household Below Poverty Line (BPL).
* **Required Documents**:
  1. BPL Ration Card.
  2. Age Proof (Aadhaar, Birth Certificate, Voter Card).
  3. Bank Passbook details (for direct bank transfer).
  4. Passport size photograph.
* **Fees**: No application fees.
* **Timeline**: 45 days processing and verification period.
* **Official Process**: Apply online through national social assistance portal (*nsap.nic.in*) or submit physical forms at the block/tehsil development office.`,

    kisan: `### 🌾 PM Kisan Samman Nidhi Yojana (${language})

Details on the direct cash support for small and marginal landholding farmers:

* **Eligibility**: Landholding farmer families with cultivable land in their name. Exclusion rules apply to institutional landowners, tax payers, and government employees.
* **Required Documents**:
  1. Land ownership papers (Khatauni/Patta).
  2. Aadhaar Card (mandatory).
  3. Bank Account Passbook (Aadhaar linked).
  4. Active mobile number.
* **Benefits**: ₹6,000 per year distributed in three equal installments.
* **Official Process**: Register online on the PM-Kisan Portal (*pmkisan.gov.in*) under the 'New Farmer Registration' tab or visit your local Common Service Centre (CSC).`
  };

  mockGuides.licence = mockGuides.license;

  // Search keyword matches
  for (let key in mockGuides) {
    if (query.includes(key)) {
      return mockGuides[key];
    }
  }

  // Generic fallback response
  return `### Hello! I am your Smart Bharat AI Civic Assistant. 🇮🇳

I can assist you in finding details for services in **${language}**:
1. **Passports** (try asking "How do I apply for a passport?")
2. **Driving Licence** (try asking "How to get a driving licence?")
3. **Aadhaar Cards** (try asking "How do I update my Aadhaar details?")
4. **Farmers & Pension Schemes** (try asking "What is PM-Kisan eligibility?")
5. **Civic Issue Reporting** (go to the *Report Issue* page in the dashboard)

Please type a specific government document or scheme name, and I will outline the required documents, fees, and steps for you.`;
}

// POST /api/ai/chat
// conversational AI assistant using Gemini
router.post('/chat', async (req, res) => {
  const { message, chatHistory, language, email } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message content is required' });
  }

  const selectedLanguage = language || 'English';

  // 1. Check Gemini key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const mockReply = getMockChatResponse(message, selectedLanguage);
    // Log history locally
    if (email) {
      logChatHistoryLocal(email, message, mockReply);
    }
    return res.json({ response: mockReply });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Format chat history for Gemini API context
    const formattedHistory = (chatHistory || []).slice(-10).map(msg => {
      return `${msg.sender === 'user' ? 'User' : 'Assistant'}: ${msg.text}`;
    }).join('\n');

    const prompt = `You are "Smart Bharat - AI Civic Companion", a professional chatbot designed to guide Indian citizens through government applications, civic reports, schemes, document requirements, fees, processing SLAs, and agency navigation.
    
    Current language preference: ${selectedLanguage}. You MUST write your entire response in ${selectedLanguage} (e.g. Hindi, Bengali, Marathi, Telugu, Tamil, etc.). If English is selected, write in English.
    
    Guidelines:
    - Keep responses professional, highly structured, using bold headings and bullet points.
    - If explaining processes (like a passport, driving license, PAN card, voter ID, pension), always detail:
      1. Eligibility
      2. Required Documents
      3. Processing Fees
      4. Estimated Timeline
      5. Step-by-step Official Process (mentioning official portal URLs)
      6. Useful tips.
    - If the user asks about reporting civic issues, direct them to the "Report Issue" panel on our dashboard.
    
    Conversation History:
    ${formattedHistory}
    
    User message: "${message}"
    Assistant response in ${selectedLanguage}:`;

    const result = await model.generateContent([prompt]);
    const botResponseText = result.response.text();

    // Log the chat to database
    if (email) {
      logChatHistory(email, message, botResponseText);
    }

    res.json({ response: botResponseText });

  } catch (err) {
    console.error("Gemini chatbot error:", err);
    // Fall back to mock response on failure
    const mockReply = getMockChatResponse(message, selectedLanguage);
    res.json({ response: mockReply });
  }
});

// Helper to log chat history (MongoDB mode)
async function logChatHistory(email, userMsg, botMsg) {
  if (isMock) {
    return logChatHistoryLocal(email, userMsg, botMsg);
  }
  try {
    let chat = await ChatHistory.findOne({ email });
    if (!chat) {
      chat = new ChatHistory({ email, messages: [] });
    }
    chat.messages.push({ sender: 'user', text: userMsg });
    chat.messages.push({ sender: 'bot', text: botMsg });
    await chat.save();
  } catch (e) {
    console.error("Failed to log chat history to MongoDB:", e);
  }
}

// Helper to log chat history (Mock JSON mode)
function logChatHistoryLocal(email, userMsg, botMsg) {
  try {
    let chat = mockDb.findOne('chatHistory', { email });
    if (!chat) {
      chat = { email, messages: [], createdAt: new Date().toISOString() };
      chat.messages.push({ sender: 'user', text: userMsg, timestamp: new Date().toISOString() });
      chat.messages.push({ sender: 'bot', text: botMsg, timestamp: new Date().toISOString() });
      mockDb.insertOne('chatHistory', chat);
    } else {
      const messages = [...chat.messages, 
        { sender: 'user', text: userMsg, timestamp: new Date().toISOString() },
        { sender: 'bot', text: botMsg, timestamp: new Date().toISOString() }
      ];
      mockDb.updateOne('chatHistory', { email }, { messages });
    }
  } catch (e) {
    console.error("Failed to log chat history to JSON file:", e);
  }
}

module.exports = router;
