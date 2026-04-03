// ═══════════════════════════════════════════════════
// FILE: src/db/interface.js
// PURPOSE: The CONTRACT — documents every function
//          both adapters must implement
//          If a function is here, it MUST exist in
//          both inMemoryAdapter.js and mongoAdapter.js
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: This file exports a class with every function
// Step 2: Every function throws an error by default
// Step 3: Adapters EXTEND this class and override
//         each function with real implementations
// Step 4: If an adapter forgets a function, the base
//         class throws a clear error immediately

class DBInterface {

  // ─── USER OPERATIONS ──────────────────────────

  // Creates a new user in the database
  // userData: { name, email, password, role }
  async createUser(userData) {
    throw new Error('createUser() not implemented')
  }

  // Finds a user by their email address
  // Used during login to check credentials
  async findUserByEmail(email) {
    throw new Error('findUserByEmail() not implemented')
  }

  // Finds a user by their unique ID
  // Used in auth middleware to attach user to request
  async findUserById(id) {
    throw new Error('findUserById() not implemented')
  }

  // Updates specific fields of a user record
  // updateData: object with only fields to change
  async updateUser(id, updateData) {
    throw new Error('updateUser() not implemented')
  }

  // ─── OAUTH OPERATIONS ─────────────────────────

  // Finds a user linked to a specific OAuth account
  // provider: "google" or "facebook"
  // oauthId: unique ID from the OAuth provider
  async findUserByOAuthId(provider, oauthId) {
    throw new Error('findUserByOAuthId() not implemented')
  }

  // Links an OAuth account to an existing user
  // Used when user logs in with OAuth but already
  // has a standard account with the same email
  async linkOAuthToUser(userId, provider, oauthProfile) {
    throw new Error('linkOAuthToUser() not implemented')
  }

  // Creates a brand new user from OAuth profile data
  // Used when no existing account is found
  // oauthProfile: { oauthId, name, email, avatar }
  async createOAuthUser(provider, oauthProfile) {
    throw new Error('createOAuthUser() not implemented')
  }

  // ─── REFRESH TOKEN OPERATIONS ─────────────────

  // Saves a new refresh token to the database
  // metadata: { platform, ipAddress, userAgent,
  //             issuedAt, expiresAt }
  async saveRefreshToken(userId, token, metadata) {
    throw new Error('saveRefreshToken() not implemented')
  }

  // Finds a refresh token record by token string
  // Returns the full token record including userId
  async findRefreshToken(token) {
    throw new Error('findRefreshToken() not implemented')
  }

  // Deletes a single refresh token (logout)
  // Called when user logs out from one device
  async deleteRefreshToken(token) {
    throw new Error('deleteRefreshToken() not implemented')
  }

  // Deletes ALL refresh tokens for a user
  // Called on theft detection (token reuse)
  // Forces user to log in again on ALL devices
  async deleteAllRefreshTokens(userId) {
    throw new Error('deleteAllRefreshTokens() not implemented')
  }

  // ─── SENSOR DATA OPERATIONS ───────────────────

  // Saves one incoming sensor reading to storage
  // payload: { temperature, humidity, soilMoisture,
  //            timestamp, sensorId, location }
  async saveSensorData(payload) {
    throw new Error('saveSensorData() not implemented')
  }

  // Returns the single most recent sensor reading
  // Used by GET /api/sensor/latest
  async getLatestSensorData() {
    throw new Error('getLatestSensorData() not implemented')
  }

  // Returns historical sensor readings
  // limit: number of records to return (default 100)
  // Used by GET /api/sensor/history
  async getSensorHistory(limit) {
    throw new Error('getSensorHistory() not implemented')
  }
}

module.exports = DBInterface