import { AutoProcessor, MultiModalityCausalLM, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

let processor, model;

self.onmessage = async (e) => {
    const data = e.data;

    if (data.type === 'load_local') {
        env.allowRemoteModels = false;
        env.localModelPath = data.handle;
        self.postMessage({ type: 'status', message: 'Local folder linked!' });
        return;
    }

    if (data.type === 'generate') {
        try {
            if (!model) {
                const model_id = "onnx-community/Janus-1.3B-ONNX";
                const progress_callback = (p) => {
                    if (p.status === 'progress') {
                        self.postMessage({ type: 'progress', percent: p.progress.toFixed(1) });
                    }
                };
                processor = await AutoProcessor.from_pretrained(model_id, { progress_callback });
                model = await MultiModalityCausalLM.from_pretrained(model_id, { device: 'webgpu', progress_callback });
            }

            self.postMessage({ type: 'status', message: 'Generating...' });
            const inputs = await processor(data.prompt, { chat_template: "text_to_image" });
            const outputs = await model.generate_images({ ...inputs, max_new_tokens: 576 });

            const blob = await outputs[0].toBlob();
            self.postMessage({ type: 'done', blob });
        } catch (err) { self.postMessage({ type: 'status', message: 'Error: ' + err.message }); }
    }
};