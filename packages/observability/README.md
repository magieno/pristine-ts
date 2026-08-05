# Observability Module

Turns a running Pristine app's logs and traces into a structured, queryable on-disk store
under `.pristine/observability/`. The CLI's `pristine logs`, `pristine trace` and
`pristine requests` commands read that store.

`CliModule` and `HttpModule` both import this module, so **most apps capture by default**.
A non-CLI, non-HTTP app that wants the store imports `ObservabilityModule` directly.

```sh
PRISTINE_OBSERVABILITY_ENABLED=false   # turn capture off entirely
```

## What lands on disk

```
.pristine/observability/
  <instanceId>/logs.jsonl         # one JSON line per captured log entry
  <instanceId>/logs.1.jsonl       # rotated generations, 1 = most recent
  <instanceId>/requests.jsonl     # one RequestSummary per completed trace
  <instanceId>/traces/<eventId>.json
  <instanceId>/pid                # the owning process
```

Each `<instanceId>` is one process lifetime (the kernel instantiation id), so concurrent
processes never race on the same file. Readers walk every instance directory newest-first;
the partitioning is invisible to `pristine logs`.

## Disk usage

**The store is capped at 100 MB by default.** That ceiling is the number to change if you
want a different budget:

```sh
PRISTINE_OBSERVABILITY_MAX_STORE_SIZE=524288000   # 500 MB
PRISTINE_OBSERVABILITY_MAX_STORE_SIZE=0           # no byte ceiling (count/age only)
```

Five limits keep it there. They matter because instance-directory retention alone bounds
nothing for a long-running process: a server writes into a *single* instance directory for
its entire lifetime, and only ever prunes *other* processes' directories.

| What it bounds | Configuration key | Env var | Default |
|---|---|---|---|
| The whole store | `pristine.observability.maxStoreSize` | `PRISTINE_OBSERVABILITY_MAX_STORE_SIZE` | 100 MB |
| One live `.jsonl` file | `pristine.observability.maxLogFileSize` | `…MAX_LOG_FILE_SIZE` | 10 MB |
| Generations kept per `.jsonl` | `pristine.observability.maxLogFiles` | `…MAX_LOG_FILES` | 3 |
| Trace files per instance | `pristine.observability.maxTraceFiles` | `…MAX_TRACE_FILES` | 500 |
| One trace file | `pristine.observability.maxTraceFileSize` | `…MAX_TRACE_FILE_SIZE` | 1 MB |
| One log entry | `pristine.observability.maxEntrySize` | `…MAX_ENTRY_SIZE` | 64 KB |
| Instance directories kept | `pristine.observability.retainedInstances` | `…RETAINED_INSTANCES` | 10 |
| How long they are kept | `pristine.observability.maxRetentionAgeInMilliseconds` | `…MAX_RETENTION_AGE_IN_MILLISECONDS` | 7 days |

And one that keeps volume off the disk in the first place:

| | Configuration key | Default |
|---|---|---|
| Minimum severity captured | `pristine.observability.logSeverityLevelConfiguration` | `SeverityEnum.Info` |

The store bypasses `BaseLogger`, so this threshold is its own — independent of what the
console logger is configured to show. Set it to `SeverityEnum.Debug` (`0`) to capture
everything, or to `SeverityEnum.Warning` (`4`) on a chatty service.

### How the limits interact

- A log entry over `maxEntrySize` is rewritten **without its `extra` payload** and flagged
  `extraOmitted`. `extra` is the unbounded part (it routinely holds whole span trees);
  dropping it keeps `eventId` / `traceId` / `severity` / `message`, so the entry still
  shows up in a filtered query.
- A `.jsonl` file over `maxLogFileSize` rolls over to `<name>.1.jsonl`. Readers
  concatenate the generations, so history survives a rollover; `pristine logs --follow`
  transparently picks up the new file.
- A trace tree over `maxTraceFileSize` is **not written**; its summary is, flagged
  `traceOmitted`, so `pristine requests` still lists the request.
- When the store as a whole exceeds `maxStoreSize`, a sweep reclaims in order: instance
  directories past the age/count limits, then whole abandoned directories oldest-first,
  then individual rotated generations and trace files. A running process's *live*
  `logs.jsonl` / `requests.jsonl` is never deleted out from under it — ownership is
  tracked through the `pid` sidecar, so concurrent workers don't delete each other's data.
- Sweeps are triggered by volume written (5% of the budget, floored at 1 MB) and on every
  rollover — not per append.

## Reading the store

```sh
pristine logs                    # newest 1000 entries across all processes
pristine logs --limit 0          # everything (can be a lot)
pristine logs <eventId>          # filter by event / trace / request id
pristine logs -f                 # follow live
pristine requests --limit 20
pristine trace <eventId>
```

`--limit` is pushed all the way down to the reader: the files are scanned backwards and
the read stops as soon as the limit is met, so a small limit against a full store touches
one 64 KB chunk.
