/**
 * A single configuration value.
 */
export type ConfigurationScalar = string | number | boolean;

/**
 * A configuration value that is a list. Its entries are scalars: a list of lists or of objects
 * is not a configuration value, because nothing as simple as an environment variable could hold it.
 *
 * It is `readonly`: the ConfigurationManager registers ONE list in the container and every
 * consumer gets that same list, so it is frozen. Copy it (`[...list]`) to change it.
 */
export type ConfigurationList = readonly ConfigurationScalar[];

/**
 * What a configuration parameter can hold once it is resolved.
 */
export type ConfigurationValue = ConfigurationScalar | ConfigurationList;
