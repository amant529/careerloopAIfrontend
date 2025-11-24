// =============================
// CONFIG
// =============================
const BACKEND = "https://careerloopaibackend.onrender.com";

// =============================
// ROLE + LOGIN
// =============================
function setRole(role) {
  localStorage.setItem("careerloop_role", role);
  const jobBtn = document.getElementById("jobseekerBtn");
  const bizBtn = document.getElementById("businessBtn");
  if (jobBtn && bizBtn) {
    jobBtn.classList.toggle("selected", role === "jobseeker");
    bizBtn.classList.toggle("selected", role === "business");
  }
}

function getRole() {
  return localStorage.getItem("careerloop_role");
}

function continueLogin() {
  const emailInput = document.getElementById("loginEmail");
  const email = emailInput ? emailInput.value.trim() : "";
  const role = getRole();

  if (!role) {
    alert("Please choose Job Seeker or Business / HR first.");
    return;
  }
  if (!email) {
    alert("Please enter your email.");
    return;
  }

  localStorage.setItem("careerloop_email", email);

  if (role === "business") {
    window.location.href = "business.html";
  } else {
    window.location.href = "jobseeker.html";
  }
}

function requireAuth() {
  const email = localStorage.getItem("careerloop_email");
  if (!email) {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("careerloop_email");
  localStorage.removeItem("careerloop_role");
  window.location.href = "index.html";
}

// =============================
// AI RESUME BUILDER
// =============================
async function generateResume() {
  // requireAuth();  // uncomment if you want hard redirect when not logged in

  // support both ids: resumeConsent OR consentBox
  const consentEl =
    document.getElementById("resumeConsent") ||
    document.getElementById("consentBox");

  if (consentEl && !consentEl.checked) {
    alert("Please agree to allow Careerloop AI to save your resume.");
    return;
  }

  const name = document.getElementById("rName")?.value.trim() || "";
  const title = document.getElementById("rTitle")?.value.trim() || "";
  const experience = document.getElementById("rExp")?.value.trim() || "";
  const skills = document.getElementById("rSkills")?.value.trim() || "";
  const education = document.getElementById("rEdu")?.value.trim() || "";
  const achievements = document.getElementById("rAch")?.value.trim() || "";
  const extras = document.getElementById("rExtras")?.value.trim() || "";
  const templateId =
    document.getElementById("rTemplate")?.value || "classic-pro";

  if (!name || !title) {
    alert("Please fill at least Name and Job Title.");
    return;
  }

  const outputEl = document.getElementById("resumeOutput");
  if (outputEl) outputEl.textContent = "Generating resume with AI...";

  try {
    const res = await fetch(`${BACKEND}/api/resume/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        title,
        experience,
        skills,
        achievements,
        education,
        extras,
        templateId,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Resume error:", data);
      alert(data.detail || "Failed to generate resume.");
      if (outputEl) outputEl.textContent = "";
      return;
    }

    if (outputEl) {
      outputEl.textContent = data.resume || "No resume text returned.";
    }
  } catch (err) {
    console.error("Resume network error:", err);
    alert("Network error while generating resume.");
    if (outputEl) outputEl.textContent = "";
  }
}

// =============================
// DOWNLOAD RESUME AS PDF
// =============================
function downloadPDF() {
  const outEl = document.getElementById("resumeOutput");
  if (!outEl || !outEl.textContent.trim()) {
    alert("Generate a resume first.");
    return;
  }

  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library not loaded.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const text = outEl.textContent;
  const lines = doc.splitTextToSize(text, 520);
  doc.text(lines, 40, 50);
  doc.save("CareerloopAI_Resume.pdf");
}

// =============================
// ATS SCREENING (single)
// =============================
async function runATS() {
  // requireAuth();

  const resume = document.getElementById("atsResume")?.value.trim() || "";
  const jd = document.getElementById("atsJD")?.value.trim() || "";
  const resultEl = document.getElementById("atsResult");

  if (!resume || !jd) {
    alert("Paste both resume and job description.");
    return;
  }

  if (resultEl) resultEl.textContent = "Running ATS check...";

  try {
    const res = await fetch(`${BACKEND}/api/screening/ats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jd }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("ATS error:", data);
      alert(data.detail || "Failed to run ATS check.");
      if (resultEl) resultEl.textContent = "";
      return;
    }

    if (resultEl) resultEl.textContent = data.result || "";
  } catch (err) {
    console.error("ATS network error:", err);
    alert("Network error while running ATS.");
    if (resultEl) resultEl.textContent = "";
  }
}

// =============================
// BULK SCREENING (HR side)
// =============================
async function runBulk() {
  // requireAuth();

  const resumes = document.getElementById("bulkResumes")?.value.trim() || "";
  const jd = document.getElementById("bulkJD")?.value.trim() || "";
  const resultEl = document.getElementById("bulkResult");

  if (!resumes || !jd) {
    alert("Paste resumes and JD.");
    return;
  }

  if (resultEl) resultEl.textContent = "Screening candidates...";

  try {
    const res = await fetch(`${BACKEND}/api/screening/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumes, jd }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Bulk ATS error:", data);
      alert(data.detail || "Failed bulk screening.");
      if (resultEl) resultEl.textContent = "";
      return;
    }

    if (resultEl)
      resultEl.textContent =
        JSON.stringify(data.candidates || [], null, 2) ||
        "No candidates returned.";
  } catch (err) {
    console.error("Bulk ATS network error:", err);
    alert("Network error while running bulk screening.");
    if (resultEl) resultEl.textContent = "";
  }
}
