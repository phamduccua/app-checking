const loginBtn = document.getElementById("loginBtn");
const loginContainer = document.getElementById("loginContainer");
const mainContainer = document.getElementById("mainContainer");
const errorText = document.getElementById("loginError");

loginBtn.addEventListener("click", async () => {
  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value.trim();

  if (!user || !pass) {
    errorText.textContent = "Vui lòng nhập đầy đủ thông tin";
    return;
  }

  errorText.textContent = "Đang đăng nhập...";
  loginBtn.disabled = true;

  try {
    const res = await fetch("https://ailogs.ptit.edu.vn/be-logs/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: user,
        password: pass
      })
    });

    const data = await res.json();
    console.log("LOGIN RESPONSE:", data);

    if (!res.ok) {
      errorText.textContent = data?.message || `Lỗi HTTP ${res.status}`;
      return;
    }

    if (data.token && data.role) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      loginContainer.style.display = "none";
      mainContainer.style.display = "flex";
      document.title = "Hệ thống giám sát khoa AI";
      return;
    }

    errorText.textContent =
      data.message || "Sai tài khoản hoặc mật khẩu";

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    errorText.textContent = "Không kết nối được máy chủ";
  } finally {
    loginBtn.disabled = false;
  }
});