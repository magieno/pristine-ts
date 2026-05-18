/**
 * Hints loggers may consult when rendering a log entry. Currently empty after the
 * breadcrumb removal; kept as a type so loggers and `LogModel` retain a stable
 * `outputHints` slot for future flags without another LogModel-shape change.
 */
export type OutputHints = Record<string, unknown>;
