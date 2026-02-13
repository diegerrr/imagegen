const worker = new Worker('./worker.js', { type: 'module' });
const promptInput = document.getElementById('prompt');
const genBtn = document.getElementById('gen-btn');
const folderBtn = document.getElementById('folder-btn');
const dlBtn = document.getElementById('dl-btn');
const status = document.getElementById('status');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let currentImgURL = null;

folderBtn.onclick = async () => {
    try {
        const handle = await window.showDirectoryPicker();
        status.innerText = "Linked: " + handle.name;
        worker.postMessage({ type: 'load_local', handle });
    } catch (e) { status.innerText = "Cancelled."; }
};

genBtn.onclick = () => {
    const text = promptInput.value.trim();
    if (!text) return;
    genBtn.disabled = true;
    dlBtn.disabled = true;
    dlBtn.style.opacity = "0.5";
    worker.postMessage({ type: 'generate', prompt: text });
};

worker.onmessage = (e) => {
    const data = e.data;
    if (data.type === 'progress') {
        progressContainer.style.display = 'block';
        progressBar.style.width = data.percent + '%';
        status.innerText = `Downloading Model: ${data.percent}%`;
    } else if (data.type === 'status') {
        status.innerText = data.message;
        if (data.message === 'Generating...') progressContainer.style.display = 'none';
    } else if (data.type === 'done') {
        status.innerText = "Complete!";
        genBtn.disabled = false;
        dlBtn.disabled = false;
        dlBtn.style.opacity = "1";
        dlBtn.style.cursor = "pointer";

        if (currentImgURL) URL.revokeObjectURL(currentImgURL);
        currentImgURL = URL.createObjectURL(data.blob);
        
        const img = new Image();
        img.onload = () => { canvas.style.display = 'block'; ctx.drawImage(img, 0, 0); };
        img.src = currentImgURL;

        dlBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = currentImgURL;
            a.download = 'diego-ai-art.png';
            a.click();
        };
    }
};