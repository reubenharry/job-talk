#!/usr/bin/env python3
"""Clean illustration: a stochastic process = a measure on paths.

Uses noisy harmonic oscillators in (t, x) — readable, not a 2D hairball.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parent / "path_measure.png"
RNG = np.random.default_rng(3)

BG = "#ffffff"
INK = "#1a1a1a"
MUTED = "#6b7280"
TEAL = "#2a9d8f"
GRID = "#e8e4dc"


def noisy_harmonic(t, amp, omega, phase, sigma):
    """x(t) = A sin(ωt + φ) + integrated white-noise jitter (small)."""
    x = amp * np.sin(omega * t + phase)
    # tiny smoothish noise via cumulative sum of gaussians, scaled down
    noise = np.cumsum(RNG.normal(0, sigma, size=t.size))
    noise -= np.linspace(noise[0], noise[-1], t.size)  # remove drift
    return x + 0.08 * noise


def main():
    t = np.linspace(0, 4 * np.pi, 400)
    fig, axes = plt.subplots(1, 2, figsize=(11.2, 4.2), dpi=160, sharey=True)
    fig.patch.set_facecolor(BG)

    # Shared axis styling
    for ax in axes:
        ax.set_facecolor(BG)
        ax.set_xlim(t[0], t[-1])
        ax.set_ylim(-1.85, 1.85)
        ax.set_xlabel("time", color=MUTED, fontsize=11)
        ax.tick_params(colors=MUTED, labelsize=9)
        for spine in ax.spines.values():
            spine.set_color(GRID)
        ax.axhline(0, color=GRID, lw=1, zorder=0)
        ax.set_xticks([])
        ax.set_yticks([-1, 0, 1])

    axes[0].set_ylabel(r"$x(t)$", color=MUTED, fontsize=12)

    # Left: one sample path
    x0 = noisy_harmonic(t, amp=1.15, omega=1.0, phase=0.3, sigma=0.04)
    axes[0].plot(t, x0, color=TEAL, lw=2.4, solid_capstyle="round")
    axes[0].set_title("one sample path", fontsize=13, color=INK, pad=10)

    # Right: a few readable paths = the measure (not a hairball)
    axes[1].set_title(r"ensemble of paths  $\approx$  $\mu$", fontsize=13, color=INK, pad=10)
    # Fixed phases/amplitudes so curves stay distinct
    others = [
        (1.05, 0.0, "#b0b7c0"),
        (1.25, 0.9, "#98a2ae"),
        (0.95, 2.0, "#7f8b99"),
        (1.15, 2.8, "#667484"),
    ]
    for amp, phase, col in others:
        xi = noisy_harmonic(t, amp=amp, omega=1.0, phase=phase, sigma=0.02)
        axes[1].plot(t, xi, color=col, lw=1.7, alpha=0.75, solid_capstyle="round")
    # highlight one
    axes[1].plot(t, x0, color=TEAL, lw=2.6, solid_capstyle="round", zorder=5)

    # Title lives on the slide — keep the figure caption-free.
    fig.tight_layout()
    fig.savefig(OUT, dpi=170, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
