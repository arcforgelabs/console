# Settled invite screenshots

Related: #32 and PR #36.

Source: 01bb3efcd7516b232b8dccc610fbef38a50d176c, VITE_DEMO=1.
The capture server used its own locked dependencies, not a linked node_modules.
Each capture waits for document fonts and sheet animations.
The capture checks the loaded Geist font, viewport bounds and failed requests.
Images contain synthetic data at 1280x900 and 390x844, in light and dark themes.
No screenshot baseline comparison ran.

This branch holds evidence only. All four draft source heads stay unchanged.
Required source gate evidence is reused from the identical source commit.
No merge, deployment, customer access or native delivery occurred.
