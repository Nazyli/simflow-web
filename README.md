# SimFlow Web

React/Vite interface for configuring and running SimFlow workflows.

## Routes

- `/studio` manages master data, draft workflow graphs, node configuration,
  transitions, validation, and publication.
- `/simulation` starts a published version for a `participant_id` and renders
  chat, email, call, or document events.

## Development

Set `VITE_API_BASE_URL` to the FastAPI `/api/v1` address when it differs from
the development default, then run:

```powershell
npm install
npm run dev
```

The graph editor stores node configuration as JSON-compatible data. An action
with **Dummy AI** enabled uses fixture JSON such as
`{"responses":["Hello"]}` or `{"classifications":[{"label":"pass","score":0.9}]}`.
