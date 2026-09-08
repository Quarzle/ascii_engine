export class AudioManager {
	constructor() {
		this.sounds = new Map();
		this.playingSounds = new Map();
	}

	preload(sounds) {
		for (const [name, filePath] of Object.entries(sounds)) {
			const audio = new Audio(filePath);

			audio.preload = "auto";

			this.sounds.set(name, audio);
			this.playingSounds.set(name, new Set());
		}
	}

	play(name, volume = 1, pitch = 1) {
		const source = this.sounds.get(name);

		if (!source) {
			console.warn(
				`Sound not loaded: ${name}`
			);

			return;
		}

		const audio = source.cloneNode();

		audio.volume =
			Math.max(0, Math.min(1, volume));

		audio.playbackRate = pitch;

		audio.preservesPitch = false;
		audio.mozPreservesPitch = false;
		audio.webkitPreservesPitch = false;

		if (!this.playingSounds.has(name)) {
			this.playingSounds.set(
				name,
				new Set()
			);
		}

		const playing =
			this.playingSounds.get(name);

		playing.add(audio);

		audio.addEventListener("ended", () => {
			playing.delete(audio);
		});

		audio.play().catch(error => {
			console.warn(
				`Could not play sound "${name}":`,
				error
			);

			playing.delete(audio);
		});
	}

	stop(name) {
		const playing =
			this.playingSounds.get(name);

		if (!playing) {
			console.warn(
				`Sound not loaded: ${name}`
			);

			return;
		}

		for (const audio of playing) {
			audio.pause();
			audio.currentTime = 0;
		}

		playing.clear();
	}

	fadeOut(name, duration = 500) {
		const playing =
			this.playingSounds.get(name);

		if (!playing) {
			console.warn(
				`Sound not loaded: ${name}`
			);

			return;
		}

		for (const audio of playing) {
			const startVolume = audio.volume;
			const startTime = performance.now();

			const fade = timestamp => {
				const elapsed =
					timestamp - startTime;

				const progress =
					Math.min(
						elapsed / duration,
						1
					);

				audio.volume =
					startVolume * (1 - progress);

				if (progress < 1) {
					requestAnimationFrame(fade);
				} else {
					audio.pause();
					audio.currentTime = 0;
					audio.volume = startVolume;

					playing.delete(audio);
				}
			};

			requestAnimationFrame(fade);
		}
	}
}
