const BACKEND = "https://careerloopaibackend.onrender.com";

function requireAuth(){
  if(!localStorage.getItem("careerloop_token")){
    window.location.href="/login.html";
  }
}

function downloadPDF(){
  const text = document.getElementById("resumeOutput").textContent;
  if(!text.trim()) return alert("Generate resume first!");

  const pdf = new jspdf.jsPDF();
  const lines = pdf.splitTextToSize(text, 180);
  pdf.text(lines, 10, 10);
  pdf.save("CareerloopAI_Resume.pdf");
}

async function generateResume(){
  if(!document.getElementById("consentBox").checked){
    alert("Please accept consent to continue.");
    return;
  }

  const payload = {
    name: rName.value,
    title: rTitle.value,
    experience: rExp.value,
    skills: rSkills.value,
    education: rEdu.value,
    achievements: rAch.value,
    extras: rExtras.value
  };

  const res = await fetch(`${BACKEND}/api/resume/generate`, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(payload)
  });

  const data = await res.json();

  if(!res.ok){
    alert("Failed to generate resume.");
    return;
  }

  document.getElementById("resumeOutput").textContent = data.resume;
}
