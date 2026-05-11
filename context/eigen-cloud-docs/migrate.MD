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
How ToSet upMigrate to ecloud CLI
Migrate to ecloud CLI
important
The eigenx CLI is being deprecated and will no longer receive updates. The ecloud CLI supports the same commands as eigenx. The app, environment, and undelegate subcommands have moved under the compute command.

The migrate command is provided to migrate your authentication key. We recommend migrating to the ecloud CLI as soon as practical.

To migrate a stored authentication key from eigenx to eigencloud:

Install the ecloud CLI:

npm install -g @layr-labs/ecloud-cli  

Verify the installation was successful:

ecloud version

Migrate the stored authentication key:

ecloud auth migrate 

Legacy keys for eigenx environments are displayed. Select the key to migrate.

When prompted to delete the legacy key, select N. We recommend not deleting your legacy key until you have verified that the migrated key works correctly.

Verify the migration was successful:

ecloud auth whoami 

The migrated key is displayed and will be used for all environments.

Changes
One key for all environments
The ecloud CLI uses one key for all environments. When migrating from eigenx, which stored a key per environment, you select one stored key to migrate to ecloud.

To continue using other keys, use the --private-key option or the ECLOUD_PRIVATE_KEY environment variable.

compute
The app, environment, and undelegate subcommands have moved under the compute command.

Arguments moved to options
The language, template-name, image-ref arguments for the app subcommand in eigenx are options in ecloud.

Previous
Sample Apps
Next
Create and use authentication keys
Changes
One key for all environments
compute
Arguments moved to options
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