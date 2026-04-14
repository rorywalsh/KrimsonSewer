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