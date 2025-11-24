const BACKEND_URL = "https://careerloopaibackend.onrender.com";

// ------------ OPTIONAL AUTH DISABLED FOR MVP ------------
function requireAuth() {
    // No auth check now
    console.log("Auth disabled for MVP");
}

// ------------ GENERATE RESUME ------------
async function generateResume() {

    const consent = document.getElementById("consent");
    if (!consent || !consent.checked) {
        alert("Please agree to allow Careerloop AI to save your resume.");
        return;
    }

    const name = document.getElementById("name").value.trim();
    const title = document.getElementById("jobTitle").value.trim();
    const experience = document.getElementById("experience").value.trim();
    const skills = document.getElementById("skills").value.trim();
    const education = document.getElementById("education").value.trim();
    const achievements = document.getElementById("achievements").value.trim();
    const extras = document.getElementById("extras").value.trim();
    const templateId = document.getElementById("template").value;

    if (!name || !title) {
        alert("Name and Job Title are required.");
        return;
    }

    document.getElementById("generated").innerText = "Generating resume...";

    try {
        const response = await fetch(`${BACKEND_URL}/api/resume/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name, title, experience, skills, education, achievements, extras, templateId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("RESUME ERROR", data);
            alert("Failed to generate resume.");
            return;
        }

        document.getElementById("generated").innerText = data.resume;

    } catch (error) {
        console.log("Network Error:", error);
        alert("Network error while generating resume.");
    }
}

// ------------ DOWNLOAD PDF ------------
function downloadPDF() {
    const text = document.getElementById("generated").innerText;
    if (!text) {
        alert("Generate resume first!");
        return;
    }

    const blob = new Blob([text], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resume.pdf";
    link.click();
}
