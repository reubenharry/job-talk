#!/usr/bin/env python3
"""Three-panel conceptual picture: prior / likelihood / posterior on trajectories."""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import Circle, FancyBboxPatch

OUT = Path(__file__).resolve().parent / "conceptual_picture.png"
RNG = np.random.default_rng(7)

BG = "#ffffff"
INK = "#2f343c"
MUTED = "#6b7280"
TEAL = "#008c96"
RED = "#dc373c"
BLUE = "#5a6edc"
GRID = "#ebe7df"
PANEL = "#faf9f6"


def harmonic2d(n, dt, omega=1.0, sigma=0.45, x0=1.1, y0=0.0, vx0=0.0, vy0=1.05):
    xs = np.empty(n)
    ys = np.empty(n)
    x, y, vx, vy = x0, y0, vx0, vy0
    for i in range(n):
        xs[i], ys[i] = x, y
        ax = -(omega**2) * x + sigma * RNG.normal()
        ay = -(omega**2) * y + sigma * RNG.normal()
        vx = 0.999 * vx + ax * dt
        vy = 0.999 * vy + ay * dt
        x += vx * dt
        y += vy * dt
    return xs, ys


def style_ax(ax, lim=2.05):
    ax.set_facecolor(PANEL)
    ax.set_aspect("equal", adjustable="box")
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_color(GRID)
        spine.set_linewidth(1.1)
    ax.axhline(0, color=GRID, lw=0.8, zorder=0)
    ax.axvline(0, color=GRID, lw=0.8, zorder=0)


def marker(ax, x, y, r, face, z=5):
    ax.add_patch(
        Circle((x, y), r, facecolor=face, edgecolor="#1e232d", linewidth=1.0, zorder=z)
    )


def main():
    dt, n = 0.02, 220
    # Shared true latent for likelihood / posterior panels
    true_x, true_y = harmonic2d(n, dt, sigma=0.28, x0=1.15, y0=-0.2, vy0=1.0)

    fig, axes = plt.subplots(1, 3, figsize=(12.6, 4.35), dpi=170)
    fig.patch.set_facecolor(BG)

    # ---- Prior: distribution over trajectories ----
    ax = axes[0]
    style_ax(ax)
    for k in range(14):
        xs, ys = harmonic2d(
            n,
            dt,
            sigma=0.55,
            x0=RNG.normal(1.0, 0.25),
            y0=RNG.normal(0.0, 0.25),
            vx0=RNG.normal(0, 0.2),
            vy0=1.0 + RNG.normal(0, 0.25),
        )
        ax.plot(xs, ys, color=TEAL, lw=1.15, alpha=0.28, solid_capstyle="round")
        marker(ax, xs[-1], ys[-1], 0.055, TEAL, z=4)
    ax.set_title("prior", fontsize=14, color=INK, pad=8)
    ax.text(
        0.5,
        -0.08,
        r"()  >->  $X$",
        transform=ax.transAxes,
        ha="center",
        va="top",
        fontsize=12,
        color=MUTED,
        family="monospace",
    )

    # ---- Likelihood: obs trajectories as causal fn of true ----
    ax = axes[1]
    style_ax(ax)
    ax.plot(true_x, true_y, color=TEAL, lw=2.3, solid_capstyle="round", zorder=3)
    marker(ax, true_x[-1], true_y[-1], 0.07, TEAL, z=5)
    for k in range(10):
        noise = 0.22
        ox = true_x + RNG.normal(0, noise, size=n)
        oy = true_y + RNG.normal(0, noise, size=n)
        # light smooth
        ox = np.convolve(ox, np.ones(5) / 5, mode="same")
        oy = np.convolve(oy, np.ones(5) / 5, mode="same")
        ax.plot(ox, oy, color=RED, lw=1.05, alpha=0.35, solid_capstyle="round")
        marker(ax, ox[-1], oy[-1], 0.045, RED, z=4)
    ax.set_title("likelihood", fontsize=14, color=INK, pad=8)
    ax.text(
        0.5,
        -0.08,
        r"$X$  >->  $Y$",
        transform=ax.transAxes,
        ha="center",
        va="top",
        fontsize=12,
        color=MUTED,
        family="monospace",
    )

    # ---- Posterior: true traj as fn of observation traj ----
    ax = axes[2]
    style_ax(ax)
    # one observation path
    obs_x = true_x + RNG.normal(0, 0.18, size=n)
    obs_y = true_y + RNG.normal(0, 0.18, size=n)
    obs_x = np.convolve(obs_x, np.ones(7) / 7, mode="same")
    obs_y = np.convolve(obs_y, np.ones(7) / 7, mode="same")
    ax.plot(obs_x, obs_y, color=RED, lw=2.0, alpha=0.85, solid_capstyle="round", zorder=2)
    marker(ax, obs_x[-1], obs_y[-1], 0.065, RED, z=4)

    # posterior particle paths hugging the obs
    for k in range(12):
        px = obs_x + RNG.normal(0, 0.12, size=n)
        py = obs_y + RNG.normal(0, 0.12, size=n)
        px = np.convolve(px, np.ones(6) / 6, mode="same")
        py = np.convolve(py, np.ones(6) / 6, mode="same")
        ax.plot(px, py, color=BLUE, lw=1.1, alpha=0.4, solid_capstyle="round")
        marker(ax, px[-1], py[-1], 0.04, BLUE, z=3)
    # true latent lightly for reference
    ax.plot(true_x, true_y, color=TEAL, lw=1.6, alpha=0.55, solid_capstyle="round", zorder=3)
    marker(ax, true_x[-1], true_y[-1], 0.06, TEAL, z=5)

    ax.set_title("posterior", fontsize=14, color=INK, pad=8)
    ax.text(
        0.5,
        -0.08,
        r"$Y$  >->  $X$",
        transform=ax.transAxes,
        ha="center",
        va="top",
        fontsize=12,
        color=MUTED,
        family="monospace",
    )

    fig.tight_layout(rect=(0, 0.06, 1, 1))
    fig.savefig(OUT, dpi=180, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
