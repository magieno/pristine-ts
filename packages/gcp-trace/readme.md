# @pristine-ts/gcp-trace

Cloud Trace tracer for Pristine-TS. Mirror of `@pristine-ts/aws-xray`: subscribes to
the framework's trace-ended stream and exports each completed `Trace` to Google
Cloud Trace via the OpenTelemetry exporter.

Set `pristine.gcp-trace.activated=true` (or `PRISTINE_GCP_TRACE_ACTIVATED=true`) to
opt in — importing the package alone is not enough.
