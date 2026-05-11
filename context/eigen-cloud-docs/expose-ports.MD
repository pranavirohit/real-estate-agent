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
How ToDeployExpose ports
Expose ports
This guide explains how to configure network ports for your EigenCompute applications, enabling them to receive incoming connections.

Overview
EigenCompute applications run in secure Docker containers. To make your application accessible over the internet, you need to:

Expose ports in your Dockerfile using the EXPOSE directive
Bind your application to the correct port in your code
(Optional) Configure TLS/HTTPS for production domains
Basic Port Configuration
The EXPOSE Directive
Add the EXPOSE directive to your Dockerfile to specify which port(s) your application listens on:

FROM --platform=linux/amd64 node:18
USER root
WORKDIR /app
COPY . .
RUN npm install

# Expose port 3000 for HTTP traffic
EXPOSE 3000

CMD ["npm", "start"]

Exposing Multiple Ports
If your application needs multiple ports (e.g., main service + metrics endpoint):

# Expose multiple individual ports
EXPOSE 3000
EXPOSE 9090

Exposing Port Ranges
For applications that need a range of ports:

# Expose ports 8000 through 8010
EXPOSE 8000-8010

Application Binding
Your application code must bind to 0.0.0.0 (all interfaces) to be accessible.

HTTPS with Custom Domains
For production applications with custom domains, you'll need to configure TLS in addition to exposing ports.

See the TLS configuration guide for complete setup instructions.

Troubleshooting
"Cannot reach my application"
Check that:

Your Dockerfile includes EXPOSE <port>
Your app binds to 0.0.0.0, not localhost or 127.0.0.1
The port matches between EXPOSE, app binding, and APP_PORT (if using TLS)
"Connection refused"
Your application may not be listening on the expected port:

Check application logs: ecloud compute app logs
Verify the port in your application startup logs
Ensure no port conflicts if running multiple services
Port Already in Use
If you see "port already in use" errors:

Check for multiple services binding to the same port
Ensure your application shuts down gracefully
Use ecloud compute app stop and ecloud compute app start to restart
Related Documentation
Quickstart Guide - Complete deployment walkthrough
TLS Configuration - Setting up HTTPS with custom domains
Deployment Reference - Dockerfile requirements
Monitoring - Viewing application logs
Previous
Configure TLS
Next
Troubleshoot deployment
Overview
Basic Port Configuration
The EXPOSE Directive
Exposing Multiple Ports
Exposing Port Ranges
Application Binding
HTTPS with Custom Domains
Troubleshooting
"Cannot reach my application"
"Connection refused"
Port Already in Use
Related Documentation
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