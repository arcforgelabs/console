# AGENTS.md

Read `VISION.md` and `README.md` first.

- Work starts from an issue. A pull request links it with `Closes #` or `Related: #`.
- Use `.github/pull_request_template.md`. Keep What Problem This Solves, User
  Impact, Why This Change Was Made and Evidence current. Evidence names the
  command, the commit, the result and what was not run.
- Never commit secrets, customer data, hostnames of customer claws or Access
  audience tags. Use synthetic data (`VITE_DEMO=1`) in tests and screenshots.
- Run lint, format check, worker tests, UI tests and both builds before a push.
- Never call the product "deck". Use console and accounts.
- Before you write or change code or tests, read the Arc Forge proof
  standard: https://github.com/arcforgelabs/platform/blob/main/docs/proof-standard.md
  (platform#262). Every test passes the value gate. A fix brings a test that is
  red on the base and green with the fix. Evidence shows the real flow with
  `VITE_DEMO=1`.
- Design rules: `DESIGN.md`.
