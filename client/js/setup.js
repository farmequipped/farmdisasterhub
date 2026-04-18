const socket = io();

socket.on('serverStarted', (data) => {
    alert(`Server started successfully with ID: ${data.serverId}`);
    window.location.href = '/';
});

socket.on('serverStarted', (data) => {
    alert(`Server started successfully with ID: ${data.serverId}`);
    window.location.href = '/';
});

socket.on('error', (message) => {
    alert(`Error: ${message}`);
});

document.getElementById('startServerBtn').addEventListener('click', () => {
    const serverId = document.getElementById('serverIdInput').value.trim();
    const email = document.getElementById('email').value.trim();
    if (serverId) {
        socket.emit('loadServer', { serverId, email });
    } else {
        alert('Please enter a Server ID.');
    }
});