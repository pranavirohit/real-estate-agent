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
EigenCompute KMS
Use Cases
Trust Guarantees
Architecture
Keys
Security and Trust Model
Security Best Practices
Verifiable Builds
Privacy
Technical Comparison
Processes
Reference

Copy for LLM
How ToDeployConfigure TLS
Configure TLS
Add TLS/HTTPS configuration to your project for secure domain access to:

Expose your TEE app using HTTPS.
Receive webhook events over HTTPS.
Serve web UIs securely.
Deploy to production with TLS.
EigenCompute enables TLS with Let's Encrypt using Caddyfile. To use an alternative certificate provider, configure in your Dockerfile.

TLS Environment Variables
Variable	Description	Required	Default
DOMAIN	Your domain name	Yes	-
APP_PORT	Port your app listens on	Yes	-
ACME_STAGING	Use Let's Encrypt staging	No	false
ACME_FORCE_ISSUE	Force certificate reissue	No	false
ENABLE_CADDY_LOGS	Enable Caddy debug logs	No	false
Configure TLS and Test with Staging Certificates
Add TLS environment variables as prompted, or provide using --domain, --app-port, --acme-staging, and --caddy-logs options.

The TLS variables are appended to your .env file, and TLS placeholders are appended to .env.example.

tip
To avoid Let's Encrypt rate limits, always test with staging certificates first.

Configure DNS by creating an A record pointing to your instance IP:

Type: A
Name: yourdomain.com
Value: Obtain IP address from ecloud compute app info
Deploy app with TLS configuration:

ecloud compute app upgrade  

The configured TLS routes traffic from ports 80 and 443 to the APP_PORT.

Switch to Production Certificates
To switch from staging to production:

Force a reissue of certificates by updating the ACME_FORCE_ISSUE environment variable:
ACME_STAGING=false
ACME_FORCE_ISSUE=true  # Only needed once

Redeploy the app:
ecloud compute app upgrade

Disable the ACME_FORCE_ISSUE environment variable:
ACME_FORCE_ISSUE=false

Let's Encrypt Rate Limits
Let's Encrypt has a rate limit of 5 certificates per week per domain. Always test with staging certificates first.

Upgrading
You can update DOMAIN and APP_PORT in the environment file and upgrade without rebuilding the Docker image. If you change anything else in the Caddyfile itself, you must rebuild the image because the Caddyfile is embedded at build time.

Troubleshooting
DNS not propagating
Wait 5-10 minutes after DNS changes. Verify with:

dig yourdomain.com
nslookup yourdomain.com

Certificate issuance failing
Check logs:

ecloud compute app logs

Common issues:

DNS not pointing to correct IP.
Port 80/443 not accessible.
Domain already has certificates (use ACME_FORCE_ISSUE=true).
Rate limit exceeded
If you hit rate limits:

Wait a week for the limit to reset.
Use a different subdomain.
Consider using staging for development.
Previous
Build from verifiable source
Next
Expose ports
TLS Environment Variables
Configure TLS and Test with Staging Certificates
Switch to Production Certificates
Upgrading
Troubleshooting
DNS not propagating
Certificate issuance failing
Rate limit exceeded
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