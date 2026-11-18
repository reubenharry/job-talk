#!/usr/bin/env python3
"""2D path figures matching the live FRP tracker look.

1. One latent trajectory in the (x, y) plane (sim-style markers).
2. A short burst of branching futures from a common tip.
"""

from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.collections import LineCollection
from matplotlib.patches import Circle

OUT_DIR = Path(__file__).resolve().parent
RNG = np.random.default_rng(11)

BG = "#ffffff"
INK = "#373c46"
MUTED = "#6b7280"
TEAL = "#008c96"  # latentColor
BLUE = "#5a6edc"  # particleColor
OUTLINE = "#1e232d"
GRID = "#ebe7df"


def harmonic2d(n, dt, omega=1.05, sigma=0.55, x0=0.9, y0=-0.35, vx0=0.0, vy0=1.1):
    """Noisy harmonic oscillator in 2D (matches talk prior)."""
    xs = np.empty(n)
    ys = np.empty(n)
    x, y, vx, vy = x0, y0, vx0, vy0
    for i in range(n):
        xs[i] = x
        ys[i] = y
        ax = -(omega**2) * x + sigma * RNG.normal()
        ay = -(omega**2) * y + sigma * RNG.normal()
        vx += ax * dt
        vy += ay * dt
        # light damping so paths stay on-screen
        vx *= 0.999
        vy *= 0.999
        x += vx * dt
        y += vy * dt
    return xs, ys


def fade_line(ax, xs, ys, color, lw=2.4, n_seg=48):
    """Draw a trajectory that fades toward the past."""
    pts = np.column_stack([xs, ys])
    # resample to equal-ish segment count
    t = np.linspace(0, 1, len(pts))
    t_new = np.linspace(0, 1, n_seg + 1)
    xs_s = np.interp(t_new, t, pts[:, 0])
    ys_s = np.interp(t_new, t, pts[:, 1])
    segs = np.stack(
        [np.column_stack([xs_s[:-1], ys_s[:-1]]), np.column_stack([xs_s[1:], ys_s[1:]])],
        axis=1,
    )
    alphas = np.linspace(0.12, 1.0, n_seg)
    colors = np.zeros((n_seg, 4))
    rgb = plt.matplotlib.colors.to_rgba(color)
    for i, a in enumerate(alphas):
        colors[i] = (rgb[0], rgb[1], rgb[2], a)
    lc = LineCollection(segs, colors=colors, linewidths=lw, capstyle="round", joinstyle="round")
    ax.add_collection(lc)


def style_plane(ax, lim=2.35):
    ax.set_facecolor(BG)
    ax.set_aspect("equal", adjustable="box")
    ax.set_xlim(-lim, lim)
    ax.set_ylim(-lim, lim)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_color(GRID)
        spine.set_linewidth(1.0)
    ax.axhline(0, color=GRID, lw=0.9, zorder=0)
    ax.axvline(0, color=GRID, lw=0.9, zorder=0)
    ax.set_xlabel(r"$x$", color=MUTED, fontsize=12, labelpad=2)
    ax.set_ylabel(r"$y$", color=MUTED, fontsize=12, labelpad=2)


def marker(ax, x, y, r, face, z=6):
    ax.add_patch(
        Circle(
            (x, y),
            r,
            facecolor=face,
            edgecolor=OUTLINE,
            linewidth=1.2,
            zorder=z,
        )
    )


def fig_one_path():
    dt = 0.02
    n = 520
    xs, ys = harmonic2d(
        n, dt, omega=1.0, sigma=0.42, x0=1.2, y0=0.1, vx0=0.05, vy0=1.05
    )

    fig, ax = plt.subplots(figsize=(6.2, 6.2), dpi=160)
    fig.patch.set_facecolor(BG)
    style_plane(ax, lim=2.2)

    fade_line(ax, xs, ys, TEAL, lw=2.5, n_seg=72)
    marker(ax, xs[-1], ys[-1], 0.09, TEAL)

    ax.scatter([], [], s=90, c=TEAL, edgecolors=OUTLINE, linewidths=0.8, label="latent")
    leg = ax.legend(loc="upper left", frameon=False, fontsize=11)
    for t in leg.get_texts():
        t.set_color(INK)

    ax.set_title("one latent trajectory", fontsize=14, color=INK, pad=10)
    fig.tight_layout()
    out = OUT_DIR / "path_one.png"
    fig.savefig(out, dpi=180, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {out}")
    return xs, ys


def fig_branching(xs_stem, ys_stem):
    """Shared past, then a short burst of branching futures."""
    dt = 0.02
    cut = int(0.78 * len(xs_stem))
    stem_x = xs_stem[: cut + 1]
    stem_y = ys_stem[: cut + 1]
    x0, y0 = stem_x[-1], stem_y[-1]
    vx0 = (stem_x[-1] - stem_x[-4]) / (3 * dt)
    vy0 = (stem_y[-1] - stem_y[-4]) / (3 * dt)

    n_branch = 36
    n_fwd = 55  # short time only
    branches = []
    for _ in range(n_branch):
        bx, by = harmonic2d(
            n_fwd,
            dt,
            omega=1.0,
            sigma=1.15,
            x0=x0,
            y0=y0,
            vx0=vx0 + RNG.normal(0, 0.35),
            vy0=vy0 + RNG.normal(0, 0.35),
        )
        branches.append((bx, by))

    fig, ax = plt.subplots(figsize=(6.2, 6.2), dpi=160)
    fig.patch.set_facecolor(BG)
    style_plane(ax, lim=2.2)

    fade_line(ax, stem_x, stem_y, TEAL, lw=2.5, n_seg=48)

    for bx, by in branches:
        ax.plot(bx, by, color=BLUE, lw=1.05, alpha=0.28, solid_capstyle="round")
        ax.plot(bx[-1], by[-1], "o", color=BLUE, markersize=2.4, alpha=0.55)

    marker(ax, x0, y0, 0.085, TEAL)

    ax.scatter([], [], s=90, c=TEAL, edgecolors=OUTLINE, linewidths=0.8, label="shared past")
    ax.plot([], [], color=BLUE, lw=2.0, alpha=0.7, label="possible futures")
    leg = ax.legend(loc="upper left", frameon=False, fontsize=11)
    for t in leg.get_texts():
        t.set_color(INK)

    ax.set_title("branching futures (short horizon)", fontsize=14, color=INK, pad=10)
    fig.tight_layout()
    out = OUT_DIR / "path_branch.png"
    fig.savefig(out, dpi=180, facecolor=BG, bbox_inches="tight")
    plt.close(fig)
    print(f"wrote {out}")


def main():
    xs, ys = fig_one_path()
    fig_branching(xs, ys)


if __name__ == "__main__":
    main()
