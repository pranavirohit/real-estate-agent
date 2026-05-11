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
How ToBuildVerifiable BuildsBuild from verifiable source
Build from verifiable source
Importantly, if you intend to persist application data across upgrades, instruct the source to save the data at the filesystem path /mnt/disks/userdata, which has been mounted to persistent storage. For more details, see spec. This path is also available as the environment variable USER_PERSISTENT_DATA_PATH, which is injected into the container.

To build from a verifiable source, options are:

Use the ecloud compute build submit command to submit a verifiable build from a GitHub source.
Specify the --verifiable option or select Yes when prompted when deploying or upgrading using the ecloud compute deploy or upgrade commands..
Submit from GitHub source
To submit a verifiable build from a GitHub source, specify the required options or supply when prompted:

--repo (ECLOUD_BUILD_REPO)
--commit (ECLOUD_BUILD_COMMIT)
--dockerfile (ECLOUD_BUILD_DOCKERFILE, default is Dockerfile)
--context (ECLOUD_BUILD_CONTEXT, default is .)
--dependencies sha256:... (repeatable; prompt supports comma-separated)
--build-caddyfile (ECLOUD_BUILD_CADDYFILE) (optional)
--no-follow
--json
For example:

ecloud compute build submit --repo https://github.com/myorg/myapp --commit abc123...

ecloud compute build submit --repo https://github.com/myorg/myapp --commit abc123... --dependencies sha256:def456...

ecloud compute build submit --repo https://github.com/myorg/myapp --commit abc123... --build-caddyfile Caddyfile

ecloud compute build submit --repo https://github.com/myorg/myapp --commit abc123... --no-follow


Once built and verified, the image can be specified as a prebuilt image when deploying or upgrading.

Submit when deploying or upgrading
To submit when deploying or upgrading, specify the --verifiable option for the ecloud compute app command, or select Yes when prompted.

When deploying or upgrading, specify a GitHub source using the --build-context, --build-dependencies, and --build-dockerfile options, or specify a prebuilt verifiable image using the --image-ref option.

Submitting builds with dependencies
To specify prebuilt dependencies to include in a verifiable build, use the --dependencies option for ecloud compute build, ecloud compute app deploy or ecloud compute app upgrade.

The EigenCompute TLS and KMS clients do not need to be specified as dependencies because they are prebuilt and the digests included in all EigenCompute applications.

For more information on dependencies in verifiable builds, refer to Verifiable Builds.

Previous
Persistent storage
Next
Configure TLS
Submit from GitHub source
Submit when deploying or upgrading
Submitting builds with dependencies
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