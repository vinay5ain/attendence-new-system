// Admin panel functionality
const classes = ['bca1', 'bca2', 'bca3', 'bba1'];
let allAttendanceData = {};
let allStudentsData = {};

// Check authentication
window.addEventListener('load', function() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    const user = JSON.parse(currentUser);
    if (user.role !== 'admin') {
        window.location.href = 'student.html';
        return;
    }
    
    // Set current month and year
    const now = new Date();
    document.getElementById('summaryMonth').value = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('reportMonth').value = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('summaryYear').value = now.getFullYear();
    document.getElementById('reportYear').value = now.getFullYear();
    
    // Default daily log date
    const today = new Date().toISOString().split('T')[0];
    const dailyDateEl = document.getElementById('dailyDate');
    if (dailyDateEl) dailyDateEl.value = today;
    
    // Load all data
    loadAllData();
});

// Navigation
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const section = this.dataset.section;
        
        // Update active button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Show/hide sections
        document.querySelectorAll('.admin-section').forEach(s => s.style.display = 'none');
        document.getElementById(section + 'Section').style.display = 'block';
    });
});

async function loadAllData() {
    try {
        // Load attendance data for all classes
        for (const className of classes) {
            const data = localStorage.getItem(`attendance_${className}`);
            allAttendanceData[className] = data ? JSON.parse(data) : [];
            
            // Load students data
            try {
                const response = await fetch(`data/${className}.json`);
                if (response.ok) {
                    allStudentsData[className] = await response.json();
                } else {
                    allStudentsData[className] = [];
                }
            } catch (error) {
                allStudentsData[className] = [];
            }
        }
        
        updateSummary();
    } catch (error) {
        showError('Error loading data: ' + error.message);
    }
}

function updateSummary() {
    const month = document.getElementById('summaryMonth').value;
    const year = document.getElementById('summaryYear').value;
    
    let totalClasses = 0;
    let totalStudents = 0;
    let totalPresent = 0;
    let totalPossible = 0;
    
    const classSummaryData = [];
    
    classes.forEach(className => {
        let classData = allAttendanceData[className];
        
        // Filter by month and year if selected
        if (month && year) {
            classData = classData.filter(record => {
                const recordDate = new Date(record.date);
                return recordDate.getMonth() + 1 == month && recordDate.getFullYear() == year;
            });
        }
        
        const students = allStudentsData[className];
        const classTotalStudents = students.length;
        const classTotalClasses = classData.length;
        
        let classPresent = 0;
        let classPossible = 0;
        
        classData.forEach(record => {
            record.students.forEach(student => {
                classPossible++;
                if (student.present) {
                    classPresent++;
                }
            });
        });
        
        const classAttendance = classPossible > 0 ? Math.round((classPresent / classPossible) * 100) : 0;
        
        classSummaryData.push({
            class: className.toUpperCase(),
            totalStudents: classTotalStudents,
            totalClasses: classTotalClasses,
            present: classPresent,
            absent: classPossible - classPresent,
            attendance: classAttendance
        });
        
        totalClasses += classTotalClasses;
        totalStudents += classTotalStudents;
        totalPresent += classPresent;
        totalPossible += classPossible;
    });
    
    // Update summary stats
    document.getElementById('totalClassesCount').textContent = totalClasses;
    document.getElementById('totalStudentsCount').textContent = totalStudents;
    document.getElementById('overallAttendance').textContent = 
        totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) + '%' : '0%';
    
    // Update class summary table
    renderClassSummaryTable(classSummaryData);
}

function renderClassSummaryTable(data) {
    const tbody = document.getElementById('classSummaryTableBody');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.class}</td>
            <td>${item.totalStudents}</td>
            <td>${item.totalClasses}</td>
            <td class="present-count">${item.present}</td>
            <td class="absent-count">${item.absent}</td>
            <td class="attendance-percent">${item.attendance}%</td>
        `;
        tbody.appendChild(row);
    });
}

// Refresh summary
document.getElementById('refreshSummary').addEventListener('click', function() {
    loadAllData();
});

// Generate monthly report
document.getElementById('generateReport').addEventListener('click', function() {
    const month = document.getElementById('reportMonth').value;
    const year = document.getElementById('reportYear').value;
    
    if (!month || !year) {
        showError('Please select month and year');
        return;
    }
    
    generateMonthlyReport(month, year);
});

function generateMonthlyReport(month, year) {
    const reportData = [];
    
    classes.forEach(className => {
        const classData = allAttendanceData[className].filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() + 1 == month && recordDate.getFullYear() == year;
        });
        
        const students = allStudentsData[className];
        const classTotalStudents = students.length;
        const classTotalClasses = classData.length;
        
        let classPresent = 0;
        let classPossible = 0;
        
        classData.forEach(record => {
            record.students.forEach(student => {
                classPossible++;
                if (student.present) {
                    classPresent++;
                }
            });
        });
        
        const classAttendance = classPossible > 0 ? Math.round((classPresent / classPossible) * 100) : 0;
        
        reportData.push({
            class: className.toUpperCase(),
            totalClasses: classTotalClasses,
            totalStudents: classTotalStudents,
            present: classPresent,
            absent: classPossible - classPresent,
            attendance: classAttendance
        });
    });
    
    renderMonthlyReportTable(reportData);
    document.getElementById('reportResults').style.display = 'block';
}

function renderMonthlyReportTable(data) {
    const tbody = document.getElementById('monthlyReportTableBody');
    tbody.innerHTML = '';
    
    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.class}</td>
            <td>${item.totalClasses}</td>
            <td>${item.totalStudents}</td>
            <td class="present-count">${item.present}</td>
            <td class="absent-count">${item.absent}</td>
            <td class="attendance-percent">${item.attendance}%</td>
        `;
        tbody.appendChild(row);
    });
}

// Daily Log: render table
function updateDailyLog() {
    const dateVal = document.getElementById('dailyDate') ? document.getElementById('dailyDate').value : '';
    const classFilter = document.getElementById('dailyClass') ? document.getElementById('dailyClass').value : '';
    const tbody = document.getElementById('dailyLogTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Build a flat list of records filtered by date/class
    const rows = [];
    classes.forEach(className => {
        if (classFilter && classFilter !== className) return;
        const classRecords = allAttendanceData[className] || [];
        classRecords.forEach(record => {
            const isSameDate = !dateVal || record.date === dateVal;
            if (!isSameDate) return;
            let presentCount = 0;
            let absentCount = 0;
            (record.students || []).forEach(s => {
                if (s.present) presentCount++; else absentCount++;
            });
            rows.push({
                date: record.date,
                class: className.toUpperCase(),
                teacher: record.teacher || '',
                subject: record.subject || '',
                time: record.time || '',
                present: presentCount,
                absent: absentCount
            });
        });
    });
    
    // Sort rows by date then class then time
    rows.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        if (a.class !== b.class) return a.class.localeCompare(b.class);
        return (a.time || '').localeCompare(b.time || '');
    });
    
    // Render
    rows.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.date}</td>
            <td>${item.class}</td>
            <td>${item.teacher}</td>
            <td>${item.subject}</td>
            <td>${item.time}</td>
            <td class="present-count">${item.present}</td>
            <td class="absent-count">${item.absent}</td>
            <td>
                <button class="btn-secondary btn-view-sheet" data-date="${item.date}" data-class="${item.class}" data-time="${item.time}" data-teacher="${item.teacher}" data-subject="${item.subject}">View</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Daily filters
document.addEventListener('click', function(e) {
    const target = e.target;
    if (target && target.id === 'refreshDaily') {
        updateDailyLog();
    }
    if (target && target.classList.contains('btn-view-sheet')) {
        const date = target.getAttribute('data-date');
        const classLabel = target.getAttribute('data-class');
        const className = classLabel ? classLabel.toLowerCase() : '';
        const time = target.getAttribute('data-time') || '';
        const teacher = target.getAttribute('data-teacher') || '';
        const subject = target.getAttribute('data-subject') || '';
        openSheetModal({ date, className, classLabel, time, teacher, subject });
    }
    if (target && target.id === 'closeSheetModal') {
        closeSheetModal();
    }
    if (target && target.id === 'viewAllDaily') {
        openAllSheetsForDay();
    }
});

// Update daily log when data loads
const _origLoadAllData = loadAllData;
loadAllData = async function() {
    await _origLoadAllData();
    updateDailyLog();
};

function openSheetModal(meta) {
    const modal = document.getElementById('sheetModal');
    const title = document.getElementById('sheetModalTitle');
    const tbody = document.getElementById('sheetTableBody');
    if (!modal || !tbody) return;
    
    // Find the specific record by date, class and (optional) time
    const records = (allAttendanceData[meta.className] || []).filter(r => r.date === meta.date);
    let record = records.find(r => (r.time || '') === meta.time);
    if (!record && records.length > 0) record = records[0];
    if (!record) {
        showError('Attendance sheet not found.');
        return;
    }
    
    title.textContent = `Sheet: ${meta.classLabel} | ${meta.date} | ${meta.time} | ${meta.subject}`;
    tbody.innerHTML = '';
    
    // Map student ids to info for roll no
    const students = allStudentsData[meta.className] || [];
    const idToStudent = {};
    students.forEach(s => { idToStudent[String(s.id)] = s; });
    
    (record.students || []).forEach(s => {
        const info = idToStudent[String(s.id)] || {};
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${info.rollNo || ''}</td>
            <td>${s.name || info.name || ''}</td>
            <td>${s.present ? 'Present' : 'Absent'}</td>
        `;
        tbody.appendChild(tr);
    });
    
    modal.style.display = 'block';
}

function closeSheetModal() {
    const modal = document.getElementById('sheetModal');
    if (modal) modal.style.display = 'none';
}

function openAllSheetsForDay() {
    const dateVal = document.getElementById('dailyDate') ? document.getElementById('dailyDate').value : '';
    const classFilter = document.getElementById('dailyClass') ? document.getElementById('dailyClass').value : '';
    if (!dateVal) {
        showError('Please select a date first');
        return;
    }
    
    // Build a simple printable window containing all sheets for that day and class (or all)
    let html = '<html><head><title>Attendance Sheets</title>' +
        '<style>body{font-family:Arial;padding:16px;} h2{margin:12px 0;} table{width:100%;border-collapse:collapse;margin-bottom:16px;} th,td{border:1px solid #ccc;padding:6px;text-align:left;} .present{color:green;font-weight:bold;} .absent{color:#b00;font-weight:bold;}</style>' +
        '</head><body>';
    
    classes.forEach(className => {
        if (classFilter && classFilter !== className) return;
        const classRecords = (allAttendanceData[className] || []).filter(r => r.date === dateVal);
        if (classRecords.length === 0) return;
        const students = allStudentsData[className] || [];
        const idToStudent = {};
        students.forEach(s => { idToStudent[String(s.id)] = s; });
        
        classRecords.forEach(record => {
            html += `<h2>${className.toUpperCase()} | ${record.date} | ${record.time || ''} | ${record.subject || ''} | ${record.teacher || ''}</h2>`;
            html += '<table><thead><tr><th>Roll No</th><th>Name</th><th>Status</th></tr></thead><tbody>';
            (record.students || []).forEach(s => {
                const info = idToStudent[String(s.id)] || {};
                const statusText = s.present ? 'Present' : 'Absent';
                const statusCls = s.present ? 'present' : 'absent';
                html += `<tr><td>${info.rollNo || ''}</td><td>${s.name || info.name || ''}</td><td class="${statusCls}">${statusText}</td></tr>`;
            });
            html += '</tbody></table>';
        });
    });
    
    html += '</body></html>';
    const w = window.open('', '_blank');
    if (!w) {
        showError('Popup blocked. Allow popups to view all sheets.');
        return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
}

// Export data
document.getElementById('exportData').addEventListener('click', function() {
    exportToCSV();
});

function exportToCSV() {
    let csvContent = "Class,Date,Teacher,Subject,Time,Student,Present\n";
    
    classes.forEach(className => {
        const data = allAttendanceData[className];
        data.forEach(record => {
            record.students.forEach(student => {
                csvContent += `${className},${record.date},${record.teacher},${record.subject},${record.time},${student.name},${student.present}\n`;
            });
        });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Data exported successfully!');
}

// Clear data
document.getElementById('clearData').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all attendance data? This action cannot be undone.')) {
        classes.forEach(className => {
            localStorage.removeItem(`attendance_${className}`);
        });
        loadAllData();
        showSuccess('All data cleared successfully!');
    }
});

// Backup data
document.getElementById('backupData').addEventListener('click', function() {
    const backupData = {
        attendance: allAttendanceData,
        students: allStudentsData,
        timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showSuccess('Backup created successfully!');
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

