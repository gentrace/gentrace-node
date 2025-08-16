/**
 * Key used to identify Gentrace sampling configuration in baggage and span attributes.
 * When set to 'true', indicates that the span should be sampled.
 */
export const ATTR_GENTRACE_SAMPLE = 'gentrace.sample';

/**
 * Key used to identify spans that are part of a Gentrace experiment.
 * When set to 'true', indicates that the span was created during an experiment run.
 */

export const ATTR_GENTRACE_IN_EXPERIMENT = 'gentrace.in_experiment';

/**
 * Key used to identify which Gentrace pipeline a particular span belongs to.
 * Spans tagged with this attribute will be viewable in the "Traces" section of the Gentrace dashboard.
 */
export const ATTR_GENTRACE_PIPELINE_ID = 'gentrace.pipeline_id';

/**
 * Key used to identify which Gentrace test case a particular span belongs to.
 * This attribute links spans to their associated test case in a dataset in Gentrace.
 */
export const ATTR_GENTRACE_TEST_CASE_ID = 'gentrace.test_case_id';

/**
 * Key used to identify which Gentrace experiment a test span(s) invoked with evalOnce
 * or evalDataset belongs to.
 */
export const ATTR_GENTRACE_EXPERIMENT_ID = 'gentrace.experiment_id';

/**
 * Key used to identify the function arguments event in Gentrace spans.
 * This event attribute captures the serialized input arguments passed to traced functions.
 */
export const ATTR_GENTRACE_FN_ARGS = 'gentrace.fn.args';

/**
 * Key used to identify the function output event in Gentrace spans.
 * This event attribute captures the serialized return value of traced functions.
 */
export const ATTR_GENTRACE_FN_OUTPUT = 'gentrace.fn.output';
