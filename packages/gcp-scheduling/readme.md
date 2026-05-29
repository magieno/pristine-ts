# @pristine-ts/gcp-scheduling

Cloud Scheduler integration for Pristine-TS. Mirror of `@pristine-ts/aws-scheduling`:
listens for the two ways Cloud Scheduler delivers a tick (Pub/Sub topic or HTTP
endpoint with `X-CloudScheduler-*` headers) and triggers `SchedulerInterface.runTasks`
with the job name.
