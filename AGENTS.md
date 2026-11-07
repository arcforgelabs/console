# AGENTS.md

Read `VISION.md` and `README.md` first. The shared rules are referenced below; this repo's own rules are in Console safeguards and Read when relevant, at the end.

<!-- arc-forge-org-consistency:start -->
Read the shared Arc Forge instructions before work:
https://github.com/arcforgelabs/tools/blob/main/docs/AGENTS.shared.md

Optional local source: ~/repos/tools/docs/AGENTS.shared.md.
Verify that the local checkout has the origin arcforgelabs/tools before use.
Do not copy the shared rules here.
Keep repository-specific safeguards and document references outside this block.

Common agent workflows: https://github.com/openclaw/agent-skills.
Product repositories own their product-specific skills.
Reusable release workflows: https://github.com/openclaw/release-workflows.
<!-- arc-forge-org-consistency:end -->

## Console safeguards

- Never commit secrets, customer data, hostnames of customer claws or Access audience tags. Use synthetic data (`VITE_DEMO=1`) in tests and screenshots.
- The Worker in `worker/` rejects any `/api/*` request without a valid Cloudflare Access token (`SECURITY.md`).
- Run lint, format check, worker tests, UI tests and both builds before a push.
- Never call the product "deck". Use console and accounts.

## Read when relevant

- **Tests and proof:** the [Arc Forge proof standard](https://github.com/arcforgelabs/platform/blob/main/docs/proof-standard.md) (platform#262). A fix brings a test that is red on the base and green with the fix; Evidence shows the real flow with `VITE_DEMO=1`.
- **Design:** [`DESIGN.md`](DESIGN.md).
- **Security:** [`SECURITY.md`](SECURITY.md).
