/**************** CONFIG ****************/
const BACKEND = "https://careerloopaibackend.onrender.com"; // your backend
const $ = (id) => document.getElementById(id);

function toast(msg, t = 3000) {
  const el = $("toast");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), t);
}

/**************** VISITOR & ANALYTICS ****************/
function getVisitorId() {
  let vid = localStorage.getItem("cl_vid");
  if (!vid) {
    vid = "v_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem("cl_vid", vid);
  }
  return vid;
}

async function trackVisit(page = "home") {
  try {
    await fetch(`${BACKEND}/api/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: getVisitorId(), page }),
    });
  } catch (e) {}
}

async function trackEvent(event_type, email = null) {
  try {
    await fetch(`${BACKEND}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitor_id: getVisitorId(), email, event_type }),
    });
  } catch {}
}

/**************** AUTH ****************/
function requireAuth() {
  const email = localStorage.getItem("cl_user");
  if (!email) {
    $("login").classList.add("page-active");
    $("mainWrapper").classList.add("hidden");
    return;
  }
  $("userEmailLabel").textContent = email;
  $("login").classList.remove("page-active");
  $("mainWrapper").classList.remove("hidden");
  showPage((location.hash || "#home").replace("#", ""));
}

function showPage(id) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("page-active"));
  const el = $(id);
  if (el) el.classList.add("page-active");
  trackVisit(id);
}

/**************** LOGIN UI ****************/
$("switchSecure").onclick = (e) => (e.preventDefault(), toggleLogin(true));
$("switchQuick").onclick = (e) => (e.preventDefault(), toggleLogin(false));

function toggleLogin(secure) {
  $("quickLogin").classList.toggle("hidden", secure);
  $("secureLogin").classList.toggle("hidden", !secure);
}

/**************** QUICK LOGIN ****************/
$("quickLoginBtn").onclick = () => {
  const email = $("loginEmail").value.trim();
  if (!email.includes("@")) return toast("Enter valid email");
  localStorage.setItem("cl_user", email);
  requireAuth();
};

/**************** OTP LOGIN (Optional backend support) ****************/
$("sendOtpBtn").onclick = async () => {
  const email = $("secureEmail").value.trim();
  if (!email.includes("@")) return toast("Enter valid email");

  try {
    await fetch(`${BACKEND}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    toast("OTP sent to email");
    $("otpInput").classList.remove("hidden");
    $("verifyOtpBtn").classList.remove("hidden");
  } catch {
    toast("OTP not sent");
  }
};

$("verifyOtpBtn").onclick = async () => {
  const email = $("secureEmail").value.trim();
  const otp = $("otpInput").value.trim();
  if (!otp) return toast("Enter OTP");

  try {
    const r = await fetch(`${BACKEND}/auth/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });
    if (!r.ok) return toast("Invalid OTP");
    localStorage.setItem("cl_user", email);
    requireAuth();
  } catch {
    toast("OTP verify failed");
  }
};

/**************** LOGOUT ****************/
$("logoutBtn").onclick = () => (localStorage.removeItem("cl_user"), location.reload());

/**************** ROUTING ****************/
window.addEventListener("hashchange", () =>
  showPage((location.hash || "#home").replace("#", ""))
);

document.querySelectorAll("[data-route]").forEach((a) =>
  a.addEventListener("click", (e) => {
    e.preventDefault();
    location.hash = a.getAttribute("href");
  })
);

/**************** RESUME BUILDER ****************/
$("genResume").onclick = async () => {
  const email = $("b_email").value.trim() || localStorage.getItem("cl_user");
  if (!$("b_name").value.trim() || !email) return toast("Enter name & email");
  if (!$("b_consent").checked) return toast("Consent required ✔");

  const payload = {
    name: $("b_name").value.trim(),
    email,
    target_role: $("b_role").value.trim(),
    experience_level: $("b_exp").value.trim(),
    achievements: $("b_achieve").value.trim(),
    skills: $("b_skills").value.trim(),
    projects: $("b_proj").value.trim(),
    education: $("b_edu").value.trim(),
    certifications: $("b_cert").value.trim(),
    extras: $("b_extra").value.trim(),
  };

  $("resumePreview").innerHTML = "<p class='muted'>⏳ Creating resume...</p>";

  try {
    const r = await fetch(`${BACKEND}/api/builder/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw data;
    $("resumePreview").textContent = data.resume;
    trackEvent("resume_generated", email);
  } catch {
    $("resumePreview").innerHTML = "<p class='muted'>⚠️ Failed to generate</p>";
  }
};

$("saveResumeBtn").onclick = async () => {
  const email = localStorage.getItem("cl_user");
  const resume = $("resumePreview").textContent.trim();
  if (!resume) return toast("Generate first");

  try {
    await fetch(`${BACKEND}/api/builder/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, resume }),
    });
    toast("💾 Saved");
  } catch {
    toast("Save failed");
  }
};

$("downloadPdfBtn").onclick = () => {
  const text = $("resumePreview").textContent.trim();
  if (!text) return toast("Generate first");
  const w = window.open("", "_blank");
  w.document.write(`<pre style="font-family:Arial;white-space:pre-wrap;">${text}</pre>`);
  w.print();
};

/**************** SCREENING ****************/
$("screenSingleBtn").onclick = async () => {
  const jd = $("singleJD").value.trim();
  const resume = $("singleResume").value.trim();
  if (!jd || !resume) return toast("Enter JD & Resume");

  $("singleScreenResult").classList.remove("hidden");
  $("singleScreenResult").innerHTML = "⏳ Processing...";

  try {
    const r = await fetch(`${BACKEND}/api/screen/single`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_description: jd, resume_text: resume }),
    });
    const data = await r.json();
    $("singleScreenResult").innerHTML = `<b>Score:</b> ${data.score}/100<br><hr>${data.summary}`;
    trackEvent("screen_single", localStorage.getItem("cl_user"));
  } catch {
    $("singleScreenResult").innerHTML = "❌ Error";
  }
};

$("screenBulkBtn").onclick = async () => {
  const jd = $("bulkJD").value.trim();
  const files = $("bulkFiles").files;
  if (!jd || !files.length) return toast("Add JD & files");

  $("bulkScreenResult").classList.remove("hidden");
  $("bulkScreenResult").innerHTML = "⏳ Uploading...";

  const fd = new FormData();
  fd.append("jd", jd);
  for (const f of files) fd.append("files", f);

  try {
    const r = await fetch(`${BACKEND}/api/screen/bulk`, { method: "POST", body: fd });
    const data = await r.json();
    $("bulkScreenResult").innerHTML = `<pre>${JSON.stringify(data.results, null, 2)}</pre>`;
    trackEvent("screen_bulk", localStorage.getItem("cl_user"));
  } catch {
    $("bulkScreenResult").innerHTML = "❌ Error";
  }
};

/**************** SUBSCRIPTION ****************/
function celebrate() {
  confetti({ particleCount: 220, spread: 120, origin: { y: 0.6 } });
}

$("claimSubBtn").onclick = async () => {
  const email = localStorage.getItem("cl_user");
  if (!email) return toast("Login first");

  try {
    const r = await fetch(`${BACKEND}/api/admin/subscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!r.ok) throw 0;
    celebrate();
    toast("🎉 Subscribed!");
    $("claimSubBtn").disabled = true;
    $("claimSubBtn").textContent = "Activated ✔";
  } catch {
    toast("Error");
  }
};

/**************** INIT ****************/
requireAuth();

/**************** BACKGROUND - WAVES ****************/
const canvas = $("bgWaveCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
resizeCanvas();
onresize = resizeCanvas;

let t = 0;
(function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ["#6c5ce7", "#b26efb", "#5dade2"].forEach((color, i) => {
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = color;
    const amp = 40 + i * 15;
    const wl = 0.01 + i * 0.005;
    const yOff = canvas.height * 0.7 + i * 25;

    for (let x = 0; x < canvas.width; x++)
      ctx.lineTo(x, yOff + Math.sin(x * wl + t + i) * amp);

    ctx.stroke();
  });
  t += 0.015;
  requestAnimationFrame(draw);
})();
