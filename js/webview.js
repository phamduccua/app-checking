const buttons = document.querySelectorAll(".list-container button");
const listContainer = document.querySelector(".list-container");
const webContainer = document.getElementById("webContainer");
const webview = document.getElementById("myWeb");
const originalTitle = document.title;

let lastApp = null;
let lastTitle = null;
let shrinkLogged = false;

let justEnteredSubject = false;

/* ===== CHỌN MÔN ===== */
buttons.forEach(btn => {
  btn.addEventListener("click", () => {
    const url = btn.dataset.url;
    webview.src = url;

    listContainer.style.display = "none";
    webContainer.style.display = "block";
    document.title = `${originalTitle} - ${btn.textContent.trim()}`;

    let subject = null;
    let fullscreen = false;
    let maximize = false;

    if (url.includes("python")) {
      subject = "py";
      fullscreen = true;
    } else if (url.includes("trr")) {
      subject = "trr";
      fullscreen = true;
    } else if (url.includes("aichallenge")) {
      subject = "ai-challenge";
      maximize = true;
    }

    if (subject) {
      localStorage.setItem("subject", subject);
      window.api.setSubject(subject);

      // đánh dấu vừa vào môn (chống log nhầm)
      justEnteredSubject = true;
      shrinkLogged = false;

      setTimeout(() => {
        justEnteredSubject = false;
      }, 1000); // 1s là đủ
    }

    window.api.setFullscreen(fullscreen);
    window.api.setMaximize(!fullscreen && maximize);
  });
});

/* ===== LOG ĐỔI APP / TAB ===== */
async function updateWindowInfo() {
  try {
    const info = await window.api.getActiveWindow();
    if (!info) return;

    const currentApp = info.owner?.name || null;
    const currentTitle = info.title?.trim() || null;

    if (!currentTitle) return;
    if (currentApp === lastApp && currentTitle === lastTitle) return;

    const subject = localStorage.getItem("subject");
    if (!subject) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const time = new Date(
      Date.now() + (7 * 60 + new Date().getTimezoneOffset()) * 60000
    );

    lastApp = currentApp;
    lastTitle = currentTitle;

    await fetch("https://ailogs.ptit.edu.vn/be-logs/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        name: currentApp,
        title: currentTitle,
        subject,
        time
      })
    });

    shrinkLogged = false;

  } catch (e) {
    console.error("Tracker error:", e);
  }
}

setInterval(updateWindowInfo, 500);

/* ===== LOG THU NHỎ MÀN HÌNH ===== */
window.api.onWindowShrinked(async ({ subject }) => {
  // chặn log nhầm khi mới vào môn
  if (shrinkLogged || justEnteredSubject) return;

  try {
    const info = await window.api.getActiveWindow();
    const token = localStorage.getItem("token");
    if (!token) return;

    const time = new Date(
      Date.now() + (7 * 60 + new Date().getTimezoneOffset()) * 60000
    );

    await fetch("https://ailogs.ptit.edu.vn/be-logs/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        name: info.owner?.name || null,
        title: "Thu nhỏ màn hình - " + (info.title?.trim() || ""),
        subject,
        time
      })
    });

    shrinkLogged = true;
    console.log("Log thu nhỏ màn hình");

  } catch (e) {
    console.error("Shrink log error:", e);
  }
});

/* ===== LOG CLICK ❌ ===== */
window.api.onClickedX(async ({ subject }) => {
  let done = false;

  // ⏱ timeout chống treo app
  setTimeout(() => {
    if (!done) {
      console.warn("Force close after timeout");
      window.api.allowClose();
    }
  }, 500);

  try {
    const token = localStorage.getItem("token");
    if (!token) return;

    const info = await window.api.getActiveWindow();

    await fetch("https://ailogs.ptit.edu.vn/be-logs/api/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify({
        name: info?.owner?.name || null,
        title: "Thoát ứng dụng - " + (info.title?.trim() || ""),
        subject,
        time: new Date().toISOString()
      })
    });

    console.log("✅ Log click X OK");

  } catch (e) {
    console.error("Click X log error:", e);
  } finally {
    done = true;
    window.api.allowClose();
  }
});
