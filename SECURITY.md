# Security

Report a vulnerability through GitHub private vulnerability reporting on this
repo (Security tab, "Report a vulnerability"). Do not open a public issue.

Scope: the console UI and the Worker in `worker/`. The Worker must reject any
`/api/*` request without a valid Cloudflare Access token.
