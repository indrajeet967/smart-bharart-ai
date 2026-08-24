const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
Object.defineProperty(global, 'isMock', { get: () => db.isMock, configurable: true });
Object.defineProperty(global, 'mockDb', { get: () => db.mockDb, configurable: true });
const Scheme = require('../models/Scheme');

// POST /api/schemes/recommend
// Recommend government schemes based on demographic profile
router.post('/recommend', async (req, res) => {
  const { age, gender, state, income, occupation, category, disability, student } = req.body;

  // Set default values if fields are missing
  const userProfile = {
    age: parseInt(age) || 25,
    gender: gender || 'All',
    state: state || 'All',
    income: parseFloat(income) || 200000,
    occupation: occupation || 'Any',
    category: category || 'General',
    disability: !!disability,
    student: !!student
  };

  try {
    let allSchemes = [];
    if (isMock) {
      allSchemes = mockDb.find('schemes', {});
    } else {
      allSchemes = await Scheme.find({});
    }

    // Local eligibility matching filter
    const eligibleSchemes = allSchemes.filter(scheme => {
      const e = scheme.eligibility;
      if (!e) return true;

      // Age check
      if (userProfile.age < e.ageMin || userProfile.age > e.ageMax) return false;

      // Gender check
      if (e.gender !== 'All' && userProfile.gender !== 'All' && e.gender.toLowerCase() !== userProfile.gender.toLowerCase()) return false;

      // Income check
      if (userProfile.income > e.incomeMax) return false;

      // State check
      if (scheme.state !== 'All' && userProfile.state !== 'All' && scheme.state.toLowerCase() !== userProfile.state.toLowerCase()) return false;

      // Occupation check
      if (e.occupation && e.occupation.length > 0 && !e.occupation.includes('Any')) {
        const hasOcc = e.occupation.some(occ => occ.toLowerCase() === userProfile.occupation.toLowerCase());
        if (!hasOcc) return false;
      }

      // Social Category check
      if (e.category && e.category.length > 0 && !e.category.includes('All')) {
        const hasCat = e.category.some(cat => cat.toLowerCase() === userProfile.category.toLowerCase());
        if (!hasCat) return false;
      }

      // Disability check
      if (e.disability && !userProfile.disability) return false;

      // Student check
      if (e.student && !userProfile.student) return false;

      return true;
    });

    // Request Gemini recommendations if API key exists
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && eligibleSchemes.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const prompt = `You are an expert Indian Government Schemes consultant on the Smart Bharat portal.
        A citizen has provided the following profile:
        - Age: ${userProfile.age}
        - Gender: ${userProfile.gender}
        - State of Residence: ${userProfile.state}
        - Annual Family Income: ₹${userProfile.income}
        - Occupation: ${userProfile.occupation}
        - Category: ${userProfile.category}
        - Disabled: ${userProfile.disability ? 'Yes' : 'No'}
        - Student: ${userProfile.student ? 'Yes' : 'No'}
        
        Our local database found these eligible schemes:
        ${eligibleSchemes.map(s => `- "${s.title}": ${s.description} (Benefits: ${s.benefits})`).join('\n')}
        
        Please return a personalized greeting and summary in markdown explaining:
        1. Why these schemes are highly recommended for them.
        2. Important steps or timelines they need to watch out for.
        3. Tips on documents they should gather.
        
        Keep it warm, structured, and easy to read.`;

        const result = await model.generateContent([prompt]);
        const recommendationText = result.response.text();

        return res.json({
          eligibleSchemes,
          recommendation: recommendationText
        });
      } catch (geminiErr) {
        console.error("Gemini Scheme Recommendation error:", geminiErr);
        // Fall back to mock greeting below on Gemini error
      }
    }

    // Default mock recommendation summary if Gemini is offline or fails
    let mockSummary = `### Personalized Recommendations

Based on your profile, you are eligible for **${eligibleSchemes.length} scheme(s)**:

${eligibleSchemes.map(s => `* **${s.title}**: Matches your occupation as a *${userProfile.occupation}* or social category *${userProfile.category}*. Benefit: *${s.benefits}*.`).join('\n')}

**Steps to Apply:**
1. Click the **Apply Now** button on the scheme card to go to the official department website.
2. Ensure you have your Aadhaar Card, Income Certificate, and bank details ready.
3. If you have active certificates (such as Category or Student ID cards), upload them under your **Digital Locker** for fast access.
`;

    if (eligibleSchemes.length === 0) {
      mockSummary = `### Recommendations Update
      
We did not find exact scheme matches in our directory for this combination. However, you may qualify for general central schemes like:
* **Digital India Career Certificates**: For students.
* **National Health Protection Scheme**: Basic emergency covers for low income families.

*Tip: Try adjusting your state or occupational inputs in Settings.*`;
    }

    res.json({
      eligibleSchemes,
      recommendation: mockSummary
    });

  } catch (err) {
    console.error("Scheme recommendations fetch error:", err);
    res.status(500).json({ error: 'Failed to retrieve scheme recommendations' });
  }
});

// GET /api/schemes/all
// Retrieve list of all schemes (for listing page)
router.get('/all', async (req, res) => {
  try {
    let schemes = [];
    if (isMock) {
      schemes = mockDb.find('schemes', {});
    } else {
      schemes = await Scheme.find({});
    }
    res.json(schemes);
  } catch (err) {
    console.error("Fetch all schemes error:", err);
    res.status(500).json({ error: 'Failed to fetch schemes list' });
  }
});

module.exports = router;
