# @pristine-ts/gcp-functions

HTTP entry mappers for GCP Cloud Functions (Gen 1 + Gen 2) and Cloud Run. Mirror of
`@pristine-ts/aws-api-gateway`: each mapper supports a dual-mode strategy where
incoming requests are exposed either as a Pristine `Request` (for controller routing)
or as a typed event payload (for handler-based processing).
