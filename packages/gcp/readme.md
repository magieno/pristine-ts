# @pristine-ts/gcp

Google Cloud Platform integration for Pristine-TS. Mirrors `@pristine-ts/aws`:
clients, event mappers, decorators, models, options, and results for GCP services.

## Coverage

| GCP service | Client | Event mapper |
| :--- | :--- | :--- |
| Firestore (Native mode) | `FirestoreClient` | `FirestoreEventMapper` (CloudEvents) |
| Cloud Storage | `CloudStorageClient` | `CloudStorageEventMapper` (CloudEvents) |
| Pub/Sub | `PubSubClient` | `PubSubEventMapper` (push subscription shape) |
| Secret Manager | `SecretManagerClient` | — |
| Eventarc | `EventarcClient` | `EventarcEventMapper` (catch-all CloudEvent) |

## Deliberately not implemented

AWS services with no first-party GCP equivalent are not mirrored:

- **SES** — GCP has no native transactional-email service. Use `@pristine-ts/http`
  against SendGrid/Postmark/etc.
- **CloudFront** — Cloud CDN is configured at the infra level (Terraform/`gcloud`),
  no SDK to wrap.
- **CloudFormation** — Deployment Manager is deprecated; Terraform is the modern
  path and is out of framework scope.
- **Kafka / MSK** — Confluent Cloud on GCP has its own SDK; if needed, a dedicated
  package can be added separately.

See companion packages: `@pristine-ts/gcp-functions` (HTTP entry mappers for Cloud
Functions / Cloud Run), `@pristine-ts/gcp-identity-platform` (auth),
`@pristine-ts/gcp-scheduling` (Cloud Scheduler), `@pristine-ts/gcp-trace`
(Cloud Trace).
