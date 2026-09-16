const messages = new Map();

function save(message) {
  if (!message || !message.id) {
    return false;
  }
  if (messages.has(message.id)) {
    return false;
  }
  messages.set(message.id, message);
  return true;
}

function all() {
  return [...messages.values()].sort((a, b) => a.timestamp - b.timestamp);
}

function count() {
  return messages.size;
}

module.exports = { save, all, count };
