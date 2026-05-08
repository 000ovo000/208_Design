const DEFAULT_CURRENT_USER_ID = Number(process.env.CURRENT_USER_ID || 1);

let currentUserId = DEFAULT_CURRENT_USER_ID;

function getCurrentUserId() {
  return currentUserId;
}

function setCurrentUserId(nextUserId) {
  const normalized = Number(nextUserId);
  if (!Number.isFinite(normalized) || normalized <= 0) {
    return false;
  }
  currentUserId = normalized;
  return true;
}

module.exports = {
  getCurrentUserId,
  setCurrentUserId,
};
