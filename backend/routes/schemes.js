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

  const parsedAge = age === undefined || age === '' ? null : Number(age);
  const parsedIncome = income === undefined || income === '' ? null : Number(income);
  if (
    (parsedAge !== null && (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 120)) ||
    (parsedIncome !== null && (!Number.isFinite(parsedIncome) || parsedIncome < 0)) ||
    (state !== undefined && (typeof state !== 'string' || state.length > 100))
  ) {
    return res.status(400).json({ error: 'Eligibility search details are invalid.' });
  }

  const userProfile = {
    age: parsedAge,
    gender: gender || 'All',
    state: state || 'All',
    income: parsedIncome,
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
    const potentialMatches = allSchemes.filter(scheme => {
      const e = scheme.eligibility;
      if (scheme.eligibilityVerified !== true || !e) return false;

      // Age check
      if (userProfile.age !== null && (userProfile.age < e.ageMin || userProfile.age > e.ageMax)) return false;

      // Gender check
      if (e.gender !== 'All' && userProfile.gender !== 'All' && e.gender.toLowerCase() !== userProfile.gender.toLowerCase()) return false;

      // Income check
      if (userProfile.income !== null && userProfile.income > e.incomeMax) return false;

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
    if (apiKey && potentialMatches.length > 0) {
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
        
        Our catalog found these possible matches. The catalog may not contain complete or current rules:
        ${potentialMatches.map(s => `- "${s.title}": ${s.description} (Benefits listed in catalog: ${s.benefits})`).join('\n')}
        
        Please return a personalized greeting and summary in markdown explaining:
        1. Explain which listed catalog rules match the supplied details.
        2. Explicitly say this is not an eligibility decision or approval.
        3. Do not invent application steps, timelines, benefits, or documents.
        
        Keep it warm, structured, and easy to read.`;

        const result = await model.generateContent([prompt]);
        const recommendationText = result.response.text();

        return res.json({
          potentialMatches,
          recommendation: recommendationText
        });
      } catch (geminiErr) {
        console.error("Gemini Scheme Recommendation error:", geminiErr);
        // Fall back to mock greeting below on Gemini error
      }
    }

    // Default mock recommendation summary if Gemini is offline or fails
    let mockSummary = `### Potential catalog matches

The catalog contains **${potentialMatches.length} potential match(es)** based on the details provided. This is not an eligibility decision or guarantee of approval.

Check the current eligibility criteria and application status on each scheme's official source before applying.
`;

    if (potentialMatches.length === 0) {
      mockSummary = 'No potential matches were found in this catalog for the supplied details. The catalog is incomplete; this does not establish that you are ineligible for government schemes.';
    }

    res.json({
      potentialMatches,
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
