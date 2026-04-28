# BookCinema Fine-Tuning Pipeline (Unsloth)

This directory contains the tools necessary to specialize the AI Agents (Director, Scriptwriter, Analyst) for professional film production.

## 1. Recommended Models
| Agent | Base Model | Goal |
|-------|------------|------|
| **Scriptwriter** | Llama-3-8B-Instruct | Hollywood screenplay formatting (Fountain/Final Draft) |
| **Director** | [GenDoP](https://github.com/3DTopia/GenDoP) | Precise XYZ camera trajectories & lighting math |
| **Analyst** | Mistral-7B-v0.3 | Narrative extraction & persistent world-building |

## 2. Using Google Colab
Since fine-tuning requires high-VRAM GPUs (A100/H100), we recommend using Google Colab.

### Step-by-Step Instructions:
1. Upload `train_role.py` and your dataset (JSONL) to Google Colab.
2. Install Unsloth:
   ```bash
   pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
   pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
   ```
3. Run the training script:
   ```bash
   python train_role.py --role scriptwriter --dataset ./screenplays.jsonl
   ```

## 3. Dataset Format
Your dataset should be in JSONL format:
```json
{"instruction": "Adapt this chapter into a screenplay scene.", "input": "...", "output": "INT. MANSION - NIGHT..."}
```

## 4. Integration
Once trained, push your model to Hugging Face and update the `LLM_MODEL_ID` in your `server/.env` file to point to your fine-tuned weights.
