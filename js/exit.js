document.addEventListener("DOMContentLoaded", () => {
  const exitBtn = document.getElementById("exitAppBtn");
  const modal = document.getElementById("exitModal");
  const confirmBtn = document.getElementById("confirmExit");
  const cancelBtn = document.getElementById("cancelExit");
  const input = document.getElementById("confirmInput");
  const errorText = document.getElementById("errorText");

  if (!exitBtn || !window.api) return;

  exitBtn.style.display = "none";

  window.api.onFullscreenChange((isFullscreen) => {
    exitBtn.style.display = isFullscreen ? "block" : "none";
  });

  // 👉 Khi bấm nút thoát → mở modal
  exitBtn.addEventListener("click", () => {
    input.value = "";
    errorText.textContent = "";
    modal.style.display = "flex";
    input.focus();
  });

  // 👉 Hủy
  cancelBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // 👉 Xác nhận
  confirmBtn.addEventListener("click", async () => {
    if (input.value.trim().toLowerCase() !== "ok") {
      errorText.textContent = "Bạn phải nhập đúng chữ 'ok'";
      return;
    }

    modal.style.display = "none";

    try {
      const token = localStorage.getItem("token");
      const subject = localStorage.getItem("subject");
      const currentTitle = document.title;

      let systemAppName = "Unknown";

      try {
        const info = await window.api.getActiveWindow();
        if (info?.owner?.name) {
          systemAppName = info.owner.name;
        }
      } catch (e) {
        console.warn("Cannot get active window info", e);
      }

      if (token) {
        await fetch("https://ailogs.ptit.edu.vn/be-logs/api/logs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({
            name: systemAppName,
            subject,
            title: `Thoát hệ thống - ${currentTitle}`,
            time: new Date().toISOString()
          })
        });
      }
    } catch (err) {
      console.error("Failed to send exit log", err);
    } finally {
      window.api.allowClose();
    }
  });
});

document.addEventListener("keydown", (e) => {
  if (e.key === "F11") {
    e.preventDefault();
    e.stopPropagation();
    console.log("F11 bị chặn");
  }
});