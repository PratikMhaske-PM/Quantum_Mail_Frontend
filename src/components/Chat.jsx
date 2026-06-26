import { useEffect, useRef, useState, useCallback } from "react";
import API from "../api/api";
import Navbar from "../components/Navbar";
import "./Chat.css";

/* ── Security helpers ── */
const MAX_MSG_LEN = 2000;
const sanitize = (str) =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

/* Rate-limiter: max `limit` calls per `windowMs` */
function useRateLimit(limit = 5, windowMs = 3000) {
  const calls = useRef([]);
  return useCallback(() => {
    const now = Date.now();
    calls.current = calls.current.filter(t => now - t < windowMs);
    if (calls.current.length >= limit) return false;
    calls.current.push(now);
    return true;
  }, [limit, windowMs]);
}

/* Debounce hook */
function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Relative time ── */
function useRelativeTime() {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  return useCallback((ts) => {
    if (!ts) return "";
    const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (diff < 5)    return "just now";
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }, []);
}

/* ── Icon components ── */
const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
    <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const LogoutIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5Z"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
    <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    <path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CheckIcon = ({ double }) => (
  <svg width="16" height="11" viewBox="0 0 20 12" fill="none">
    <path d="M1 5l4 4L14 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    {double && <path d="M7 9l4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
    {double && <path d="M7 9l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
  </svg>
);

/* ── Avatar ── */
const AVATAR_COLORS = [
  ["#25D366","#128C7E"], ["#0ea5e9","#0284c7"], ["#8b5cf6","#7c3aed"],
  ["#f59e0b","#d97706"], ["#ec4899","#db2777"], ["#10b981","#059669"],
  ["#ef4444","#dc2626"], ["#14b8a6","#0d9488"],
];
function avatarColor(str) {
  let h = 0;
  for (let i = 0; i < (str?.length ?? 0); i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function Avatar({ name, size = 38, status = false }) {
  const [from, to] = avatarColor(name);
  const letter = name?.[0]?.toUpperCase() ?? "?";
  return (
    <div className="av-wrap" style={{ width: size, height: size }}>
      <div
        className="av"
        style={{
          width: size, height: size,
          background: `linear-gradient(135deg, ${from}, ${to})`,
          fontSize: size * 0.4,
          borderRadius: "50%",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontWeight: 700, flexShrink: 0,
          fontFamily: "'DM Sans', sans-serif",
          userSelect: "none",
        }}
      >
        {letter}
      </div>
      {status && <span className="av-status" />}
    </div>
  );
}

function TypingDots() {
  return (
    <div className="typing-bubble">
      <span /><span /><span />
    </div>
  );
}

const QUICK_EMOJIS = ["👍","❤️","😂","😮","😢","🔥"];

/* ════════════ MAIN COMPONENT ════════════ */
function Chat() {
  const [chatList, setChatList]             = useState([]);
  const [users, setUsers]                   = useState([]);
  const [selectedUser, setSelectedUser]     = useState(null);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [messages, setMessages]             = useState([]);
  const [message, setMessage]               = useState("");
  const [editingId, setEditingId]           = useState(null);
  const [editText, setEditText]             = useState("");
  const [search, setSearch]                 = useState("");
  const [userSearch, setUserSearch]         = useState("");
  const [contextMenu, setContextMenu]       = useState(null);
  const [seenUsers, setSeenUsers]           = useState(new Set());
  const [animatedMsgIds, setAnimatedMsgIds] = useState(new Set());
  const [sendError, setSendError]           = useState("");
  const [hoveredMsg, setHoveredMsg]         = useState(null);
  const [emojiPickerFor, setEmojiPickerFor] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const seenUsersRef   = useRef(seenUsers);
  seenUsersRef.current = seenUsers;

  const getRelativeTime = useRelativeTime();
  const canSend         = useRateLimit(8, 4000);
  const debouncedSearch = useDebounce(search, 250);

  const rawId = localStorage.getItem("user_id");
  const currentUserId    = rawId && /^\d+$/.test(rawId) ? Number(rawId) : null;
  const currentUserEmail = String(localStorage.getItem("user_email") ?? "").slice(0, 200);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const close = () => { setContextMenu(null); setEmojiPickerFor(null); };
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    setAnimatedMsgIds(prev => prev.has(last.id) ? prev : new Set([...prev, last.id]));
  }, [messages]);

  useEffect(() => {
    fetchChats();
    fetchUsers();
    const iv = setInterval(() => {
      fetchChats();
      if (selectedUser) fetchMessages(selectedUser);
    }, 2500);
    return () => clearInterval(iv);
  }, [selectedUser]); // eslint-disable-line

  const fetchUsers = async () => {
    try { const r = await API.get("/users/"); setUsers(r.data); }
    catch { /* silent */ }
  };

  const fetchChats = async () => {
    try {
      const r = await API.get("/messages/chats/list");
      setChatList(r.data.map(c =>
        seenUsersRef.current.has(c.user_id) ? { ...c, unread_count: 0 } : c
      ));
    } catch { /* silent */ }
  };

  const fetchMessages = async (userId) => {
    try {
      const r = await API.get(`/messages/conversation/${userId}`);
      setMessages(r.data);
    } catch { /* silent */ }
  };

  const openConversation = async (userId) => {
    if (!userId) return;
    setSelectedUser(userId);
    setSeenUsers(prev => new Set([...prev, userId]));
    setChatList(prev => prev.map(c => c.user_id === userId ? { ...c, unread_count: 0 } : c));
    try {
      const r = await API.get(`/messages/conversation/${userId}`);
      setMessages(r.data);
      const u = users.find(u => u.id === userId);
      if (u) setSelectedUserEmail(sanitize(u.email || u.username || "Chat"));
      inputRef.current?.focus();
    } catch { /* silent */ }
  };

  const sendMessage = async () => {
    const trimmed = message.trim().slice(0, MAX_MSG_LEN);
    if (!trimmed) return;
    if (!canSend()) { setSendError("Slow down a bit…"); setTimeout(() => setSendError(""), 2000); return; }
    setSendError("");
    try {
      await API.post("/messages/send", { receiver_id: selectedUser, message: trimmed });
      setMessage("");
      fetchMessages(selectedUser);
      fetchChats();
    } catch { setSendError("Failed to send. Try again."); }
  };

  const deleteMessage = async (id) => {
    try { await API.delete(`/messages/${id}`); fetchMessages(selectedUser); }
    catch { /* silent */ }
  };

  const saveEdit = async (id) => {
    const trimmed = editText.trim().slice(0, MAX_MSG_LEN);
    if (!trimmed) return;
    try {
      await API.put(`/messages/${id}`, { message: trimmed });
      setEditingId(null);
      fetchMessages(selectedUser);
    } catch { /* silent */ }
  };

  const logout = () => { localStorage.clear(); window.location.href = "/"; };

  const handleRightClick = (e, msg) => {
    e.preventDefault();
    e.stopPropagation();
    if (msg.sender_id !== currentUserId) return;
    const MENU_W = 190, MENU_H = 100;
    const x = e.clientX + MENU_W > window.innerWidth  ? e.clientX - MENU_W : e.clientX;
    const y = e.clientY + MENU_H > window.innerHeight ? e.clientY - MENU_H : e.clientY;
    setContextMenu({ x, y, message: msg });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_MSG_LEN) setMessage(val);
  };

  const filteredChats = chatList.filter(c =>
    c.username?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  const groupedMessages = messages.reduce((acc, msg) => {
    const dateKey = new Date(msg.timestamp).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(msg);
    return acc;
  }, {});

  const charsLeft = MAX_MSG_LEN - message.length;

  /* ════════════ RENDER ════════════ */
  return (
    <div className="ch-root">
      <Navbar
        users={users}
        currentUserEmail={currentUserEmail}
        userSearch={userSearch}
        setUserSearch={setUserSearch}
        fetchConversation={openConversation}
      />

      <div className="ch-layout">

        {/* ══ SIDEBAR ══ */}
        <aside className="ch-sidebar">
          <div className="sb-head">
            <div className="sb-title">
              <span className="sb-title-text">Chats</span>
              {chatList.reduce((s, c) => s + (c.unread_count || 0), 0) > 0 && (
                <span className="sb-total-badge">
                  {chatList.reduce((s, c) => s + (c.unread_count || 0), 0)}
                </span>
              )}
            </div>
            <button className="sb-edit-btn" title="New chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <div className="sb-search">
            <SearchIcon />
            <input
              type="text"
              className="sb-search-input"
              placeholder="Search or start new chat"
              value={search}
              onChange={e => setSearch(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="sb-list">
            {filteredChats.length === 0 ? (
              <div className="sb-empty">
                <div className="sb-empty-icon">💬</div>
                <p>No conversations yet</p>
                <span>Start a new chat above</span>
              </div>
            ) : filteredChats.map((chat, idx) => {
              const isActive = selectedUser === chat.user_id;
              const unread   = chat.unread_count || 0;
              return (
                <div
                  key={chat.user_id}
                  className={`sb-item ${isActive ? "sb-item--active" : ""}`}
                  style={{ animationDelay: `${idx * 35}ms` }}
                  onClick={() => openConversation(chat.user_id)}
                >
                  <div className="sb-item-av">
                    <Avatar name={chat.username} size={46} />
                  </div>
                  <div className="sb-item-body">
                    <div className="sb-item-top">
                      <span className={`sb-item-name ${unread > 0 ? "sb-item-name--unread" : ""}`}>
                        {sanitize(chat.username)}
                      </span>
                      <span className={`sb-item-time ${unread > 0 ? "sb-item-time--unread" : ""}`}>
                        {getRelativeTime(chat.last_message_time)}
                      </span>
                    </div>
                    <div className="sb-item-bottom">
                      <p className={`sb-item-preview ${unread > 0 ? "sb-item-preview--unread" : ""}`}>
                        {sanitize(chat.last_message) || "No messages yet"}
                      </p>
                      {unread > 0 && (
                        <span className="sb-unread-chip">{unread > 99 ? "99+" : unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sb-foot">
            <Avatar name={currentUserEmail} size={36} />
            <span className="sb-foot-email">{currentUserEmail}</span>
            <button className="sb-logout" onClick={logout} title="Logout">
              <LogoutIcon />
            </button>
          </div>
        </aside>

        {/* ══ CONVERSATION ══ */}
        <main className="ch-conv">
          {selectedUser ? (
            <>
              {/* Header */}
              <div className="conv-header">
                <div className="conv-header-left">
                  <Avatar name={selectedUserEmail} size={40} status />
                  <div className="conv-header-info">
                    <span className="conv-header-name">{selectedUserEmail}</span>
                    <span className="conv-header-status">
                      <span className="status-dot" />online
                    </span>
                  </div>
                </div>
                <div className="conv-header-actions">
                  <button className="hdr-btn" title="Voice call">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.7 12a19.79 19.79 0 01-3.07-8.67A2 2 0 013.62 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.91 8.59a16 16 0 006.29 6.29l.96-.96a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92Z"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button className="hdr-btn" title="Video call">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <polygon points="23 7 16 12 23 17 23 7" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                      <rect x="1" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>
                  <button className="hdr-btn" title="More options">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="5" r="1.5" fill="currentColor"/>
                      <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
                      <circle cx="12" cy="19" r="1.5" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="conv-messages">
                {messages.length === 0 ? (
                  <div className="conv-empty">
                    <div className="conv-empty-emoji">
                      <Avatar name={selectedUserEmail} size={72} />
                    </div>
                    <p className="conv-empty-name">{selectedUserEmail}</p>
                    <span>Send a message to start the conversation</span>
                  </div>
                ) : (
                  Object.entries(groupedMessages).map(([dateKey, dayMsgs]) => (
                    <div key={dateKey} className="msg-day-group">
                      <div className="msg-day-label">
                        <span>
                          {new Date(dateKey).toDateString() === new Date().toDateString()
                            ? "Today"
                            : new Date(dateKey).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
                        </span>
                      </div>

                      {dayMsgs.map((msg, i) => {
                        const isOwn   = msg.sender_id === currentUserId;
                        const prevMsg = dayMsgs[i - 1];
                        const nextMsg = dayMsgs[i + 1];
                        const grouped = prevMsg?.sender_id === msg.sender_id;
                        const isLast  = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                        const isNew   = i === dayMsgs.length - 1 && animatedMsgIds.has(msg.id);

                        return (
                          <div
                            key={msg.id}
                            className={`msg-row ${isOwn ? "msg-row--own" : "msg-row--other"} ${isNew ? "msg-pop" : ""} ${grouped ? "msg-grouped" : ""}`}
                            onContextMenu={e => handleRightClick(e, msg)}
                            onMouseEnter={() => setHoveredMsg(msg.id)}
                            onMouseLeave={() => setHoveredMsg(null)}
                          >
                            {/* Receiver avatar — left side */}
                            {!isOwn && (
                              <div className="msg-av-slot">
                                {isLast
                                  ? <Avatar name={selectedUserEmail} size={30} />
                                  : <div style={{ width: 30, flexShrink: 0 }} />
                                }
                              </div>
                            )}

                            <div className="msg-content">
                              {editingId === msg.id ? (
                                <div className="msg-edit-box">
                                  <input
                                    className="msg-edit-input"
                                    value={editText}
                                    onChange={e => setEditText(e.target.value.slice(0, MAX_MSG_LEN))}
                                    onKeyDown={e => e.key === "Enter" && saveEdit(msg.id)}
                                    autoFocus
                                    maxLength={MAX_MSG_LEN}
                                  />
                                  <div className="msg-edit-actions">
                                    <button className="edit-save-btn" onClick={() => saveEdit(msg.id)}>Save</button>
                                    <button className="edit-cancel-btn" onClick={() => setEditingId(null)}>Cancel</button>
                                  </div>
                                </div>
                              ) : (
                                <div className={`msg-bubble ${isOwn ? "msg-bubble--own" : "msg-bubble--other"} ${isLast && isOwn ? "bubble-tail-own" : ""} ${isLast && !isOwn ? "bubble-tail-other" : ""}`}>
                                  <p className="msg-text">{msg.message}</p>
                                  <div className="msg-meta">
                                    <span className="msg-ts">{getRelativeTime(msg.timestamp)}</span>
                                    {msg.is_edited && <span className="msg-edited">edited</span>}
                                    {isOwn && (
                                      <span className={`msg-tick ${msg.status === "read" ? "msg-tick--read" : ""}`}>
                                        <CheckIcon double={msg.status === "read"} />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Hover toolbar */}
                            {hoveredMsg === msg.id && editingId !== msg.id && (
                              <div className={`msg-toolbar ${isOwn ? "msg-toolbar--own" : "msg-toolbar--other"}`}>
                                <button className="toolbar-btn" title="React"
                                  onClick={e => { e.stopPropagation(); setEmojiPickerFor(msg.id); }}>
                                  😊
                                </button>
                                {isOwn && (
                                  <>
                                    <button className="toolbar-btn" title="Edit"
                                      onClick={() => { setEditingId(msg.id); setEditText(msg.message); }}>
                                      <EditIcon />
                                    </button>
                                    <button className="toolbar-btn toolbar-btn--danger" title="Delete"
                                      onClick={() => deleteMessage(msg.id)}>
                                      <TrashIcon />
                                    </button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Emoji picker */}
                            {emojiPickerFor === msg.id && (
                              <div
                                className={`emoji-picker ${isOwn ? "emoji-picker--own" : ""}`}
                                onClick={e => e.stopPropagation()}
                              >
                                {QUICK_EMOJIS.map(e => (
                                  <button key={e} className="emoji-btn"
                                    onClick={() => setEmojiPickerFor(null)}>
                                    {e}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="conv-input-wrap">
                {sendError && <div className="send-error">{sendError}</div>}
                <div className="conv-input-bar">
                  <button className="input-action-btn" title="Emoji">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      <circle cx="9" cy="9" r="1.2" fill="currentColor"/>
                      <circle cx="15" cy="9" r="1.2" fill="currentColor"/>
                    </svg>
                  </button>

                  <button className="input-action-btn" title="Attach file">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.42 16.41a2 2 0 01-2.83-2.83l8.49-8.48"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  <div className="input-field-wrap">
                    <input
                      ref={inputRef}
                      type="text"
                      className="conv-input"
                      placeholder="Type a message"
                      value={message}
                      onChange={handleInput}
                      onKeyDown={handleKeyDown}
                      maxLength={MAX_MSG_LEN}
                      autoComplete="off"
                      spellCheck
                    />
                    {message.length > MAX_MSG_LEN * 0.85 && (
                      <span className={`char-count ${charsLeft < 100 ? "char-count--warn" : ""}`}>
                        {charsLeft}
                      </span>
                    )}
                  </div>

                  <button
                    className={`send-btn ${message.trim() ? "send-btn--active" : ""}`}
                    onClick={sendMessage}
                    disabled={!message.trim()}
                    title="Send"
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="conv-welcome">
              <div className="welcome-inner">
                <div className="welcome-icon">
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                    <circle cx="40" cy="40" r="40" fill="#f0fdf4"/>
                    <path d="M20 28h40v28a4 4 0 01-4 4H24a4 4 0 01-4-4V28Z" fill="#25D366" opacity=".15"/>
                    <rect x="20" y="22" width="40" height="32" rx="5" stroke="#25D366" strokeWidth="2"/>
                    <path d="M20 46l8-6h24" stroke="#25D366" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="31" cy="35" r="2" fill="#25D366"/>
                    <circle cx="40" cy="35" r="2" fill="#25D366"/>
                    <circle cx="49" cy="35" r="2" fill="#25D366"/>
                  </svg>
                </div>
                <h2>QUANTUM MESSAGING</h2>
                <p>Send and receive messages without keeping your phone online.<br/>Use Quantum Messaging on up to 4 linked devices.</p>
                <div className="welcome-hint">
                  <span>←</span> Select a chat to start messaging
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="ctx-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="ctx-item"
            onClick={() => {
              setEditingId(contextMenu.message.id);
              setEditText(contextMenu.message.message);
              setContextMenu(null);
            }}
          >
            <EditIcon /> Edit message
          </button>
          <div className="ctx-sep" />
          <button
            className="ctx-item ctx-item--danger"
            onClick={() => { deleteMessage(contextMenu.message.id); setContextMenu(null); }}
          >
            <TrashIcon /> Delete message
          </button>
        </div>
      )}
    </div>
  );
}

export default Chat;