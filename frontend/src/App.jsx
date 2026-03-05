import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useGameStore, SCREENS } from './store/gameStore';
import LobbyPage from './pages/LobbyPage';
import WaitingRoom from './components/WaitingRoom';
import RoundStartScreen from './components/RoundStartScreen';
import HostDashboard from './components/HostDashboard';
import PlayerView from './components/PlayerView';
import RoundEndScreen from './components/RoundEndScreen';
import FinalResults from './components/FinalResults';
import AudienceDisplay from './pages/AudienceDisplay';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Singleton socket — avoids double-connect (StrictMode removed from main.jsx)
let socket = null;
export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

function GameRouter() {
  const {
    screen, setScreen, isHost, roomState, question, timerSeconds,
    lastResult, buzzWinner, isTossUpQuestion, incomingRound, roundEndData, error,
    setSocketId, setIsHost, setRoomState, setQuestion,
    setTimerSeconds, setLastResult, setBuzzWinner,
    setIsTossUpQuestion, setIncomingRound, setRoundEndData, setError,
  } = useGameStore();

  useEffect(() => {
    const sock = getSocket();

    const handlers = {
      connect: () => {
        setSocketId(sock.id);
        // Try to reconnect to active session on every (re)connect
        const savedCode    = localStorage.getItem('pb_roomCode');
        const savedSession = localStorage.getItem('pb_sessionId');
        if (savedCode && savedSession) {
          sock.emit('reconnect_session', { roomCode: savedCode, sessionId: savedSession });
        }
      },
      reconnected: ({ roomState, myName, isHost: wasHost, currentQuestion }) => {
        setRoomState(roomState);
        setIsHost(wasHost);
        // Keep localStorage in sync
        localStorage.setItem('pb_isHost', wasHost ? 'true' : 'false');
        // Restore question for host if game was mid-question
        if (wasHost && currentQuestion) {
          setQuestion(currentQuestion);
        }
        // Restore correct screen based on game state
        const gs = roomState.state;
        if (gs === 'LOBBY') setScreen(SCREENS.WAITING);
        else if (gs === 'ROUND_START') setScreen(SCREENS.ROUND_START);
        else if (gs === 'ROUND_END') setScreen(SCREENS.ROUND_END);
        else if (gs === 'FINISHED') setScreen(SCREENS.FINAL);
        else setScreen(SCREENS.GAME);
        console.log(`✅ Reconnected as ${wasHost ? 'HOST' : 'PLAYER'} to room ${roomState.code}`);
      },
      reconnect_failed: () => {
        // Clear stale session refs silently — user stays on landing
        localStorage.removeItem('pb_roomCode');
        localStorage.removeItem('pb_isHost');
      },
      player_reconnected: ({ roomState }) => setRoomState(roomState),
      player_disconnected: ({ roomState }) => setRoomState(roomState),

      room_created: ({ roomState }) => {
        localStorage.setItem('pb_roomCode', roomState.code);
        localStorage.setItem('pb_isHost', 'true');
        setIsHost(true); setRoomState(roomState); setScreen(SCREENS.WAITING);
      },
      player_joined: ({ roomState }) => {
        setRoomState(roomState);
        if (screen === SCREENS.LANDING) setScreen(SCREENS.WAITING);
      },
      join_error: ({ message }) => setError(message),
      rounds_configured: ({ roomState }) => setRoomState(roomState),

      round_starting: ({ round, roomState }) => {
        setRoomState(roomState);
        setIncomingRound(round);
        setLastResult(null); setBuzzWinner(null); setIsTossUpQuestion(false);
        setScreen(SCREENS.ROUND_START);
      },

      host_question: ({ question, roomState }) => {
        setRoomState(roomState); setQuestion(question);
        setLastResult(null); setBuzzWinner(null); setIsTossUpQuestion(false);
        setScreen(SCREENS.GAME);
      },
      your_turn: ({ question, roomState }) => {
        setRoomState(roomState); setQuestion(question);
        setLastResult(null); setBuzzWinner(null); setIsTossUpQuestion(false);
        setScreen(SCREENS.GAME);
      },
      turn_changed: ({ roomState }) => {
        setRoomState(roomState);
        setLastResult(null); setBuzzWinner(null); setIsTossUpQuestion(false);
        if (screen !== SCREENS.GAME) setScreen(SCREENS.GAME);
      },

      timer_tick: ({ seconds }) => setTimerSeconds(seconds),

      tossup_activated: ({ roomState }) => {
        setRoomState(roomState);
        setBuzzWinner(null); setIsTossUpQuestion(false);
        if (screen !== SCREENS.GAME) setScreen(SCREENS.GAME);
      },
      buzz_winner: ({ winnerName, roomState }) => {
        setRoomState(roomState); setBuzzWinner(winnerName);
      },
      tossup_question: ({ question }) => {
        setQuestion(question);
        setIsTossUpQuestion(true);
        setScreen(SCREENS.GAME); // force player to game screen so they see the question
      },

      question_passed: ({ roomState }) => {
        setRoomState(roomState); setLastResult(null);
      },
      answer_result: ({ roomState, ...result }) => {
        setRoomState(roomState); setLastResult(result);
      },
      time_up: ({ roomState }) => setRoomState(roomState),

      round_complete: (data) => {
        setRoomState(data.roomState);
        setRoundEndData(data);
        setScreen(SCREENS.ROUND_END);
      },
      game_finished: ({ roomState }) => {
        // Clear saved session — game is over, next visit should show landing
        localStorage.removeItem('pb_roomCode');
        localStorage.removeItem('pb_isHost');
        setRoomState(roomState); setScreen(SCREENS.FINISHED);
      },
    };

    Object.entries(handlers).forEach(([ev, fn]) => sock.on(ev, fn));
    return () => Object.keys(handlers).forEach(ev => sock.off(ev));
  }, [screen]);

  const emit = (ev, data) => getSocket().emit(ev, data);

  // Persist session so reconnect works after page reload
  const getOrCreateSessionId = () => {
    let sid = localStorage.getItem('pb_sessionId');
    if (!sid) { sid = Math.random().toString(36).substring(2) + Date.now().toString(36); localStorage.setItem('pb_sessionId', sid); }
    return sid;
  };

  const handleHostGame    = ({ hostName }) => {
    const sessionId = getOrCreateSessionId();
    emit('create_room', { hostName, sessionId });
  };
  const handleJoinGame    = ({ playerName, roomCode }) => {
    const sessionId = getOrCreateSessionId();
    localStorage.setItem('pb_roomCode', roomCode);
    localStorage.setItem('pb_isHost', 'false');
    emit('join_room', { roomCode, playerName, sessionId });
  };
  const handleStartGame   = () => {
    emit('trigger_countdown', { roomCode: roomState.code });
    setTimeout(() => emit('start_game', { roomCode: roomState.code }), 3500);
  };
  const handleSaveRounds    = (rounds)      => emit('configure_rounds', { roomCode: roomState.code, rounds });
  const handleSubmitAnswer  = (answerIndex) => emit('submit_answer', { roomCode: roomState.code, answerIndex });
  const handlePassQuestion  = ()            => emit('pass_question', { roomCode: roomState.code });
  const handleBuzzIn        = ()            => emit('buzz_in', { roomCode: roomState.code });
  const handleSubmitTossUp  = (answerIndex) => emit('submit_tossup_answer', { roomCode: roomState.code, answerIndex });
  const handleEnableTossup  = ()            => emit('enable_tossup', { roomCode: roomState.code });
  const handleSkipTossup    = ()            => emit('skip_tossup', { roomCode: roomState.code });
  const handleNextQuestion  = ()            => emit('next_question', { roomCode: roomState.code });
  const handlePlayAgain     = ()            => window.location.reload();

  return (
    <div className="min-h-screen bg-dark-900 text-white overflow-x-hidden">

      {/* Global error toast */}
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-8 py-3 bg-neon-pink
          text-white font-body text-sm tracking-widest shadow-neon-pink border border-white/20 animate-buzz-in">
          ⚠ {error}
        </div>
      )}

      {screen === SCREENS.LANDING && (
        <LobbyPage onHostGame={handleHostGame} onJoinGame={handleJoinGame} />
      )}
      {screen === SCREENS.WAITING && (
        <WaitingRoom roomState={roomState} isHost={isHost}
          onStartGame={handleStartGame} onSaveRounds={handleSaveRounds} />
      )}
      {screen === SCREENS.ROUND_START && (
        <RoundStartScreen round={incomingRound} roomState={roomState} />
      )}
      {screen === SCREENS.GAME && (
        isHost ? (
          <HostDashboard
            roomState={roomState} question={question}
            timerSeconds={timerSeconds} lastResult={lastResult} buzzWinner={buzzWinner}
            onEnableTossup={handleEnableTossup}
            onSkipTossup={handleSkipTossup}
            onNextQuestion={handleNextQuestion}
          />
        ) : (
          <PlayerView
            roomState={roomState} mySocketId={getSocket()?.id}
            question={question} timerSeconds={timerSeconds}
            lastResult={lastResult} buzzWinner={buzzWinner}
            isTossUpQuestion={isTossUpQuestion}
            state={roomState?.state}
            onSubmitAnswer={handleSubmitAnswer}
            onPassQuestion={handlePassQuestion}
            onBuzzIn={handleBuzzIn}
            onSubmitTossUp={handleSubmitTossUp}
          />
        )
      )}
      {screen === SCREENS.ROUND_END && (
        <RoundEndScreen data={roundEndData} roomState={roomState} isHost={isHost} />
      )}
      {screen === SCREENS.FINISHED && (
        <FinalResults roomState={roomState} isHost={isHost} onPlayAgain={handlePlayAgain} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/display" element={<AudienceDisplay />} />
        <Route path="*" element={<GameRouter />} />
      </Routes>
    </BrowserRouter>
  );
}
