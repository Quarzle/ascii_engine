export class Random {
	constructor(initialSeed = 0) {
		this.previousValue = initialSeed;
	}

	int(min, max) {
		return Math.floor(
			Math.random() * (max - min + 1)
		) + min;
	}

	float(min, max) {
		return Math.random() * (max - min) + min;
	}

	seededInt(min, max, seed) {
		const random = this.seededFloat(0, 1, seed);
		return Math.floor(random * (max - min + 1)) + min;
	}

	seededFloat(min, max, seed, sequenced = false) {
		let t;
		if (sequenced) {
			t = (seed + this.previousValue) >>> 0;
		} else {
			t = seed >>> 0;
		}

		t += 0x6D2B79F5;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

		const random = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

		this.previousValue = random;
		return random * (max - min) + min;
	}

	setInitial(value) {
		this.previousValue = value;
	}
}
