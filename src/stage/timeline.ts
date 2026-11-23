import type { StepDefinition, TimelineLocation } from './types';

export function totalDuration(steps: StepDefinition[]): number {
  return steps.reduce((sum, step) => sum + step.durationMs, 0);
}

export function stepStart(steps: StepDefinition[], index: number): number {
  return steps.slice(0, index).reduce((sum, step) => sum + step.durationMs, 0);
}

export function locateTime(steps: StepDefinition[], timeMs: number): TimelineLocation {
  if (steps.length === 0) return { stepIndex: 0, progress: 0 };
  let remaining = Math.max(0, timeMs);
  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    if (remaining < step.durationMs || index === steps.length - 1) {
      return {
        stepIndex: index,
        progress: Math.min(1, remaining / Math.max(1, step.durationMs)),
      };
    }
    remaining -= step.durationMs;
  }
  return { stepIndex: steps.length - 1, progress: 1 };
}
