from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

app = FastAPI()

# Servir arquivos estáticos (frontend)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Carregar modelo T5
model_name = "mrm8488/t5-base-finetuned-question-generation-ap"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name)

@app.get("/")
async def root():
    return FileResponse("static/index.html")

@app.post("/chat")
async def chat(request: Request):
    data = await request.json()
    prompt = data.get("inputs")
    if not prompt:
        return JSONResponse({"error": "Prompt não fornecido."}, status_code=400)
    # Gera resposta
    input_ids = tokenizer.encode(prompt, return_tensors="pt")
    with torch.no_grad():
        output_ids = model.generate(input_ids, max_length=256)
    generated = tokenizer.decode(output_ids[0], skip_special_tokens=True)
    # Retorna no formato esperado pelo frontend
    return {
        "choices": [
            {"message": {"content": generated}}
        ]
    } 