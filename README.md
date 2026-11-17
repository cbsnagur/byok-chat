# BYOK Chat

A single-file, bring-your-own-endpoint chat interface for LLMs. Enter a base URL, an API key and a model, and chat. It has no backend, no build step and no tracking: requests go straight from your browser to the endpoint you configure.

**Use it now:** https://cbsnagur.github.io/byok-chat/, or download `index.html` and open it in a browser.

## Features

- Works with any **OpenAI-compatible** endpoint (`/chat/completions`), including OpenRouter, Groq, Together, Mistral, DeepSeek, Gemini's OpenAI-compatible endpoint, LiteLLM, vLLM, Ollama, LM Studio and llama.cpp.
- Also supports the **OpenAI Responses** API (`/responses`) and the **Anthropic Messages** API (`/messages`).
- Streams replies and shows reasoning or thinking text when the model sends it.
- Renders markdown, with copy buttons for code blocks and whole replies.
- Lets you attach images and text files. Images are sent as data URLs; text files are inlined into the prompt.
- **Load list** fetches `GET {base}/models` so you can pick a model.
- Optional reasoning effort and max output token settings. Neither is sent unless you set it.
- Settings are saved in your browser. The API key is saved only if you tick "Keep the key".

## Setup

Open **Settings** and fill in:

| Field | Example |
|---|---|
| Base URL | `https://your-endpoint.example/v1`: everything before `/chat/completions` |
| API key | your key; leave it empty for local servers that don't need one |
| Model | the model id, typed or picked via **Load list** |
| API shape | `OpenAI-compatible` unless your endpoint is the OpenAI Responses or Anthropic Messages API |

No endpoint, key or model is built in. You supply all of them.

## "The request never reached the endpoint" (CORS)

Browsers only let a page call an API that sends CORS headers. Many hosted APIs send them. Some APIs and corporate gateways don't, and local servers often need them switched on (for Ollama: `OLLAMA_ORIGINS=*`).

If your endpoint blocks browser requests, run the bundled zero-dependency proxy (Node 18+):

```bash
node proxy.mjs https://your-endpoint.example/v1
```

Then set **Base URL** to `http://localhost:8787`. The proxy listens on `127.0.0.1` only, forwards your request (including the auth header) unchanged, and adds CORS headers to the response. Use `PORT=9000 node proxy.mjs …` to change the port.

Note: the hosted GitHub Pages copy uses `https`. Some browsers (Safari in particular) block it from calling plain `http://` endpoints other than `localhost`. In that case, open your downloaded `index.html` instead.

## Security notes

- Your key is sent only to the base URL you enter. It is kept in memory unless you tick "Keep the key", which stores it in this browser's `localStorage`.
- Anyone who can run scripts on the page's origin could read a stored key. Don't tick "Keep the key" on shared machines. If you fork this repo, don't add third-party scripts.
- The only other request the page makes is to Google Fonts for typefaces. Delete the three `<link>` lines in `<head>` if you'd rather not make it.

## License

MIT
