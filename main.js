const worker = new Worker('./worker.js', { type: 'module' });
const promptInput = document.getElementById('prompt');
const genBtn = document.getElementById('gen-btn');
const folderBtn = document.getElementById('folder-btn');
const dlBtn = document.getElementById('dl-btn');
const status = document.getElementById('status');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// 1. Handle Local Folder Linking
folderBtn.onclick = async () => {
    try {
        const handle = await window.showDirectoryPicker();
        status.innerText = "Linked: " + handle.name;
        worker.postMessage({ type: 'load_local', handle });
    } catch (e) { status.innerText = "Folder selection cancelled."; }
};

// 2. Handle Generation
genBtn.onclick = () => {
    const text = promptInput.value.trim();
    if (!text) return;
    genBtn.disabled = true;
    dlBtn.style.display = 'none';
    status.innerText = "Initializing AI...";
    worker.postMessage({ type: 'generate', prompt: text });
};

// 3. Receive result from Worker
worker.onmessage = (e) => {
    const { type, message, blob } = e.data;
    if (type === 'status') {
        status.innerText = message;
    } else if (type === 'done') {
        status.innerText = "Complete!";
        genBtn.disabled = false;
        dlBtn.style.display = 'inline-block';
        
        const img = new Image();
        img.onload = () => {
            canvas.style.display = 'block';
            ctx.drawImage(img, 0, 0);
        };
        img.src = URL.createObjectURL(blob);
        
        dlBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = img.src;
            a.download = 'ai-image.png';
            a.click();
        };
    }
};