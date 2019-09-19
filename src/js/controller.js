import { World, Vec2, Edge, Circle } from "planck-js";

export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 3;

		this.lastStep = 0;
		this.timeCount = 0;
		this.stepTime = 1 / 60;
		this.numSteps = 0;

		this.world = World({gravity: Vec2(0, -10)})

		const ground = this.world.createBody({
			type: 'static',
			position: Vec2(0, -10),
		});
		ground.createFixture({
			shape: Edge(Vec2(-40.0, 0.0), Vec2(40.0, 0.0))
		});
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
			this.numSteps ++;
		}
	}

	physicsStep() {
		if (this.numSteps % 60 == 0) {
			const circleBody = this.world.createBody({type: 'dynamic', position: Vec2(Math.random(), 10)});
			circleBody.createFixture(Circle(1), {density: 1});
		}
		this.world.step(this.stepTime);
	}

	/**
	 * Render the current state of the controller.
	 *
	 * @param {!CanvasRenderingContext2D} context
	 */
	render(context) {
		context.scale(10, -10);
		for (var body = this.world.getBodyList(); body; body = body.getNext()) {
			const bodyPos = body.getPosition();
			for (var fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
				const shape = fixture.getShape();
				if (shape.getType() != 'circle') {
					continue;
				}
				const center = shape.getCenter();
				const radius = shape.getRadius();
			
				context.beginPath();
				context.fillStyle = 'black';
				context.arc(bodyPos.x + center.x, bodyPos.y + center.y, radius, 0, 2 * Math.PI);
				context.fill();
			}
		}
	}

}
