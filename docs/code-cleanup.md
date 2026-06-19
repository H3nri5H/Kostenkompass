# Code cleanup

The MVP keeps one read-only CI workflow and defers deployment until a signed EAS/TestFlight or store process exists.

Cleanup changes are intentionally behavior-preserving:

- obsolete branch-specific automation is removed;
- dead validation helpers are removed;
- generated assets remain versioned;
- authentication, vehicle, product, and expense behavior is unchanged.
