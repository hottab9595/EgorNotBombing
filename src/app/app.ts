import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

const START_KEY = 'egor.startedAt';
const BEST_KEY = 'egor.bestMs';

function readNumber(key: string): number | null {
  try {
    const value = Number(localStorage.getItem(key));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number): void {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable (private mode etc.) — timer still works in-memory.
  }
}

const pad = (n: number) => String(n).padStart(2, '0');

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly startedAt = signal(readNumber(START_KEY) ?? Date.now());
  private readonly now = signal(Date.now());
  protected readonly bestMs = signal(readNumber(BEST_KEY) ?? 0);
  protected readonly resetCount = signal(0);

  protected readonly elapsedMs = computed(() => Math.max(0, this.now() - this.startedAt()));
  protected readonly minutes = computed(() => Math.floor(this.elapsedMs() / 60_000));
  protected readonly seconds = computed(() => Math.floor(this.elapsedMs() / 1000) % 60);
  protected readonly clock = computed(() => {
    const total = Math.floor(this.elapsedMs() / 1000);
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
  });
  protected readonly bestMinutes = computed(() =>
    Math.floor(Math.max(this.bestMs(), this.elapsedMs()) / 60_000),
  );
  /** Fraction of the current minute that has passed, drives the progress ring. */
  protected readonly minuteProgress = computed(() => (this.elapsedMs() % 60_000) / 60_000);
  protected readonly ringCircumference = 2 * Math.PI * 140;

  constructor() {
    writeNumber(START_KEY, this.startedAt());
    const id = setInterval(() => this.now.set(Date.now()), 250);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  protected reset(): void {
    const elapsed = this.elapsedMs();
    if (elapsed > this.bestMs()) {
      this.bestMs.set(elapsed);
      writeNumber(BEST_KEY, elapsed);
    }
    const now = Date.now();
    this.startedAt.set(now);
    this.now.set(now);
    writeNumber(START_KEY, now);
    this.resetCount.update((c) => c + 1);
  }
}
