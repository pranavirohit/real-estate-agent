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
Get StartedBilling
Billing
Deploying an EigenCompute application to Sepolia testnet or mainnet requires an EigenCompute subscription. EigenCompute subscriptions can be paid by credit card or EigenCompute credits can be purchased with USDC.

EigenCompute has metered billing so you pay for what you use. All new customers receive up to $25 matched credits.

Mainnet Pricing
Current EigenCompute pricing is the testnet pricing. Mainnet deployments are available at testnet pricing for a promotional period ending on 04/31/2026.

Up to 10 apps each can be deployed on Sepolia testnet and mainnet per subscription (that is, 20 apps total can be deployed per subscription per ecloud CLI authentication key).

Instance types
Shielded VM (vTPM): Verified boot and runtime attestation.
SEV-SNP (TEE): Verified boot, runtime attestation, and hardware-encrypted memory (AMD).
TDX (TEE): Verified boot, runtime attestation, and hardware-encrypted memory (Intel).
Instance pricing and specifications
Instance Tier	Resources	Security Type	Hourly Price	Monthly Price
Starter 1	Shared 2 vCPU + 1 GB	Shielded VM (vTPM)	$0.03/hr	$19.99/mo
Starter 2	Shared 2 vCPU + 4 GB	Shielded VM (vTPM)	$0.04/hr	$29.99/mo
Pro 1	2 vCPU + 4 GB	SEV-SNP (TEE)	$0.07/hr	$53.99/mo
Pro 2	2 vCPU + 8 GB	SEV-SNP (TEE)	$0.12/hr	$85.99/mo
Enterprise 1	4 vCPU + 16 GB	TDX (TEE)	$0.33/hr	$239.99/mo
Enterprise 2	8 vCPU + 32 GB	TDX (TEE)	$0.66/hr	$484.99/mo
Subscribe
To subscribe to EigenCompute:

ecloud billing subscribe

Choose whether to subscribe with credit card or by purchasing credits with USDC.

If you select credit card, the payment portal is displayed. Enter your payment method details and click the Subscribe button.

If you select purchase credits with USDC, the EigenCompute wallet address and balance is displayed. If the wallet contains USDC, specify the amount to spend on credits. If the wallet does not contain USDC, you are prompted to send USDC to the wallet.

The payment successful message is displayed. Return to the terminal and you have access to deploy your application.

Cancel a Subscription
To cancel an active subscription:

ecloud billing cancel

The deployed application is terminated and a refund for the remaining period of the month issued to the payment method you provided when subscribing.

Manage Billing
To view current subscriptions:

ecloud billing status

The subscription status is displayed and a link provided to manage payment methods and view subscription transactions.

Top up with USDC
To purchase EigenCompute credits with USDC:

ecloud billing top-up

The EigenCompute wallet address and balance is displayed. If the wallet contains USDC, specify the amount to spend on credits. If the wallet does not contain USDC, you are prompted to send USDC to the wallet.

Support
For support, join our Telegram channel.

To talk to the EigenCompute team, complete this form and a member of the team will reach out to discuss your project.

Previous
Deploy Your Agent
Next
Sample Apps
Instance types
Instance pricing and specifications
Subscribe
Cancel a Subscription
Manage Billing
Top up with USDC
Support
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