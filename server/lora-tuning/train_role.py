from unsloth import FastLanguageModel
import torch
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset

# Configuration
model_name = "unsloth/llama-3-8b-bnb-4bit" # 4bit for efficiency
max_seq_length = 2048
dtype = None # None for auto detection
load_in_4bit = True

# Load Model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = model_name,
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# Add LoRA Adapters
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

# Dataset Template for "Director" Role
director_prompt = """Below is a scene description from a book.
Write a detailed cinematographic shot list including camera trajectories and lighting setups.

### Scene:
{}

### Shot List:
{}"""

def formatting_prompts_func(examples):
    instructions = examples["scene"]
    outputs      = examples["shot_list"]
    texts = []
    for instruction, output in zip(instructions, outputs):
        text = director_prompt.format(instruction, output) + tokenizer.eos_token
        texts.append(text)
    return { "text" : texts, }

# Load your custom production dataset here
# dataset = load_dataset("json", data_files="director_training_data.json", split="train")
# dataset = dataset.map(formatting_prompts_func, batched = True,)

# Training
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    # train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_is_bf16_supported(),
        bf16 = torch.cuda.is_is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

# trainer.train()

# Save LoRA
# model.save_pretrained_lora("director_lora_model")
# tokenizer.save_pretrained("director_lora_model")
