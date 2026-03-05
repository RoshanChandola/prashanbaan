const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  sessionId:  { type: String, required: true, unique: true },
  name:       { type: String, required: true },

  // Cumulative stats
  gamesPlayed:   { type: Number, default: 0 },
  totalScore:    { type: Number, default: 0 },
  totalCorrect:  { type: Number, default: 0 },
  totalBuzzes:   { type: Number, default: 0 },
  wins:          { type: Number, default: 0 },
  bestStreak:    { type: Number, default: 0 },
  bestScore:     { type: Number, default: 0 },

  // History of games
  gameRefs: [{
    gameId:    { type: mongoose.Schema.Types.ObjectId, ref: 'GameHistory' },
    score:     Number,
    rank:      Number,
    playedAt:  Date,
    _id: false,
  }],

  lastSeen:  { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

PlayerSchema.index({ sessionId: 1 }, { unique: true });
PlayerSchema.index({ totalScore: -1 });  // for global leaderboard

module.exports = mongoose.model('Player', PlayerSchema);
