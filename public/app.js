// =============================
// CONFIG
// =============================
const BACKEND = "https://careerloopaibackend.onrender.com";

// =============================
// SIMPLE LOGIN (Email Only)
// =============================
async function loginUser() {
    const email = document.getElementById("loginEmail").value.trim();
    if (!email) return alert("Please enter email");

    localStorage.setItem("careerloop_email", email);
    window.location.href = "/dashboard.html";
}

// =============================
// GENERATE RESUME (AI)
// =============================
async function generateResume() {
    const name = document.getElementById("rName").value.trim();
    const title = document.getElementById("rTitle").value.trim();
    const experience = document.getElementById("rExp").value.trim();
    const skills = document.getElementById("rSkills").value.trim();
    const achievements = document.getElementById("rAch").value.trim();
    const education = document.getElementById("rEdu").value.trim();
    const extras = document.getElementById("rExtras").value.trim();
    const consent = document.getElementById("consent").checked;

    if (!name || !title) {
        alert("Name & Job Title are required.");
        return;
    }

    if (!consent) {
        alert("You must give consent to generate resume.");
        return;
    }

    document.getElementById("resumeOutput").innerText = "Generating resume...";
    
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
                templateId: "classic-pro"
            })
        });

        if (!res.ok) {
            const err = await res.json();
            console.log("Resume Error:", err);
            alert("Failed to generate resume.");
            return;
        }

        const data = await res.json();
        document.getElementById("resumeOutput").innerText = data.resume;

    } catch (error) {
        console.error(error);
        alert("Network error while generating resume.");
    }
}

// =============================
// DOWNLOAD RESUME AS PDF
// =============================
function downloadPDF() {
    const text = document.getElementById("resumeOutput").innerText;
    if (!text) return alert("Generate a resume first!");

    const blob = new Blob([text], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "Careerloop_Resume.pdf";
    a.click();

    URL.revokeObjectURL(url);
}

// =============================
// ATS SCREENING
// =============================
async function runAtsCheck() {
    const resumeText = document.getElementById("atsResume").value.trim();
    const jobDesc = document.getElementById("atsJob").value.trim();

    if (!resumeText || !jobDesc) {
        alert("Please enter resume text & job description");
        return;
    }

    document.getElementById("atsOutput").innerText = "Running ATS check...";

    try {
        const res = await fetch(`${BACKEND}/api/screening/run`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ resume: resumeText, jd: jobDesc })
        });

        if (!res.ok) {
            alert("Failed to run ATS check.");
            return;
        }

        const data = await res.json();
        document.getElementById("atsOutput").innerText = data.result;

    } catch (err) {
        console.error(err);
        alert("Network error while running ATS check.");
    }
}

// =============================
// LOGOUT
// =============================
function logoutUser() {
    localStorage.removeItem("careerloop_email");
    window.location.href = "/index.html";
}
