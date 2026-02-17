(function(){
  function getData(key){try{return JSON.parse(localStorage.getItem(key));}catch(e){return null}}
  function saveData(key,val){try{localStorage.setItem(key,JSON.stringify(val));return true;}catch(e){console.error('Save error:',e);return false;}}
  function notify(msg){alert(msg)}

  function ensureAuth(){
    const cur = getData('currentUser');
    if(!cur){ window.location.href='login.html'; return null }
    if(cur.role !== 'teacher' && cur.role !== 'headmaster'){
      // redirect non-teachers to main dashboard
      window.location.href = 'teacher.html';
      return null;
    }
    return cur;
  }

  function addActivity(icon,text){
    let acts = getData('activities')||[]; if(!Array.isArray(acts)) acts=[];
    const time = new Date().toLocaleString();
    acts.unshift({id:String(Date.now()),icon, text, time});
    if(acts.length>12) acts = acts.slice(0,12);
    saveData('activities', acts);
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const user = ensureAuth(); if(!user) return;
    document.getElementById('teacherName').textContent = user.name || user.username || 'Teacher';
    // Show class (or classes) assigned to this teacher and student counts by matching class.teacher
    try {
      const classInfoEl = document.getElementById('teacherClassInfo');
      if (classInfoEl) {
        const classes = getData('classes') || [];
        const myClasses = (Array.isArray(classes) ? classes : []).filter(c => c.teacher === user.name || c.teacher === user.username);
        if (myClasses.length === 0) {
          classInfoEl.textContent = '';
        } else {
          // show first class and count; if multiple, show comma-separated names
          const classNames = myClasses.map(c => c.name).join(', ');
          const students = getData('students') || [];
          const firstCount = (Array.isArray(students) ? students.filter(s => s.class === myClasses[0].name).length : 0);
          classInfoEl.textContent = `${classNames} — ${firstCount} students`;
        }
      }
    } catch (e) { /* ignore if element missing */ }

    // Back and logout
    document.getElementById('btnTeacherBack').addEventListener('click', ()=>{ window.location.href='teacher.html' });
    document.getElementById('btnTeacherLogout').addEventListener('click', ()=>{ localStorage.removeItem('currentUser'); window.location.href='login.html' });

    // Tabs
    document.querySelectorAll('.tab').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
        document.querySelectorAll('.tab-section').forEach(s=>s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
      })
    });

    // Timetable
    function loadTimetables(){
      const tts = getData('timetables')||[]; return Array.isArray(tts)?tts:[];
    }
    function renderTimetable(){
      const tbody = document.getElementById('ttBody'); tbody.innerHTML='';
      const tts = loadTimetables();
      const mine = tts.filter(x=> (x.teacher && (x.teacher===user.name || x.teacher===user.username)) || x.createdBy===user.username );
      
      // Show count - unique classes and total slots
      const countEl = document.getElementById('ttClassCount');
      if(countEl) {
        if(mine.length === 0) {
          countEl.textContent = 'No timetable entries assigned yet.';
        } else {
          const uniqueClasses = [...new Set(mine.map(x => x.class || x.className))].length;
          countEl.textContent = `${uniqueClasses} unique class(es) — ${mine.length} total slot(s)`;
        }
      }
      
      if(mine.length===0){ tbody.innerHTML='<tr><td colspan="5">No timetable entries yet.</td></tr>'; return }
      mine.forEach(r=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${r.className||r.class||''}</td><td>${r.day}</td><td>${r.start}</td><td>${r.end}</td><td>${r.subject}</td>`;
        tbody.appendChild(tr);
      });
    }

    document.getElementById('ttForm').addEventListener('submit', e=>{
      e.preventDefault();
      const className = document.getElementById('ttClass').value.trim();
      const day = document.getElementById('ttDay').value.trim();
      const start = document.getElementById('ttStart').value;
      const end = document.getElementById('ttEnd').value;
      const subject = document.getElementById('ttSubject').value.trim();
      if(!className||!day||!start||!end||!subject) return notify('Fill all fields');
      const tts = loadTimetables();
      const entry = { id: 'T'+String(tts.length+1).padStart(3,'0'), className, day, start, end, subject, teacher: user.name || user.username, createdBy: user.username };
      tts.push(entry); saveData('timetables', tts); addActivity('🗓️', `Added timetable ${subject} for ${className}`); renderTimetable();
      document.getElementById('ttForm').reset();
    });

    renderTimetable();

    // Grades
    function loadGrades(){ const g = getData('grades')||[]; return Array.isArray(g)?g:[] }
    function renderGrades(){ const tbody = document.getElementById('gradesBody'); tbody.innerHTML=''; const gs = loadGrades().filter(x=> x.createdBy===user.username || x.teacher===user.name ); if(gs.length===0){tbody.innerHTML='<tr><td colspan="7">No grades yet.</td></tr>';return} gs.forEach((g,i)=>{ const tr=document.createElement('tr'); tr.innerHTML=`<td>${g.id||i+1}</td><td>${g.studentId}</td><td>${g.class}</td><td>${g.subject}</td><td>${g.exam}</td><td>${g.grade}</td><td>${g.teacher||g.createdBy}</td>`; tbody.appendChild(tr); }) }
    document.getElementById('gradeForm').addEventListener('submit', e=>{ e.preventDefault(); const studentId=document.getElementById('gradeStudentId').value.trim(); const cls=document.getElementById('gradeClass').value.trim(); const subject=document.getElementById('gradeSubject').value.trim(); const exam=document.getElementById('gradeExam').value.trim(); const grade=document.getElementById('gradeValue').value.trim(); if(!studentId||!cls||!subject||!exam||!grade) return notify('Fill all fields'); let gs = loadGrades(); const id = 'G'+String(gs.length+1).padStart(3,'0'); const g = { id, studentId, class:cls, subject, exam, grade, teacher: user.name, createdBy: user.username, time: new Date().toLocaleString()}; gs.push(g); saveData('grades', gs); addActivity('📝', `Saved grade for ${studentId} (${subject})`); renderGrades(); document.getElementById('gradeForm').reset(); });
    renderGrades();

    // Attendance
    function loadAttendance(){ const a = getData('attendance')||[]; return Array.isArray(a)?a:[] }
    function renderAttendance(dayFilter = 'all'){ 
      const tbody = document.getElementById('attBody'); 
      tbody.innerHTML='';
      let atts = loadAttendance().filter(x=> x.teacher===user.name || x.createdBy===user.username);
      
      // Apply day filter
      if(dayFilter !== 'all') {
        atts = atts.filter(a => getDayName(a.date) === dayFilter);
      }
      
      if(atts.length===0){
        tbody.innerHTML=`<tr><td colspan="5">No attendance records for ${dayFilter === 'all' ? 'any day' : dayFilter}.</td></tr>`;
        return;
      } 
      atts.forEach(a=>{ 
        const tr=document.createElement('tr'); 
        const statusColor = a.status === 'present' ? '#c8f7dc' : '#ffe4cc'; 
        const statusText = a.status === 'present' ? '#118854' : '#cc6600';
        const dayName = getDayName(a.date);
        tr.innerHTML=`<td>${dayName}, ${a.date}</td><td>${a.studentName||a.studentId}</td><td>${a.class}</td><td><span class="att-status-badge" style="background-color:${statusColor}; color:${statusText};">${a.status.toUpperCase()}</span></td><td>${a.teacher}</td>`; 
        tbody.appendChild(tr); 
      }) 
    }
    
    // Populate attendance class select
    function populateAttendanceClassSelect(){
      const sel = document.getElementById('attClassSelect');
      if(!sel) return;
      const classes = getData('classes')||[];
      const myClasses = (Array.isArray(classes)?classes:[]).filter(c => c.teacher === user.name || c.teacher === user.username);
      sel.innerHTML = '<option value="">Select Class</option>';
      myClasses.forEach(c => {
        const opt = document.createElement('option'); opt.value = c.name; opt.textContent = c.name; sel.appendChild(opt);
      });
    }
    populateAttendanceClassSelect();
    
    // Helper: get day name from date string (YYYY-MM-DD)
    function getDayName(dateStr) {
      const d = new Date(dateStr + 'T00:00:00');
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[d.getDay()];
    }
    
    let currentDayFilter = 'all'; // Track current filter
    
    // Load and mark attendance
    let attToggleState = {}; // track checkbox state temporarily
    document.getElementById('attLoadBtn').addEventListener('click', e=>{
      e.preventDefault();
      const date = document.getElementById('attDate').value;
      const cls = document.getElementById('attClassSelect').value;
      if(!date || !cls) { alert('Please select date and class'); return; }
      const students = getData('students')||[];
      const clsStudents = (Array.isArray(students)?students:[]).filter(s => s.class === cls);
      if(clsStudents.length === 0) { alert('No students in this class'); return; }
      
      // Reset toggle state
      attToggleState = {};
      
      // Build marking UI
      const listEl = document.getElementById('attStudentMarkingList');
      listEl.innerHTML = '';
      clsStudents.forEach(s => {
        const div = document.createElement('div');
        div.className = 'att-item';
        const chk = document.createElement('input'); 
        chk.type = 'checkbox'; 
        chk.id = 'att_' + s.id; 
        chk.checked = true;
        attToggleState[s.id] = true; // default present
        const label = document.createElement('label'); 
        label.htmlFor = 'att_' + s.id; 
        label.textContent = s.name + ' (' + s.id + ')';
        const statusBadge = document.createElement('span');
        statusBadge.className = 'att-status-badge att-status-present';
        statusBadge.textContent = 'Present';
        statusBadge.id = 'status_' + s.id;
        chk.addEventListener('change', () => {
          attToggleState[s.id] = chk.checked;
          const badge = document.getElementById('status_' + s.id);
          if (chk.checked) {
            badge.textContent = 'Present';
            badge.className = 'att-status-badge att-status-present';
          } else {
            badge.textContent = 'Absent';
            badge.className = 'att-status-badge att-status-absent';
          }
        });
        div.appendChild(chk);
        div.appendChild(label);
        div.appendChild(statusBadge);
        listEl.appendChild(div);
      });
      
      const dayName = getDayName(date);
      document.getElementById('attMarkingInfo').textContent = `${cls} — ${dayName}, ${date} (${clsStudents.length} students)`;
      document.getElementById('attMarkingCard').style.display = 'block';
    });
    
    document.getElementById('attSaveBtn').addEventListener('click', ()=>{
      const date = document.getElementById('attDate').value;
      const cls = document.getElementById('attClassSelect').value;
      if(!date || !cls) { alert('Select date and class'); return; }
      
      const students = getData('students')||[];
      const clsStudents = (Array.isArray(students)?students:[]).filter(s => s.class === cls);
      let atts = loadAttendance();
      if(!Array.isArray(atts)) atts = [];
      
      clsStudents.forEach(s => {
        const status = attToggleState[s.id] ? 'present' : 'absent';
        // Check if already marked for this date
        const existingIdx = atts.findIndex(a => a.studentId === s.id && a.date === date && a.class === cls);
        const rec = { id: 'A'+String(atts.length+1).padStart(3,'0'), studentId: s.id, studentName: s.name, class: cls, date, status, teacher: user.name, createdBy: user.username, time: new Date().toLocaleString() };
        if(existingIdx !== -1) {
          atts[existingIdx] = rec;
        } else {
          atts.push(rec);
        }
      });
      
      try {
        if(saveData('attendance', atts)){ 
          // Count present students
          const presentCount = Object.values(attToggleState).filter(v => v).length;
          const totalCount = clsStudents.length;
          
          // Create a notification for the headmaster dashboard
          let notifications = getData('attendanceNotifications') || [];
          if(!Array.isArray(notifications)) notifications = [];
          
          const notification = {
            id: 'N' + String(notifications.length + 1).padStart(5, '0'),
            type: 'attendance',
            teacher: user.name || user.username,
            class: cls,
            presentCount: presentCount,
            totalCount: totalCount,
            date: date,
            timestamp: new Date().toLocaleString(),
            message: `${user.name || user.username} marked attendance for ${cls}: ${presentCount}/${totalCount} students present`,
            read: false
          };
          
          notifications.unshift(notification); // Add to front
          if(notifications.length > 50) notifications = notifications.slice(0, 50); // Keep last 50
          
          saveData('attendanceNotifications', notifications);
          
          alert('Attendance saved successfully'); 
          addActivity('📋', `Marked attendance for ${cls} on ${date}`); 
          renderAttendance(currentDayFilter); 
          document.getElementById('attMarkingCard').style.display = 'none';
          document.getElementById('attForm').reset();
          attToggleState = {};
        } else {
          alert('Error: Could not save attendance data');
        }
      } catch(err) {
        console.error('Attendance save error:', err);
        alert('Error saving attendance: ' + err.message);
      }
    });
    
    document.getElementById('attCancelBtn').addEventListener('click', ()=>{
      document.getElementById('attMarkingCard').style.display = 'none';
      attToggleState = {};
    });
    
    // Wire day filter buttons
    document.querySelectorAll('.day-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Update button styles
        document.querySelectorAll('.day-btn').forEach(b => {
          b.style.background = 'white';
          b.style.color = 'black';
          b.style.borderColor = '#ddd';
        });
        btn.style.background = '#667eea';
        btn.style.color = 'white';
        btn.style.borderColor = '#667eea';
        
        // Filter and re-render
        currentDayFilter = btn.dataset.day;
        renderAttendance(currentDayFilter);
      });
    });
    
    // Set "All Days" as initially selected
    const allDaysBtn = document.querySelector('.day-btn[data-day="all"]');
    if(allDaysBtn) {
      allDaysBtn.style.background = '#667eea';
      allDaysBtn.style.color = 'white';
      allDaysBtn.style.borderColor = '#667eea';
    }
    
    renderAttendance();

    // Render list of students for this teacher
    function renderTeacherStudents(){
      try{
        const listEl = document.getElementById('teacherStudentsList');
        if(!listEl) return;
        listEl.innerHTML = '';
        const classes = getData('classes')||[];
        const myClasses = (Array.isArray(classes)?classes:[]).filter(c => c.teacher === user.name || c.teacher === user.username);
        if(myClasses.length === 0){
          listEl.innerHTML = '<li style="color:#666;">No classes assigned.</li>';
          return;
        }
        const students = getData('students')||[];
        myClasses.forEach(cls => {
          const header = document.createElement('li');
          header.style.fontWeight = '700';
          header.style.marginTop = '0.5rem';
          header.textContent = cls.name;
          listEl.appendChild(header);
          const clsStudents = (Array.isArray(students)?students:[]).filter(s => s.class === cls.name);
          if(clsStudents.length === 0){
            const li = document.createElement('li'); li.style.color='#666'; li.textContent = 'No students in this class.'; listEl.appendChild(li);
          } else {
            clsStudents.forEach(s => {
              const li = document.createElement('li');
              li.style.padding = '4px 0';
              li.textContent = `${s.name} (${s.id})`;
              listEl.appendChild(li);
            });
          }
        });
      }catch(e){console.warn('Could not render teacher students',e)}
    }
    renderTeacherStudents();

  });
})();