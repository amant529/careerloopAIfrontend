// ======================================
// CONFIG
// ======================================
const BACKEND = "https://careerloopaibackend.onrender.com";

// ======================================
// AUTH HELPERS
// ======================================

function getUser() {
  return {
    email: localStorage.getItem("cl_email"),
    role: localStorage.getItem("cl_role")
  };
}

function requireAuth() {
  const { email } = getUser();
  if (!email) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("cl_email");
  localStorage.removeItem("cl_role");
  window.location.href = "login.html";
}

// ======================================
// LOGIN / ROLE SELECTION
// ======================================

function loginUser() {
  const emailInput = document.getElementById("loginEmail");
  const roleRadio = document.querySelector("input[name='role']:checked");

  const email = emailInput ? emailInput.value.trim() : "";
  const role = roleRadio ? roleRadio.value : "";

  if (!role) {
    alert("Please select Job Seeker or Business / HR.");
    return;
  }
  if (!email) {
    alert("Please enter your email.");
    return;
  }

  localStorage.setItem("cl_email", email);
  localStorage.setItem("cl_role", role);

  if (role === "jobseeker") {
    window.location.href = "jobseeker.html";
  } else {
    window.location.href = "bulk.html"; // HR goes to bulk screening page
  }
}

// ======================================
// AI RESUME BUILDER
// ======================================

async function generateResume() {
  requireAuth();

  const consent = document.getElementById("consentBox");
  if (!consent || !consent.checked) {
    alert("Please agree that Careerloop AI may save your resume.");
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
    document.getElementById("templateSelect")?.value || "classic-pro";

  if (!name || !title) {
    alert("Please fill at least Name and Job Title.");
    return;
  }

  const outputEl = document.getElementById("resumeOutput");
  if (outputEl) {
    outputEl.textContent = "⏳ Generating resume with AI...";
  }

  try {
    const response = await fetch(`${BACKEND}/api/resume/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        title,
        experience,
        skills,
        education,
        achievements,
        extras,
        templateId
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Resume error:", data);
      alert(data.detail || "OpenAI processing error");
      if (outputEl) outputEl.textContent = "";
      return;
    }

    if (outputEl) {
      outputEl.textContent = data.resume || "No resume text returned.";
    }
  } catch (err) {
    console.error("Network / AI error:", err);
    alert("Network error while generating resume.");
    if (outputEl) outputEl.textContent = "";
  }
}

// ======================================
// DOWNLOAD AS PDF
// ======================================

function downloadPDF() {
  const out = document.getElementById("resumeOutput");
  if (!out || !out.textContent.trim()) {
    alert("Generate a resume first.");
    return;
  }
  if (!window.jspdf || !window.jspdf.jsPDF) {
    alert("PDF library not loaded.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const text = out.textContent;
  const lines = doc.splitTextToSize(text, 520);
  doc.text(lines, 40, 60);
  doc.save("CareerloopAI_Resume.pdf");
}

// ======================================
// ATS SCREENING (SINGLE)
// ======================================

async function runATS() {
  requireAuth();

  const resume = document.getElementById("atsResume")?.value.trim() || "";
  const jd = document.getElementById("atsJD")?.value.trim() || "";
  const resultEl = document.getElementById("atsResult");

  if (!resume || !jd) {
    alert("Paste both resume and job description.");
    return;
  }

  if (resultEl) resultEl.textContent = "⏳ Running ATS check...";

  try {
    const response = await fetch(`${BACKEND}/api/screening/ats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume, jd })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
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

// ======================================
// BULK SCREENING (HR)
// ======================================

async function runBulk() {
  requireAuth();

  const resumes = document.getElementById("bulkResumes")?.value.trim() || "";
  const jd = document.getElementById("bulkJD")?.value.trim() || "";
  const resultEl = document.getElementById("bulkResult");

  if (!resumes || !jd) {
    alert("Paste resumes and JD.");
    return;
  }

  if (resultEl) resultEl.textContent = "⏳ Screening candidates...";

  try {
    const response = await fetch(`${BACKEND}/api/screening/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resumes, jd })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Bulk ATS error:", data);
      alert(data.detail || "Failed bulk screening.");
      if (resultEl) resultEl.textContent = "";
      return;
    }

    if (resultEl) {
      resultEl.textContent =
        JSON.stringify(data.candidates || [], null, 2) ||
        "No candidates returned.";
    }
  } catch (err) {
    console.error("Bulk ATS network error:", err);
    alert("Network error while running bulk screening.");
    if (resultEl) resultEl.textContent = "";
  }
}
