import { create } from 'zustand';

export const SCREENS = {
  LANDING: 'LANDING',
  WAITING: 'WAITING',
  ROUND_START: 'ROUND_START',
  GAME: 'GAME',
  ROUND_END: 'ROUND_END',
  FINISHED: 'FINISHED'
};

export const useGameStore = create((set, get) => ({
  // Connection
  socketId: null,
  setSocketId: (id) => set({ socketId: id }),

  // Screen routing — if we have a saved session, show a reconnecting state
  screen: (typeof localStorage !== 'undefined' && localStorage.getItem('pb_roomCode'))
    ? SCREENS.GAME   // optimistically show game; reconnect event will correct if needed
    : SCREENS.LANDING,
  setScreen: (screen) => set({ screen }),

  // Role — restore from localStorage so host doesn't flash as player on refresh
  isHost: (typeof localStorage !== 'undefined' && localStorage.getItem('pb_isHost') === 'true'),
  setIsHost: (v) => set({ isHost: v }),

  // Room
  roomState: null,
  setRoomState: (rs) => set({ roomState: rs }),

  // Current question (for active player / host)
  question: null,
  setQuestion: (q) => set({ question: q }),

  // Timer
  timerSeconds: 30,
  setTimerSeconds: (t) => set({ timerSeconds: t }),

  // Last answer result
  lastResult: null,
  setLastResult: (r) => set({ lastResult: r }),

  // Buzz winner name
  buzzWinner: null,
  setBuzzWinner: (name) => set({ buzzWinner: name }),

  // Is this player the toss-up question answerer
  isTossUpQuestion: false,
  setIsTossUpQuestion: (v) => set({ isTossUpQuestion: v }),

  // Round start announcement
  incomingRound: null,
  setIncomingRound: (r) => set({ incomingRound: r }),

  // Round end leaderboard
  roundEndData: null,
  setRoundEndData: (d) => set({ roundEndData: d }),

  // Error message
  error: '',
  setError: (msg) => {
    set({ error: msg });
    if (msg) setTimeout(() => set({ error: '' }), 4000);
  },

  // Audio mute
  isMuted: false,
  toggleMute: () => set(s => ({ isMuted: !s.isMuted })),

  // Reset for new game
  reset: () => set({
    screen: SCREENS.LANDING,
    isHost: false,
    roomState: null,
    question: null,
    timerSeconds: 30,
    lastResult: null,
    buzzWinner: null,
    isTossUpQuestion: false,
    incomingRound: null,
    roundEndData: null,
    error: ''
  })
}));
