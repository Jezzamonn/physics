import { PhysicsSim } from "./physics-sim";

const DEFAULT_STEP_TIME = 1 / (30 * 4 * 2);

export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 10;

		this.lastStep = 0;
		this.timeCount = 0;
		this.stepTime = DEFAULT_STEP_TIME;

		this.physicsSims = [];
		for (let i = 0; i < 2; i++) {
			const physicsSim = new PhysicsSim();
			physicsSim.color = (i % 2 == 0) ? 'black' : 'white';
			
			physicsSim.delayCount = i * 1;

			this.physicsSims.push(physicsSim);
		}
	}

	/**
	 * Simulate time passing.
	 *
	 * @param {number} dt Time since the last frame, in seconds 
	 */
	update(dt) {
		this.animAmt += dt / this.period;
		this.animAmt %= 1;

		this.timeCount += dt;
		for (let i = 0; i < 10 && this.lastStep < this.timeCount; i++) {
			this.physicsStep();

			this.lastStep += this.stepTime;
		}
		this.lastStep = Math.ceil(this.timeCount / this.stepTime) * this.stepTime;
	}

	physicsStep() {
		for (const physicsSim of this.physicsSims) {
			physicsSim.physicsStep(this.stepTime);
		}
	}

	/**
	 * Render the current state of the controller.
	 *
	 * @param {!CanvasRenderingContext2D} context
	 */
	render(context) {
		// Render reference border
		const borderPos = 251;
		context.beginPath();
		context.strokeStyle = '#EEE';
		context.moveTo(-borderPos, -borderPos);
		context.lineTo(-borderPos, borderPos);
		context.lineTo(borderPos, borderPos);
		context.lineTo(borderPos, -borderPos);
		context.closePath();
		context.stroke();

		for (const physicsSim of this.physicsSims) {
			physicsSim.render(context);
		}
	}

}
