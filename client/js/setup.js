/* Created by Dominik Honzak */
const socket = io();

const tab = function(tabIndex) {
  const classes = document.getElementsByClassName("tab");
  const shown = document.getElementsByClassName("show");
  shown[0].classList.remove("show");
  classes[tabIndex].classList.add("show");
};

const updateEmails = (emailList) => {
    document.getElementById('currentEmails').innerHTML = "";
    if (emailList.length > 0) {
        for (const email of emailList) {
            const emailElem = document.createElement('div');
            emailElem.textContent = email;
            emailElem.classList.add('email-item');
            emailElem.onclick = () => {
                const confirmDelete = confirm(`Are you sure you want to remove ${email} from the notification list?`);
                if (confirmDelete) {
                    socket.emit('addEmail', "remove", email);
                }
            };
            document.getElementById('currentEmails').appendChild(emailElem);
        }
    } else {
        document.getElementById('currentEmails').textContent = "None";
    }
};

socket.emit('checkServers');

socket.on('checkServers', (data) => {
    tab(1);
    document.getElementById('serverNumber').textContent = data.servers.length || "0";
    document.getElementById('serverIdInput').value = data.hub || '';
    updateEmails(data.email);
    if (data.email.length == 0) {
        document.getElementById('emailAddon').style.display = 'block';
    }
});

socket.on('serverStarted', (data) => {
    window.location.href = '/';
});

socket.on('addEmail', (data) => {
    updateEmails(data.email);
});

socket.on('error', (message) => {
    alert(`Error: ${message}`);
});

document.getElementById('startServerBtn').addEventListener('click', () => {
    const serverId = document.getElementById('serverIdInput').value.trim();
    const email = document.getElementById('emailAddon').value.trim();
    if (serverId) {
        socket.emit('loadServer', { serverId, email });
    } else {
        alert('Please enter a Server ID.');
    }
});

document.getElementById('addEmailBtn').addEventListener('click', () => {
    const email = document.getElementById('email').value.trim();
    if (email) {
        socket.emit('addEmail', "add", email);
        document.getElementById('email').value = '';
    } else {
        alert('Please enter an email address.');
    }
});

