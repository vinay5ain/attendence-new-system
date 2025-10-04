// Login functionality
const users = [
    { username: '123', password: '123', role: 'teacher' },
    { username: 'teacher2', password: '456', role: 'teacher' },
    { username: 'admin', password: 'admin', role: 'admin' }
];

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const userType = document.getElementById('userType').value;
    
    // Validate user credentials
    const user = users.find(u => 
        u.username === username && 
        u.password === password && 
        u.role === userType
    );
    
    if (user) {
        // Store user session
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Redirect based on role
        if (user.role === 'teacher') {
            window.location.href = 'student.html';
        } else if (user.role === 'admin') {
            window.location.href = 'admin.html';
        }
    } else {
        document.getElementById('errorMessage').textContent = 'Invalid credentials. Please try again.';
    }
});

// Check if user is already logged in
window.addEventListener('load', function() {
    const currentUser = sessionStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.role === 'teacher') {
            window.location.href = 'student.html';
        } else if (user.role === 'admin') {
            window.location.href = 'admin.html';
        }
    }
});
