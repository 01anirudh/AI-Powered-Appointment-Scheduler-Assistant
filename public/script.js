const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const messagesDiv = document.getElementById('messages');
const appointmentsList = document.getElementById('appointmentsList');
const uploadBtn = document.getElementById('uploadBtn');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const fileNameSpan = document.getElementById('fileName');
const removeImageBtn = document.getElementById('removeImage');

let currentImage = null;

// Initialize
fetchAppointments();

// Event Listeners
sendBtn.addEventListener('click', handleSend);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
    }
});

uploadBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        currentImage = e.target.files[0];
        fileNameSpan.textContent = currentImage.name;
        imagePreview.classList.remove('hidden');
        userInput.placeholder = "Add a caption or just click send...";
    }
});

removeImageBtn.addEventListener('click', () => {
    resetImage();
});

// Functions
async function handleSend() {
    const text = userInput.value.trim();

    if (!text && !currentImage) return;

    // Add user message
    addMessage(text || (currentImage ? "[Uploaded Image]" : ""), 'user');
    userInput.value = '';

    // Show loading state
    const loadingId = addMessage('Thinking...', 'bot');
    const botMsgDiv = document.querySelector(`[data-id="${loadingId}"]`);

    try {
        let response;
        if (currentImage) {
            const formData = new FormData();
            formData.append('image', currentImage);

            // Reset image immediately for better UX
            resetImage();

            response = await fetch('/api/upload', { method: 'POST', body: formData });
        } else {
            response = await fetch('/api/parse-text', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
        }

        const data = await response.json();

        // Remove loading message
        if (botMsgDiv) botMsgDiv.remove();

        // Show result in chat (Standard clean response)
        // Show result in chat (Standard clean response)
        if (data.status === 'ok' || data.status === 'success') {
            console.log('🔍 Debug Info:', {
                raw_text: data.raw_text,
                entities: data.entities,
                normalized: data.normalized,
                confidence: data.entities_confidence
            });

            const { date, time, department } = data.appointment;
            const dept = department;

            addMessage(`✅ <strong>Appointment Scheduled!</strong><br>
                        📅 Date: ${date}<br>
                        ⏰ Time: ${time}<br>
                        🏥 Dept: ${dept}<br>
                        <small style="color:#aaa; font-size:0.8em">Confidence: ${(data.entities_confidence * 100).toFixed(0)}%</small>`, 'bot');
        } else if (data.status === 'needs_clarification') {
            addMessage(`⚠️ <strong>Clarification Needed</strong><br>${data.message}`, 'bot');
        } else {
            addMessage(`❌ <strong>Error</strong><br>${data.error || 'Unknown error'}`, 'bot');
        }

        fetchAppointments();

    } catch (error) {
        console.error(error);
        if (botMsgDiv) botMsgDiv.querySelector('.message-content').textContent = "Error connecting to server.";
    }
}

function addMessage(text, type) {
    const id = Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}`;
    msgDiv.setAttribute('data-id', id);
    msgDiv.innerHTML = `<div class="message-content">${text}</div>`;
    messagesDiv.appendChild(msgDiv);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    return id;
}

function resetImage() {
    currentImage = null;
    imageInput.value = '';
    imagePreview.classList.add('hidden');
    userInput.placeholder = "Type your request... (e.g., 'Cardiology tomorrow at 10am')";
}

async function fetchAppointments() {
    try {
        const res = await fetch('/api/appointments');
        const data = await res.json();

        if (data.appointments && data.appointments.length > 0) {
            appointmentsList.innerHTML = data.appointments.map(appt => {
                const date = appt.normalizedData.date || 'TBD';
                const time = appt.normalizedData.time || 'TBD';
                const dept = appt.normalizedData.department || 'General';
                const statusClass = appt.status === 'success' ? 'status-success' : 'status-clarification';

                return `
                    <div class="appt-card">
                        <div class="appt-header">
                            <span class="appt-dept">${dept}</span>
                            <span class="appt-time">${time}</span>
                        </div>
                        <div class="appt-date">${date}</div>
                        <div class="appt-status ${statusClass}">${appt.status.replace('_', ' ')}</div>
                    </div>
                `;
            }).join('');
        } else {
            appointmentsList.innerHTML = '<div class="empty-state">No appointments yet</div>';
        }
    } catch (e) {
        console.error("Failed to fetch appointments", e);
    }
}
