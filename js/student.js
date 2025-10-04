// Student attendance functionality
let students = [];
let attendanceData = [];

// Check authentication
window.addEventListener('load', function() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = 'index.html';
        return;
    }
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    
    // Set teacher name from session
    const user = JSON.parse(currentUser);
    document.getElementById('teacherName').value = user.username;
});

// Load students when class is selected
document.getElementById('className').addEventListener('change', function() {
    const className = this.value;
    if (className) {
        loadStudents(className);
    }
});

async function loadStudents(className) {
    try {
        const response = await fetch(`data/${className}.json`);
        if (response.ok) {
            students = await response.json();
            renderStudentsTable();
            document.getElementById('studentsSection').style.display = 'block';
        } else {
            showError('Failed to load students data');
        }
    } catch (error) {
        showError('Error loading students: ' + error.message);
    }
}

function renderStudentsTable() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';
    
    students.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.rollNo}</td>
            <td>${student.name}</td>
            <td>${student.number}</td>
            <td>${student.city}</td>
            <td>
                <input type="radio" name="attendance_${student.id}" value="present" checked>
            </td>
            <td>
                <input type="radio" name="attendance_${student.id}" value="absent">
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Save attendance
document.getElementById('saveAttendanceBtn').addEventListener('click', function() {
    saveAttendance();
});

async function saveAttendance() {
    const formData = {
        date: document.getElementById('date').value,
        teacher: document.getElementById('teacherName').value,
        subject: document.getElementById('subject').value,
        time: document.getElementById('classTime').value,
        class: document.getElementById('className').value
    };
    
    // Validate form
    if (!formData.date || !formData.teacher || !formData.subject || !formData.time || !formData.class) {
        showError('Please fill all required fields');
        return;
    }
    
    if (students.length === 0) {
        showError('Please select a class first');
        return;
    }
    
    // Collect attendance data
    const attendanceStudents = students.map(student => {
        const attendanceValue = document.querySelector(`input[name="attendance_${student.id}"]:checked`).value;
        return {
            id: student.id,
            name: student.name,
            present: attendanceValue === 'present'
        };
    });
    
    const attendanceRecord = {
        date: formData.date,
        teacher: formData.teacher,
        subject: formData.subject,
        time: formData.time,
        class: formData.class,
        students: attendanceStudents
    };
    
    try {
        // Load existing attendance data
        const existingData = await loadAttendanceData(formData.class);
        
        // Add new record
        existingData.push(attendanceRecord);
        
        // Save to file (simulate with localStorage for demo)
        localStorage.setItem(`attendance_${formData.class}`, JSON.stringify(existingData));
        
        showSuccess('Attendance saved successfully!');
        
        // Clear form
        setTimeout(() => {
            document.getElementById('attendanceForm').reset();
            document.getElementById('studentsSection').style.display = 'none';
            students = [];
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('date').value = today;
        }, 2000);
        
    } catch (error) {
        showError('Error saving attendance: ' + error.message);
    }
}

async function loadAttendanceData(className) {
    try {
        const data = localStorage.getItem(`attendance_${className}`);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        return [];
    }
}

// Clear form
document.getElementById('clearBtn').addEventListener('click', function() {
    document.getElementById('attendanceForm').reset();
    document.getElementById('studentsSection').style.display = 'none';
    students = [];
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    hideMessages();
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

function hideMessages() {
    document.getElementById('successMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}
