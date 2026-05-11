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
How ToBuildPersistent storage
Persistent storage
EigenCompute provides a persistent storage volume that survives application upgrades. The boot disk is replaced during image updates, but user data lives on an independent persistent disk that is reattached to the new VM. This means your workload state persists across upgrades, not just reboots.

Storage path
All persistent data should be written to:

/mnt/disks/userdata

This path is also available via the environment variable USER_PERSISTENT_DATA_PATH:

echo $USER_PERSISTENT_DATA_PATH
# /mnt/disks/userdata

Use this environment variable in your application code to stay forward-compatible if the mount path ever changes.

Example usage
Write any data you need to persist (databases, configuration, caches) under the persistent storage path:

import os

data_dir = os.environ.get("USER_PERSISTENT_DATA_PATH", "/mnt/disks/userdata")

# Store a SQLite database
db_path = os.path.join(data_dir, "myapp.db")

# Store application state
state_path = os.path.join(data_dir, "state.json")

dataDir := os.Getenv("USER_PERSISTENT_DATA_PATH")
if dataDir == "" {
    dataDir = "/mnt/disks/userdata"
}
dbPath := filepath.Join(dataDir, "myapp.db")

How it works
The persistent storage volume is encrypted and managed automatically by the platform:

With a secondary disk attached — The volume uses a LUKS-encrypted disk that is formatted on first boot and reopened on subsequent boots.
Without a secondary disk — The platform falls back to a directory on the boot disk that is already encrypted by the platform.
In both cases, the data is available at the same /mnt/disks/userdata path and your application code does not need to change.

For more details, see the Persistent Storage Design Spec.

Previous
Attested API example
Next
Build from verifiable source
Storage path
Example usage
How it works
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