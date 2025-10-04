// Monthly report functionality
let attendanceData = [];
let students = [];

// Check authentication
window.addEventListener('load', function() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set current month and year
    const now = new Date();
    document.getElementById('selectedMonth').value = String(now.getMonth() + 1).padStart(2, '0');
    document.getElementById('selectedYear').value = now.getFullYear();
});

// Generate report
document.getElementById('filterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    generateReport();
});

async function generateReport() {
    const month = document.getElementById('selectedMonth').value;
    const year = document.getElementById('selectedYear').value;
    const className = document.getElementById('selectedClass').value;
    
    if (!month || !year || !className) {
        showError('Please select month, year, and class');
        return;
    }
    
    try {
        // Load attendance data
        const data = localStorage.getItem(`attendance_${className}`);
        attendanceData = data ? JSON.parse(data) : [];
        
        // Load students data for total count
        const response = await fetch(`data/${className}.json`);
        if (response.ok) {
            students = await response.json();
        }
        
        // Filter by month and year
        const filteredData = attendanceData.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() + 1 == month && recordDate.getFullYear() == year;
        });
        
        renderMonthlyReport(filteredData);
        calculateSummary(filteredData);
        
        document.getElementById('reportSection').style.display = 'block';
        
    } catch (error) {
        showError('Error generating report: ' + error.message);
    }
}

function renderMonthlyReport(data) {
    const tbody = document.getElementById('monthlyTableBody');
    tbody.innerHTML = '';
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No attendance records found for the selected period</td></tr>';
        return;
    }
    
    data.forEach((record, index) => {
        const presentCount = record.students.filter(s => s.present).length;
        const absentCount = record.students.filter(s => !s.present).length;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(record.date)}</td>
            <td>${record.teacher}</td>
            <td>${record.subject}</td>
            <td>${record.time}</td>
            <td class="present-count">${presentCount}</td>
            <td class="absent-count">${absentCount}</td>
            <td>
                <button class="btn-small" onclick="showStudentDetails(${index})">View Details</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function calculateSummary(data) {
    const totalClasses = data.length;
    const totalStudents = students.length;
    
    let totalPresent = 0;
    let totalPossible = 0;
    
    data.forEach(record => {
        record.students.forEach(student => {
            totalPossible++;
            if (student.present) {
                totalPresent++;
            }
        });
    });
    
    const avgAttendance = totalPossible > 0 ? Math.round((totalPresent / totalPossible) * 100) : 0;
    
    document.getElementById('totalClasses').textContent = totalClasses;
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('avgAttendance').textContent = avgAttendance + '%';
}

function showStudentDetails(index) {
    const record = attendanceData.filter(r => {
        const month = document.getElementById('selectedMonth').value;
        const year = document.getElementById('selectedYear').value;
        const recordDate = new Date(r.date);
        return recordDate.getMonth() + 1 == month && recordDate.getFullYear() == year;
    })[index];
    
    if (!record) return;
    
    const modal = document.getElementById('studentModal');
    const detailsDiv = document.getElementById('studentDetails');
    
    let html = `
        <h4>Attendance for ${formatDate(record.date)}</h4>
        <p><strong>Teacher:</strong> ${record.teacher}</p>
        <p><strong>Subject:</strong> ${record.subject}</p>
        <p><strong>Time:</strong> ${record.time}</p>
        <br>
        <table class="student-details-table">
            <thead>
                <tr>
                    <th>Student Name</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    record.students.forEach(student => {
        const status = student.present ? 'Present' : 'Absent';
        const statusClass = student.present ? 'status-present' : 'status-absent';
        html += `
            <tr>
                <td>${student.name}</td>
                <td class="${statusClass}">${status}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    detailsDiv.innerHTML = html;
    modal.style.display = 'block';
}

// Close modal
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById('studentModal').style.display = 'none';
});

window.addEventListener('click', function(event) {
    const modal = document.getElementById('studentModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Logout functionality
document.getElementById('logoutBtn').addEventListener('click', function() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
});

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB');
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

