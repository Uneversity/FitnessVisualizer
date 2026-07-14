// A seamless, diagonal pattern of gym icons that dissolves toward the middle,
// so whatever text sits over the center stays legible.
// Rendered as an inline <svg> (not a CSS background-image) because the diagonal
// tilt comes from patternTransform, which CSS background-repeat cannot do.
//
// Props:
//   angle — tilt of the whole lattice, in degrees
//   scale — icon size. Icons are drawn in a 40x40 box, so 0.65 => ~26px icons
//   dim   — how dark the center pool of zinc-950 gets (0 = off, 1 = solid)
export default function GymPattern({ angle = -30, scale = 0.65, dim = 0.7 }) {
    // Stroke width is multiplied by the transform, so a 0.65 scale would also make
    // the lines 65% as thick. Pre-divide to keep the intended 1.6px weight.
    const stroke = 1.6 / scale;

    // Reused so every <use> shrinks the same way: place the box, then shrink it.
    const at = (x, y) => `translate(${x},${y}) scale(${scale})`;

    return (
        <svg className="h-full w-full" aria-hidden="true">
            <defs>
                {/* Each icon is drawn inside a 40x40 box so it can be placed with a plain translate(). */}
                <g id="dumbbell" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="13" y="18" width="14" height="4" rx="1.5" />
                    <rect x="8" y="13" width="5" height="14" rx="1.5" />
                    <rect x="27" y="13" width="5" height="14" rx="1.5" />
                    <rect x="4" y="16" width="4" height="8" rx="1.5" />
                    <rect x="32" y="16" width="4" height="8" rx="1.5" />
                </g>

                <g id="kettlebell" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 16 C14 7, 26 7, 26 16" />
                    <path d="M13 16 C7 21, 7 34, 20 34 C33 34, 33 21, 27 16 Z" />
                </g>

                <g id="plate" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="20" cy="20" r="15" />
                    <circle cx="20" cy="20" r="5" />
                    <circle cx="20" cy="10" r="1.6" />
                    <circle cx="30" cy="20" r="1.6" />
                    <circle cx="20" cy="30" r="1.6" />
                    <circle cx="10" cy="20" r="1.6" />
                </g>

                <g id="barbell" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="3" y1="20" x2="37" y2="20" />
                    <rect x="9" y="11" width="3.5" height="18" rx="1.2" />
                    <rect x="14" y="14" width="3" height="12" rx="1.2" />
                    <rect x="27.5" y="11" width="3.5" height="18" rx="1.2" />
                    <rect x="23" y="14" width="3" height="12" rx="1.2" />
                </g>

                <g id="stopwatch" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="20" cy="24" r="12" />
                    <rect x="16.5" y="4" width="7" height="4" rx="1.2" />
                    <line x1="20" y1="8" x2="20" y2="12" />
                    <line x1="20" y1="24" x2="20" y2="17" />
                    <line x1="20" y1="24" x2="25" y2="27" />
                </g>

                <g id="bottle" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="16" y="4" width="8" height="5" rx="1.2" />
                    <rect x="13" y="10" width="14" height="26" rx="4" />
                    <line x1="13" y1="18" x2="27" y2="18" />
                </g>

                {/*
                    A 180x90 half-drop lattice (was 240x120 — same structure, tighter grid).
                    Row 1 sits at y=6, row 2 is nudged 30px right — that offset is what stops
                    the icons lining up into obvious columns.
                    patternTransform tilts the whole lattice, so the rows run diagonally AND
                    every icon ends up at the same angle (all parallel).
                */}
                <pattern
                    id="gym-pattern"
                    width="180"
                    height="90"
                    patternUnits="userSpaceOnUse"
                    patternTransform={`rotate(${angle})`}
                >
                    <use href="#dumbbell" transform={at(6, 6)} stroke="#a1a1aa" strokeWidth={stroke} opacity="0.22" />
                    <use href="#plate" transform={at(66, 6)} stroke="#4ade80" strokeWidth={stroke} opacity="0.28" />
                    <use href="#kettlebell" transform={at(126, 6)} stroke="#a1a1aa" strokeWidth={stroke} opacity="0.22" />

                    {/* The x=-24 copy is the wrap-around twin of the x=156 one — it fills the seam. */}
                    <use href="#barbell" transform={at(-24, 51)} stroke="#a1a1aa" strokeWidth={stroke} opacity="0.22" />
                    <use href="#stopwatch" transform={at(36, 51)} stroke="#a1a1aa" strokeWidth={stroke} opacity="0.22" />
                    <use href="#bottle" transform={at(96, 51)} stroke="#4ade80" strokeWidth={stroke} opacity="0.28" />
                    <use href="#barbell" transform={at(156, 51)} stroke="#a1a1aa" strokeWidth={stroke} opacity="0.22" />
                </pattern>

                {/*
                    A mask is read by BRIGHTNESS: white = show, black = hide, grey = partial.
                    So a radial ramp from black (center) to white (edges) makes the pattern
                    fade out under the headline and return toward the corners.
                */}
                <radialGradient id="gym-fade" cx="50%" cy="50%" r="62%">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="35%" stopColor="#333333" />
                    <stop offset="75%" stopColor="#d4d4d4" />
                    <stop offset="100%" stopColor="#ffffff" />
                </radialGradient>
                <mask id="gym-mask">
                    <rect width="100%" height="100%" fill="url(#gym-fade)" />
                </mask>

                {/* A pool of zinc-950 that's strongest at the center and fades to nothing
                    at the edges — deepens the darkness right behind the text. */}
                <radialGradient id="gym-dim" cx="50%" cy="50%" r="62%">
                    <stop offset="0%" stopColor="#09090b" stopOpacity={dim} />
                    <stop offset="60%" stopColor="#09090b" stopOpacity={dim * 0.35} />
                    <stop offset="100%" stopColor="#09090b" stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* 1. the pattern, masked so it dissolves toward the center */}
            <rect width="100%" height="100%" fill="url(#gym-pattern)" mask="url(#gym-mask)" />
            {/* 2. the dark pool on top, for extra contrast under the headline */}
            <rect width="100%" height="100%" fill="url(#gym-dim)" />
        </svg>
    );
}