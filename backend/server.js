require('dotenv').config();
const express    = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');

const { connectDB, isDBConnected } = require('./db/connect');
const Quiz        = require('./models/Quiz');
const Room        = require('./models/Room');
const GameHistory = require('./models/GameHistory');
const Player      = require('./models/Player');

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', methods: ['GET','POST'] }
});

const STATES = {
  LOBBY:'LOBBY', ROUND_START:'ROUND_START', ACTIVE:'ACTIVE',
  LOCKED:'LOCKED', TOSS_UP:'TOSS_UP', BUZZ_LOCKED:'BUZZ_LOCKED',
  ROUND_END:'ROUND_END', FINISHED:'FINISHED'
};
const ROUND_TYPES = { SEQUENTIAL:'SEQUENTIAL', BLITZ:'BLITZ' };

const DEFAULT_QUESTIONS = [
  { question:"What does CPU stand for?", options:["Central Processing Unit","Core Power Unit","Computer Processing Unit","Central Power Unit"], answer:0, points:10, category:"IT" },
  { question:"Which language is used for web styling?", options:["Java","Python","CSS","C++"], answer:2, points:10, category:"IT" },
  { question:"What does HTML stand for?", options:["Hyper Text Markup Language","High Tech Modern Language","Hyper Transfer Mode Language","Home Tool Markup Language"], answer:0, points:10, category:"IT" },
  { question:"Who is known as the father of computers?", options:["Alan Turing","Charles Babbage","Bill Gates","John von Neumann"], answer:1, points:10, category:"IT" },
  { question:"Which is NOT a programming language?", options:["Python","Java","Cobra","HTML"], answer:3, points:10, category:"IT" },
  { question:"What is the capital of France?", options:["London","Berlin","Paris","Rome"], answer:2, points:10, category:"GK" },
  { question:"How many bits are in a byte?", options:["4","8","16","32"], answer:1, points:10, category:"IT" },
  { question:"Which planet is the Red Planet?", options:["Venus","Mars","Jupiter","Mercury"], answer:1, points:10, category:"Science" },
  { question:"What does RAM stand for?", options:["Random Access Memory","Read Access Module","Rapid Array Module","Random Array Memory"], answer:0, points:10, category:"IT" },
  { question:"Which company created JavaScript?", options:["Microsoft","Apple","Netscape","IBM"], answer:2, points:10, category:"IT" },
  { question:"Binary of decimal 10?", options:["1010","1100","1001","0110"], answer:0, points:10, category:"IT" },
  { question:"Protocol for secure web browsing?", options:["HTTP","FTP","HTTPS","SMTP"], answer:2, points:10, category:"IT" },
  { question:"First iPhone release year?", options:["2005","2006","2007","2008"], answer:2, points:10, category:"GK" },
  { question:"Who founded Microsoft?", options:["Steve Jobs","Bill Gates","Mark Zuckerberg","Larry Page"], answer:1, points:10, category:"IT" },
  { question:"What does URL stand for?", options:["Universal Resource Locator","Uniform Resource Locator","Unified Reference Link","Universal Reference Link"], answer:1, points:10, category:"IT" },
  { question:"Which data structure uses LIFO?", options:["Queue","Tree","Stack","Graph"], answer:2, points:10, category:"IT" },
  { question:"Default port for HTTP?", options:["21","443","80","8080"], answer:2, points:10, category:"IT" },
  { question:"Who painted the Mona Lisa?", options:["Michelangelo","Da Vinci","Raphael","Botticelli"], answer:1, points:10, category:"GK" },
  { question:"What is 2 to the power 10?", options:["512","1024","2048","256"], answer:1, points:10, category:"IT" },
  { question:"Which OS is open-source?", options:["Windows","macOS","Linux","iOS"], answer:2, points:10, category:"IT" },
];

// ─── IN-MEMORY ───────────────────────────────────────────────────────────────
const rooms          = new Map();
const displaySockets = new Map();
const gameStartTimes = new Map();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
function generateCode() {
  const c = Math.random().toString(36).substring(2,7).toUpperCase();
  return rooms.has(c) ? generateCode() : c;
}

function getPublicRoom(room) {
  return {
    code: room.code, state: room.state,
    host: { name: room.host.name, socketId: room.host.socketId },
    players: room.players.map(p => ({
      id: p.socketId, name: p.name, score: p.score,
      isActive: p.isActive, streak: p.streak,
      roundScores: p.roundScores, correctCount: p.correctCount,
      connected: p.connected !== false,
    })),
    rounds: room.rounds.map(r => ({
      roundNumber: r.roundNumber, name: r.name, type: r.type,
      timerSeconds: r.timerSeconds, passAllowed: r.passAllowed,
      tossupOnPass: r.tossupOnPass, correctPoints: r.correctPoints,
      penaltyPoints: r.penaltyPoints, questionCount: r.questions.length,
    })),
    currentRoundIndex:    room.currentRoundIndex,
    currentQuestionIndex: room.currentQuestionIndex,
    currentPlayerIndex:   room.currentPlayerIndex,
    totalQuestions: room.rounds[room.currentRoundIndex]?.questions.length || 0,
    timerSeconds:   room.timerSeconds,
    buzzLock:       room.buzzLock,
    buzzWinner:     room.buzzWinner,
    passedBy:       room.passedBy,
    roundResults:   room.roundResults,
    lastBuzzMs:     room.lastBuzzMs || null,
  };
}

const getCurrentRound = room => room.rounds[room.currentRoundIndex];
function setActivePlayer(room) { room.players.forEach((p,i) => { p.isActive = (i === room.currentPlayerIndex); }); }
function clearTimer(room) { if (room.timerInterval) { clearInterval(room.timerInterval); room.timerInterval = null; } }

function startTimer(roomCode) {
  const room = rooms.get(roomCode); if (!room) return;
  room.timerSeconds = getCurrentRound(room).timerSeconds;
  clearTimer(room);
  room.timerInterval = setInterval(() => {
    const r = rooms.get(roomCode); if (!r) return;
    r.timerSeconds = Math.max(0, r.timerSeconds - 1);
    io.to(roomCode).emit('timer_tick', { seconds: r.timerSeconds });
    if (r.timerSeconds <= 0) {
      clearTimer(r); r.state = STATES.LOCKED;
      io.to(roomCode).emit('time_up', { roomState: getPublicRoom(r) });
      syncRoomToDB(r);
    }
  }, 1000);
}

function broadcastQuestion(room) {
  const round = getCurrentRound(room);
  const question = round.questions[room.currentQuestionIndex];
  if (!question) return;
  room.roundResults = null; room.buzzWinner = null; room.passedBy = null;
  room.buzzTimestamps = {}; room.buzzOpenedAt = null; room.lastBuzzMs = null;

  if (round.type === ROUND_TYPES.BLITZ) {
    room.state = STATES.TOSS_UP; room.buzzLock = null; room.buzzOpenedAt = Date.now();
    io.to(room.host.socketId).emit('host_question', { question, roomState: getPublicRoom(room) });
    io.to(room.code).emit('tossup_activated', { roomState: getPublicRoom(room) });
  } else {
    room.state = STATES.ACTIVE;
    const ap = room.players[room.currentPlayerIndex];
    io.to(room.host.socketId).emit('host_question', { question, roomState: getPublicRoom(room) });
    if (ap) io.to(ap.socketId).emit('your_turn', { question, roomState: getPublicRoom(room) });
    io.to(room.code).emit('turn_changed', { roomState: getPublicRoom(room) });
    startTimer(room.code);
  }
  syncRoomToDB(room);
}

function advanceQuestion(room) {
  const round = getCurrentRound(room);
  room.currentQuestionIndex++;
  if (room.currentQuestionIndex >= round.questions.length) {
    endRound(room);
  } else {
    if (round.type === ROUND_TYPES.SEQUENTIAL) {
      room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
      setActivePlayer(room);
    }
    broadcastQuestion(room);
  }
}

async function endRound(room) {
  clearTimer(room); room.state = STATES.ROUND_END;
  room.players.forEach(p => p.roundScores.push(p.score));
  const sorted = [...room.players].sort((a,b) => b.score - a.score);
  io.to(room.code).emit('round_complete', {
    roundIndex: room.currentRoundIndex,
    roundName: getCurrentRound(room).name,
    leaderboard: sorted.map(p => ({ name: p.name, score: p.score, roundScores: p.roundScores })),
    roomState: getPublicRoom(room),
  });
  await syncRoomToDB(room);

  setTimeout(async () => {
    const r = rooms.get(room.code); if (!r) return;
    r.currentRoundIndex++;
    if (r.currentRoundIndex >= r.rounds.length) {
      r.state = STATES.FINISHED; r.completedAt = new Date();
      io.to(r.code).emit('game_finished', { roomState: getPublicRoom(r) });
      await syncRoomToDB(r);
      await saveGameHistory(r);
      await updatePlayerStats(r);
    } else {
      r.currentQuestionIndex = 0; r.currentPlayerIndex = 0;
      r.state = STATES.ROUND_START; setActivePlayer(r);
      const nr = r.rounds[r.currentRoundIndex];
      io.to(r.code).emit('round_starting', {
        roundIndex: r.currentRoundIndex,
        round: { roundNumber: nr.roundNumber, name: nr.name, type: nr.type, timerSeconds: nr.timerSeconds, questionCount: nr.questions.length },
        roomState: getPublicRoom(r),
      });
      await syncRoomToDB(r);
      setTimeout(() => { const r2 = rooms.get(r.code); if (r2 && r2.state === STATES.ROUND_START) broadcastQuestion(r2); }, 4000);
    }
  }, 6000);
}

// ─── DB SYNC (debounced) ──────────────────────────────────────────────────────
const syncTimers = new Map();
function syncRoomToDB(room, delayMs = 300) {
  if (!isDBConnected()) return;
  if (syncTimers.has(room.code)) clearTimeout(syncTimers.get(room.code));
  syncTimers.set(room.code, setTimeout(async () => {
    syncTimers.delete(room.code);
    try {
      await Room.findOneAndUpdate({ code: room.code }, {
        state: room.state, players: room.players, rounds: room.rounds,
        currentRoundIndex: room.currentRoundIndex,
        currentQuestionIndex: room.currentQuestionIndex,
        currentPlayerIndex: room.currentPlayerIndex,
        buzzWinner: room.buzzWinner || null,
        passedBy: room.passedBy || null,
        lastActivity: new Date(),
        completedAt: room.completedAt || null,
      }, { new: true });
    } catch (err) { console.error('DB sync error:', err.message); }
  }, delayMs));
}

async function saveGameHistory(room) {
  if (!isDBConnected()) return;
  try {
    const sorted = [...room.players].sort((a,b) => b.score - a.score);
    const durationMs = gameStartTimes.has(room.code) ? Date.now() - gameStartTimes.get(room.code) : 0;
    await GameHistory.create({
      roomCode: room.code, quizId: room.quizId || null,
      quizTitle: room.quizTitle || 'Custom Quiz', hostName: room.host.name,
      playedAt: new Date(), durationMs,
      playerCount: room.players.length, roundCount: room.rounds.length,
      totalQuestions: room.rounds.reduce((s,r) => s + r.questions.length, 0),
      winner: sorted[0]?.name || '',
      finalLeaderboard: sorted.map((p,i) => ({
        name: p.name, score: p.score, rank: i+1,
        roundScores: p.roundScores, correctCount: p.correctCount,
        buzzCount: p.buzzCount, streak: p.streak,
      })),
      roundSummaries: room.rounds.map((r,i) => ({
        roundIndex: i, roundName: r.name, roundType: r.type, questionsAsked: r.questions.length,
      })),
    });
    if (room.quizId) await Quiz.findByIdAndUpdate(room.quizId, { $inc: { playCount: 1 } });
    console.log(`📊 History saved: ${room.code}`);
  } catch (err) { console.error('History save error:', err.message); }
}

async function updatePlayerStats(room) {
  if (!isDBConnected()) return;
  const sorted = [...room.players].sort((a,b) => b.score - a.score);
  const historyDoc = await GameHistory.findOne({ roomCode: room.code }).sort({ playedAt: -1 });
  for (let i = 0; i < sorted.length; i++) {
    const p = sorted[i];
    if (!p.sessionId) continue;
    try {
      await Player.findOneAndUpdate(
        { sessionId: p.sessionId },
        {
          $set:  { name: p.name, lastSeen: new Date() },
          $inc:  { gamesPlayed: 1, totalScore: p.score, totalCorrect: p.correctCount, totalBuzzes: p.buzzCount, wins: i === 0 ? 1 : 0 },
          $max:  { bestScore: p.score, bestStreak: p.streak },
          $push: { gameRefs: { $each: [{ gameId: historyDoc?._id, score: p.score, rank: i+1, playedAt: new Date() }], $slice: -20 } },
        },
        { upsert: true }
      );
    } catch (err) { console.error(`Stats error for ${p.name}:`, err.message); }
  }
  console.log(`👤 Stats updated: ${room.players.length} players`);
}

async function restoreRoomsFromDB() {
  if (!isDBConnected()) return;
  try {
    const activeRooms = await Room.find({
      state: { $nin: ['FINISHED'] },
      lastActivity: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    });
    for (const dbRoom of activeRooms) {
      if (!rooms.has(dbRoom.code)) {
        rooms.set(dbRoom.code, {
          code: dbRoom.code, state: 'LOBBY',
          host: dbRoom.host, players: dbRoom.players || [],
          rounds: dbRoom.rounds || [],
          currentRoundIndex: dbRoom.currentRoundIndex || 0,
          currentQuestionIndex: dbRoom.currentQuestionIndex || 0,
          currentPlayerIndex: dbRoom.currentPlayerIndex || 0,
          timerSeconds: 30, timerInterval: null,
          buzzLock: null, buzzTimestamps: {}, buzzWinner: null,
          buzzOpenedAt: null, lastBuzzMs: null,
          passedBy: null, roundResults: null,
          quizId: dbRoom.quizId || null, quizTitle: dbRoom.quizTitle || '',
          completedAt: null,
        });
        console.log(`♻️  Restored room ${dbRoom.code} from DB`);
      }
    }
  } catch (err) { console.error('Room restore error:', err.message); }
}

// ─── SOCKET EVENTS ────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔗 ${socket.id}`);

  socket.on('join_display', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('display_error', { message: 'Room not found' });
    displaySockets.set(socket.id, roomCode);
    socket.join(roomCode);
    socket.emit('display_joined', { roomState: getPublicRoom(room) });
  });

  socket.on('reconnect_session', async ({ roomCode, sessionId }) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('reconnect_failed', { message: 'Room no longer active' });

    const isHost = room.host.sessionId === sessionId;
    const player = room.players.find(p => p.sessionId === sessionId);

    if (!isHost && !player) return socket.emit('reconnect_failed', { message: 'Session not found in this room' });

    socket.join(roomCode);

    if (isHost) {
      // Restore host socket
      room.host.socketId = socket.id;
      // Re-send current question to host if game is active
      const round = getCurrentRound(room);
      const currentQ = round?.questions?.[room.currentQuestionIndex];
      socket.emit('reconnected', {
        roomState: getPublicRoom(room),
        myName: room.host.name,
        myScore: 0,
        isHost: true,
        currentQuestion: currentQ || null,
      });
      console.log(`♻️  Host ${room.host.name} reconnected to ${roomCode}`);
    }

    if (player) {
      player.socketId  = socket.id;
      player.connected = true;
      player.lastSeen  = new Date();
      socket.emit('reconnected', {
        roomState: getPublicRoom(room),
        myName:    player.name,
        myScore:   player.score,
        isHost:    false,
        currentQuestion: null, // players get question via turn events
      });
      io.to(roomCode).emit('player_reconnected', { playerName: player.name, roomState: getPublicRoom(room) });
      console.log(`♻️  Player ${player.name} reconnected to ${roomCode}`);
    }

    await syncRoomToDB(room, 0);
  });

  socket.on('create_room', async ({ hostName, sessionId }) => {
    const code = generateCode();
    const qs = shuffle(DEFAULT_QUESTIONS);
    const defaultRounds = [
      { roundNumber:1, name:'Round 1 — Sequential', type:ROUND_TYPES.SEQUENTIAL, timerSeconds:30,
        passAllowed:true, tossupOnPass:true, correctPoints:10, penaltyPoints:-5,
        questions: qs.slice(0,5).map((q,i) => ({...q, id:i+1})) },
      { roundNumber:2, name:'Round 2 — Buzzer Blitz', type:ROUND_TYPES.BLITZ, timerSeconds:20,
        passAllowed:false, tossupOnPass:false, correctPoints:10, penaltyPoints:-5,
        questions: qs.slice(5,10).map((q,i) => ({...q, id:i+1})) },
    ];
    const room = {
      code, state:STATES.LOBBY, host:{ socketId:socket.id, name:hostName, sessionId },
      players:[], rounds:defaultRounds,
      currentRoundIndex:0, currentQuestionIndex:0, currentPlayerIndex:0,
      timerSeconds:30, timerInterval:null, buzzLock:null, buzzTimestamps:{},
      buzzWinner:null, buzzOpenedAt:null, lastBuzzMs:null, passedBy:null,
      roundResults:null, quizId:null, quizTitle:'', completedAt:null,
    };
    rooms.set(code, room);
    socket.join(code);
    socket.emit('room_created', { roomCode:code, roomState:getPublicRoom(room) });
    console.log(`🏟️  Room ${code} by ${hostName}`);
    if (isDBConnected()) {
      try {
        await Room.create({ code, state:'LOBBY', host:{ socketId:socket.id, name:hostName, sessionId },
          players:[], rounds:defaultRounds,
          currentRoundIndex:0, currentQuestionIndex:0, currentPlayerIndex:0, lastActivity:new Date() });
      } catch(err) { console.error('DB create room:', err.message); }
    }
  });

  socket.on('join_room', async ({ roomCode, playerName, sessionId }) => {
    const room = rooms.get(roomCode);
    if (!room) return socket.emit('join_error', { message:'Room not found — check the code!' });
    if (room.state !== STATES.LOBBY) return socket.emit('join_error', { message:'Game already in progress!' });
    if (room.players.find(p => p.socketId === socket.id)) return;
    const player = { socketId:socket.id, sessionId, name:playerName, score:0, isActive:false,
      streak:0, roundScores:[], correctCount:0, buzzCount:0, connected:true, lastSeen:new Date(), joinedAt:new Date() };
    room.players.push(player);
    socket.join(roomCode);
    io.to(roomCode).emit('player_joined', { roomState:getPublicRoom(room) });
    console.log(`👤 ${playerName} → ${roomCode}`);
    await syncRoomToDB(room);
  });

  socket.on('configure_rounds', async ({ roomCode, rounds }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.socketId !== socket.id) return;
    room.rounds = rounds.map((r,i) => ({
      roundNumber: i+1, name: r.name||`Round ${i+1}`,
      type: r.type||ROUND_TYPES.SEQUENTIAL,
      timerSeconds: Math.min(120, Math.max(5, parseInt(r.timerSeconds)||30)),
      passAllowed: r.type === ROUND_TYPES.SEQUENTIAL ? !!r.passAllowed : false,
      tossupOnPass: r.type === ROUND_TYPES.SEQUENTIAL ? !!r.tossupOnPass : false,
      correctPoints: parseInt(r.correctPoints)||10,
      penaltyPoints: parseInt(r.penaltyPoints)||-5,
      questions: (r.questions||[]).map((q,qi) => ({
        id:qi+1, question:q.question, options:q.options,
        answer:parseInt(q.answer), points:parseInt(q.points)||10, category:q.category||'General',
      }))
    }));
    io.to(roomCode).emit('rounds_configured', { roomState:getPublicRoom(room) });
    await syncRoomToDB(room);
  });

  // ── QUIZ TEMPLATE OPERATIONS ──
  socket.on('save_quiz_template', async ({ roomCode, title }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.socketId !== socket.id) return;
    if (!isDBConnected()) return socket.emit('quiz_save_error', { message:'Database not connected' });
    try {
      const quiz = await Quiz.create({
        title: title || `Quiz by ${room.host.name}`,
        createdBy: room.host.name, sessionId: room.host.sessionId,
        rounds: room.rounds, isTemplate: false,
      });
      room.quizId = quiz._id; room.quizTitle = quiz.title;
      socket.emit('quiz_saved', { quizId: quiz._id, title: quiz.title });
      console.log(`💾 Quiz saved: ${quiz.title}`);
    } catch(err) { socket.emit('quiz_save_error', { message: err.message }); }
  });

  socket.on('get_my_quizzes', async ({ sessionId }) => {
    if (!isDBConnected()) return socket.emit('my_quizzes', { quizzes:[] });
    try {
      const quizzes = await Quiz.find({ sessionId })
        .select('title totalQuestions playCount createdAt')
        .sort({ updatedAt:-1 }).limit(20);
      socket.emit('my_quizzes', { quizzes });
    } catch(err) { socket.emit('my_quizzes', { quizzes:[] }); }
  });

  socket.on('load_quiz', async ({ roomCode, quizId }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.socketId !== socket.id) return;
    if (!isDBConnected()) return socket.emit('join_error', { message:'Database not connected' });
    try {
      const quiz = await Quiz.findById(quizId);
      if (!quiz) return socket.emit('join_error', { message:'Quiz not found' });
      room.rounds = quiz.rounds.map((r,i) => ({ ...r.toObject(), roundNumber:i+1 }));
      room.quizId = quiz._id; room.quizTitle = quiz.title;
      io.to(roomCode).emit('rounds_configured', { roomState:getPublicRoom(room) });
      socket.emit('quiz_loaded', { title:quiz.title, roundCount:quiz.rounds.length });
      await syncRoomToDB(room);
    } catch(err) { socket.emit('join_error', { message:'Failed to load quiz' }); }
  });

  socket.on('trigger_countdown', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.socketId !== socket.id) return;
    io.to(roomCode).emit('start_countdown');
  });

  socket.on('start_game', async ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.socketId !== socket.id) return;
    if (room.players.length === 0) return socket.emit('join_error', { message:'Need at least 1 player!' });
    room.state = STATES.ROUND_START;
    room.currentRoundIndex = 0; room.currentQuestionIndex = 0; room.currentPlayerIndex = 0;
    setActivePlayer(room);
    gameStartTimes.set(roomCode, Date.now());
    const fr = room.rounds[0];
    io.to(roomCode).emit('round_starting', {
      roundIndex:0,
      round:{ roundNumber:fr.roundNumber, name:fr.name, type:fr.type, timerSeconds:fr.timerSeconds, questionCount:fr.questions.length },
      roomState:getPublicRoom(room),
    });
    await syncRoomToDB(room, 0);
    setTimeout(() => { const r = rooms.get(roomCode); if (r && r.state === STATES.ROUND_START) broadcastQuestion(r); }, 4000);
  });

  socket.on('submit_answer', async ({ roomCode, answerIndex }) => {
    const room = rooms.get(roomCode);
    if (!room || room.state !== STATES.ACTIVE) return;
    const ap = room.players[room.currentPlayerIndex];
    if (!ap || ap.socketId !== socket.id) return;
    clearTimer(room);
    const round = getCurrentRound(room);
    const q = round.questions[room.currentQuestionIndex];
    const correct = answerIndex === q.answer;
    const points = correct ? (q.points || round.correctPoints) : 0;
    if (correct) { ap.score += points; ap.streak++; ap.correctCount++; } else { ap.streak = 0; }
    room.state = STATES.LOCKED;
    room.roundResults = { correct, playerName:ap.name, pointsAwarded:points, answerIndex, correctIndex:q.answer };
    io.to(roomCode).emit('answer_result', { ...room.roundResults, roomState:getPublicRoom(room) });
    await syncRoomToDB(room);
  });

  socket.on('pass_question', async ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.state !== STATES.ACTIVE) return;
    const ap = room.players[room.currentPlayerIndex];
    if (!ap || ap.socketId !== socket.id) return;
    if (!getCurrentRound(room).passAllowed) return;
    clearTimer(room); ap.streak = 0;
    room.state = STATES.LOCKED; room.passedBy = ap.name;
    io.to(roomCode).emit('question_passed', { passedBy:ap.name, roomState:getPublicRoom(room) });
    await syncRoomToDB(room);
  });

  socket.on('enable_tossup', async ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.socketId !== socket.id) return;
    room.state = STATES.TOSS_UP; room.buzzLock = null;
    room.buzzTimestamps = {}; room.buzzOpenedAt = Date.now(); room.lastBuzzMs = null;
    io.to(roomCode).emit('tossup_activated', { roomState:getPublicRoom(room) });
    await syncRoomToDB(room);
  });

  socket.on('buzz_in', async ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.state !== STATES.TOSS_UP || room.buzzLock) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    const nowMs = Date.now();
    room.buzzTimestamps[socket.id] = nowMs;
    room.lastBuzzMs = room.buzzOpenedAt ? nowMs - room.buzzOpenedAt : null;
    room.buzzLock = socket.id; room.buzzWinner = player.name;
    room.state = STATES.BUZZ_LOCKED; player.buzzCount++;
    const q = getCurrentRound(room).questions[room.currentQuestionIndex];
    io.to(roomCode).emit('buzz_winner', { winnerId:socket.id, winnerName:player.name, reactionMs:room.lastBuzzMs, roomState:getPublicRoom(room) });
    const { answer:_hidden, ...qForPlayer } = q;
    socket.emit('tossup_question', { question:qForPlayer });
    startTimer(roomCode);
    await syncRoomToDB(room);
  });

  socket.on('submit_tossup_answer', async ({ roomCode, answerIndex }) => {
    const room = rooms.get(roomCode);
    if (!room || room.buzzLock !== socket.id) return;
    const player = room.players.find(p => p.socketId === socket.id);
    if (!player) return;
    clearTimer(room);
    const round = getCurrentRound(room);
    const q = round.questions[room.currentQuestionIndex];
    const correct = answerIndex === q.answer;
    const points = correct ? (q.points || round.correctPoints) : round.penaltyPoints;
    if (correct) { player.score += points; player.streak++; player.correctCount++; }
    else         { player.score = Math.max(0, player.score + points); player.streak = 0; }
    room.state = STATES.LOCKED;
    room.roundResults = { correct, playerName:player.name, pointsAwarded:points, answerIndex, correctIndex:q.answer, isTossUp:true, reactionMs:room.lastBuzzMs };
    io.to(roomCode).emit('answer_result', { ...room.roundResults, roomState:getPublicRoom(room) });
    await syncRoomToDB(room);
  });

  socket.on('next_question', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.socketId !== socket.id) return;
    clearTimer(room); advanceQuestion(room);
  });

  socket.on('skip_tossup', ({ roomCode }) => {
    const room = rooms.get(roomCode);
    if (!room || room.host.socketId !== socket.id) return;
    clearTimer(room); advanceQuestion(room);
  });

  socket.on('disconnect', async () => {
    console.log(`❌ ${socket.id}`);
    displaySockets.delete(socket.id);
    for (const [code, room] of rooms) {
      const player = room.players.find(p => p.socketId === socket.id);
      if (player) {
        player.connected = false; player.lastSeen = new Date();
        io.to(code).emit('player_disconnected', { playerName:player.name, roomState:getPublicRoom(room) });
        await syncRoomToDB(room, 500);
        break;
      }
    }
  });
});

// ─── REST API ─────────────────────────────────────────────────────────────────
app.get('/health', (req,res) => res.json({ status:'ok', db:isDBConnected()?'connected':'disconnected', rooms:rooms.size, uptime:process.uptime() }));
app.get('/room/:code', (req,res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error:'Not found' });
  res.json({ exists:true, state:room.state, playerCount:room.players.length });
});
app.get('/api/history', async (req,res) => {
  if (!isDBConnected()) return res.json({ games:[] });
  try {
    const games = await GameHistory.find().select('roomCode quizTitle hostName playedAt playerCount winner roundCount durationMs').sort({ playedAt:-1 }).limit(20);
    res.json({ games });
  } catch(err) { res.status(500).json({ error:err.message }); }
});
app.get('/api/history/:id', async (req,res) => {
  if (!isDBConnected()) return res.status(503).json({ error:'DB not connected' });
  try {
    const game = await GameHistory.findById(req.params.id);
    if (!game) return res.status(404).json({ error:'Not found' });
    res.json(game);
  } catch(err) { res.status(500).json({ error:err.message }); }
});
app.get('/api/leaderboard', async (req,res) => {
  if (!isDBConnected()) return res.json({ players:[] });
  try {
    const players = await Player.find().select('name gamesPlayed totalScore wins bestScore bestStreak').sort({ totalScore:-1 }).limit(20);
    res.json({ players });
  } catch(err) { res.status(500).json({ error:err.message }); }
});
app.get('/api/player/:sessionId', async (req,res) => {
  if (!isDBConnected()) return res.json({ player:null });
  try {
    const player = await Player.findOne({ sessionId:req.params.sessionId });
    if (!player) return res.status(404).json({ error:'Not found' });
    res.json({ player });
  } catch(err) { res.status(500).json({ error:err.message }); }
});
app.get('/api/quizzes/:sessionId', async (req,res) => {
  if (!isDBConnected()) return res.json({ quizzes:[] });
  try {
    const quizzes = await Quiz.find({ sessionId:req.params.sessionId }).select('title totalQuestions playCount createdAt').sort({ updatedAt:-1 }).limit(20);
    res.json({ quizzes });
  } catch(err) { res.status(500).json({ error:err.message }); }
});

// ─── START ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
async function start() {
  await connectDB();
  await restoreRoomsFromDB();
  httpServer.listen(PORT, () => {
    console.log(`🎮 PrashanBaan · IT UTSAV 4.0 · Port ${PORT}`);
    console.log(`🌐 DB: ${isDBConnected() ? 'Connected ✅' : 'Memory-only mode ⚡'}`);
  });
}
start();
