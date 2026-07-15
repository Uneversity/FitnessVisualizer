export async function POST(request) {

    const { exercise, repHistory } = await request.json();

    if (!repHistory || repHistory.length === 0) {
        return Response.json({ notes: "No reps recorded." });
    }

    // doing arithmetic here since LLMs are bad at it
    const depths    = repHistory.map(r => r.minAngle);
    const lockouts  = repHistory.map(r => r.maxAngle);
    const durations = repHistory.map(r => r.durationMs);
    const avg = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    const summary = {
        totalReps: repHistory.length,
        avgDepth: avg(depths),
        worstDepth: Math.max(...depths),    // LARGER angle = shallower rep
        bestDepth: Math.min(...depths),
        avgLockout: avg(lockouts),
        avgDurationMs: avg(durations),
        fastestRepMs: Math.min(...durations),
    };

    const prompt = `You are a strength coach reviewing a single set, analyzed by a
        2D webcam pose-detection system.

        EXERCISE: ${exercise}

        HOW TO READ THE DATA:
        The system tracks the angle at one joint (knee for squats, elbow for curls).
        - minAngle = the deepest point of the rep. SMALLER = deeper range of motion.
        - maxAngle = the most extended point. Near 170-180 = full lockout/extension.
        - durationMs = time for the full rep. Under ~800ms often means momentum, not control.

        SET SUMMARY:
        ${JSON.stringify(summary, null, 2)}

        PER-REP DATA (in order):
        ${JSON.stringify(repHistory)}

        YOUR TASK:
        Give 2-3 sentences of feedback. Ground every claim in a specific number from the
        data above — cite the rep number or the angle. Look for: reps that got shallower
        as the set progressed (fatigue), incomplete lockouts, and reps rushed compared to
        the average.

        IMPORTANT LIMITS — do not violate these:
        - This is a single 2D joint angle. You CANNOT see spine position, knee tracking,
        shoulder placement, or bar path. Never comment on them.
        - If the data looks consistent and complete, say so plainly. Do not invent a flaw.
        - Address the lifter directly. No preamble, no headings, no markdown.`;

    //Res = Response status from the Gemini API.
    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
    );

    //data which is what the Gemini API returns.
    const data = await res.json();

    if (!res.ok || !data.candidates) {
        console.error("Gemini error:", JSON.stringify(data));
        
        //If error was with res then the AI coach is busy, otherwise the data is not valid. Still regardless log and return error number.
        const message = res.status === 503
            ? "The coach is having problems right now — your workout was still saved."
            : "The coach didn't give a valid response — your workout was still saved.";

        return Response.json({ notes: message }, { status: res.status });
    }

    console.log("GEMINI RESPONSE:", JSON.stringify(data, null, 2));

    return Response.json({ notes: data.candidates[0].content.parts[0].text });
    
}