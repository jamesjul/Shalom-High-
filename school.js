// ===========================
// DOM ELEMENTS
// ===========================

const navLinks = document.querySelectorAll('.nav-link');
const menuItems = document.querySelectorAll('.menu-item');
const contentSections = document.querySelectorAll('.content-section');

// ===========================
// INITIALIZE ON PAGE LOAD
// ===========================

document.addEventListener('DOMContentLoaded', function() {
    console.log('✓ Page loaded - initializing...');
    
    // Initialize currency selector
    const currencySelect = document.getElementById('currencySelect');
    if (currencySelect) {
        currencySelect.value = getCurrency();
        console.log('✓ Currency selector initialized to:', getCurrency());
    }
    
    initializeNavigation();
    initializeFilters();

    // Display logged-in user's name in navbar and wire logout
    try{
        const currentUser = getData('currentUser');
        const navUserEl = document.getElementById('navUsername') || document.querySelector('.user-profile .username');
        if(navUserEl && currentUser){ navUserEl.textContent = currentUser.name || currentUser.username || 'User'; }

        const logoutBtn = document.getElementById('btnLogout');
        if(logoutBtn){
            logoutBtn.addEventListener('click', function(){
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            });
        }
    }catch(e){console.warn('Error wiring logout or displaying user',e)}
    
    // Wire notification bell button
    const notificationBell = document.getElementById('notificationBell');
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            const section = document.getElementById('dashboard-section');
            if (section) {
                navigateTo('dashboard');
                setTimeout(() => {
                    const notifContainer = document.getElementById('notificationsContainer');
                    if (notifContainer) {
                        notifContainer.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }
        });
    }
    
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
        loadAllData();
    }, 100);
});

// Simple auth guard: require a logged-in user to view dashboard
document.addEventListener('DOMContentLoaded', function() {
    const current = getData('currentUser');
    if (!current) {
        // redirect to external login page
        window.location.href = 'login.html';
    }
});

// ===========================
// NAVIGATION FUNCTIONS
// ===========================

function initializeNavigation() {
    // Nav links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            navigateTo(section);
        });
    });

    // Menu items
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const menu = this.getAttribute('data-menu');
            navigateTo(menu);
        });
    });
}

function navigateTo(section) {
    // Remove active class from all links and items
    navLinks.forEach(link => link.classList.remove('active'));
    menuItems.forEach(item => item.classList.remove('active'));
    contentSections.forEach(section => section.classList.remove('active'));

    // Add active class to current link and item
    document.querySelector(`[data-section="${section}"]`)?.classList.add('active');
    document.querySelector(`[data-menu="${section}"]`)?.classList.add('active');

    // Show active section
    const activeSection = document.getElementById(`${section}-section`);
    if (activeSection) {
        activeSection.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// ===========================
// LOCAL STORAGE FUNCTIONS
// ===========================

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log('✓ Saved ' + key + ' to localStorage');
        return true;
    } catch (e) {
        console.error('✗ Error saving to localStorage:', e);
        return false;
    }
}

function getData(key) {
    try {
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            console.log('✓ Retrieved ' + key + ' from localStorage');
            return parsed;
        }
        return null;
    } catch (e) {
        console.error('✗ Error reading from localStorage:', e);
        return null;
    }
}

// ===========================
// CURRENCY FUNCTIONS
// ===========================

function getCurrency() {
    const currency = localStorage.getItem('schoolCurrency') || 'USD';
    return currency;
}

function getCurrencySymbol(currency = null) {
    const curr = currency || getCurrency();
    return curr === 'ZWL' ? 'Z$' : '$';
}

function changeCurrency(newCurrency) {
    localStorage.setItem('schoolCurrency', newCurrency);
    console.log('✓ Currency changed to:', newCurrency);
}

function formatCurrency(amount, currency = null) {
    const curr = currency || getCurrency();
    const symbol = getCurrencySymbol(curr);
    
    if (amount === '-') return '-';
    
    const numAmount = parseInt(amount) || 0;
    if (curr === 'ZWL') {
        return symbol + numAmount.toLocaleString();
    } else {
        return symbol + numAmount.toLocaleString();
    }
}

// ===========================
// LOAD ALL DATA FROM STORAGE
// ===========================

function loadAllData() {
    console.log('=== LOADING ALL STORED DATA ===');
    loadStudentsFromStorage();
    loadTeachersFromStorage();
    // Load classes first so timetable selector can use them
    loadClassesFromStorage();
    loadFeesFromStorage();
    updateFeeSummary();
    // Timetables
    loadTimetablesFromStorage();
    populateTimetableClassSelect();

    // Load notifications
    loadAttendanceNotifications();

    // Wire timetable class select change (in case not wired in HTML)
    const ttSelect = document.getElementById('timetableClassSelect');
    if (ttSelect) {
        ttSelect.addEventListener('change', function() {
            renderTimetableForClass(this.value);
        });
    }

    // Ensure Add Class button is wired and debug clicks
    const addClassBtn = document.getElementById('addClassBtn');
    if (addClassBtn) {
        addClassBtn.addEventListener('click', function(e) {
            console.log('Add Class button clicked');
            // allow existing onclick to run as well
        });
    }
    console.log('=== DATA LOAD COMPLETE ===');
    // Update the dashboard stats once data is loaded
    updateDashboardStats();
    // Load recent activities (persisted)
    loadActivitiesFromStorage();
}

// ===========================
// DASHBOARD STATS
// ===========================

function updateDashboardStats() {
    const students = getData('students') || [];
    const teachers = getData('teachers') || [];
    const classes = getData('classes') || [];
    const totalStudents = students.length || 0;
    const totalTeachers = teachers.length || 0;
    const totalClasses = classes.length || 0;

    const elStudents = document.getElementById('totalStudentsStat');
    const elTeachers = document.getElementById('totalTeachersStat');
    const elClasses = document.getElementById('totalClassesStat');

    if (elStudents) elStudents.textContent = totalStudents.toLocaleString();
    if (elTeachers) elTeachers.textContent = totalTeachers.toLocaleString();
    if (elClasses) elClasses.textContent = totalClasses.toLocaleString();

    // Animate numeric stats
    animateStats();
}

// ===========================
// ATTENDANCE NOTIFICATIONS
// ===========================

function loadAttendanceNotifications() {
    const notificationsContainer = document.getElementById('notificationsContainer');
    if (!notificationsContainer) return;
    
    const notifications = getData('attendanceNotifications') || [];
    
    if (!Array.isArray(notifications) || notifications.length === 0) {
        notificationsContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No attendance notifications yet</p>';
        updateNotificationBadge(0);
        // Wire clear button
        const clearBtn = document.getElementById('clearNotificationsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                saveData('attendanceNotifications', []);
                loadAttendanceNotifications();
            });
        }
        return;
    }
    
    notificationsContainer.innerHTML = '';
    
    notifications.forEach(notification => {
        const div = document.createElement('div');
        div.className = 'notification-item';
        div.style.cssText = `
            padding: 1rem;
            border-left: 4px solid #667eea;
            background: #f9f9f9;
            margin-bottom: 0.75rem;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `;
        
        const dayName = getDayNameFromDateStr(notification.date);
        const timeStr = new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0; color: #333;">📋 Attendance Marked - <strong>${notification.class}</strong></h4>
                    <p style="margin: 0.25rem 0; color: #666; font-size: 0.95em;">
                        <strong>Teacher:</strong> ${notification.teacher}
                    </p>
                    <p style="margin: 0.25rem 0; color: #666; font-size: 0.95em;">
                        <strong>Present:</strong> <span style="color: #43e97b; font-weight: 600;">${notification.presentCount}/${notification.totalCount}</span> students
                    </p>
                    <p style="margin: 0.5rem 0 0 0; color: #999; font-size: 0.85em;">
                        ${dayName}, ${notification.date} at <strong>${timeStr}</strong>
                    </p>
                </div>
                <button class="btn-small" onclick="removeNotification(this, '${notification.id}')" style="margin-left: 0.5rem; padding: 4px 8px; background: #eee; border: none; border-radius: 4px; cursor: pointer;">✕</button>
            </div>
        `;
        
        notificationsContainer.appendChild(div);
    });
    
    // Update badge count
    updateNotificationBadge(notifications.length);
    
    // Wire clear button
    const clearBtn = document.getElementById('clearNotificationsBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            saveData('attendanceNotifications', []);
            loadAttendanceNotifications();
        });
    }
}

function getDayNameFromDateStr(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[d.getDay()];
}

function updateNotificationBadge(count) {
    const badge = document.getElementById('notificationCount');
    if (!badge) return;
    
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function removeNotification(btn, notificationId) {
    let notifications = getData('attendanceNotifications') || [];
    notifications = notifications.filter(n => n.id !== notificationId);
    saveData('attendanceNotifications', notifications);
    loadAttendanceNotifications();
}

// Listen for storage changes (real-time updates when teacher marks attendance in another tab/window)
window.addEventListener('storage', (e) => {
    if (e.key === 'attendanceNotifications') {
        console.log('Attendance notifications updated from another tab');
        loadAttendanceNotifications();
    }
});


// ===========================
// CLASSES MANAGEMENT
// ===========================

function loadClassesFromStorage() {
    console.log('Loading classes...');
    const classes = getData('classes') || [];
    window._classes = Array.isArray(classes) ? classes : [];
    renderClasses();
    // populate class filters used elsewhere (students, timetable)
    populateClassFilter();
}

function renderClasses() {
    const container = document.getElementById('classesContainer');
    if (!container) return;
    container.innerHTML = '';

    const classes = window._classes || [];
    const filterValue = document.getElementById('formLevelFilter')?.value || '';
    
    // Filter classes by form level if selected
    let displayClasses = classes;
    if (filterValue) {
        displayClasses = classes.filter(cls => cls.formLevel === filterValue);
    }
    
    if (displayClasses.length === 0) {
        container.innerHTML = '<p>No classes yet. Click "Add New Class" to create one.</p>';
        return;
    }

    // Group classes by form level
    const groupedByForm = {};
    displayClasses.forEach(cls => {
        const formLevel = cls.formLevel || 'Unassigned';
        if (!groupedByForm[formLevel]) {
            groupedByForm[formLevel] = [];
        }
        groupedByForm[formLevel].push(cls);
    });
    
    // Sort form levels
    const sortedForms = Object.keys(groupedByForm).sort((a, b) => {
        if (a === 'Unassigned') return 1;
        if (b === 'Unassigned') return -1;
        return parseInt(a) - parseInt(b);
    });
    
    sortedForms.forEach(formLevel => {
        // Add form level header
        const formHeader = document.createElement('div');
        formHeader.style.cssText = `
            margin-top: 1.5rem;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid #667eea;
        `;
        formHeader.innerHTML = `<h3 style="margin: 0; color: #667eea;">Form ${formLevel}</h3>`;
        container.appendChild(formHeader);
        
        // Create grid for classes in this form
        const grid = document.createElement('div');
        grid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 1rem;
            margin-bottom: 1rem;
        `;
        
        groupedByForm[formLevel].forEach(cls => {
            const card = document.createElement('div');
            card.className = 'class-card';
            // compute student count dynamically from students storage
            const allStudents = getData('students') || [];
            const count = allStudents.filter(s => s.class === cls.name).length;
            card.innerHTML = `
                <div class="class-header">
                    <h2>${cls.name}</h2>
                    <span class="class-badge">${count} Students</span>
                </div>
                <div class="class-details">
                    <p><strong>Class Teacher:</strong> ${cls.teacher || '-'}</p>
                    <p><strong>Room:</strong> ${cls.room || '-'}</p>
                </div>
                <div class="class-actions">
                    <button class="btn-small btn-info" onclick="showViewClassDetails('${cls.id}')">View Details</button>
                    <button class="btn-small btn-warning" onclick="showEditClassForm('${cls.id}')">Edit</button>
                    <button class="btn-small btn-danger" onclick="deleteClassRecord(this, '${cls.id}')">Delete</button>
                </div>
            `;
            grid.appendChild(card);
        });
        
        container.appendChild(grid);
    });
}

function filterClassesByFormLevel(formLevel) {
    renderClasses();
}

function showAddClassForm() {
    console.log('showAddClassForm invoked');
    const className = prompt('Enter class name (e.g., Form 1-A):');
    if (!className) return;
    const teacher = prompt('Enter class teacher name:');
    const room = prompt('Enter room number:');

    addClassToStorage({ name: className, teacher: teacher || '', room: room || '' });
}

// --- Modal-based class creation/editing ---
function openClassModal(editId = null) {
    const modal = document.getElementById('classModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    // Clear form
    document.getElementById('classForm').reset && document.getElementById('classForm').reset();
    document.getElementById('modalTitle').textContent = editId ? 'Edit Class' : 'Create Class';
    modal.dataset.editId = editId || '';
    
    // If editing, populate the form with existing data
    if (editId) {
        const classes = window._classes || getData('classes') || [];
        const cls = classes.find(c => c.id === editId);
        if (cls) {
            document.getElementById('classFormLevelInput').value = cls.formLevel || '';
            // Extract class letter from full name (e.g., "Form 1-A" -> "A")
            const classLetter = cls.name.split('-').pop() || '';
            document.getElementById('classNameInput').value = classLetter;
            document.getElementById('classTeacherInput').value = cls.teacher || '';
            document.getElementById('classRoomInput').value = cls.room || '';
        }
    }
}

function closeClassModal() {
    const modal = document.getElementById('classModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
    modal.dataset.editId = '';
}

// subjects removed

// Handle form submit
document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'classForm') {
        e.preventDefault();
        const editId = document.getElementById('classModal').dataset.editId || null;
        const formLevel = document.getElementById('classFormLevelInput').value.trim();
        const name = document.getElementById('classNameInput').value.trim();
        if (!formLevel) return showNotification('Form level is required', 'warning');
        if (!name) return showNotification('Class name is required', 'warning');
        const teacher = document.getElementById('classTeacherInput').value.trim();
        const room = document.getElementById('classRoomInput').value.trim();
        
        // Create full class name combining form level and class name (e.g., "Form 1-A")
        const fullClassName = `Form ${formLevel}-${name}`;

        const clsObj = { name: fullClassName, formLevel, teacher, room };

        if (editId) {
            // update existing
            let classes = getData('classes') || [];
            const idx = classes.findIndex(c => c.id === editId);
            if (idx === -1) return showNotification('Class not found', 'error');
            classes[idx] = { ...classes[idx], ...clsObj };
            if (saveData('classes', classes)) {
                window._classes = classes;
                renderClasses();
                populateTimetableClassSelect();
                populateClassFilter();
                closeClassModal();
                showNotification('Class updated', 'success');
            } else showNotification('Error updating class', 'error');
        } else {
            addClassToStorage(clsObj);
            closeClassModal();
        }
    }
});

// Allow clicking outside modal content to close
document.addEventListener('click', function(e) {
    const modal = document.getElementById('classModal');
    if (!modal) return;
    if (modal.getAttribute('aria-hidden') === 'false' && e.target === modal) closeClassModal();
});

// ---------------------------
// USER / GUEST CREATION MODAL
// ---------------------------

function openUserModal() {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'false');
    const form = document.getElementById('userForm');
    if (form && form.reset) form.reset();
    document.getElementById('userModalTitle').textContent = 'Create Guest User';

    // Populate class select and wire role/class behavior for teacher credential creation
    const classSelect = document.getElementById('guestClassSelect');
    const roleSelect = document.getElementById('guestRole');
    const usernameInput = document.getElementById('guestUsername');
    if (classSelect) {
        // Fill classes
        classSelect.innerHTML = '<option value="">Select Class</option>';
        const classes = getData('classes') || [];
        (Array.isArray(classes) ? classes : []).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.name;
            opt.textContent = c.name;
            classSelect.appendChild(opt);
        });
        // Wire once
        if (roleSelect && !roleSelect.dataset._guestWired) {
            roleSelect.addEventListener('change', function() {
                if (this.value === 'teacher') {
                    document.getElementById('guestClassRow').style.display = 'block';
                    if (usernameInput) {
                        usernameInput.readOnly = true;
                        usernameInput.placeholder = 'Will match selected class';
                    }
                } else {
                    document.getElementById('guestClassRow').style.display = 'none';
                    if (usernameInput) {
                        usernameInput.readOnly = false;
                        usernameInput.placeholder = 'username';
                    }
                }
            });
            classSelect.addEventListener('change', function() {
                    if (roleSelect.value === 'teacher' && usernameInput) {
                        // When a class is selected, auto-fill username with the class teacher's name (if set)
                        const clsName = this.value || '';
                        const classes = getData('classes') || [];
                        const cls = (Array.isArray(classes) ? classes : []).find(c => c.name === clsName);
                        const teacherName = cls ? (cls.teacher || '') : '';
                        usernameInput.value = teacherName || '';
                    }
                });
            roleSelect.dataset._guestWired = '1';
        }
        // Apply initial role state
        if (roleSelect && roleSelect.value === 'teacher') {
            document.getElementById('guestClassRow').style.display = 'block';
            if (usernameInput) usernameInput.readOnly = true;
        } else {
            document.getElementById('guestClassRow').style.display = 'none';
        }
    }
}

function closeUserModal() {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    modal.setAttribute('aria-hidden', 'true');
}

// Handle user form submit
document.addEventListener('submit', function(e) {
    if (e.target && e.target.id === 'userForm') {
        e.preventDefault();
        const name = document.getElementById('guestName').value.trim();
        let username = document.getElementById('guestUsername').value.trim();
        const password = document.getElementById('guestPassword').value;
        const role = document.getElementById('guestRole').value || 'guest';
        const selectedClass = document.getElementById('guestClassSelect')?.value || '';

        if (!name || !username || !password) return showNotification('Please fill all fields', 'warning');

        let users = getData('users') || [];
        if (!Array.isArray(users)) users = [];
        if (users.find(u => u.username === username)) return showNotification('Username already exists', 'error');

        const id = 'U' + String(users.length + 1).padStart(3, '0');
        // If creating a teacher, enforce username to match the class teacher's name
        if (role === 'teacher') {
            if (!selectedClass) return showNotification('Please select a class for the teacher', 'warning');
            const classes = getData('classes') || [];
            const cls = (Array.isArray(classes) ? classes : []).find(c => c.name === selectedClass);
            // prefer the stored class.teacher value; fall back to provided name field
            const classTeacherName = cls ? (cls.teacher || name) : name;
            if (!classTeacherName) return showNotification('Class teacher name is required', 'warning');
            username = classTeacherName;
        }

        const user = { id, username, password, role, name };
        users.push(user);
        if (saveData('users', users)) {
            showNotification('Guest created successfully', 'success');
            addActivity('👤', `Created guest user ${name} (${username})`);
            // If this is a teacher credential, ensure a teacher record exists and is linked
            if (role === 'teacher') {
                let teachers = getData('teachers') || [];
                if (!Array.isArray(teachers)) teachers = [];
                // Link teacher record by teacher name (username)
                let existing = teachers.find(t => t.username === username || t.name === username || t.name === name);
                if (!existing) {
                    const nextId = 'T' + String(teachers.length + 1).padStart(3, '0');
                    const newTeacher = { id: nextId, name: username, department: '', email: '', phone: '', status: 'Active', username: username, class: selectedClass };
                    teachers.push(newTeacher);
                    saveData('teachers', teachers);
                    addActivity('👩‍🏫', `Teacher account created for ${username} — class ${selectedClass}`);
                } else {
                    // ensure username/class are set on existing record
                    existing.username = username;
                    existing.class = selectedClass;
                    existing.name = username;
                    saveData('teachers', teachers);
                }
                // Refresh teachers table and dashboard stats
                loadTeachersFromStorage();
                updateDashboardStats();
            }
            closeUserModal();
        } else {
            showNotification('Error saving guest', 'error');
        }
    }
});

// Allow clicking outside user modal to close
document.addEventListener('click', function(e) {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    if (modal.getAttribute('aria-hidden') === 'false' && e.target === modal) closeUserModal();
});

function addClassToStorage(cls) {
    let classes = getData('classes') || [];
    if (!Array.isArray(classes)) classes = [];
    const nextId = 'C' + String(classes.length + 1).padStart(3, '0');
    const newClass = { id: nextId, ...cls };
    classes.push(newClass);
    if (saveData('classes', classes)) {
        window._classes = classes;
        renderClasses();
        populateTimetableClassSelect();
        populateClassFilter();
        showNotification('Class added successfully!', 'success');
        updateDashboardStats();
    } else {
        showNotification('Error saving class!', 'error');
    }
}

function showViewClassDetails(id) {
    openClassDetailsModal(id);
}

function openClassDetailsModal(classId) {
    const classes = window._classes || getData('classes') || [];
    const cls = classes.find(c => c.id === classId);
    if (!cls) return showNotification('Class not found', 'error');

    const students = getData('students') || [];
    const fees = getData('fees') || [];
    const grades = getData('grades') || [];

    const rows = students.filter(s => s.class === cls.name).map(s => {
        const fee = fees.find(f => f.studentId === s.id);
        const feeStatus = fee && fee.status === 'paid' ? 'Paid' : 'Pending';
        const mid = grades.find(g => g.studentId === s.id && (g.examType||'').toLowerCase() === 'midterm');
        const fin = grades.find(g => g.studentId === s.id && (g.examType||'').toLowerCase() === 'final');
        const midDisplay = mid ? (mid.marks + ' (' + (mid.grade||'') + ')') : '-';
        const finDisplay = fin ? (fin.marks + ' (' + (fin.grade||'') + ')') : '-';
        return { student: s, feeStatus, midDisplay, finDisplay };
    });

    const tbody = document.getElementById('classStudentsTableBody');
    const title = document.getElementById('classDetailsTitle');
    if (!tbody || !title) return;
    title.textContent = `Class: ${cls.name} — Students (${rows.length})`;
    tbody.innerHTML = '';

    if (rows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No students in this class.</td></tr>';
    } else {
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.student.name}</td>
                <td>${r.feeStatus}</td>
                <td>${r.midDisplay}</td>
                <td>${r.finDisplay}</td>
                <td>
                    <button class="btn-small btn-secondary" onclick="promptAddGrade('${r.student.id}')">Add/Edit Grade</button>
                    <button class="btn-small btn-info" onclick="viewStudentDetail('${r.student.id}')">View</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const modal = document.getElementById('classDetailsModal');
    if (modal) modal.setAttribute('aria-hidden', 'false');
}

function closeClassDetailsModal() {
    const modal = document.getElementById('classDetailsModal');
    if (modal) modal.setAttribute('aria-hidden', 'true');
}

function promptAddGrade(studentId) {
    const examType = prompt('Enter exam type (Midterm or Final):');
    if (!examType) return;
    const marks = prompt('Enter marks (0-100):');
    if (marks === null) return;
    const m = parseInt(marks);
    if (isNaN(m) || m < 0) return showNotification('Invalid marks', 'error');
    const grade = calculateGrade(m);

    let grades = getData('grades') || [];
    if (!Array.isArray(grades)) grades = [];
    const existingIdx = grades.findIndex(g => g.studentId === studentId && (g.examType||'').toLowerCase() === examType.toLowerCase());
    const student = (getData('students') || []).find(s => s.id === studentId);
    if (existingIdx !== -1) {
        grades[existingIdx] = { ...grades[existingIdx], marks: m, grade, examType };
    } else {
        grades.push({ id: String(grades.length + 1).padStart(3,'0'), studentId, studentName: student?.name||'', class: student?.class||'', subject: '', examType, marks: m, grade });
    }
    if (saveData('grades', grades)) {
        showNotification('Grade saved', 'success');
        // refresh modal
        const currentClass = document.getElementById('classDetailsTitle')?.textContent?.split(':')[1]?.split('—')[0]?.trim();
        const classes = window._classes || getData('classes') || [];
        const cls = classes.find(c => c.name === currentClass);
        if (cls) openClassDetailsModal(cls.id);
    } else {
        showNotification('Error saving grade', 'error');
    }
}

function viewStudentDetail(studentId) {
    const students = getData('students') || [];
    const student = students.find(s => s.id === studentId);
    if (!student) return showNotification('Student not found', 'error');

    // Class and class teacher
    const classes = getData('classes') || window._classes || [];
    const cls = classes.find(c => c.name === student.class);
    const classTeacher = cls ? (cls.teacher || '—') : '—';

    // Fee status
    const fees = getData('fees') || [];
    const fee = fees.find(f => f.studentId === studentId);
    let feeStatus = 'No record';
    if (fee) {
        if (fee.status === 'paid') feeStatus = `Paid (${formatCurrency(fee.amount)} on ${fee.datePaid})`;
        else feeStatus = 'Pending';
    }

    const msg = `Student: ${student.name}\nID: ${student.id}\nClass: ${student.class}\nClass Teacher: ${classTeacher}\nFee Status: ${feeStatus}`;
    alert(msg);
}

function showEditClassForm(id) {
    const classes = window._classes || getData('classes') || [];
    const idx = classes.findIndex(c => c.id === id);
    if (idx === -1) return showNotification('Class not found', 'error');
    
    // Open the modal with the class ID for editing
    openClassModal(id);
}

// subject management removed

function deleteClassRecord(button, classId) {
    if (!confirm('Are you sure you want to delete this class?')) return;
    let classes = getData('classes') || [];
    classes = classes.filter(c => c.id !== classId);
    if (saveData('classes', classes)) {
        window._classes = classes;
        // Remove from DOM
        if (button) button.closest('.class-card')?.remove();
        populateTimetableClassSelect();
        populateClassFilter();
        showNotification('Class deleted', 'success');
        updateDashboardStats();
    } else {
        showNotification('Error deleting class', 'error');
    }
}

// classes are loaded from loadAllData

function loadStudentsFromStorage() {
    console.log('Loading students...');
    const students = getData('students');
    const tableBody = document.getElementById('studentsTableBody');
    
    if (!tableBody) {
        console.error('✗ Students table body not found!');
        return;
    }

    if (students && Array.isArray(students) && students.length > 0) {
        console.log('✓ Found ' + students.length + ' students in storage');
        tableBody.innerHTML = '';
        
        students.forEach(student => {
            addStudentRowToTable(student, tableBody);
        });
    } else {
        console.log('No students in storage');
    }
}

function loadTeachersFromStorage() {
    console.log('Loading teachers...');
    const teachers = getData('teachers');
    const tableBody = document.getElementById('teachersTableBody');
    
    if (!tableBody) {
        console.error('✗ Teachers table body not found!');
        return;
    }

    if (teachers && Array.isArray(teachers) && teachers.length > 0) {
        console.log('✓ Found ' + teachers.length + ' teachers in storage');
        tableBody.innerHTML = '';
        
        teachers.forEach(teacher => {
            addTeacherRowToTable(teacher, tableBody);
        });
    } else {
        console.log('No teachers in storage');
    }
}

function addStudentRowToTable(student, tableBody) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.class}</td>
        <td>
            <button class="btn-small btn-info" onclick="viewStudentDetail('${student.id}')">View</button>
            <button class="btn-small btn-warning" onclick="editRecord('student')">Edit</button>
            <button class="btn-small btn-danger" onclick="deleteStudentRecord(this, '${student.id}')">Delete</button>
        </td>
    `;
    tableBody.appendChild(newRow);
}

function addTeacherRowToTable(teacher, tableBody) {
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td>${teacher.id}</td>
        <td>${teacher.name}</td>
        <td>${teacher.department}</td>
        <td>${teacher.email}</td>
        <td>${teacher.phone}</td>
        <td><span class="status-badge status-active">Active</span></td>
        <td>
            <button class="btn-small btn-info" onclick="alert('View: ${teacher.name}')">View</button>
            <button class="btn-small btn-warning" onclick="editRecord('teacher')">Edit</button>
            <button class="btn-small btn-danger" onclick="deleteTeacherRecord(this, '${teacher.id}')">Delete</button>
        </td>
    `;
    tableBody.appendChild(newRow);
}

// ===========================
// ADD STUDENT FUNCTION
// ===========================

function showAddStudentForm() {
    const name = prompt('Enter student name:');
    if (name) {
        const studentClass = prompt('Enter class (e.g., 10-A):');
        if (name && studentClass) {
            addStudentToTable(name, studentClass);
            showNotification('Student added successfully!', 'success');
        }
    }
}

function addStudentToTable(name, studentClass) {
    console.log('Adding student:', name);
    
    // Get existing students from localStorage
    let students = getData('students') || [];
    
    // If it's not an array (corrupted data), start fresh
    if (!Array.isArray(students)) {
        students = [];
    }
    
    // Generate next ID
    const nextId = String(students.length + 1).padStart(3, '0');
    
    // Create new student object (roll number removed)
    const newStudent = {
        id: nextId,
        name: name,
        class: studentClass
    };
    
    // Add to array
    students.push(newStudent);
    
    // Save to localStorage
    if (saveData('students', students)) {
        // Add to table
        const tableBody = document.getElementById('studentsTableBody');
        addStudentRowToTable(newStudent, tableBody);
        console.log('✓ Student added successfully');
        // Update class counts/UI
        loadClassesFromStorage();
        // Update dashboard stats
        updateDashboardStats();
        // Add recent activity
        addActivity('👤', `New student added: ${newStudent.name} (${newStudent.class})`);
    } else {
        showNotification('Error saving student!', 'error');
    }
}

// ===========================
// DELETE STUDENT FUNCTION
// ===========================

function deleteStudentRecord(button, studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        console.log('Deleting student:', studentId);
        
        // Get students from localStorage
        let students = getData('students') || [];
        
        // Filter out the deleted student
        students = students.filter(s => s.id !== studentId);
        
        // Also remove their fee record if exists
        let fees = getData('fees') || [];
        fees = fees.filter(f => f.studentId !== studentId);
        
        // Save updated lists
        if (saveData('students', students) && saveData('fees', fees)) {
            // Remove from table
            button.closest('tr').remove();
            
            // Reload fees to update the fees table
            loadFeesFromStorage();
            updateFeeSummary();
                // Update classes UI after student removal
                loadClassesFromStorage();
            
            showNotification('Student deleted successfully!', 'success');
            console.log('✓ Student and their fees deleted');
        } else {
            showNotification('Error deleting student!', 'error');
        }
    }
}

// ===========================
// ADD TEACHER FUNCTION
// ===========================

function showAddTeacherForm() {
    const name = prompt('Enter teacher name:');
    if (name) {
        const department = prompt('Enter department:');
        const email = prompt('Enter email:');
        const phone = prompt('Enter phone number:');
        
        if (name && department && email && phone) {
            addTeacherToTable(name, department, email, phone);
            showNotification('Teacher added successfully!', 'success');
        }
    }
}

function addTeacherToTable(name, department, email, phone) {
    console.log('Adding teacher:', name);
    
    // Get existing teachers from localStorage
    let teachers = getData('teachers') || [];
    
    // If it's not an array (corrupted data), start fresh
    if (!Array.isArray(teachers)) {
        teachers = [];
    }
    
    // Generate next ID
    const nextId = 'T' + String(teachers.length + 1).padStart(3, '0');
    
    // Create new teacher object
    const newTeacher = {
        id: nextId,
        name: name,
        department: department,
        email: email,
        phone: phone,
        status: 'Active'
    };
    
    // Add to array
    teachers.push(newTeacher);
    
    // Save to localStorage
    if (saveData('teachers', teachers)) {
        // Add to table
        const tableBody = document.getElementById('teachersTableBody');
        addTeacherRowToTable(newTeacher, tableBody);
        console.log('✓ Teacher added successfully');
        updateDashboardStats();
        addActivity('👩‍🏫', `New teacher added: ${newTeacher.name}`);
    } else {
        showNotification('Error saving teacher!', 'error');
    }
}

// ===========================
// DELETE TEACHER FUNCTION
// ===========================

function deleteTeacherRecord(button, teacherId) {
    if (confirm('Are you sure you want to delete this teacher?')) {
        console.log('Deleting teacher:', teacherId);
        
        // Get teachers from localStorage
        let teachers = getData('teachers') || [];
        
        // Filter out the deleted teacher
        teachers = teachers.filter(t => t.id !== teacherId);
        
        // Save updated list
        if (saveData('teachers', teachers)) {
            // Remove from table
            button.closest('tr').remove();
            showNotification('Teacher deleted successfully!', 'success');
            console.log('✓ Teacher deleted');
            updateDashboardStats();
        } else {
            showNotification('Error deleting teacher!', 'error');
        }
    }
}

// ===========================
// OTHER FORM FUNCTIONS
// ===========================

function showAddClassForm() {
    // This no-op was removed to allow the persistent class creation handler to run.
}

function showGradeForm() {
    const studentName = prompt('Enter student name:');
    if (studentName) {
        const subject = prompt('Enter subject:');
        const marks = prompt('Enter marks (0-100):');
        const examType = prompt('Enter exam type (Midterm/Final/Quiz):');
        
        if (studentName && subject && marks && examType) {
            const grade = calculateGrade(parseInt(marks));
            showNotification('Grades posted successfully!', 'success');
        }
    }
}

function showAttendanceForm() {
    // Attendance UI removed for headmaster dashboard
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function calculateGrade(marks) {
    if (marks >= 90) return 'A';
    if (marks >= 80) return 'B';
    if (marks >= 70) return 'C';
    if (marks >= 60) return 'D';
    return 'F';
}

function deleteRecord(button) {
    if (confirm('Are you sure you want to delete this record?')) {
        button.closest('tr').remove();
        showNotification('Record deleted successfully!', 'success');
    }
}

function editRecord(type) {
    showNotification(`Edit ${type} functionality would open a form`, 'info');
}

function loadAttendance() {
    // Attendance loading removed
}

// ===========================
// FILTER FUNCTIONS
// ===========================

function initializeFilters() {
    const studentSearch = document.getElementById('studentSearch');
    const classFilter = document.getElementById('classFilter');
    const teacherSearch = document.getElementById('teacherSearch');
    const departmentFilter = document.getElementById('departmentFilter');
    const gradeClassFilter = document.getElementById('gradeClassFilter');
    const examFilter = document.getElementById('examFilter');

    if (studentSearch) {
        studentSearch.addEventListener('keyup', filterStudents);
    }
    if (classFilter) {
        classFilter.addEventListener('change', filterStudents);
    }
    if (teacherSearch) {
        teacherSearch.addEventListener('keyup', filterTeachers);
    }
    if (departmentFilter) {
        departmentFilter.addEventListener('change', filterTeachers);
    }
    if (gradeClassFilter) {
        gradeClassFilter.addEventListener('change', filterGrades);
    }
    if (examFilter) {
        examFilter.addEventListener('change', filterGrades);
    }
}

function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const classFilter = document.getElementById('classFilter').value;
    const tableBody = document.getElementById('studentsTableBody');
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(row => {
        const name = row.children[1].textContent.toLowerCase();
        const className = row.children[2].textContent;

        const matchesSearch = name.includes(searchTerm);
        const matchesClass = !classFilter || className === classFilter;

        row.style.display = matchesSearch && matchesClass ? '' : 'none';
    });
}

function filterTeachers() {
    const searchTerm = document.getElementById('teacherSearch').value.toLowerCase();
    const departmentFilter = document.getElementById('departmentFilter').value;
    const tableBody = document.getElementById('teachersTableBody');
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(row => {
        const name = row.children[1].textContent.toLowerCase();
        const department = row.children[2].textContent;

        const matchesSearch = name.includes(searchTerm);
        const matchesDept = !departmentFilter || department === departmentFilter;

        row.style.display = matchesSearch && matchesDept ? '' : 'none';
    });
}

function filterGrades() {
    const classFilter = document.getElementById('gradeClassFilter').value;
    const examFilter = document.getElementById('examFilter').value;
    const tableBody = document.getElementById('gradesTableBody');
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(row => {
        const className = row.children[1].textContent;
        const examType = row.children[3].textContent;

        const matchesClass = !classFilter || className === classFilter;
        const matchesExam = !examFilter || examType.toLowerCase() === examFilter;

        row.style.display = matchesClass && matchesExam ? '' : 'none';
    });
}

// ===========================
// NOTIFICATION SYSTEM
// ===========================

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;

    const colors = {
        success: { bg: '#43e97b', text: 'white' },
        error: { bg: '#f5576c', text: 'white' },
        warning: { bg: '#ffa502', text: 'white' },
        info: { bg: '#4facfe', text: 'white' }
    };

    const color = colors[type] || colors.info;
    notification.style.backgroundColor = color.bg;
    notification.style.color = color.text;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// ===========================
// RECENT ACTIVITIES
// ===========================

function addActivity(iconEmoji, text) {
    // Persist activity object and re-render list
    if (!window._activities || !Array.isArray(window._activities)) window._activities = [];
    const time = new Date().toLocaleString();
    const entry = { id: String(Date.now()), icon: iconEmoji, text: text, time };
    // newest first
    window._activities.unshift(entry);
    // keep up to 8 items
    if (window._activities.length > 8) window._activities = window._activities.slice(0, 8);
    // save to storage and render
    saveData('activities', window._activities);
    renderActivities();
}

function renderActivities() {
    const list = document.getElementById('recentActivitiesList');
    if (!list) return;
    list.innerHTML = '';
    const activities = window._activities || [];
    
    if (activities.length === 0) {
        list.innerHTML = '<p style="color: #999; text-align: center; padding: 2rem;">No activities yet</p>';
        // Still wire the clear button
        const clearBtn = document.getElementById('clearActivitiesBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                saveData('activities', []);
                loadActivitiesFromStorage();
            });
        }
        return;
    }
    
    activities.forEach(a => {
        const item = document.createElement('div');
        item.className = 'activity-item';
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'flex-start';
        item.style.padding = '0.75rem';
        item.style.borderBottom = '1px solid #eee';
        
        const contentDiv = document.createElement('div');
        contentDiv.style.display = 'flex';
        contentDiv.style.flex = '1';
        contentDiv.style.gap = '0.75rem';
        
        const iconSpan = document.createElement('span');
        iconSpan.className = 'activity-icon';
        iconSpan.style.fontSize = '1.5rem';
        iconSpan.textContent = a.icon;
        
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'activity-details';
        detailsDiv.style.flex = '1';
        
        const textP = document.createElement('p');
        textP.className = 'activity-text';
        textP.style.margin = '0 0 0.25rem 0';
        textP.textContent = a.text;
        
        const timeP = document.createElement('p');
        timeP.className = 'activity-time';
        timeP.style.margin = '0';
        timeP.style.fontSize = '0.85em';
        timeP.style.color = '#999';
        timeP.textContent = a.time;
        
        detailsDiv.appendChild(textP);
        detailsDiv.appendChild(timeP);
        
        contentDiv.appendChild(iconSpan);
        contentDiv.appendChild(detailsDiv);
        
        const removeBtn = document.createElement('button');
        removeBtn.innerHTML = '✕';
        removeBtn.style.background = 'none';
        removeBtn.style.border = 'none';
        removeBtn.style.cursor = 'pointer';
        removeBtn.style.fontSize = '1.2rem';
        removeBtn.style.color = '#999';
        removeBtn.style.padding = '0 0.5rem';
        removeBtn.style.marginLeft = '0.5rem';
        removeBtn.title = 'Remove activity';
        removeBtn.addEventListener('click', () => {
            removeActivity(a.id);
        });
        
        item.appendChild(contentDiv);
        item.appendChild(removeBtn);
        list.appendChild(item);
    });
    
    // Wire the clear button
    const clearBtn = document.getElementById('clearActivitiesBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            saveData('activities', []);
            loadActivitiesFromStorage();
        });
    }
}

function removeActivity(activityId) {
    let activities = getData('activities') || [];
    activities = activities.filter(a => a.id !== activityId);
    saveData('activities', activities);
    loadActivitiesFromStorage();
}

function loadActivitiesFromStorage() {
    const activities = getData('activities') || [];
    window._activities = Array.isArray(activities) ? activities : [];
    renderActivities();
}

// ===========================
// ANIMATIONS
// ===========================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);

// ===========================
// STATS ANIMATION
// ===========================

function animateStats() {
    const statValues = document.querySelectorAll('.stat-value');
    statValues.forEach(stat => {
        const finalValue = parseInt(stat.textContent);
        if (!isNaN(finalValue)) {
            animateValue(stat, 0, finalValue, 1000);
        }
    });
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        
        if (element.textContent.includes('%')) {
            element.textContent = value + '%';
        } else {
            element.textContent = value.toLocaleString();
        }
        
        if (progress < 1) {
            requestAnimationFrame(step);
        }
    };
    requestAnimationFrame(step);
}

window.addEventListener('load', animateStats);

// ===========================
// KEYBOARD SHORTCUTS
// ===========================

document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// ===========================
// FEE MANAGEMENT
// ===========================

function loadFeesFromStorage() {
    console.log('Loading fees...');
    const fees = getData('fees');
    const students = getData('students') || [];
    const tableBody = document.getElementById('feesTableBody');
    
    if (!tableBody) {
        console.error('✗ Fees table body not found!');
        return;
    }

    // Create a map of student IDs and their fee status
    let feeMap = {};
    fees.forEach(fee => {
        feeMap[fee.studentId] = fee;
    });

    // Clear table
    tableBody.innerHTML = '';

    if (students.length > 0) {
        console.log('✓ Creating fee records for ' + students.length + ' students');
        
        // Create a row for each student
        students.forEach((student, index) => {
            let feeRecord = feeMap[student.id];
            
            // If no fee record exists for this student, create a pending one
            if (!feeRecord) {
                feeRecord = {
                    id: String(index + 1).padStart(3, '0'),
                    studentId: student.id,
                    studentName: student.name,
                    class: student.class,
                    amount: '-',
                    status: 'pending',
                    datePaid: '-'
                };
            }
            
            addFeeRowToTable(feeRecord, tableBody);
        });
    } else {
        console.log('No students in system yet');
    }
    // Update class-specific fee summary if a class is selected
    const feeClassSelect = document.getElementById('feeClassFilter');
    if (feeClassSelect) updateFeeClassSummary(feeClassSelect.value);
}

function addFeeRowToTable(fee, tableBody) {
    const newRow = document.createElement('tr');
    const statusBadge = fee.status === 'paid' ? 'status-paid' : 'status-pending';
    const displayAmount = formatCurrency(fee.amount);
    const displayDate = fee.datePaid;
    
    newRow.innerHTML = `
        <td>${fee.id}</td>
        <td>${fee.studentName}</td>
        <td>${fee.class}</td>
        <td>${displayAmount}</td>
        <td><span class="status-badge ${statusBadge}">${fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}</span></td>
        <td>${displayDate}</td>
        <td>
            <button class="btn-small btn-info" onclick="viewFeeDetail('${fee.studentId}')">View</button>
            <button class="btn-small btn-warning" onclick="updateFeeStatus('${fee.studentId}')" ${fee.status === 'pending' ? '' : 'disabled'}>Mark Paid</button>
            <button class="btn-small btn-danger" onclick="deleteFeeRecord(this, '${fee.studentId}')">Delete</button>
        </td>
    `;
    tableBody.appendChild(newRow);
}

function showMarkFeeForm() {
    const students = getData('students') || [];
    
    if (students.length === 0) {
        showNotification('No students in the system yet!', 'warning');
        return;
    }
    
    // Create a dropdown list of students
    let studentOptions = students.map((s, index) => `${index + 1}. ${s.name} (${s.class})`).join('\n');
    
    const studentChoice = prompt('Select student by number:\n\n' + studentOptions + '\n\nEnter number:');
    
    if (studentChoice) {
        const studentIndex = parseInt(studentChoice) - 1;
        
        if (studentIndex >= 0 && studentIndex < students.length) {
            const selectedStudent = students[studentIndex];
            const amount = prompt(`Enter fee amount for ${selectedStudent.name}:`);
            
            if (amount && !isNaN(amount)) {
                markFeePaid(selectedStudent, amount);
            }
        } else {
            showNotification('Invalid student number!', 'error');
        }
    }
}

function markFeePaid(student, amount) {
    console.log('Marking fee paid for:', student.name);
    
    // Get existing fees from localStorage
    let fees = getData('fees') || [];
    
    if (!Array.isArray(fees)) {
        fees = [];
    }
    
    // Check if fee already exists for this student
    const existingFeeIndex = fees.findIndex(f => f.studentId === student.id);
    
    // Get today's date
    const today = new Date();
    const datePaid = (today.getMonth() + 1).toString().padStart(2, '0') + '/' + 
                     today.getDate().toString().padStart(2, '0') + '/' + 
                     today.getFullYear();
    
    if (existingFeeIndex !== -1) {
        // Update existing fee record
        fees[existingFeeIndex] = {
            ...fees[existingFeeIndex],
            amount: amount,
            status: 'paid',
            datePaid: datePaid
        };
        console.log('✓ Fee record updated for:', student.name);
    } else {
        // Create new fee object
        const newFee = {
            id: String(fees.length + 1).padStart(3, '0'),
            studentId: student.id,
            studentName: student.name,
            class: student.class,
            amount: amount,
            status: 'paid',
            datePaid: datePaid
        };
        
        fees.push(newFee);
        console.log('✓ New fee record created');
    }
    
    // Save to localStorage
    if (saveData('fees', fees)) {
        loadFeesFromStorage();
        updateFeeSummary();
        showNotification(`Fee marked as paid for ${student.name}!`, 'success');
        addActivity('💰', `Fee paid: ${student.name} — ${formatCurrency(amount)}`);
    } else {
        showNotification('Error saving fee record!', 'error');
    }
}

function deleteFeeRecord(button, studentId) {
    if (confirm('Delete this fee record?')) {
        console.log('Deleting fee for student:', studentId);
        
        // Get fees from localStorage
        let fees = getData('fees') || [];
        
        // Filter out the deleted fee
        fees = fees.filter(f => f.studentId !== studentId);
        
        // Save updated list
        if (saveData('fees', fees)) {
            button.closest('tr').remove();
            updateFeeSummary();
            showNotification('Fee record deleted!', 'success');
            console.log('✓ Fee deleted');
        } else {
            showNotification('Error deleting fee record!', 'error');
        }
    }
}

function updateFeeSummary() {
    const fees = getData('fees') || [];
    const students = getData('students') || [];
    
    let totalCollected = 0;
    let totalPending = 0;
    let paidCount = 0;
    let totalCount = students.length;
    
    fees.forEach(fee => {
        const amount = parseInt(fee.amount) || 0;
        
        if (fee.status === 'paid') {
            totalCollected += amount;
            paidCount++;
        } else {
            totalPending += amount;
        }
    });
    
    // Calculate collection rate based on students
    const collectionRate = totalCount > 0 ? ((paidCount / totalCount) * 100).toFixed(1) : 0;
    
    // Update summary display with formatted currency
    const totalFeesElement = document.getElementById('totalFeesCollected');
    const pendingFeesElement = document.getElementById('totalFeesPending');
    const rateElement = document.getElementById('feeCollectionRate');
    
    if (totalFeesElement) totalFeesElement.textContent = formatCurrency(totalCollected.toString());
    if (pendingFeesElement) pendingFeesElement.textContent = formatCurrency(totalPending.toString());
    if (rateElement) rateElement.textContent = collectionRate + '%';
    
    console.log('Fee Summary Updated - Collected: ' + formatCurrency(totalCollected.toString()) + ', Pending: ' + formatCurrency(totalPending.toString()));
}

function updateFeeClassSummary(className) {
    const summaryEl = document.getElementById('feeClassSummary');
    const body = document.getElementById('feeClassSummaryBody');
    if (!summaryEl || !body) return;

    if (!className) {
        summaryEl.style.display = 'none';
        body.innerHTML = 'Select a class to view paid/pending students.';
        return;
    }

    const students = (getData('students') || []).filter(s => s.class === className);
    const fees = getData('fees') || [];

    const paid = [];
    const pending = [];

    students.forEach(s => {
        const fee = fees.find(f => f.studentId === s.id);
        if (fee && fee.status === 'paid') paid.push(`${s.name} (${formatCurrency(fee.amount)})`);
        else pending.push(s.name);
    });

    let html = `<p><strong>Class:</strong> ${className}</p>`;
    html += `<p><strong>Total students:</strong> ${students.length}</p>`;
    html += `<p><strong>Paid:</strong> ${paid.length}</p>`;
    if (paid.length > 0) html += `<p>${paid.join(', ')}</p>`;
    html += `<p><strong>Pending:</strong> ${pending.length}</p>`;
    if (pending.length > 0) html += `<p>${pending.join(', ')}</p>`;

    body.innerHTML = html;
    summaryEl.style.display = 'block';
}

function viewFeeDetail() {
    showNotification('Fee detail view would open here', 'info');
}

// ===========================
// TIMETABLE MANAGEMENT
// ===========================

function loadTimetablesFromStorage() {
    console.log('Loading timetables...');
    const timetables = getData('timetables') || [];
    // We don't render here; render is driven by selected class
    window._timetables = timetables; // simple in-memory cache
    console.log('✓ Timetables loaded:', timetables.length);
}

function populateTimetableClassSelect() {
    const select = document.getElementById('timetableClassSelect');
    if (!select) return;

    // Use classes from class management (preferred)
    const classes = getData('classes') || window._classes || [];

    // Clear and add default
    select.innerHTML = '<option value="">Select Class</option>';
    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });
}

function populateClassFilter() {
    const select = document.getElementById('classFilter');
    if (!select) return;

    const classes = getData('classes') || window._classes || [];
    // preserve current selection
    const current = select.value || '';
    select.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'All Classes';
    select.appendChild(defaultOpt);

    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });

    // restore selection if still valid
    if (current) select.value = current;
    // also populate fee class selector so fees UI stays in sync
    populateFeeClassFilter();
}

function populateFeeClassFilter() {
    const select = document.getElementById('feeClassFilter');
    if (!select) return;

    const classes = getData('classes') || window._classes || [];
    const current = select.value || '';
    select.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'All Classes';
    select.appendChild(defaultOpt);

    classes.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.textContent = c.name;
        select.appendChild(opt);
    });

    if (current) select.value = current;
}

function showAddTimetableEntry() {
    const classes = getData('classes') || [];
    const teachers = getData('teachers') || [];
    const classArray = Array.isArray(classes) ? classes : [];
    const teacherArray = Array.isArray(teachers) ? teachers : [];
    
    if (classArray.length === 0) {
        showNotification('No classes exist. Create a class first.', 'warning');
        return;
    }
    
    // Prompt for class
    let classOptions = classArray.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
    const classChoice = prompt('Select class by number:\n\n' + classOptions + '\n\nEnter number:');
    if (!classChoice) return;
    
    const classIdx = parseInt(classChoice) - 1;
    if (classIdx < 0 || classIdx >= classArray.length) {
        showNotification('Invalid class number', 'error');
        return;
    }
    
    const selectedClass = classArray[classIdx];
    const className = selectedClass.name;
    
    // Prompt for teacher - can be any teacher or new name
    let teacherOptions = '';
    if (teacherArray.length > 0) {
        teacherOptions = '\nAvailable teachers:\n' + teacherArray.map((t, i) => `${i + 1}. ${t.name}`).join('\n') + '\n';
    }
    const teacherChoice = prompt(`${teacherOptions}\nEnter teacher name or select from list (or type new name):`) || '';
    if (!teacherChoice.trim()) return showNotification('Teacher name is required', 'warning');
    
    let teacherName = teacherChoice.trim();
    // If it's a number, look up from teacher list
    const tIdx = parseInt(teacherChoice) - 1;
    if (tIdx >= 0 && tIdx < teacherArray.length) {
        teacherName = teacherArray[tIdx].name;
    }
    
    const day = prompt('Enter day (e.g., Monday):');
    if (!day) return;
    const start = prompt('Start time (e.g., 08:00):');
    if (!start) return;
    const end = prompt('End time (e.g., 09:00):');
    if (!end) return;
    const subject = prompt('Subject (e.g., English):');
    if (!subject) return;

    addTimetableEntry({ class: className, day, start, end, teacher: teacherName, subject });
}

function addTimetableEntry(entry) {
    let timetables = getData('timetables') || [];
    if (!Array.isArray(timetables)) timetables = [];

    const id = String(timetables.length + 1).padStart(3, '0');
    const newEntry = { id, ...entry };
    timetables.push(newEntry);

    if (saveData('timetables', timetables)) {
        window._timetables = timetables;
        showNotification('Timetable entry saved', 'success');
        addActivity('🗓️', `Timetable: ${entry.teacher} → ${entry.class} (${entry.subject}, ${entry.day} ${entry.start}-${entry.end})`);
        // Refresh view
        const classSelect = document.getElementById('timetableClassSelect');
        if (classSelect) renderTimetableForClass(classSelect.value);
    } else {
        showNotification('Error saving timetable', 'error');
    }
}

function renderTimetableForClass(className) {
    const tbody = document.getElementById('timetableTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const timetables = window._timetables || getData('timetables') || [];
    const entries = timetables.filter(t => t.class === className);

    if (entries.length === 0) {
        const r = document.createElement('tr');
        r.innerHTML = '<td colspan="7">No timetable entries for this class.</td>';
        tbody.appendChild(r);
        return;
    }

    entries.forEach(e => {
        const r = document.createElement('tr');
        r.innerHTML = `
            <td>${e.id}</td>
            <td>${e.day}</td>
            <td>${e.start}</td>
            <td>${e.end}</td>
            <td>${e.subject}</td>
            <td>${e.teacher}</td>
            <td>
                <button class="btn-small btn-warning" onclick="editTimetableEntry('${e.id}')">Edit</button>
                <button class="btn-small btn-danger" onclick="deleteTimetableEntry(this, '${e.id}')">Delete</button>
            </td>
        `;
        tbody.appendChild(r);
    });
}

function editTimetableEntry(id) {
    let timetables = getData('timetables') || [];
    const idx = timetables.findIndex(t => t.id === id);
    if (idx === -1) return showNotification('Entry not found', 'error');

    const current = timetables[idx];
    const day = prompt('Day:', current.day) || current.day;
    const start = prompt('Start time:', current.start) || current.start;
    const end = prompt('End time:', current.end) || current.end;
    const teacher = prompt('Teacher:', current.teacher) || current.teacher;
    const subject = prompt('Subject:', current.subject) || current.subject;

    timetables[idx] = { ...current, day, start, end, teacher, subject };
    if (saveData('timetables', timetables)) {
        window._timetables = timetables;
        showNotification('Timetable updated', 'success');
        const classSelect = document.getElementById('timetableClassSelect');
        if (classSelect) renderTimetableForClass(classSelect.value);
    } else {
        showNotification('Error updating timetable', 'error');
    }
}

function deleteTimetableEntry(button, id) {
    if (!confirm('Delete this timetable entry?')) return;
    let timetables = getData('timetables') || [];
    timetables = timetables.filter(t => t.id !== id);
    if (saveData('timetables', timetables)) {
        button.closest('tr').remove();
        window._timetables = timetables;
        showNotification('Entry deleted', 'success');
    } else {
        showNotification('Error deleting entry', 'error');
    }
}
function updateFeeStatus(studentId) {
    const students = getData('students') || [];
    const fees = getData('fees') || [];
    
    const student = students.find(s => s.id === studentId);
    if (!student) {
        showNotification('Student not found!', 'error');
        return;
    }
    
    const amount = prompt(`Enter fee amount for ${student.name}:`);
    
    if (amount && !isNaN(amount)) {
        markFeePaid(student, amount);
    }
}

// Initialize fee filters
setTimeout(() => {
    const feeSearch = document.getElementById('feeSearch');
    const feeStatusFilter = document.getElementById('feeStatusFilter');
    const feeClassFilter = document.getElementById('feeClassFilter');
    
    if (feeSearch) {
        feeSearch.addEventListener('keyup', filterFees);
    }
    if (feeStatusFilter) {
        feeStatusFilter.addEventListener('change', filterFees);
    }
    if (feeClassFilter) {
        feeClassFilter.addEventListener('change', function() {
            filterFees();
            updateFeeClassSummary(this.value);
        });
    }
}, 500);

function filterFees() {
    const searchTerm = document.getElementById('feeSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('feeStatusFilter')?.value || '';
    const classFilter = document.getElementById('feeClassFilter')?.value || '';
    const tableBody = document.getElementById('feesTableBody');
    
    if (!tableBody) return;
    
    const rows = tableBody.querySelectorAll('tr');

    rows.forEach(row => {
        const name = row.children[1].textContent.toLowerCase();
        const cls = row.children[2].textContent;
        const status = row.children[4].textContent.toLowerCase();

        const matchesSearch = name.includes(searchTerm);
        const matchesStatus = !statusFilter || status.includes(statusFilter);
        const matchesClass = !classFilter || cls === classFilter;

        row.style.display = matchesSearch && matchesStatus && matchesClass ? '' : 'none';
    });
}

// ===========================
// EXPORT & PRINT
// ===========================

function exportTableToCSV(tableId, filename = 'export.csv') {
    const table = document.getElementById(tableId);
    let csv = [];
    
    const headers = [];
    table.querySelectorAll('th').forEach(header => {
        headers.push(header.textContent);
    });
    csv.push(headers.join(','));
    
    table.querySelectorAll('tbody tr').forEach(row => {
        const rowData = [];
        row.querySelectorAll('td').forEach((cell, index) => {
            if (index < headers.length - 1) {
                rowData.push('"' + cell.textContent.replace(/"/g, '""') + '"');
            }
        });
        csv.push(rowData.join(','));
    });
    
    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    link.click();
}

function printTable(tableId) {
    const printWindow = window.open('', '_blank');
    const table = document.getElementById(tableId);
    printWindow.document.write('<html><head><title>Print</title>');
    printWindow.document.write('<style>table { border-collapse: collapse; width: 100%; }');
    printWindow.document.write('th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }');
    printWindow.document.write('th { background-color: #667eea; color: white; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(table.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}
