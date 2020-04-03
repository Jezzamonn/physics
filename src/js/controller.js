import { PhysicsSim } from "./physics-sim";
import { seededRandom } from "./util";

const DEFAULT_STEP_TIME = 1 / (30 * 5 * 2);

export default class Controller {

	constructor() {
		this.timeToFill = 20;
		this.numLayers = 2;
		this.numSims = 2 * this.numLayers;

		// two colors = takes twice this time to fill.
		this.period = 2 * (this.timeToFill / this.numLayers);

		this.seeds = ['qertjioflk5afndqsdd', 'qarifjdsnklvpaiorejwfsd']

		this.lastStep = 0;
		this.realTimeCount = 0;
		this.steppedTimeCount = 0;

		this.stepTime = DEFAULT_STEP_TIME;

		this.physicsSims = [];
		this.reset();
	}

	reset() {
		this.physicsSims = [];
		for (let i = 0; i < this.numSims; i++) {
			const layerAmt = i / this.numLayers;
			const layerIndex = i % this.numLayers;
			const physicsSim = new PhysicsSim();

			physicsSim.color = (i % 2 == 0) ? 'black' : 'white';
			physicsSim.rng = seededRandom(this.seeds[layerIndex]);
			physicsSim.delayCount = layerAmt * this.timeToFill;

			this.physicsSims.push(physicsSim);
		}
		this.stepUntilReady();
	}

	/**
	 * Simulate time passing.
	 *
	 * @param {number} dt Time since the last frame, in seconds 
	 */
	update(dt) {
		dt *= 2;
		this.realTimeCount += dt;
		for (let i = 0; i < 15 && this.lastStep < this.realTimeCount; i++) {
			this.physicsStep();

			this.lastStep += this.stepTime;

			this.steppedTimeCount += this.stepTime;
			if (this.steppedTimeCount >= this.period) {
				this.reset();
				this.steppedTimeCount -= this.period;
			}
		}
		this.lastStep = Math.ceil(this.realTimeCount / this.stepTime) * this.stepTime;
	}

	physicsStep() {
		for (const physicsSim of this.physicsSims) {
			physicsSim.physicsStep(this.stepTime);
		}
	}

	stepUntilReady() {
		while (true) {
			let allReady = true;
			for (let i = 0; i < this.numLayers; i++) {
				if (this.physicsSims[i].delayCount > 0) {
					allReady = false;
					break;
				}
			}

			if (allReady) {
				break;
			}

			this.physicsStep();
		}
	}

	/**
	 * Render the current state of the controller.
	 *
	 * @param {!CanvasRenderingContext2D} context
	 */
	render(context) {
		for (const physicsSim of this.physicsSims) {
			physicsSim.render(context);
		}

		// Render reference border
		const borderPos = 251;
		context.beginPath();
		context.strokeStyle = '#E00';
		context.moveTo(-borderPos, -borderPos);
		context.lineTo(-borderPos, borderPos);
		context.lineTo(borderPos, borderPos);
		context.lineTo(borderPos, -borderPos);
		context.closePath();
		context.stroke();

	}

}
