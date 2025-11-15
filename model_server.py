# model_server.py
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForCausalLM
from huggingface_hub import login
import torch

# Login if your model is private
login("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")

app = FastAPI()

# Load model and tokenizer once at startup
print("Loading model...")
tokenizer = AutoTokenizer.from_pretrained("nishit1945/VSM-LLM")
model = AutoModelForCausalLM.from_pretrained("nishit1945/VSM-LLM")
device = "cuda" if torch.cuda.is_available() else "cpu"
model.to(device)
print("Model loaded successfully.")

class Message(BaseModel):
    prompt: str

@app.post("/generate")
def generate_text(request: Message):
    inputs = tokenizer(request.prompt, return_tensors="pt").to(device)
    outputs = model.generate(
        **inputs,
        max_new_tokens=100,
        do_sample=True,
        temperature=0.7,
        top_p=0.9
    )
    text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return {"response": text}
