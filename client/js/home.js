const socket = io();

socket.on('dataUpdate', (data) => {
    const statsDiv = document.getElementById('stats');
    statsDiv.innerHTML = '<h2>Server Stats</h2>';
    const alertsDiv = document.getElementById('alerts');
    alertsDiv.innerHTML = '<h2>Alerts</h2>';

    for (const [serverId, serverData] of Object.entries(data.servers)) {
        if (serverData.stats.predicted_class !== 0) {
            alertsDiv.innerHTML += `<div><p><strong>${serverId}:</strong> ${new Date().toLocaleString()}: Disaster predicted: class ${serverData.stats.predicted_class} (confidence: ${serverData.stats.confidence ? serverData.stats.confidence.toFixed(2) : 'N/A'})</p></div>`;
        }
        statsDiv.innerHTML += `
            <h3>Server: ${serverId}</h3>
            <p>Temperature: ${serverData.stats.temperature ? serverData.stats.temperature.toFixed(2) : 'N/A'}</p>
            <p>Humidity: ${serverData.stats.humidity ? serverData.stats.humidity.toFixed(2) : 'N/A'}</p>
            <p>Predicted Class: ${serverData.stats.predicted_class || 'N/A'}</p>
            <p>Confidence: ${serverData.stats.confidence ? serverData.stats.confidence.toFixed(2) : 'N/A'}</p>
        `;

        serverData.alerts.forEach(alert => {
            alertsDiv.innerHTML += `<p><strong>${serverId}:</strong> ${alert.timestamp}: ${alert.message} (confidence: ${alert.confidence})</p>`;
        });
    }
});