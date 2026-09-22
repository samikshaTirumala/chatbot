import asyncio
import os

from fastapi import Body, FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from openai import AsyncOpenAI


SYSTEM_PROMPT = """\
You are a customer-support executive for our
premium streetwear and lifestyle e-commerce brand named BSNKing.

Your job is to identify the customer's main
problem and urgency. Answer them clearly and helpfully.

Use professional, friendly language. If the customer has an issue,
use words like I understand your frustration,
I am really sorry for the inconvenience, and I will help resolve this.

Do not answer any other question which is not
related to product recommendations, product availability,
size or fit questions, order tracking, shipping delays,
returns and refunds, payment issues, account problems,
or company policy queries.
"""

app = FastAPI(title="BSNKing Chat API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = AsyncOpenAI()
model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
history: list[dict[str, str]] = []
history_lock = asyncio.Lock()


@app.post("/api/chat", response_class=PlainTextResponse)
async def chat(message: str = Body(..., media_type="text/plain")) -> str:
    async with history_lock:
        history.append({"role": "user", "content": message})

        api_response = await client.responses.create(
            model=model,
            instructions=SYSTEM_PROMPT,
            input=history,
            store=False,
        )
        answer = api_response.output_text

        history.append({"role": "assistant", "content": answer})
        return answer


@app.delete("/api")
async def clear_chat() -> Response:
    async with history_lock:
        history.clear()
    return Response(status_code=200)
