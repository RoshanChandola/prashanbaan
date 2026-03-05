const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question:  { type: String, required: true, maxlength: 500 },
  options:   { type: [String], validate: v => v.length === 4, required: true },
  answer:    { type: Number, min: 0, max: 3, required: true },
  points:    { type: Number, default: 10, min: 1, max: 100 },
  category:  { type: String, default: 'General', maxlength: 50 },
  difficulty:{ type: String, enum: ['EASY', 'MEDIUM', 'HARD'], default: 'MEDIUM' },
  // Analytics
  timesAsked:   { type: Number, default: 0 },
  timesCorrect: { type: Number, default: 0 },
}, { _id: true });

const RoundSchema = new mongoose.Schema({
  roundNumber:   { type: Number, required: true },
  name:          { type: String, required: true, maxlength: 80 },
  type:          { type: String, enum: ['SEQUENTIAL', 'BLITZ'], required: true },
  timerSeconds:  { type: Number, min: 5, max: 120, default: 30 },
  passAllowed:   { type: Boolean, default: true },
  tossupOnPass:  { type: Boolean, default: true },
  correctPoints: { type: Number, default: 10 },
  penaltyPoints: { type: Number, default: -5 },
  questions:     [QuestionSchema],
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  title:       { type: String, required: true, maxlength: 100 },
  createdBy:   { type: String, required: true },          // host name
  sessionId:   { type: String },                          // host session ID
  rounds:      [RoundSchema],
  isTemplate:  { type: Boolean, default: false },         // public preset
  totalQuestions: { type: Number, default: 0 },
  playCount:   { type: Number, default: 0 },
  createdAt:   { type: Date, default: Date.now },
  updatedAt:   { type: Date, default: Date.now },
});

QuizSchema.pre('save', function (next) {
  this.totalQuestions = this.rounds.reduce((sum, r) => sum + r.questions.length, 0);
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Quiz', QuizSchema);
