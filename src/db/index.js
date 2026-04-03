// ═══════════════════════════════════════════════════
// FILE: src/db/index.js
// PURPOSE: The DAL router — reads NODE_ENV and
//          exports the correct adapter
//          This is the ONLY file the rest of the
//          app imports for any database operation
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: Load .env so NODE_ENV is available
// Step 2: Read NODE_ENV value
// Step 3: If production → connect MongoDB + export
//         mongoAdapter
// Step 4: If development or not set → export
//         inMemoryAdapter (safe default)
// Step 5: Log which adapter is active so developer
//         always knows which DB is in use

require('dotenv').config()
const mongoose = require('mongoose')

// Read the current environment
// Default to 'development' if not set — safe fallback
const ENV = process.env.NODE_ENV || 'development'

// ─── ADAPTER SELECTION ──────────────────────────

let db

if (ENV === 'production') {

  // ── PRODUCTION: Use MongoDB via Mongoose ────────

  const MONGODB_URI = process.env.MONGODB_URI

  // Guard: crash immediately with clear message
  // if MONGODB_URI is missing in production
  if (!MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI is not set in .env')
    console.error('   NODE_ENV=production requires MONGODB_URI')
    process.exit(1)   // stop the server immediately
  }

  // Connect to MongoDB
  // useNewUrlParser + useUnifiedTopology are best practice
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('✅ MongoDB connected successfully')
    })
    .catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message)
      process.exit(1)   // stop server if DB fails to connect
    })

  // Handle connection events after initial connect
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected')
  })

  mongoose.connection.on('reconnected', () => {
    console.log('✅ MongoDB reconnected')
  })

  // Export the mongo adapter
  db = require('./mongoAdapter')
  console.log('🗄️  Database: MongoDB (production)')

} else {

  // ── DEVELOPMENT (or not set): Use In-Memory ──────
  // Safe default — never crashes due to missing DB

  db = require('./inMemoryAdapter')
  console.log('🗄️  Database: In-Memory (development)')
  console.log('⚠️  Note: Data will be lost on server restart')
}

// ─── EXPORT ─────────────────────────────────────
// Every file in the app imports db from HERE only
// Example usage in any controller or service:
//
//   const db = require('../db')
//   const user = await db.findUserByEmail(email)

module.exports = db