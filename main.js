// main.js - Corrected for the Multimodal Chat
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

const history = document.getElementById('chat-history');
const input = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const uploadInput = document.getElementById('image-upload');
const folderBtn = document.getElementById('folder-btn');
const status = document.getElementById('status');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');

let pendingImage = null;

// Add message to UI (Handles text and generated AI images)
function addMessage(role, content, isImage = false) {
    const div = document.createElement('div');
    div.className = `msg ${role}`;
    
    if (isImage) {
        const img = new Image();
        img.src = URL.createObjectURL(content);
        img.style.maxWidth = "100%";
        img.style.borderRadius = "8px";
        img.style.marginTop = "10px";
        
        div.innerHTML = `<strong>AI Art:</strong><br>`;
        div.appendChild(img);
        
        const dl = document.createElement('a');
        dl.href = img.src;
        dl.download = 'diego-ai-art.png';
        dl.innerText = ' [Download PNG]';
        dl.style.display = "block";
        dl.style.color = "#28a745";
        div.appendChild(dl);
    } else {
        div.innerText = content;
    }
    
    history.appendChild(div);
    history.scrollTop = history.scrollHeight;
}

// 1. Folder Selection
folderBtn.onclick = async () => {
    try {
        const handle = await window.showDirectoryPicker();
        status.innerText = "Linked: " + handle.name;
        worker.postMessage({ type: 'load_local', handle });
    } catch (e) {
        status.innerText = "Folder access denied or cancelled.";
    }
};

// 2. Image Uploading
document.getElementById('upload-btn').onclick = () => uploadInput.click();
uploadInput.onchange = (e) => {
    pendingImage = e.target.files[0];
    status.innerText = `Image ready: ${pendingImage.name}`;
};

// 3. Send Message
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

// 4. Handle Worker Responses
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