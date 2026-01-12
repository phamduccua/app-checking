/* ================== EXIT MODAL ================== */
document.addEventListener("DOMContentLoaded", () => {
  const exitBtn = document.getElementById("exitAppBtn");
  const modal = document.getElementById("exitModal");
  const confirmBtn = document.getElementById("confirmExit");
  const cancelBtn = document.getElementById("cancelExit");
  const input = document.getElementById("confirmInput");
  const errorText = document.getElementById("errorText");

  if (!exitBtn || !window.api) return;
  exitBtn.style.display = "none";

  window.api.onFullscreenChange(v => {
    exitBtn.style.display = v ? "block" : "none";
  });

  exitBtn.onclick = () => {
    input.value = "";
    errorText.textContent = "";
    modal.style.display = "flex";
    input.focus();
  };

  cancelBtn.onclick = () => modal.style.display = "none";

  confirmBtn.onclick = async () => {
    if (input.value.trim().toLowerCase() !== "ok") {
      errorText.textContent = "Bạn phải nhập đúng chữ 'ok'";
      return;
    }

    modal.style.display = "none";
    await sendLog("Thoát hệ thống");
    window.api.allowClose();
  };
});

/* ================== BLOCK F11 ================== */
document.addEventListener("keydown", e => {
  if (e.key === "F11") {
    e.preventDefault();
    e.stopPropagation();
  }
});

/* ================== SUBJECT SELECT ================== */
const buttons = document.querySelectorAll(".list-container button");
const webview = document.getElementById("myWeb");
const originalTitle = document.title;

let justEnteredSubject = false;

buttons.forEach(btn => {
  btn.onclick = () => {
    const url = btn.dataset.url;
    webview.src = url;

    document.title = `${originalTitle} - ${btn.textContent.trim()}`;

    let subject = null;
    let fullscreen = false;
    let maximize = false;

    if (url.includes("python")) { subject = "py"; fullscreen = true; }
    else if (url.includes("trr")) { subject = "trr"; fullscreen = true; }
    else if (url.includes("aichallenge")) { subject = "ai-challenge"; maximize = true; }

    if (subject) {
      localStorage.setItem("subject", subject);
      window.api.setSubject(subject);
      justEnteredSubject = true;
      setTimeout(() => justEnteredSubject = false, 1000);
    }

    window.api.setFullscreen(fullscreen);
    window.api.setMaximize(!fullscreen && maximize);
  };
});

/* ================== ACTIVE WINDOW LOG ================== */
let lastApp = null;
let lastTitle = null;
let lastLogTime = 0;

async function updateWindowInfo() {
  const now = Date.now();
  if (now - lastLogTime < 700) return;

  const info = await window.api.getActiveWindow();
  if (!info || !info.title) return;

  const app = info.owner?.name;
  const title = info.title.trim();
  if (!app || app === "Electron") return;

  if (app === lastApp && title === lastTitle) return;

  const subject = localStorage.getItem("subject");
  const token = localStorage.getItem("token");
  if (!subject || !token) return;

  lastApp = app;
  lastTitle = title;
  lastLogTime = now;

  await fetch("https://ailogs.ptit.edu.vn/be-logs/api/logs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      name: app,
      title,
      subject,
      time: new Date().toISOString()
    })
  });
}

setInterval(updateWindowInfo, 1000);

/* ================== SHRINK LOG ================== */
window.api.onWindowShrinked(async ({ subject }) => {
  if (justEnteredSubject) return;
  await sendLog("Thu nhỏ màn hình", subject);
});

/* ================== CLICK X ================== */
window.api.onClickedX(async ({ subject }) => {
  await sendLog("Thoát ứng dụng", subject);
  window.api.allowClose();
});

/* ================== LOG HELPER ================== */
async function sendLog(action, subjectOverride) {
  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const info = await window.api.getActiveWindow();
    const subject = subjectOverride || localStorage.getItem("subject");

    await fetch("https://ailogs.ptit.edu.vn/be-logs/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        name: info?.owner?.name || null,
        title: `${action} - ${info?.title || ""}`,
        subject,
        time: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error("Send log error", e);
  }
}
