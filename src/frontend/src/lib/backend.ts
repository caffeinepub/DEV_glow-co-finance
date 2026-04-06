/**
 * Backend actor access.
 * All backend calls go through useActor() from @caffeineai/core-infrastructure.
 * Import useActor directly from there in hooks — this file re-exports for convenience.
 */
export { useActor } from "@caffeineai/core-infrastructure";
