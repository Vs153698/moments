// Enables React.act for react-test-renderer outside Jest.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
