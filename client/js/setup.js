const socket = io();

socket.emit('checkConfig', {}, (response) => {
    if (response === 'set up') {
        window.location.href = '/';
    }
});

socket.on('serverStarted', (data) => {
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