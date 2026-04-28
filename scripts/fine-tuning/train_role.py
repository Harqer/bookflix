from unsloth import FastLanguageModel
import torch
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset
import argparse

def train(role, dataset_path, output_dir):
    max_seq_length = 2048
    dtype = None # None for auto detection. Float16 for Tesla T4, V100, Bfloat16 for Ampere+
    load_in_4bit = True # Use 4bit quantization to reduce memory usage.

    # 1. Load Model
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = "unsloth/llama-3-8b-instruct-bnb-4bit",
        max_seq_length = max_seq_length,
        dtype = dtype,
        load_in_4bit = load_in_4bit,
    )

    # 2. Add LoRA Adapters
    model = FastLanguageModel.get_peft_model(
        model,
        r = 16, # Rank
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                          "gate_proj", "up_proj", "down_proj",],
        lora_alpha = 16,
        lora_dropout = 0,
        bias = "none",
        use_gradient_checkpointing = "unsloth",
        random_state = 3407,
        use_rslora = False,
        loftq_config = None,
    )

    # 3. Load Dataset
    dataset = load_dataset("json", data_files = dataset_path, split = "train")

    # 4. Define Trainer
    trainer = SFTTrainer(
        model = model,
        tokenizer = tokenizer,
        train_dataset = dataset,
        dataset_text_field = "text",
        max_seq_length = max_seq_length,
        dataset_num_proc = 2,
        packing = False, # Can make training 5x faster for short sequences.
        args = TrainingArguments(
            per_device_train_batch_size = 2,
            gradient_accumulation_steps = 4,
            warmup_steps = 5,
            max_steps = 60, # Adjust based on dataset size
            learning_rate = 2e-4,
            fp16 = not torch.cuda.is_bf16_supported(),
            bf16 = torch.cuda.is_bf16_supported(),
            logging_steps = 1,
            optim = "adamw_8bit",
            weight_decay = 0.01,
            lr_scheduler_type = "linear",
            seed = 3407,
            output_dir = output_dir,
        ),
    )

    # 5. Train
    trainer.train()

    # 6. Save Model
    model.save_pretrained(f"{output_dir}_lora")
    tokenizer.save_pretrained(f"{output_dir}_lora")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--role", type=str, required=True, help="scriptwriter, director, or analyst")
    parser.add_argument("--dataset", type=str, required=True, help="Path to JSONL dataset")
    parser.add_argument("--output", type=str, default="./outputs", help="Output directory")
    args = parser.parse_args()

    train(args.role, args.dataset, args.output)
