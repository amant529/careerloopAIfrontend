/************************************************************
 * CONFIG
 ************************************************************/
const BACKEND = "https://careerloopaibackend.onrender.com"; // << change if needed


/************************************************************
 * SIMPLE UTILITIES
 ************************************************************/
const $ = (id) => document.getElementById(id);

function toast(msg, duration = 3000) {
  const t = $("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => (t.style.display = "none"), duration);
}

function showPage(pageId) {
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("page-active"));
  $(pageId).classList.add("page-active");
}

function requireAuth() {
  const email = localStorage.getItem("cl_user");
  if (email) {
    $("userEmailLabel").textContent = email;
    $("login").classList.remove("page-active");
    $("mainWrapper").classList.remove("hidden");
    showPage(location.hash.replace("#", "") || "home");
  } else {
    $("mainWrapper").classList.add("hidden");
    $("login").classList.add("page-active");
  }
}


/************************************************************
 * LOGIN + LOGOUT
 ************************************************************/
$("loginBtn").onclick = () => {
  const email = $("loginEmail").value.trim();
  if (!email.includes("@")) return toast("Enter a valid email");

  localStorage.setItem("cl_user", email);
  $("userEmailLabel").textContent = email;
  $("login").classList.remove("page-active");
  $("mainWrapper").classList.remove("hidden");
  showPage("home");
};

$("logoutBtn").onclick = () => {
  localStorage.removeItem("cl_user");
  location.reload();
};


/************************************************************
 * PAGE NAVIGATION
 ************************************************************/
window.addEventListener("hashchange", () => {
  const p = location.hash.replace("#", "") || "home";
  showPage(p);
});

document.querySelectorAll("[data-route]").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const hash = a.getAttribute("href");
    location.hash = hash;
  });
});

// initial view
requireAuth();


/************************************************************
 * AI RESUME BUILDER
 ************************************************************/
$("genResume").onclick = async () => {
  const payload = {
    name: $("b_name").value.trim(),
    email: $("b_email").value.trim(),
    role: $("b_role").value.trim(),
    exp: $("b_exp").value.trim(),
    achieve: $("b_achieve").value.trim(),
    skills: $("b_skills").value.trim(),
    proj: $("b_proj").value.trim(),
    edu: $("b_edu").value.trim(),
    cert: $("b_cert").value.trim(),
    extra: $("b_extra").value.trim(),
    consent: $("b_consent").checked,
  };

  if (!payload.name || !payload.email) return toast("Name & email required");

  if (!payload.consent) return toast("Consent is required");

  $("resumePreview").innerHTML = "<p class='muted'>Generating resume...</p>";

  try {
    const res = await fetch(`${BACKEND}/api/builder/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to generate");

    $("resumePreview").textContent = data.resume || "No content returned";

  } catch (err) {
    $("resumePreview").innerHTML = "<p class='muted'>❌ Error generating resume</p>";
    toast(err.message);
  }
};


// SAVE RESUME
$("saveResumeBtn").onclick = async () => {
  try {
    const email = localStorage.getItem("cl_user");
    const resume = $("resumePreview").textContent.trim();

    if (!resume) return toast("Generate resume first");

    const res = await fetch(`${BACKEND}/api/builder/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, resume }),
    });

    if (res.ok) toast("Resume saved");
    else toast("Save failed");

  } catch {
    toast("Error saving");
  }
};


// PDF DOWNLOAD
$("downloadPdfBtn").onclick = () => {
  const text = $("resumePreview").textContent.trim();
  if (!text) return toast("Generate resume first");

  const w = window.open("", "_blank");
  w.document.write(`<pre style="font-family:Arial;white-space:pre-wrap;">${text}</pre>`);
  w.print();
};


/************************************************************
 * AI SCREENING
 ************************************************************/

// Single
$("screenSingleBtn").onclick = async () => {
  const payload = {
    jd: $("singleJD").value.trim(),
    resume: $("singleResume").value.trim(),
  };

  if (!payload.jd || !payload.resume) return toast("Enter both JD & Resume");

  $("singleScreenResult").classList.remove("hidden");
  $("singleScreenResult").innerHTML = "Processing...";

  try {
    const res = await fetch(`${BACKEND}/api/screen/single`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    $("singleScreenResult").innerHTML = `
      <b>Score:</b> ${data.score}/100
      <br><b>Match Summary:</b><br>${data.summary}
    `;

  } catch {
    $("singleScreenResult").innerHTML = "Error running screening";
  }
};


// Bulk
$("screenBulkBtn").onclick = async () => {
  const jd = $("bulkJD").value.trim();
  const files = $("bulkFiles").files;

  if (!jd || files.length === 0) return toast("Enter JD & Select Files");

  $("bulkScreenResult").classList.remove("hidden");
  $("bulkScreenResult").innerHTML = "Uploading & analyzing...";

  const fd = new FormData();
  fd.append("jd", jd);
  for (let file of files) fd.append("files", file);

  try {
    const res = await fetch(`${BACKEND}/api/screen/bulk`, { method: "POST", body: fd });
    const data = await res.json();

    $("bulkScreenResult").innerHTML = `<pre>${JSON.stringify(data.results, null, 2)}</pre>`;

  } catch {
    $("bulkScreenResult").innerHTML = "Error analyzing";
  }
};


/************************************************************
 * BACKGROUND ANIMATED WAVES
 ************************************************************/
const canvas = document.getElementById("bgWaveCanvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.onresize = resizeCanvas;

let t = 0;
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.lineWidth = 2;

    ctx.strokeStyle =
      i === 0 ? "#6c5ce7ff" :
      i === 1 ? "#b26efbff" :
                "#5dade2ff";

    const amplitude = 40 + i * 15;
    const wavelength = 0.01 + i * 0.005;
    const yOffset = canvas.height * 0.7 + i * 25;

    for (let x = 0; x < canvas.width; x++) {
      const y = yOffset + Math.sin(x * wavelength + t + i) * amplitude;
      ctx.lineTo(x, y);
    }

    ctx.stroke();
  }

  t += 0.015;
  requestAnimationFrame(draw);
}

draw();
