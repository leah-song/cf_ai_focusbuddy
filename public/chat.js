const chatMessages = document.getElementById("chat-messages");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const typingIndicator = document.getElementById("typing-indicator");
const historyList = document.getElementById("history-list");
const newChatBtn = document.getElementById("new-chat");

let sessionId = null;
let chatHistory = [];
let isProcessing = false;

// Load all sessions into sidebar
async function loadSessions() {
  const res = await fetch("/api/sessions");
  const sessions = (await res.json()).sort((a, b) => b.lastUpdated - a.lastUpdated);
  historyList.innerHTML = "";

  sessions.forEach((s) => {
    const li = document.createElement("li");
    // show the summary instead of topic
    const updated = new Date(s.lastUpdated);
	const timeStr = updated.toLocaleString([], {
		month: "short",    // e.g., "Nov"
  		day: "numeric",
  		hour: "2-digit",
  		minute: "2-digit",
		});

	li.innerHTML = `
  		<div class="chat-item-top">
    		<span class="chat-summary">${s.summary || s.topic || "New chat"}</span>
   		 <span class="chat-timestamp">${timeStr}</span>
  		</div>
`	;
    li.dataset.id = s.id;
    li.addEventListener("click", () => {
      Array.from(historyList.children).forEach(el => el.classList.remove("active"));
      li.classList.add("active");
      loadSession(s.id);
    });

    historyList.appendChild(li);
  });
}

// Load messages for a session
async function loadSession(id) {
  sessionId = id;
  const res = await fetch(`/api/session?id=${id}`);
  chatHistory = await res.json();
  chatMessages.innerHTML = "";
  chatHistory.forEach(m => addMessageToChat(m.role, m.content));
}

// Start new chat
async function startNewChat() {
  const res = await fetch("/api/newSession", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ topic: `Chat - ${new Date().toLocaleString()}` }),
  });
  const data = await res.json();
  sessionId = data.sessionId;
  chatHistory = [];
  chatMessages.innerHTML = "";

  // Refresh the sidebar and highlight the new chat
    // Refresh the sidebar list
  await loadSessions();

  // Find the newly created chat in the sidebar
  const newItem = Array.from(historyList.children).find(
    (li) => li.dataset.id === sessionId
  );

  if (newItem) {
    // Remove "active" from all other list items
    Array.from(historyList.children).forEach((el) =>
      el.classList.remove("active")
    );

    // Highlight this new one
    newItem.classList.add("active");

    // Load the new chat’s content (the greeting message)
    await loadSession(sessionId);
  }
}

// Send message
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message || isProcessing) return;

  isProcessing = true;
  userInput.disabled = true;
  sendButton.disabled = true;

  addMessageToChat("user", message);
  saveMessage({ role: "user", content: message });
  chatHistory.push({ role: "user", content: message });
  userInput.value = "";
  userInput.style.height = "auto";
  typingIndicator.classList.add("visible");

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, messages: chatHistory })
    });
    const data = await res.json();
    addMessageToChat("assistant", data.response);
    chatHistory.push({ role: "assistant", content: data.response });
    saveMessage({ role: "assistant", content: data.response });
    await loadSessions();
  } catch (err) {
    console.error(err);
    if (!data || !data.response) {
        addMessageToChat("assistant", "Error processing your request.");
    }
  } finally {
    typingIndicator.classList.remove("visible");
    isProcessing = false;
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus();
  }
}

// Add message to chat window
function addMessageToChat(role, content) {
  const msgEl = document.createElement("div");
  msgEl.className = `message ${role}-message`;
  msgEl.innerHTML = `<p>${content}</p>`;
  chatMessages.appendChild(msgEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Save message to backend
async function saveMessage(msg) {
  await fetch("/api/addMessage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message: msg })
  });
}

// Event listeners
sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});
userInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});
newChatBtn.addEventListener("click", startNewChat);

// Initialize
(async function init() {
  await loadSessions();
  const last = historyList.lastChild;
  if (last) {
    loadSession(last.dataset.id); // last active chat
  } else {
    startNewChat();
  }
})();
