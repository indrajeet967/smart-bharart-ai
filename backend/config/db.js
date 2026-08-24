const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isMock = false;
let mockDbPath = path.join(__dirname, '..', 'db_fallback.json');

// Initialize mock DB file if it doesn't exist
if (!fs.existsSync(mockDbPath)) {
  fs.writeFileSync(mockDbPath, JSON.stringify({
    users: [],
    complaints: [],
    schemes: [],
    documents: [],
    notifications: [],
    chatHistory: []
  }, null, 2));
}

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("⚠️ MONGODB_URI not found in env. Falling back to local JSON database storage.");
    isMock = true;
    return;
  }

  try {
    // Attempt Mongoose connection with timeout
    mongoose.set('strictQuery', false);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log("✅ MongoDB Connected Successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.warn("⚠️ Falling back to local JSON database storage (db_fallback.json).");
    isMock = true;
  }
};

// Simple helpers to read/write JSON mock database
const getMockData = () => {
  try {
    const raw = fs.readFileSync(mockDbPath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { users: [], complaints: [], schemes: [], documents: [], notifications: [], chatHistory: [] };
  }
};

const saveMockData = (data) => {
  try {
    fs.writeFileSync(mockDbPath, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error("Failed to write to mock database file:", e);
  }
};

const mockDb = {
  find: (collection, query = {}) => {
    const data = getMockData()[collection] || [];
    return data.filter(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },
  findOne: (collection, query = {}) => {
    const data = getMockData()[collection] || [];
    return data.find(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
  },
  insertOne: (collection, doc) => {
    const dbData = getMockData();
    if (!dbData[collection]) dbData[collection] = [];
    const newDoc = { ...doc, _id: doc._id || 'mock_' + Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString() };
    dbData[collection].push(newDoc);
    saveMockData(dbData);
    return newDoc;
  },
  updateOne: (collection, query, updateFields) => {
    const dbData = getMockData();
    const list = dbData[collection] || [];
    const idx = list.findIndex(item => {
      for (let key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    });
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updateFields, updatedAt: new Date().toISOString() };
      saveMockData(dbData);
      return list[idx];
    }
    return null;
  },
  deleteMany: (collection, query) => {
    const dbData = getMockData();
    const list = dbData[collection] || [];
    dbData[collection] = list.filter(item => {
      for (let key in query) {
        if (item[key] === query[key]) return false;
      }
      return true;
    });
    saveMockData(dbData);
    return { deletedCount: list.length - dbData[collection].length };
  }
};

module.exports = {
  connectDB,
  get isMock() { return isMock; },
  mockDb
};
