var _scene = null;
function initAudio(sceneRef) { _scene = sceneRef; }

/* Utility classes for BabylonJS Sound classes - Rory Walsh 2024 */

/* One shot collision sound class that creates an optional visible mesh for testing.

OneShotCollisionSound({file:'string', x: number, z: number, w: number, visible: true/false, color: 'string', volume:number, timeBetweenPlays:number})

'file' can also be passed an array of files. These would then be played in random order. 

For example:

let triggerSounds = [];
let files = [];
files.push("./build/assets/2.wav");
files.push("./build/assets/3.wav");
files.push("./build/assets/4.wav");
triggerSounds.push(new OneShotCollisionSound({ file: files, x: 2, z: 0.5, visible: true }));

*/

class OneShotCollisionSound {
    constructor(args) {
        if (!_scene) throw new Error('OneShotCollisionSound: sounds must be created inside the createScene function, in the "ADD YOUR SOUNDS HERE" section.');
        //Simple crate
        this.y = (typeof args.y === 'undefined' ? 1 : args.y);
        this.w = (typeof args.w === 'undefined' ? .3 : args.w);
        this.h = (typeof args.h === 'undefined' ? .1 : args.h);
        this.color = (typeof args.color === 'undefined' ? 'white' : args.color);
        this.visible = (typeof args.visible === 'undefined' ? true : args.visible);
        this.name = (typeof args.name === 'undefined' ? args.file[0] : args.name);
        this.volume = (typeof args.volume === 'undefined' ? 0.5 : args.volume);
        this.timeBetweenPlays = (typeof args.timeBetweenPlays === 'undefined' ? 2000 : args.secondsBeforeNextPlay * 1000);
        this.sounds = [];
        this.position = new BABYLON.Vector3(args.x, this.y, args.z);
        this.box = BABYLON.Mesh.CreateBox(this.name, 3, _scene);
        this.box.material = new BABYLON.StandardMaterial("Mat", _scene);
        const [, r, g, b, a] = colorKeywordToRGB(this.color).replace(/\s/g, "").match(/rgba?\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?\)/i);
        this.box.material.emissiveColor = new BABYLON.Color3(r, g, b, .5);
        this.box.material.alpha = 0.1;
        this.box.material.zOffset = 1
        if (this.visible)
            this.box.material.wireframe = true;
        else
            this.box.material.alpha = 0;

        this.box.scaling = new BABYLON.Vector3(this.w, 1, this.w);
        this.box.position = new BABYLON.Vector3(args.x, this.y, args.z);
        // Create and load the sound async
        this.sound = null;
        console.log(args.file);
        if (Array.isArray(args.file)) {
            args.file.forEach(sound => {
                this.sounds.push(new BABYLON.Sound(sound, sound, _scene, function () {
                    // Call with the sound is ready to be played (loaded & decoded)
                    console.log(sound);
                }, { loop: false, autoplay: false, spatialSound: false, volume: this.volume }));
            })
        }
        else {
            this.sound = new BABYLON.Sound(this.name, args.file, _scene, function () {
                console.log("Sound ready to be played!");
            }, { loop: false, autoplay: false, spatialSound: false, volume: this.volume });
        }

        this.canPlay = true;
        (window._registeredSounds = window._registeredSounds || []).push(this);
    }

    play() {
        var that = this;
        if (this.canPlay === true) {
            if (this.sounds.length > 0) {
                let index = Math.floor(Math.random() * this.sounds.length);
                this.sounds[index].play();
            }
            else {
                if (this.sound) {
                    this.sound.play();
                }
            }
            this.canPlay = false;
        }

    }
};

class AreaSound {
    constructor(args) {
        if (!_scene) throw new Error('AreaSound: sounds must be created inside the createScene function, in the "ADD YOUR SOUNDS HERE" section.');
        //Simple crate
        this.y = (typeof args.y === 'undefined' ? 1 : args.y);
        this.w = (typeof args.w === 'undefined' ? .3 : args.w);
        this.h = (typeof args.h === 'undefined' ? .3 : args.h);
        this.color = (typeof args.color === 'undefined' ? 'white' : args.color);
        this.visible = (typeof args.visible === 'undefined' ? true : args.visible);
        this.name = (typeof args.name === 'undefined' ? args.file : args.name);
        this.rolloff = (typeof args.rolloff === 'undefined' ? 1 : args.rolloff);
        this.volume = (typeof args.volume === 'undefined' ? 1 : args.volume);
        this.minDistance = (typeof args.minDistance === 'undefined' ? 1 : args.minDistance);

        this.position = new BABYLON.Vector3(args.x, this.y, args.z);
        let size = (8 / this.rolloff) * 3;
        // sphereRadius = the outer edge — beyond this, volume is 0
        this.sphereRadius = size / 2;
        this.sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1, diameterY: size, diameterX: size, diameterZ: size }, _scene); //scene is optional and defaults to the current scene
        this.sphere.material = new BABYLON.StandardMaterial("Mat", _scene);
        const [, r, g, b, a] = colorKeywordToRGB(this.color).replace(/\s/g, "").match(/rgba?\((\d+(?:\.\d+)?),(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?\)/i);
        this.sphere.material.emissiveColor = new BABYLON.Color3(r, g, b, .5);
        this.sphere.material.alpha = 0.1;
        if (this.visible)
            this.sphere.material.wireframe = true;
        else
            this.sphere.material.alpha = 0;

        //this.sphere.scaling = new BABYLON.Vector3(this.w, 1, this.h);
        this.sphere.position = new BABYLON.Vector3(args.x, this.y, args.z);
        this.sphere.checkCollisions = false;
        this.sphere.isPickable = false;
        // Create and load the sound — NOT spatial; we manage volume manually per frame
        const _self = this;
        this.sound = new BABYLON.Sound(this.name, args.file, _scene, function () {
            console.log(args.file + " is ready to be played!");
        }, { loop: true, autoplay: true, spatialSound: false, volume: 0 });
        (window._registeredSounds = window._registeredSounds || []).push(this);
    }
};

/*
 * startSoundCollisions(camera)
 *
 * Call this once after creating your sounds. It automatically checks each
 * OneShotCollisionSound trigger every frame and plays it when the camera
 * walks inside its zone.
 *
 * Example:
 *   new OneShotCollisionSound({ file: './assets/creak.wav', x: -70, y: -12, z: -60, w: 3 });
 *   startSoundCollisions(camera);
 */
function startSoundCollisions(camera) {
    _scene.onBeforeRenderObservable.add(function () {
        var cam = _scene.activeCamera || camera;
        (window._registeredSounds || []).forEach(function (s) {
            // Unity-style attenuation:
            // outside sphereRadius  -> 0
            // inside minDistance   -> full volume
            // between              -> exponential falloff
            if (s instanceof AreaSound && s.sound) {
                var pos = s.sphere ? s.sphere.position : s.position;
                var dist = BABYLON.Vector3.Distance(cam.position, pos);
                var gain;
                if (dist >= s.sphereRadius) {
                    gain = 0;
                } else if (dist <= s.minDistance) {
                    gain = 1;
                } else {
                    // Normalise distance into [0..1] across the fade zone
                    var t = (dist - s.minDistance) / (s.sphereRadius - s.minDistance);
                    // Exponential curve: 1 at t=0, 0 at t=1, shape controlled by rolloff
                    gain = Math.pow(1 - t, s.rolloff);
                }
                s.sound.setVolume(s.volume * gain);
            }

            if (!(s instanceof OneShotCollisionSound) || !s.box) return;
            var b = s.box.getBoundingInfo().boundingBox;
            var p = cam.position;
            var inside = p.x >= b.minimumWorld.x && p.x <= b.maximumWorld.x
                && p.y >= b.minimumWorld.y && p.y <= b.maximumWorld.y
                && p.z >= b.minimumWorld.z && p.z <= b.maximumWorld.z;
            if (inside) {
                s.play();
            } else {
                s.canPlay = true;
            }
        });
    });
}

/* 
 * LoopedSound - continuously loops a sound with optional crossfade
 * 
 * LoopedSound({
 *   file: 'string',
 *   volume: number (0-1),
 *   playbackRate: number (pitch, default 1.0),
 *   crossfade: number (seconds, 0 = no crossfade),
 *   autoStart: boolean
 * })
 * 
 * Example:
 *   let drone = new LoopedSound({
 *     file: './audio/drone.wav',
 *     volume: 0.5,
 *     playbackRate: 1.0,
 *     crossfade: 1.0,
 *     autoStart: true
 *   });
 */
class LoopedSound {
    constructor(args) {
        if (!_scene) throw new Error('LoopedSound: must be created inside the createScene function.');

        this.file = args.file;
        this.volume = (typeof args.volume === 'number') ? Math.max(0, Math.min(1, args.volume)) : 0.5;
        this.playbackRate = Math.max(0.01, (typeof args.playbackRate === 'number') ? args.playbackRate : 1);
        // crossfade: 0 = no crossfade, 1 = fade in/out for half the clip length each
        this.crossfade = (typeof args.crossfade === 'number') ? Math.max(0, Math.min(1, args.crossfade)) : 0;

        this._ctx = null;
        this._masterGain = null;
        this._buffer = null;
        this._activeSources = [];
        this._scheduleTimer = null;
        this._isRunning = false;

        (window._registeredSounds = window._registeredSounds || []).push(this);
        this._load();
    }

    _load() {
        var self = this;
        var audioEngine = BABYLON.Engine.audioEngine;
        this._ctx = (audioEngine && (audioEngine.audioContext || audioEngine._audioContext))
            || new (window.AudioContext || window.webkitAudioContext)();

        console.log('[LoopedSound] AudioContext state on load:', this._ctx.state, '| file:', this.file);

        this._masterGain = this._ctx.createGain();
        this._masterGain.gain.value = this.volume;
        this._masterGain.connect(this._ctx.destination);

        fetch(this.file)
            .then(function (r) { return r.arrayBuffer(); })
            .then(function (ab) {
                console.log('[LoopedSound] Decoding audio data...');
                return self._ctx.decodeAudioData(ab);
            })
            .then(function (buffer) {
                self._buffer = buffer;
                console.log('[LoopedSound] Buffer decoded. Duration:', buffer.duration.toFixed(3), 's | playbackRate:', self.playbackRate, '| crossfade:', self.crossfade);
                self._startWhenUnlocked();
            })
            .catch(function (e) { console.warn('[LoopedSound] Failed to load', self.file, e); });
    }

    _startWhenUnlocked() {
        var self = this;
        var ctx = this._ctx;

        console.log('[LoopedSound] _startWhenUnlocked, ctx.state:', ctx.state);

        if (ctx.state === 'running') {
            this._play();
            return;
        }

        var audioEngine = BABYLON.Engine.audioEngine;
        if (audioEngine && audioEngine.onAudioUnlockedObservable) {
            console.log('[LoopedSound] Waiting for BabylonJS audio unlock...');
            audioEngine.onAudioUnlockedObservable.addOnce(function () {
                console.log('[LoopedSound] Audio unlocked via BabylonJS, ctx.state:', ctx.state);
                if (!self._isRunning) { self._play(); }
            });
        } else {
            console.log('[LoopedSound] No onAudioUnlockedObservable, polling...');
            (function poll() {
                ctx.resume().then(function () {
                    console.log('[LoopedSound] poll: ctx.state after resume:', ctx.state);
                    if (!self._isRunning && ctx.state === 'running') { self._play(); }
                    else if (!self._isRunning) { setTimeout(poll, 200); }
                });
            })();
        }
    }

    _play() {
        if (this._isRunning || !this._buffer) {
            console.warn('[LoopedSound] _play() called but isRunning:', this._isRunning, 'buffer:', !!this._buffer);
            return;
        }
        this._isRunning = true;
        console.log('[LoopedSound] _play() starting. crossfade:', this.crossfade, '| bufferDuration:', this._buffer.duration.toFixed(3));

        if (this.crossfade <= 0) {
            // Single looping node — Web Audio handles the loop point exactly, fully JS-freeze-proof.
            var src = this._ctx.createBufferSource();
            src.buffer = this._buffer;
            src.loop = true;
            src.playbackRate.value = this.playbackRate;
            src.connect(this._masterGain);
            src.start(0);
            this._activeSources.push(src);
            console.log('[LoopedSound] Native loop started');
        } else {
            // Look-ahead scheduler: runs every 25ms, schedules instances 150ms ahead on
            // the audio clock. Immune to JS-thread freezes — if we fall behind we just
            // snap _nextAudioStart forward and continue without cascading.
            this._nextAudioStart = this._ctx.currentTime;
            this._instanceCount = 0;
            this._runScheduler();
        }
    }

    _runScheduler() {
        if (!this._isRunning) { return; }
        var ctx = this._ctx;
        var lookahead = 0.15; // seconds to schedule ahead
        var duration = this._buffer.duration / this.playbackRate;
        // crossfade is a 0-1 fraction: crossfadeSecs = crossfade * (duration / 2)
        // At crossfade=1, each instance fades for duration/2 and the next starts at the midpoint.
        var crossfadeSecs = this.crossfade * (duration / 2);
        var period = duration - crossfadeSecs;

        // If JS was frozen and we're badly behind, snap forward to avoid a burst
        if (this._nextAudioStart < ctx.currentTime - period) {
            console.log('[LoopedSound] scheduler behind by', (ctx.currentTime - this._nextAudioStart).toFixed(3), 's — snapping forward');
            this._nextAudioStart = ctx.currentTime;
        }

        // Schedule every instance whose start time falls within the lookahead window
        while (this._nextAudioStart < ctx.currentTime + lookahead) {
            this._scheduleOneInstance(this._nextAudioStart, this._instanceCount === 0);
            this._instanceCount++;
            this._nextAudioStart += period;
        }

        var self = this;
        this._scheduleTimer = setTimeout(function () { self._runScheduler(); }, 25);
    }

    _scheduleOneInstance(audioStartTime, isFirst) {
        var ctx = this._ctx;
        var self = this;
        var t = Math.max(audioStartTime, ctx.currentTime);
        var duration = this._buffer.duration / this.playbackRate;
        var crossfadeSecs = this.crossfade * (duration / 2);

        console.log('[LoopedSound] scheduling instance #' + this._instanceCount,
            '| t:', t.toFixed(3), '| duration:', duration.toFixed(3),
            '| crossfadeSecs:', crossfadeSecs.toFixed(3), '| isFirst:', isFirst);

        var gain = ctx.createGain();
        gain.connect(this._masterGain);

        var src = ctx.createBufferSource();
        src.buffer = this._buffer;
        src.playbackRate.value = this.playbackRate;
        src.connect(gain);

        if (isFirst || crossfadeSecs === 0) {
            gain.gain.setValueAtTime(1.0, t);
        } else {
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(1.0, t + crossfadeSecs);
        }
        if (crossfadeSecs > 0) {
            gain.gain.setValueAtTime(1.0, t + duration - crossfadeSecs);
            gain.gain.linearRampToValueAtTime(0, t + duration);
        }

        src.start(t);
        src.stop(t + duration);

        var srcRef = src;
        var gainRef = gain;
        this._activeSources.push(srcRef);
        src.onended = function () {
            gainRef.disconnect();
            var idx = self._activeSources.indexOf(srcRef);
            if (idx !== -1) { self._activeSources.splice(idx, 1); }
            console.log('[LoopedSound] instance ended | active:', self._activeSources.length);
        };
    }

    start() {
        if (!this._isRunning) { this._startWhenUnlocked(); }
    }

    stop() {
        this._isRunning = false;
        if (this._scheduleTimer !== null) { clearTimeout(this._scheduleTimer); this._scheduleTimer = null; }
        this._activeSources.forEach(function (src) { try { src.stop(); } catch (e) { } });
        this._activeSources = [];
        if (this._masterGain) { this._masterGain.gain.value = 0; }
    }

    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this._masterGain) { this._masterGain.gain.value = this.volume; }
    }

    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.01, rate);
        this._activeSources.forEach(function (src) { src.playbackRate.value = rate; });
    }
}

/* 
 * RandomNonSpatialSound - plays sounds at random intervals with pitch/amplitude variation
 * 
 * RandomNonSpatialSound({
 *   file: 'string' or ['array', 'of', 'files'],
 *   minInterval: number (ms),
 *   maxInterval: number (ms),
 *   pitchVariation: number,
 *   amplitudeVariation: number,
 *   basePitch: number,
 *   baseAmplitude: number,
 *   autoStart: boolean
 * })
 * 
 * Example:
 *   let ambient = new RandomNonSpatialSound({
 *     file: ['./audio/birds1.wav', './audio/birds2.wav'],
 *     minInterval: 2000,
 *     maxInterval: 8000,
 *     pitchVariation: 0.2,
 *     amplitudeVariation: 0.3,
 *     basePitch: 1.0,
 *     baseAmplitude: 0.5,
 *     autoStart: true
 *   });
 */
class RandomNonSpatialSound {
    constructor(args) {
        if (!_scene) throw new Error('RandomNonSpatialSound: sounds must be created inside the createScene function, in the "ADD YOUR SOUNDS HERE" section.');

        // Process file parameter
        const fileArray = Array.isArray(args.file) ? args.file : [args.file];
        this.files = fileArray.filter(Boolean);

        // Parameters with defaults
        this.minInterval = Math.max(0, Number(args.minInterval) || 1000);
        this.maxInterval = Math.max(this.minInterval, Number(args.maxInterval) || 5000);
        this.pitchVariation = Math.max(0, Number(args.pitchVariation) || 0);
        this.amplitudeVariation = Math.max(0, Number(args.amplitudeVariation) || 0);
        this.basePitch = Math.max(0.01, Number(args.basePitch) || 1);
        this.baseAmplitude = Math.max(0, Number(args.baseAmplitude) || 1);
        this.autoStart = (typeof args.autoStart === 'undefined' ? true : args.autoStart);

        this.sounds = [];
        this.timerId = null;
        this.isRunning = false;

        // Load all sound files
        this.files.forEach(soundFile => {
            this.sounds.push(new BABYLON.Sound(soundFile, soundFile, _scene, function () {
                console.log(soundFile + " ready for random playback");
            }, { loop: false, autoplay: false, spatialSound: false }));
        });

        (window._registeredSounds = window._registeredSounds || []).push(this);

        if (this.autoStart) {
            this.start();
        }
    }

    start() {
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this._scheduleNext();
    }

    stop() {
        this.isRunning = false;
        if (this.timerId !== null) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    _scheduleNext() {
        if (!this.isRunning) {
            return;
        }

        const waitMs = this._randomRange(this.minInterval, this.maxInterval);
        this.timerId = setTimeout(() => {
            if (!this.isRunning || this.sounds.length === 0) {
                return;
            }

            const randomSound = this.sounds[Math.floor(Math.random() * this.sounds.length)];
            const randomPitch = Math.max(0.01, this.basePitch + (this._signedRandom() * this.pitchVariation));
            const randomAmplitude = this._clamp(this.baseAmplitude + (this._signedRandom() * this.amplitudeVariation), 0, 1);

            randomSound.setPlaybackRate(randomPitch);
            randomSound.setVolume(randomAmplitude);
            randomSound.play();

            this._scheduleNext();
        }, waitMs);
    }

    _randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    _signedRandom() {
        return (Math.random() * 2) - 1;
    }

    _clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
}

/*
 * FootstepSystem - plays footstep sounds as the player moves
 *
 * FootstepSystem({
 *   dryFiles: ['array', 'of', 'files'],   // played on normal ground
 *   wetFiles:  ['array', 'of', 'files'],   // played when over water
 *   volume: number (0-1),
 *   volumeVariation: number (0-1),         // random ± offset per step
 *   pitchVariation: number (0-1),          // random ± pitch offset per step
 *   strideLength: number (world units),    // distance walked before next step fires
 *   stepIntervalVariation: number (0-1)    // random ± fraction applied to strideLength
 * })
 */
class FootstepSystem {
    constructor(args) {
        if (!_scene) throw new Error('FootstepSystem: must be created inside the createScene function.');

        this.dryFiles = Array.isArray(args.dryFiles) ? args.dryFiles.slice() : [];
        this.wetFiles = Array.isArray(args.wetFiles) ? args.wetFiles.slice() : [];
        this.volume = (typeof args.volume === 'number') ? Math.max(0, Math.min(1, args.volume)) : 0.7;
        this.volumeVariation = (typeof args.volumeVariation === 'number') ? Math.max(0, Math.min(1, args.volumeVariation)) : 0.0;
        this.pitchVariation = (typeof args.pitchVariation === 'number') ? Math.max(0, args.pitchVariation) : 0.0;
        this.strideLength = (typeof args.strideLength === 'number') ? Math.max(0.1, args.strideLength) : 2.0;
        this.stepIntervalVariation = (typeof args.stepIntervalVariation === 'number') ? Math.max(0, Math.min(1, args.stepIntervalVariation)) : 0.0;

        this._dryBuffers = [];
        this._wetBuffers = [];
        this._lastPosition = null;
        this._lastStepTime = 0;
        this._distanceSinceLastStep = 0;
        this._currentStride = this.strideLength;
        this._wasStationary = true;

        var audioEngine = BABYLON.Engine.audioEngine;
        this._ctx = (audioEngine && (audioEngine.audioContext || audioEngine._audioContext))
            || new (window.AudioContext || window.webkitAudioContext)();

        this.dryFiles.forEach(f => this._loadBuffer(f, this._dryBuffers));
        this.wetFiles.forEach(f => this._loadBuffer(f, this._wetBuffers));

        this._observer = _scene.onBeforeRenderObservable.add(() => this._update());
        window._footstepSystem = this;
    }

    _loadBuffer(file, targetArray) {
        var self = this;
        fetch(file)
            .then(r => r.arrayBuffer())
            .then(ab => self._ctx.decodeAudioData(ab))
            .then(buffer => { targetArray.push(buffer); })
            .catch(e => console.warn('[FootstepSystem] Failed to load', file, e));
    }

    _update() {
        var cam = _scene.activeCamera;
        if (!cam || (cam.getClassName && cam.getClassName() === 'ArcRotateCamera')) return;

        var now = performance.now();
        var pos = cam.position;

        if (!this._lastPosition) {
            this._lastPosition = pos.clone();
            return;
        }

        var dx = pos.x - this._lastPosition.x;
        var dz = pos.z - this._lastPosition.z;
        var dist = Math.sqrt(dx * dx + dz * dz);
        this._lastPosition.copyFrom(pos);

        // Standing still — reset distance accumulator so next movement starts fresh
        if (dist < 0.001) {
            this._distanceSinceLastStep = 0;
            this._wasStationary = true;
            return;
        }

        // First movement after standing still — fire immediately (skip stride accumulation)
        if (this._wasStationary && now - this._lastStepTime >= 80) {
            this._wasStationary = false;
            this._distanceSinceLastStep = 0;

            var isOverWaterImmediate = false;
            var immediateRay = new BABYLON.Ray(pos, new BABYLON.Vector3(0, -1, 0), 1000);
            var immediateHit = _scene.pickWithRay(immediateRay, function (mesh) { return mesh.isPickable; });
            if (immediateHit && immediateHit.pickedMesh && immediateHit.pickedMesh.metadata && immediateHit.pickedMesh.metadata.isWater === true) {
                isOverWaterImmediate = true;
            }
            var immediateBank = isOverWaterImmediate ? this._wetBuffers : this._dryBuffers;
            if (immediateBank.length > 0) {
                this._playBuffer(immediateBank[Math.floor(Math.random() * immediateBank.length)]);
                this._lastStepTime = now;
                var v = (Math.random() * 2 - 1) * this.stepIntervalVariation;
                this._currentStride = Math.max(0.1, this.strideLength * (1 + v));
            }
            return;
        }
        this._wasStationary = false;

        this._distanceSinceLastStep += dist;

        // Fire when we've walked a full stride, with 80ms hard floor to prevent double-fires
        if (this._distanceSinceLastStep < this._currentStride) return;
        if (now - this._lastStepTime < 80) return;

        // Water check via downward raycast
        var isOverWater = false;
        var downRay = new BABYLON.Ray(pos, new BABYLON.Vector3(0, -1, 0), 1000);
        var hit = _scene.pickWithRay(downRay, function (mesh) { return mesh.isPickable; });
        if (hit && hit.pickedMesh && hit.pickedMesh.metadata && hit.pickedMesh.metadata.isWater === true) {
            isOverWater = true;
        }

        var bank = isOverWater ? this._wetBuffers : this._dryBuffers;
        if (bank.length === 0) { this._distanceSinceLastStep = 0; return; }

        this._playBuffer(bank[Math.floor(Math.random() * bank.length)]);
        this._lastStepTime = now;
        this._distanceSinceLastStep = 0;
        // Pick a new randomised stride for the next step
        var variation = (Math.random() * 2 - 1) * this.stepIntervalVariation;
        this._currentStride = Math.max(0.1, this.strideLength * (1 + variation));
    }

    _playBuffer(buffer) {
        if (this._ctx.state !== 'running') return;

        var gain = this._ctx.createGain();
        var vol = this.volume + (Math.random() * 2 - 1) * this.volumeVariation;
        gain.gain.value = Math.max(0, Math.min(1, vol));
        gain.connect(this._ctx.destination);

        var src = this._ctx.createBufferSource();
        src.buffer = buffer;
        src.playbackRate.value = Math.max(0.1, 1 + (Math.random() * 2 - 1) * this.pitchVariation);
        src.connect(gain);
        src.start();
        src.onended = function () { gain.disconnect(); };
    }

    dispose() {
        if (this._observer) {
            _scene.onBeforeRenderObservable.remove(this._observer);
            this._observer = null;
        }
        this._dryBuffers = [];
        this._wetBuffers = [];
        if (window._footstepSystem === this) window._footstepSystem = null;
    }
}

//https://stackoverflow.com/a/72808544
const colorKeywordToRGB = (colorKeyword) => {
    // CREATE TEMPORARY ELEMENT
    let el = document.createElement('div');
    // APPLY COLOR TO TEMPORARY ELEMENT
    el.style.color = colorKeyword;
    // APPEND TEMPORARY ELEMENT
    document.body.appendChild(el);
    // RESOLVE COLOR AS RGB() VALUE
    let rgbValue = window.getComputedStyle(el).color;
    // REMOVE TEMPORARY ELEMENT
    document.body.removeChild(el);
    return rgbValue;
}