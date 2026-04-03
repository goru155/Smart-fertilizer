// ═══════════════════════════════════════════════════
// FILE: src/db/inMemoryAdapter.js
// PURPOSE: DEV implementation of the DB contract
//          Stores all data in plain JS objects/arrays
//          Data is lost when server restarts
//          No database installation needed
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: We create plain JS objects as our "tables"
// Step 2: Each function reads/writes to these objects
// Step 3: We use crypto to generate unique IDs
// Step 4: All functions are async to match the
//         exact same interface as mongoAdapter
// Step 5: On server restart, all data is wiped clean

const { randomUUID } = require('crypto')

// Import the contract this adapter must follow
const DBInterface = require('./interface')

// ─── IN-MEMORY STORE ────────────────────────────
// These are our "database tables"
// Plain JS objects that live in server memory

const store = {
  // Stores all registered users
  // Structure: { id, name, email, password,
  //              role, oauthAccounts, createdAt }
  users: [],

  // Stores all active refresh tokens
  // Structure: { id, userId, token, platform,
  //              ipAddress, userAgent,
  //              issuedAt, expiresAt }
  refreshTokens: [],

  // Stores all incoming sensor readings
  // Structure: { id, temperature, humidity,
  //              soilMoisture, timestamp,
  //              sensorId, location }
  sensorData: []
}

// ─── ADAPTER CLASS ──────────────────────────────
class InMemoryAdapter extends DBInterface {

  // ─── USER OPERATIONS ────────────────────────

  // Creates a new user and adds to store.users array
  async createUser(userData) {
    const newUser = {
      id: randomUUID(),          // unique ID
      name: userData.name,
      email: userData.email,
      password: userData.password, // already hashed
      role: userData.role || 'user',
      oauthAccounts: [],           // linked OAuth accounts
      createdAt: new Date().toISOString()
    }
    store.users.push(newUser)
    return newUser
  }

  // Searches store.users for matching email
  // Returns null if not found (same as MongoDB)
  async findUserByEmail(email) {
    const user = store.users.find(
      u => u.email === email.toLowerCase()
    )
    return user || null
  }

  // Searches store.users for matching ID
  async findUserById(id) {
    const user = store.users.find(u => u.id === id)
    return user || null
  }

  // Updates specific fields on a user record
  // Only changes the fields provided in updateData
  async updateUser(id, updateData) {
    const index = store.users.findIndex(u => u.id === id)
    if (index === -1) return null

    // Merge existing user with new data
    store.users[index] = {
      ...store.users[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    }
    return store.users[index]
  }

  // ─── OAUTH OPERATIONS ───────────────────────

  // Searches users whose oauthAccounts array contains
  // a matching provider + oauthId combination
  async findUserByOAuthId(provider, oauthId) {
    const user = store.users.find(u =>
      u.oauthAccounts.some(
        acc => acc.provider === provider &&
               acc.oauthId === oauthId
      )
    )
    return user || null
  }

  // Adds an OAuth account entry to existing user
  // Used when same email exists with standard login
  async linkOAuthToUser(userId, provider, oauthProfile) {
    const index = store.users.findIndex(
      u => u.id === userId
    )
    if (index === -1) return null

    // Add OAuth account to user's oauthAccounts array
    store.users[index].oauthAccounts.push({
      provider,
      oauthId:  oauthProfile.oauthId,
      name:     oauthProfile.name,
      email:    oauthProfile.email,
      avatar:   oauthProfile.avatar,
      linkedAt: new Date().toISOString()
    })
    return store.users[index]
  }

  // Creates a completely new user from OAuth data
  // No password set — OAuth users don't use passwords
  async createOAuthUser(provider, oauthProfile) {
    const newUser = {
      id:       randomUUID(),
      name:     oauthProfile.name,
      email:    oauthProfile.email,
      password: null,              // no password for OAuth
      role:     'user',
      oauthAccounts: [{
        provider,
        oauthId:  oauthProfile.oauthId,
        name:     oauthProfile.name,
        email:    oauthProfile.email,
        avatar:   oauthProfile.avatar,
        linkedAt: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    }
    store.users.push(newUser)
    return newUser
  }

  // ─── REFRESH TOKEN OPERATIONS ───────────────

  // Saves a new refresh token with metadata
  // metadata tracks platform, device, and timing
  async saveRefreshToken(userId, token, metadata) {
    const tokenRecord = {
      id:          randomUUID(),
      userId,
      token,
      platform:    metadata.platform   || 'web',
      ipAddress:   metadata.ipAddress  || null,
      userAgent:   metadata.userAgent  || null,
      issuedAt:    metadata.issuedAt   ||
                   new Date().toISOString(),
      expiresAt:   metadata.expiresAt
    }
    store.refreshTokens.push(tokenRecord)
    return tokenRecord
  }

  // Finds a refresh token record by the token string
  async findRefreshToken(token) {
    const record = store.refreshTokens.find(
      t => t.token === token
    )
    return record || null
  }

  // Removes one specific token (single device logout)
  async deleteRefreshToken(token) {
    const before = store.refreshTokens.length
    store.refreshTokens = store.refreshTokens.filter(
      t => t.token !== token
    )
    // Returns true if a token was actually deleted
    return store.refreshTokens.length < before
  }

  // Removes ALL tokens for a user
  // Called when theft is detected (token reuse)
  // Forces re-login on every device
  async deleteAllRefreshTokens(userId) {
    const before = store.refreshTokens.length
    store.refreshTokens = store.refreshTokens.filter(
      t => t.userId !== userId
    )
    const deleted = before - store.refreshTokens.length
    return { deletedCount: deleted }
  }

  // ─── SENSOR DATA OPERATIONS ─────────────────

  // Adds one sensor reading to store.sensorData
  async saveSensorData(payload) {
    const reading = {
      id:           randomUUID(),
      sensorId:     payload.sensorId     || 'esp32-01',
      temperature:  payload.temperature  ?? null,
      humidity:     payload.humidity     ?? null,
      soilMoisture: payload.soilMoisture ?? null,
      location:     payload.location     || null,
      timestamp:    payload.timestamp    ||
                    new Date().toISOString()
    }
    store.sensorData.push(reading)
    return reading
  }

  // Returns the most recently added sensor reading
  async getLatestSensorData() {
    if (store.sensorData.length === 0) return null
    // Last item in array is most recent
    return store.sensorData[store.sensorData.length - 1]
  }

  // Returns last N sensor readings, newest first
  // Default limit is 100 records
  async getSensorHistory(limit = 100) {
    return [...store.sensorData]
      .reverse()   // newest first
      .slice(0, limit)
  }
}

module.exports = new InMemoryAdapter()