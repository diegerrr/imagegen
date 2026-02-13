const worker = new Worker('./worker.js', { type: 'module' });
const history = document.getElementById('chat-history');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const uploadBtn = document.getElementById('image-upload');
const status = document.getElementById('status');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');

let pendingImage = null;

// Add message to UI
function addMessage(role, content, isImage = false) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    if (isImage) {
        const img = new Image();
        img.src = URL.createObjectURL(content);
        img.onclick = () => window.open(img.src);
        div.innerHTML = `<strong>AI Art:</strong><br>`;
        div.appendChild(img);
        // Add a download link automatically
        const dl = document.createElement('a');
        dl.href = img.src;
        dl.download = 'ai-art.png';
        dl.innerText = ' [Download]';
        dl.style.color = '#28a745';
        div.appendChild(dl);
    } else {
        div.innerText = content;
    }
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

// File Upload
document.getElementById('upload-btn').onclick = () => uploadBtn.click();
uploadBtn.onchange = (e) => {
    pendingImage = e.target.files[0];
    status.innerText = `Image ready: ${pendingImage.name}`;
};

// Local Folder
document.getElementById('folder-btn').onclick = async () => {
    try {
        const handle = await window.showDirectoryPicker();
        worker.postMessage({ type: 'load_local', handle });
    } catch (e) { status.innerText = "Cancelled."; }
};

// Send Message
sendBtn.onclick = () => {
    const text = input.value.trim();
    if (!text && !pendingImage) return;

    addMessage('user', text || "Sent an image");
    sendBtn.disabled = true;
    
    worker.postMessage({ 
        type: 'generate', 
        prompt: text, 
        image: pendingImage 
    });
    
    input.value = '';
    pendingImage = null;
};

worker.onmessage = (e) => {
    const data = e.data;
    if (data.type === 'progress') {
        progressContainer.style.display = 'block';
        progressBar.style.width = data.percent + '%';
        status.innerText = `Downloading Model: ${data.percent}%`;
    } else if (data.type === 'status') {
        status.innerText = data.message;
        if (data.message === 'Processing...') progressContainer.style.display = 'none';
    } else if (data.type === 'done') {
        sendBtn.disabled = false;
        if (data.mode === 'image') {
            addMessage('ai', data.blob, true);
        } else {
            addMessage('ai', data.text);
        }
    }
};