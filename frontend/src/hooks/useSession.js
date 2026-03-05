export function getOrCreateSessionId() {
  let id = localStorage.getItem('quiznova_session_id');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('quiznova_session_id', id);
  }
  return id;
}

export function saveRoomData(roomCode, role, playerName) {
  localStorage.setItem('quiznova_room', JSON.stringify({ roomCode, role, playerName, ts: Date.now() }));
}

export function getRoomData() {
  try {
    const data = JSON.parse(localStorage.getItem('quiznova_room') || 'null');
    if (!data) return null;
    // Expire after 2 hours
    if (Date.now() - data.ts > 2 * 60 * 60 * 1000) {
      localStorage.removeItem('quiznova_room');
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function clearRoomData() {
  localStorage.removeItem('quiznova_room');
}
