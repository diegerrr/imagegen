const worker = new Worker('./worker.js', { type: 'module' });
const promptInput = document.getElementById('prompt');
const genBtn = document.getElementById('gen-btn');
const dlBtn = document.getElementById('dl-btn');
const status = document.getElementById('status');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

genBtn.onclick = () => {
    const text = promptInput.value.trim();
    if (!text) return;
    genBtn.disabled = true;
    dlBtn.style.display = 'none';
    status.innerText = "Loading AI... (First time takes a moment)";
    worker.postMessage({ prompt: text });
};

worker.onmessage = (e) => {
    const { type, message, blob } = e.data;
    if (type === 'status') {
        status.innerText = message;
    } else if (type === 'done') {
        status.innerText = "Complete!";
        genBtn.disabled = false;
        dlBtn.style.display = 'inline-block';
        
        // Load the blob into the canvas
        const img = new Image();
        img.onload = () => {
            canvas.style.display = 'block';
            ctx.drawImage(img, 0, 0);
        };
        img.src = URL.createObjectURL(blob);
        
        // Setup download button
        dlBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = img.src;
            a.download = 'ai-image.png';
            a.click();
        };
    }
};