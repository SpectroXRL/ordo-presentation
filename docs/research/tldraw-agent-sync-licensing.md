# tldraw agent starter kit, sync, and SDK licensing

Researched: 2026-11-14. Sources are tldraw's own GitHub repos (raw files on `main`). The `tldraw.dev` site was **not reachable** from the research sandbox (DNS failure), so the live pricing page and rendered docs were not read. The docs are read from their MDX source in the monorepo instead.

Repos:
- Agent template: https://github.com/tldraw/agent-template (last commit seen 2026-10-28, sha `b7ade5f`)
- SDK monorepo: https://github.com/tldraw/tldraw

## 1. Agent starter kit architecture (verified)

- **Layout:** three areas. `client/` is React, agent logic and utils in the browser. `worker/` is a Cloudflare Worker that handles model requests and prompt building. `shared/` holds types and schemas used by both. ([README](https://raw.githubusercontent.com/tldraw/agent-template/main/README.md), "Architecture overview")
- **Stack:** `tldraw` and `@tldraw/tlschema` ^5.6.0, Vercel AI SDK `ai` ^5, `@ai-sdk/{anthropic,google,openai}`, `zod` ^4. ([package.json](https://github.com/tldraw/agent-template/blob/main/package.json))
- **Worker:**
  - `POST /stream` routes to a Durable Object (`AgentDurableObject`) and returns `text/event-stream`. The DO id is the fixed name `"anonymous"`; a code comment says per-user ids are a future idea. ([worker/worker.ts](https://github.com/tldraw/agent-template/blob/main/worker/worker.ts), [worker/routes/stream.ts](https://github.com/tldraw/agent-template/blob/main/worker/routes/stream.ts))
  - CORS is `*`, and there is no auth.
  - `AgentService` creates the OpenAI, Anthropic and Google providers from env API keys and calls `streamText`. ([worker/do/AgentService.ts](https://github.com/tldraw/agent-template/blob/main/worker/do/AgentService.ts))
  - Anthropic gets an ephemeral cache breakpoint on the system prompt. Where the model supports it, the assistant turn is prefilled with `{"actions": [{"_type":` to force JSON output.
  - The streamed text is parsed incrementally (`closeAndParseJson.ts`) into `Streaming<AgentAction>` events.
- **Mode system:** `client/modes/AgentModeDefinitions.ts` defines modes. Each active mode has `parts` (what the agent can see) and `actions` (what it can do). Lifecycle hooks (`onEnter`, `onExit`, `onPromptStart/End/Cancel`) live in `AgentModeChart.ts`. Utils self-register via `registerPromptPartUtil` / `registerActionUtil`, and mode-scoped actions use `forModes`. (README)
- **Public API:** `agent.prompt()`, `agent.request()`, `agent.schedule()`, `agent.interrupt()`, `agent.cancel()`, `agent.reset()`. The agent loops until its scheduled work is done. (README)

## 2. How prompts become canvas actions (verified)

1. **Client builds the prompt parts.** Each `PromptPartUtil.getPart()` collects one piece of context. Parts present in the repo's `client/parts/` include:
   - messages, selected shapes, user and agent viewport bounds, and chat history
   - blurry (simplified) shapes in the viewport, peripheral shape clusters, and the screenshot
   - context items, user action history, the todo list, canvas lints, mode, model name and time
   - The README lists the same sources: message, selection, viewport, user-added context, recent user actions, screenshot, simplified shapes, peripheral clusters, history and lints.
2. **Shapes are simplified for the model.** There are `BlurryShape` (viewport overview), `FocusedShape` (detailed, for context items) and peripheral cluster formats. Positions are offset per chat and numbers are rounded, then restored with helper methods. (README sections on positions and shapes)
3. **Worker turns parts into messages.** `PromptPartDefinition.buildContent` and `priority` decide the order. `buildSystemPrompt` embeds the action JSON schemas generated from zod `AgentActionSchemas`.
4. **The model streams JSON `{"actions":[{"_type":...}]}`.** Each action has a `_type` literal, deliberately first. Types in `shared/schema/AgentActionSchemas.ts` are: `add-detail`, `align`, `bringToFront`, `clear`, `count`, `countryInfo`, `create`, `delete`, `distribute`, `label`, `message`, `move`, `pen`, `place`, `resize`, `review`, `rotate`, `sendToBack`, `setMyView`, `stack`, `think`, `update-todo-list`, `update`, and `unknown`.
5. **Client applies actions as they stream.**
   - `AgentActionUtil.sanitizeAction()` fixes hallucinated ids and values (`ensureShapeIdExists` and similar helpers).
   - `applyAction()` mutates the tldraw `Editor` once `action.complete` is true.
   - `agent.schedule()` triggers follow-up turns, for example to review work or return external API data.

## 3. Image support

- **What the agent sees (verified):**
  - `ScreenshotPartUtil` renders the shapes in the request bounds with `editor.toImage` as a JPEG data URL, capped at 8000px on its longest side, and sends it as an image part.
  - The worker's `buildMessages.ts` converts any content string starting with `data:image/` into an AI SDK `{type:'image'}` message part.
  - The prompt text says the screenshot is "not a reference image".
  - So the model must be vision-capable.
- **What the agent can do with images (verified absence):** the default action list has no image-creation or upload action. The `create`, `place` and `pen` actions are for shapes and strokes.
- **What the SDK supports generally (verified):**
  - Image and video shapes are SDK features (tldraw README).
  - `/docs/ai` shows creating an `AssetRecordType` asset plus an `image` shape for generated images. ([ai.mdx](https://github.com/tldraw/tldraw/blob/main/apps/docs/content/docs/ai.mdx))
  - Sibling starter kits (Chat, Image pipeline) target image workflows. (tldraw README)
- **Uncertain:** whether user-dropped images can be passed to the agent as context. I found no image-specific context item in `ContextItem.ts` (I only grepped for "image"), so treat it as unsupported until tested.

## 4. Sync deployment options (verified, from [sync.mdx](https://github.com/tldraw/tldraw/blob/main/apps/docs/content/docs/sync.mdx))

- **Packages:** `@tldraw/sync` (client, `useSync({uri, assets})`) and `@tldraw/sync-core` (server, `TLSocketRoom`).
- **Hosted demo:** suitable for prototyping only. "To use tldraw sync in production, you will need to host it yourself."
- **Option A (recommended): the Cloudflare template** ([templates/sync-cloudflare](https://github.com/tldraw/tldraw/tree/main/templates/sync-cloudflare)).
  - One Durable Object per room, with state persisted in the DO's built-in SQLite storage.
  - R2 stores images and videos.
  - Not provided: authentication and authorization, rate and size limits on asset uploads, snapshot history, and room listing or search.
- **Option B: any JS server with WebSockets.** Use `TLSocketRoom` plus `InMemorySyncStorage` (lost on restart unless you save snapshots via `onChange`) or `SQLiteSyncStorage` (recommended for production). SQLite wrappers exist for Durable Objects (`DurableObjectSqliteSyncWrapper`) and Node (`NodeSqliteWrapper`, better-sqlite3 or `node:sqlite`). Reference: [templates/simple-server-example](https://github.com/tldraw/tldraw/tree/main/templates/simple-server-example).
- **Constraint:** only one `TLSocketRoom` globally per room, otherwise users diverge. Cloudflare DOs enforce this.
- **Hibernation:** supported via `onSessionSnapshot`, `handleSocketResume` and `clientTimeout: Infinity`.
- **Also needed:** an asset store (`TLAssetStore`) and, for bookmark shapes, an unfurl service.
- **Sync is not in the agent template.** The template's DO is only the model proxy. Combining agent and sync means wiring them yourself, which I did not verify.

## 5. SDK license, pricing, open-source use

**License (verified, [LICENSE.md](https://github.com/tldraw/tldraw/blob/main/LICENSE.md) and [license.mdx](https://github.com/tldraw/tldraw/blob/main/apps/docs/content/community/license.mdx)):**
- The SDK is under the custom "tldraw license". It is source-available and **not** open source.
- The default terms permit use in Development Environments only. Production use is prohibited without a license key.
- Production use needs one of three licenses:
  - **Trial:** free for 100 days, one per commercial unit. It pings tldraw with a hash of the key.
  - **Commercial:** sold through sales. Startup pricing "may be available for small teams".
  - **Hobby:** discretionary and non-commercial. The "made with tldraw" watermark must be shown.
- Keys are passed as `<Tldraw licenseKey="..."/>`, validated client-side, and work offline. Commercial and hobby keys send no data by default. Commercial keys issued without a fixed domain are tracked like trial keys.
- The license forbids disabling or interfering with key enforcement and requires keeping notices. It also forbids distributing the SDK as a standalone product.
- **Open source use:** you may include tldraw in an open-source project, but the SDK stays under its own license. Downstream users need their own trial, commercial or hobby license for production. The trademark guidelines also apply.
- **Starter kits and templates are MIT-licensed** (tldraw README; `agent-template/LICENSE.md` is MIT, © 2024 tldraw Inc.). The `tldraw` dependency they pull in is still under the tldraw license.

**Pricing:** **not verified.** The docs only say "discuss pricing" with sales and point to https://tldraw.dev/pricing, which I could not load. No dollar figures are cited here. Check that page and https://tldraw.dev/get-a-license/plans before quoting numbers.

## Gaps and uncertainties
- No exact pricing, and no confirmation of the plan tiers or the startup discount terms.
- The docs were read as MDX on `main`, and the rendered site may differ. `license.mdx` is dated 9/13/2023 in its front matter, but the content is current on `main`.
- `LICENSE.md` could not be tied to a specific SDK release. Confirm with the license shipped in your installed `tldraw` version.
- The image-context question in section 3 and the agent-plus-sync integration in section 4 are unverified.
