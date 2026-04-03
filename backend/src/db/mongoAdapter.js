// ═══════════════════════════════════════════════════
// FILE: src/db/mongoAdapter.js
// PURPOSE: PROD implementation of the DB contract
//          Uses Mongoose models to talk to MongoDB
//          Implements the exact same functions as
//          inMemoryAdapter — just with real storage
// ═══════════════════════════════════════════════════

// HOW THIS WORKS:
// Step 1: We define Mongoose Schemas (data shape)
// Step 2: We create Models from those schemas
// Step 3: Each function uses the model to talk to MongoDB
// Step 4: All functions are async — Mongoose returns
//         Promises natively
// Step 5: Function signatures are IDENTICAL to
//         inMemoryAdapter so routes never need to change

const mongoose = require('mongoose')
const DBInterface = require('./interface')

// ─── MONGOOSE SCHEMAS ───────────────────────────
// Schemas define the shape and rules of our data

// OAuth account sub-schema
// Embedded inside UserSchema as an array
const OAuthAccountSchema = new mongoose.Schema({
  provider:  { type: String, required: true },  // google/facebook
  oauthId:   { type: String, required: true },  // provider's user ID
  name:      { type: String },
  email:     { type: String },
  avatar:    { type: String },
  linkedAt:  { type: Date, default: Date.now }
})

// User schema — stores all registered users
const UserSchema = new mongoose.Schema({
  name: {
    type:     String,
    required: true,
    trim:     true
  },
  email: {
    type:      String,
    required:  true,
    unique:    true,    // no duplicate emails
    lowercase: true,    // always store as lowercase
    trim:      true
  },
  // null for OAuth-only users (no password set)
  password: {
    type:    String,
    default: null
  },
  role: {
    type:    String,
    enum:    ['user', 'admin'],
    default: 'user'
  },
  // Array of linked OAuth accounts
  oauthAccounts: [OAuthAccountSchema]
}, {
  timestamps: true   // adds createdAt + updatedAt auto
})

// Refresh token schema — stores active sessions
const RefreshTokenSchema = new mongoose.Schema({
  userId: {
    type:     mongoose.Schema.Types.ObjectId,
    ref:      'User',
    required: true
  },
  token: {
    type:     String,
    required: true,
    unique:   true   // each token is unique
  },
  platform:  { type: String, default: 'web' },
  ipAddress: { type: String, default: null },
  userAgent: { type: String, default: null },
  issuedAt:  { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
})

// Sensor data schema — stores ESP32 readings
const SensorDataSchema = new mongoose.Schema({
  sensorId:     { type: String, default: 'esp32-01' },
  temperature:  { type: Number, default: null },
  humidity:     { type: Number, default: null },
  soilMoisture: { type: Number, default: null },
  location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null }
  },
  timestamp: {
    type:    Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// ─── MONGOOSE MODELS ────────────────────────────
// Models are the classes we use to query MongoDB
// mongoose.model('Name', Schema) creates the model

const User         = mongoose.model('User', UserSchema)
const RefreshToken = mongoose.model('RefreshToken', RefreshTokenSchema)
const SensorData   = mongoose.model('SensorData', SensorDataSchema)

// ─── ADAPTER CLASS ──────────────────────────────
class MongoAdapter extends DBInterface {

  // ─── USER OPERATIONS ────────────────────────

  // Creates and saves a new user document
  async createUser(userData) {
    const user = new User({
      name:     userData.name,
      email:    userData.email,
      password: userData.password,
      role:     userData.role || 'user'
    })
    return await user.save()
  }

  // Finds user by email (case insensitive via schema)
  async findUserByEmail(email) {
    return await User.findOne({
      email: email.toLowerCase()
    })
  }

  // Finds user by MongoDB _id
  async findUserById(id) {
    return await User.findById(id)
  }

  // Updates only the provided fields
  // { new: true } returns the updated document
  async updateUser(id, updateData) {
    return await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
  }

  // ─── OAUTH OPERATIONS ───────────────────────

  // Finds user with matching OAuth provider + ID
  // Uses dot notation to search inside array
  async findUserByOAuthId(provider, oauthId) {
    return await User.findOne({
      oauthAccounts: {
        $elemMatch: { provider, oauthId }
      }
    })
  }

  // Pushes new OAuth account into user's array
  async linkOAuthToUser(userId, provider, oauthProfile) {
    return await User.findByIdAndUpdate(
      userId,
      {
        $push: {
          oauthAccounts: {
            provider,
            oauthId:  oauthProfile.oauthId,
            name:     oauthProfile.name,
            email:    oauthProfile.email,
            avatar:   oauthProfile.avatar,
            linkedAt: new Date()
          }
        }
      },
      { new: true }
    )
  }

  // Creates new user directly from OAuth profile
  async createOAuthUser(provider, oauthProfile) {
    const user = new User({
      name:     oauthProfile.name,
      email:    oauthProfile.email,
      password: null,
      role:     'user',
      oauthAccounts: [{
        provider,
        oauthId:  oauthProfile.oauthId,
        name:     oauthProfile.name,
        email:    oauthProfile.email,
        avatar:   oauthProfile.avatar,
        linkedAt: new Date()
      }]
    })
    return await user.save()
  }

  // ─── REFRESH TOKEN OPERATIONS ───────────────

  // Saves a new refresh token document to MongoDB
  async saveRefreshToken(userId, token, metadata) {
    const tokenRecord = new RefreshToken({
      userId,
      token,
      platform:  metadata.platform  || 'web',
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      issuedAt:  metadata.issuedAt  || new Date(),
      expiresAt: metadata.expiresAt
    })
    return await tokenRecord.save()
  }

  // Finds token document by token string value
  async findRefreshToken(token) {
    return await RefreshToken.findOne({ token })
  }

  // Deletes one specific token document
  async deleteRefreshToken(token) {
    return await RefreshToken.deleteOne({ token })
  }

  // Deletes every token belonging to a user
  // Called when token reuse / theft is detected
  async deleteAllRefreshTokens(userId) {
    return await RefreshToken.deleteMany({ userId })
  }

  // ─── SENSOR DATA OPERATIONS ─────────────────

  // Creates and saves a new sensor reading
  async saveSensorData(payload) {
    const reading = new SensorData({
      sensorId:     payload.sensorId     || 'esp32-01',
      temperature:  payload.temperature  ?? null,
      humidity:     payload.humidity     ?? null,
      soilMoisture: payload.soilMoisture ?? null,
      location:     payload.location     || null,
      timestamp:    payload.timestamp    || new Date()
    })
    return await reading.save()
  }

  // Returns the single most recent reading
  // sort({ timestamp: -1 }) = newest first
  // limit(1) = only one record
  async getLatestSensorData() {
    return await SensorData
      .findOne()
      .sort({ timestamp: -1 })
  }

  // Returns last N readings, newest first
  async getSensorHistory(limit = 100) {
    return await SensorData
      .find()
      .sort({ timestamp: -1 })
      .limit(limit)
  }
}

module.exports = new MongoAdapter()