import { AutoProcessor, MultiModalityCausalLM, RawImage } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.0';

let processor, model;

self.onmessage = async (e) => {
    const { prompt } = e.data;
    try {
        if (!model) {
            const model_id = "onnx-community/Janus-1.3B-ONNX";
            self.postMessage({ type: 'status', message: 'Downloading Model Weights...' });
            processor = await AutoProcessor.from_pretrained(model_id);
            model = await MultiModalityCausalLM.from_pretrained(model_id, { device: 'webgpu' });
        }

        self.postMessage({ type: 'status', message: 'Generating pixels...' });
        
        // Prepare inputs and generate
        const inputs = await processor(prompt, { chat_template: "text_to_image" });
        const outputs = await model.generate_images({ 
            ...inputs, 
            min_new_tokens: 576, 
            max_new_tokens: 576 
        });

        // Convert the output to a blob (image file)
        const blob = await outputs[0].toBlob();
        self.postMessage({ type: 'done', blob });

    } catch (err) {
        self.postMessage({ type: 'status', message: 'Error: ' + err.message });
    }
};