// ============================================================
// SOUNDS — this is the only file you need to edit
// ============================================================
function initSounds() {
    let areaSounds = [];
    areaSounds.push(new AreaSound({ file: "./audio/toneC3.ogg", x: -71.58, y: -15.07, z: -58.97, volume: 1, rolloff: 1.4, minDistance: 2, visible: false }));
    let footsteps = new FootstepSystem({
        dryFiles: ["./audio/footstep_dry1.ogg", "./audio/footstep_dry2.ogg"],
        wetFiles: [],
        volume: 0.55,
        volumeVariation: 0.2,
        pitchVariation: 0.1,
        stepInterval: 400,
        stepIntervalVariation: 0.2
    });
}