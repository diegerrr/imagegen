// main.js
const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

// We wait for the DOM to be ready to avoid "null" errors
window.addEventListener('DOMContentLoaded', () => {
    const history = document.getElementById('chat-history');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const uploadInput = document.getElementById('image-upload');
    const folderBtn = document.getElementById('folder-btn');
    const status = document.getElementById('status');
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = document.getElementById('progress-container');

    let pendingImage = null;

    // UI Message Handler
    function addMessage(role, content, isImage = false) {
        const div = document.createElement('div');
        div.className = `msg ${role}`;
        
        if (isImage) {
            const img = new Image();
            img.src = URL.createObjectURL(content);
            img.style.maxWidth = "100%";
            img.style.borderRadius = "8px";
            div.innerHTML = `<strong>AI Generated:</strong><br>`;
            div.appendChild(img);
            
            // Download link for the generated image
            const dl = document.createElement('a');
            dl.href = img.src;
            dl.download = 'diego-ai-art.png';
            dl.innerText = ' [Download]';
            dl.style.color = '#28a745';
            div.appendChild(dl);
        } else {
            div.innerText = content;
        }
        history.appendChild(div);
        history.scrollTop = history.scrollHeight;
    }

    // Folder Logic
    folderBtn.onclick = async () => {
        try {
            const handle = await window.showDirectoryPicker();
            status.innerText = "Linked: " + handle.name;
            worker.postMessage({ type: 'load_local', handle });
        } catch (e) { status.innerText = "Access denied."; }
    };

    // Upload Logic
    document.getElementById('upload-btn').onclick = () => uploadInput.click();
    uploadInput.onchange = (e) => {
        pendingImage = e.target.files[0];
        status.innerText = `Ready: ${pendingImage.name}`;
    };

    // Send Logic
    sendBtn.onclick = () => {
        const text = input.value.trim();
        if (!text && !pendingImage) return;

        addMessage('user', text || "Shared an image");
        sendBtn.disabled = true;
        
        worker.postMessage({ type: 'generate', prompt: text, image: pendingImage });
        input.value = '';
        pendingImage = null;
    };

    // Worker Listener
    worker.onmessage = (e) => {
        const data = e.data;
        if (data.type === 'progress') {
            progressContainer.style.display = 'block';
            progressBar.style.width = data.percent + '%';
            status.innerText = `Downloading: ${data.percent}%`;
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
});