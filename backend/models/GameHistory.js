const mongoose = require('mongoose');

const QuestionLogSchema = new mongoose.Schema({
  roundIndex:     Number,
  questionIndex:  Number,
  questionText:   String,
  correctIndex:   Number,
  answeredBy:     String,      // player name, or null if unanswered
  answerIndex:    Number,      // what they submitted
  correct:        Boolean,
  pointsAwarded:  Number,
  isTossUp:       Boolean,
  timeTakenMs:    Number,      // ms from question shown to answer
  reactionMs:     Number,      // buzz reaction time (toss-ups only)
}, { _id: false });

const FinalPlayerSchema = new mongoose.Schema({
  name:         String,
  score:        Number,
  rank:         Number,
  roundScores:  [Number],
  correctCount: Number,
  buzzCount:    Number,
  streak:       Number,        // peak streak during game
}, { _id: false });

const GameHistorySchema = new mongoose.Schema({
  roomCode:    { type: String, required: true },
  quizId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', default: null },
  quizTitle:   { type: String, default: 'Custom Quiz' },
  hostName:    { type: String, required: true },

  playedAt:    { type: Date, default: Date.now },
  durationMs:  { type: Number, default: 0 },   // total game time

  playerCount:    Number,
  roundCount:     Number,
  totalQuestions: Number,

  winner:         { type: String, default: '' },
  finalLeaderboard: [FinalPlayerSchema],
  questionLog:    [QuestionLogSchema],

  // Round summaries
  roundSummaries: [{
    roundIndex:  Number,
    roundName:   String,
    roundType:   String,
    questionsAsked: Number,
    _id: false,
  }],
});

GameHistorySchema.index({ playedAt: -1 });
GameHistorySchema.index({ hostName: 1 });
GameHistorySchema.index({ roomCode: 1 });

module.exports = mongoose.model('GameHistory', GameHistorySchema);
