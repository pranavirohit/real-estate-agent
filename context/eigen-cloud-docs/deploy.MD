Skip to main content
EigenLayer Logo
EigenCloud
AgentKit
EigenCompute
EigenLayer
EigenDA

Search
ctrl
K
Get Started
EigenCompute Overview
Quickstart
Deploy Your Agent
Billing
Sample Apps
How To
Set up
Migrate to ecloud CLI
Create and use authentication keys
Build
Use app wallet
Use ecloud SDK
Use existing image
Attested API example
Persistent storage
Verifiable Builds
Build from verifiable source
Deploy
Configure TLS
Expose ports
Troubleshoot deployment
Operate
Operate application
Verify trust guarantees
Concepts
Reference

Copy for LLM
Get StartedDeploy Your Agent
Deploy Your Agent on EigenCloud
Deploy your agent to a Trusted Execution Environment on EigenCloud using Claude Code and the EigenCompute agent skill.

Install the skill
mkdir -p .claude/skills && curl -o .claude/skills/ecloud.md \
  https://raw.githubusercontent.com/Layr-Labs/skill.md/master/ecloud/SKILL.md

The skill source is at Layr-Labs/skill.md — it works with Claude Code and any agent that supports the Agent Skills open standard.

Prerequisites
Before deploying, ensure you have:

Docker installed and logged in (docker login)
ecloud CLI: npm install -g @layr-labs/ecloud-cli
Sepolia ETH for testnet, or mainnet ETH for production
An EigenCompute subscription
Deploy
Open Claude Code in your project directory and tell it what you want:

> Deploy my agent to EigenCloud on sepolia

The skill handles the full lifecycle:

Checks prerequisites — CLI, auth, billing, Docker, environment
Builds your image — cross-compiles to linux/amd64 if you're on Apple Silicon
Deploys to a TEE — provisions an Intel TDX instance with encrypted environment variables
Verifies the deployment — polls for running status, health checks the app
Sets up your dashboard profile — name, description, and verify dashboard link
Your agent gets its own persistent EVM and Solana wallets, derived deterministically inside the TEE.

What else you can ask
"Upgrade my agent to the latest image"
"Show me the logs for my app"
"Do a verifiable build from my GitHub repo"
"Roll back to the previous release"
"Top up my USDC credits"
Next steps
Quickstart — deploy manually with the CLI
Billing — subscription and credit details
Sample Apps — templates to start from
Previous
Quickstart
Next
Billing
Install the skill
Prerequisites
Deploy
What else you can ask
Next steps
EigenCloud
About
Privacy Policy
Terms of Service
Disclaimers
Acceptable Use Policy
Community
Support
Forum
Telegram
X
More
GitHub
Youtube
Copyright © 2026 Eigen Labs, Inc.