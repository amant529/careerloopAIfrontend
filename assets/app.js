const app = (function(){
  // ✅ IMPORTANT: your backend URL
  const BACKEND_BASE = "https://careerloopaibackend.onrender.com";

  const $ = (id)=>document.getElementById(id);
  const text = (id, v)=>{ const el = $(id); if(el) el.textContent = v; };

  const state = { bulkFiles: [], lastBulkResults: [] };

  /* ROUTING */
  function route(){
    const hash = location.hash || "#home";
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('page-active'));
    const el = document.querySelector(hash);
    if(el) el.classList.add('page-active');
    document.querySelectorAll('[data-route]').forEach(a=>{
      if(a.getAttribute('href') === hash) a.classList.add('active');
      else a.classList.remove('active');
    });
  }

  async function loadStats(){
    try{
      const r = await fetch(`${BACKEND_BASE}/api/dashboard`);
      const j = await r.json();
      const c = j.resumes_count || 0;
      text('statResumes', c);
      text('statScreened', Math.round(c*0.6));
      text('statShortlisted', Math.round(c*0.12));
      text('dash_resumes', c);
      text('dash_screened', Math.round(c*0.6));
      text('dash_shortlisted', Math.round(c*0.12));
      text('dash_revenue', j.revenue_monthly ? `₹${j.revenue_monthly}` : '₹0');
    }catch(e){}
  }

  /* HOME DEMO */
  function bindHome(){
    const demoJD = $('demoJD');
    const demoFile = $('demoFile');
    const demoResult = $('demoResult');

    $('demoBtn').addEventListener('click',()=>{
      demoJD.value = "Looking for Senior ML Engineer with Python, PyTorch, Deep Learning, 3+ years experience.";
    });

    $('demoRun').addEventListener('click', async ()=>{
      demoResult.classList.add('hidden');
      const f = demoFile.files[0];
      const jd = (demoJD.value||'').trim();
      if(!jd) return alert("Paste a job description.");
      if(!f) return alert("Choose a sample resume file.");

      // upload
      const fd = new FormData();
      fd.append('file', f);
      const up = await fetch(`${BACKEND_BASE}/api/upload/resume`, { method:'POST', body: fd });
      const upj = await up.json();
      const snippet = upj.text_snippet || '';

      const resp = await fetch(`${BACKEND_BASE}/api/screening/score`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ resume_text: snippet, job_description: jd })
      });
      const j = await resp.json();
      demoResult.innerHTML = `<strong>Score: ${j.score ?? 'N/A'}</strong><div style="margin-top:8px">${j.ai_feedback || ''}</div>`;
      demoResult.classList.remove('hidden');
    });
  }

  /* BUILDER */
  function bindBuilder(){
    const preview = $('resumePreview');
    const tplSel = $('templateSelect');

    function renderPreview(){
      const name = $('b_name').value || "Full Name";
      const email = $('b_email').value || "you@domain.com";
      const summary = $('b_summary').value || "";
      const skills = $('b_skills').value || "";
      const exp = $('b_experience').value || "";
      $('previewTemplate').textContent = tplSel.options[tplSel.selectedIndex].text;

      preview.innerHTML = `
        <div class="r-wrap ${tplSel.value}">
          <h1 style="margin:0;font-size:18px">${name}</h1>
          <div style="color:var(--muted);font-size:12px">${email}</div>
          <h3 style="margin-top:12px;margin-bottom:6px">Professional Summary</h3>
          <div style="white-space:pre-wrap">${summary}</div>
          <h3 style="margin-top:10px">Experience</h3>
          <div style="white-space:pre-wrap">${exp}</div>
          <h3 style="margin-top:10px">Skills</h3>
          <div>${skills}</div>
        </div>
      `;
    }

    // load draft
    const draft = localStorage.getItem('clai-draft');
    if(draft){
      try{
        const d = JSON.parse(draft);
        $('b_name').value = d.name || '';
        $('b_email').value = d.email || '';
        $('b_summary').value = d.summary || '';
        $('b_skills').value = d.skills || '';
        $('b_experience').value = d.experience || '';
      }catch(e){}
    }
    ['b_name','b_email','b_summary','b_skills','b_experience'].forEach(id=>{
      $(id).addEventListener('input', renderPreview);
    });
    tplSel.addEventListener('change', renderPreview);

    $('genResume').addEventListener('click', renderPreview);

    $('saveDraft').addEventListener('click',()=>{
      const d = {
        name:$('b_name').value,
        email:$('b_email').value,
        summary:$('b_summary').value,
        skills:$('b_skills').value,
        experience:$('b_experience').value
      };
      localStorage.setItem('clai-draft', JSON.stringify(d));
      alert('Draft saved locally.');
    });

    $('exportPdf').addEventListener('click',()=>{
      const w = window.open('', '_blank');
      w.document.write(`<html><head><title>Resume</title><style>body{font-family:Arial;padding:20px;color:#111}h1{font-size:20px}</style></head><body>${$('resumePreview').innerHTML}</body></html>`);
      w.document.close();
      w.print();
    });

    $('submitResume').addEventListener('click', async ()=>{
      const name = $('b_name').value;
      const email = $('b_email').value;
      const textContent = $('resumePreview').innerText || $('resumePreview').textContent || '';

      const fd = new FormData();
      const blob = new Blob([textContent], {type:'text/plain'});
      fd.append('file', blob, `${(name||'candidate').replace(/\s+/g,'_')}.txt`);
      fd.append('name', name || '');
      fd.append('email', email || '');

      const res = await fetch(`${BACKEND_BASE}/api/upload/resume`, { method:'POST', body: fd });
      const j = await res.json();
      if(j.id){
        alert('Resume submitted. ID: '+ j.id);
        loadStats();
      } else {
        alert('Error submitting resume.');
      }
    });

    renderPreview();
  }

  /* SINGLE SCREEN */
  function bindSingleScreen(){
    $('singleRun').addEventListener('click', async ()=>{
      const jd = ($('single_jd').value||'').trim();
      let resume_text = ($('single_resume_text').value||'').trim();
      const f = $('single_file').files[0];

      if(!jd) return alert("Enter job description.");

      if(f){
        const fd = new FormData();
        fd.append('file', f);
        const up = await fetch(`${BACKEND_BASE}/api/upload/resume`, { method:'POST', body: fd });
        const upj = await up.json();
        resume_text = upj.text_snippet || resume_text;
      }

      if(!resume_text) return alert("Provide resume text or upload a file.");

      $('singleResult').classList.add('hidden');
      const resp = await fetch(`${BACKEND_BASE}/api/screening/score`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({resume_text, job_description:jd})
      });
      const j = await resp.json();
      $('singleResult').innerHTML = `<strong>Score: ${j.score ?? 'N/A'}</strong><div style="margin-top:8px">${j.ai_feedback || ''}</div>`;
      $('singleResult').classList.remove('hidden');
    });
  }

  /* BULK SCREEN */
  function bindBulk(){
    const drop = $('dropZone');
    const fileInput = $('bulkFiles');
    const bulkJD = $('bulk_jd');
    const bulkProgress = $('bulkProgress');
    const bulkBar = $('bulkProgressBar');
    const bulkStatus = $('bulkStatus');
    const resultsWrap = $('bulkResults');
    const resultsBody = $('bulkResultsBody');

    drop.addEventListener('dragover', e=>{e.preventDefault(); drop.classList.add('drag');});
    drop.addEventListener('dragleave', e=>{drop.classList.remove('drag');});
    drop.addEventListener('drop', e=>{
      e.preventDefault();
      drop.classList.remove('drag');
      const files = Array.from(e.dataTransfer.files || []);
      state.bulkFiles = state.bulkFiles.concat(files);
      fileInput.files = toFileList(state.bulkFiles);
      renderBulkList();
    });

    fileInput.addEventListener('change', e=>{
      state.bulkFiles = Array.from(e.target.files || []);
      renderBulkList();
    });

    $('bulkClear').addEventListener('click', ()=>{
      state.bulkFiles = [];
      fileInput.value = "";
      renderBulkList();
    });

    function renderBulkList(){
      resultsBody.innerHTML = "";
      state.bulkFiles.forEach((f,i)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${i+1}</td><td>${f.name}</td><td>-</td><td>-</td>
          <td><button class="btn ghost" onclick="app.removeBulk(${i})">Remove</button></td>`;
        resultsBody.appendChild(tr);
      });
      if(state.bulkFiles.length) resultsWrap.classList.remove('hidden'); else resultsWrap.classList.add('hidden');
    }

    $('bulkUploadAndRun').addEventListener('click', async ()=>{
      if(!state.bulkFiles.length) return alert("Add files first.");
      const jd = (bulkJD.value||'').trim();
      if(!jd) return alert("Paste a job description.");

      bulkProgress.classList.remove('hidden');
      bulkBar.style.width = '0%';
      bulkStatus.textContent = `0 / ${state.bulkFiles.length}`;

      // upload sequentially
      const uploaded = [];
      for(let i=0;i<state.bulkFiles.length;i++){
        const f = state.bulkFiles[i];
        const fd = new FormData();
        fd.append('file', f);
        fd.append('job_id', 0);
        const up = await fetch(`${BACKEND_BASE}/api/upload/resume`, { method:'POST', body: fd });
        const upj = await up.json();
        uploaded.push({ id: upj.id, filename: upj.filename, text_snippet: upj.text_snippet });
        bulkBar.style.width = `${Math.round((i+1)/state.bulkFiles.length*40)}%`;
        bulkStatus.textContent = `${i+1} / ${state.bulkFiles.length}`;
      }

      const items = uploaded.map(u=>({ resume_text:u.text_snippet, resume_id:u.id }));
      const resp = await fetch(`${BACKEND_BASE}/api/screening/bulk`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ job_description: jd, items })
      });
      const j = await resp.json();

      state.lastBulkResults = j.results || [];
      resultsBody.innerHTML = "";
      state.lastBulkResults.forEach((r,idx)=>{
        const tr = document.createElement('tr');
        const fileName = (uploaded[idx] && uploaded[idx].filename) || (`Resume ${idx+1}`);
        const matched = (r.matched || []).slice(0,6).join(', ');
        tr.innerHTML = `<td>${idx+1}</td>
          <td>${fileName}</td>
          <td>${r.score ?? 'N/A'}</td>
          <td>${matched}</td>
          <td><button class="btn ghost" onclick="app.markShortlist(${r.resume_id})">Shortlist</button></td>`;
        resultsBody.appendChild(tr);
      });

      bulkBar.style.width = '100%';
      bulkStatus.textContent = `${state.lastBulkResults.length} / ${state.bulkFiles.length}`;
    });

    $('exportCSV').addEventListener('click', ()=>{
      if(!state.lastBulkResults.length) return alert('No results to export.');
      const rows = [['resume_id','filename','score','matched']];
      state.lastBulkResults.forEach((r,idx)=>{
        const fn = (state.bulkFiles[idx] && state.bulkFiles[idx].name) || '';
        rows.push([
          r.resume_id || '',
          fn,
          r.score || '',
          (r.matched||[]).slice(0,8).join(';')
        ]);
      });
      const csv = rows.map(r=>r.map(c=>`"${String(c||'').replace(/"/g,'""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], {type:'text/csv'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk_results.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });

    window.app.removeBulk = (i)=>{
      state.bulkFiles.splice(i,1);
      $('bulkFiles').files = toFileList(state.bulkFiles);
      renderBulkList();
    };
  }

  async function markShortlist(id){
    if(!id) return alert('No resume id');
    try{
      const res = await fetch(`${BACKEND_BASE}/api/resume/${id}/shortlist`, { method:'POST' });
      const j = await res.json();
      if(j.ok) alert('Marked shortlisted.');
      else alert('Shortlist done.');
      loadStats();
    }catch(e){
      alert('Shortlist request failed.');
    }
  }

  function toFileList(files){
    const dt = new DataTransfer();
    files.forEach(f=>dt.items.add(f));
    return dt.files;
  }

  function init(){
    window.addEventListener('hashchange', route);
    route();
    bindHome();
    bindBuilder();
    bindSingleScreen();
    bindBulk();
    loadStats();
    const yEl = $('year');
    if(yEl) yEl.textContent = new Date().getFullYear();
    document.querySelectorAll('[data-route]').forEach(a=>{
      a.addEventListener('click', e=>{
        e.preventDefault();
        location.hash = a.getAttribute('href');
      });
    });
  }

  return {
    init,
    go:(h)=>location.hash=h,
    markShortlist
  };
})();

window.addEventListener('DOMContentLoaded', ()=>app.init());
