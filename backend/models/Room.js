const mongoose = require('mongoose');

const PlayerStateSchema = new mongoose.Schema({
  socketId:     String,
  sessionId:    { type: String, required: true },
  name:         { type: String, required: true },
  score:        { type: Number, default: 0 },
  isActive:     { type: Boolean, default: false },
  streak:       { type: Number, default: 0 },
  roundScores:  { type: [Number], default: [] },
  correctCount: { type: Number, default: 0 },
  buzzCount:    { type: Number, default: 0 },
  joinedAt:     { type: Date, default: Date.now },
  lastSeen:     { type: Date, default: Date.now },
  connected:    { type: Boolean, default: true },
}, { _id: false });

const RoomSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, maxlength: 5 },

  state: {
    type: String,
    enum: ['LOBBY', 'ROUND_START', 'ACTIVE', 'LOCKED', 'TOSS_UP', 'BUZZ_LOCKED', 'ROUND_END', 'FINISHED'],
    default: 'LOBBY'
  },

  host: {
    socketId:  String,
    name:      { type: String, required: true },
    sessionId: { type: String, required: true },
  },

  players: [PlayerStateSchema],

  // Quiz config — copied from Quiz template or custom-built
  quizId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
  quizTitle:  { type: String, default: '' },
  rounds:     { type: mongoose.Schema.Types.Mixed, default: [] }, // full rounds array

  // Progress
  currentRoundIndex:    { type: Number, default: 0 },
  currentQuestionIndex: { type: Number, default: 0 },
  currentPlayerIndex:   { type: Number, default: 0 },

  // Runtime (not critical to persist — reconstructed on reconnect)
  buzzWinner: { type: String, default: null },
  passedBy:   { type: String, default: null },

  // Timestamps
  createdAt:   { type: Date, default: Date.now },
  lastActivity:{ type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
});

// Auto-expire rooms after 8 hours of inactivity
RoomSchema.index({ lastActivity: 1 }, { expireAfterSeconds: 8 * 60 * 60 });
RoomSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Room', RoomSchema);
