const BASE_URL = "https://careerloopaibackend.onrender.com";

// ------------ CONTINUE LOGIN (NO OTP) ---------------
function continueLogin() {
    const email = document.getElementById("emailInput").value.trim();
    const role = localStorage.getItem("role");

    if (!email) return alert("Please enter email");

    localStorage.setItem("userEmail", email);

    if (role === "jobseeker") {
        window.location.href = "/dashboard/jobseeker.html";
    } else {
        window.location.href = "/dashboard/hr.html";
    }
}


// ------------ RESUME GENERATION -------------------
async function generateResume() {

    const consent = document.getElementById("consentBox");
    if (!consent || !consent.checked) {
        alert("Please agree to allow Careerloop AI to save your resume.");
        return;
    }

    const data = {
        name: document.getElementById("rName").value,
        title: document.getElementById("rTitle").value,
        experience: document.getElementById("rExp").value,
        skills: document.getElementById("rSkills").value,
        education: document.getElementById("rEdu").value,
        achievements: document.getElementById("rAch").value,
        extras: document.getElementById("rExtras").value,
        templateId: "classic-pro"
    };

    try {
        const res = await fetch(`${BASE_URL}/api/resume/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });

        const out = await res.json();

        if (!res.ok) return alert(out.detail || "Failed to generate resume");

        document.getElementById("resumeOutput").innerText = out.resume;

    } catch (err) {
        console.error(err);
        alert("Network error while generating resume.");
    }
}


// ------------ PDF DOWNLOAD -------------------
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const text = document.getElementById("resumeOutput").innerText;
    doc.text(text, 10, 10);

    doc.save("resume.pdf");
}
