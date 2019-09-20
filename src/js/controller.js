import { World, Vec2, Edge, Circle, Polygon } from "planck-js";
import { slurp } from './util';

const PX_FROM_M = 50;
const M_FROM_PX = 1 / PX_FROM_M;
const PX_SIZE = 250;
const PX_WORLD_BOUNDARY = 1.2 * PX_SIZE;

export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 10;

		this.lastStep = 0;
		this.timeCount = 0;
		this.stepTime = 1 / 60;
		this.numSteps = 0;

		this.world = World({gravity: Vec2(0, -10)})

		const ground = this.world.createBody({
			type: 'static',
			position: Vec2(0, 0),
		});
		ground.createFixture({
			shape: Edge(
				Vec2(M_FROM_PX * -2 * PX_SIZE, -M_FROM_PX * PX_SIZE),
				Vec2(M_FROM_PX * 2 * PX_SIZE, -M_FROM_PX * PX_SIZE))
		});
		ground.createFixture({
			shape: Edge(
				Vec2(-M_FROM_PX * PX_SIZE, M_FROM_PX * -2 * PX_SIZE),
				Vec2(-M_FROM_PX * PX_SIZE, M_FROM_PX * 2 * PX_SIZE))
		});
		ground.createFixture({
			shape: Edge(
				Vec2(M_FROM_PX * PX_SIZE, M_FROM_PX * -2 * PX_SIZE),
				Vec2(M_FROM_PX * PX_SIZE, M_FROM_PX * 2 * PX_SIZE))
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
		if (this.numSteps % 10 == 0) {
			this.addShape();
		}
		this.world.step(this.stepTime);
	}

	addShape() {
		const m_radius = M_FROM_PX * PX_SIZE / 10;
		const circleBody = this.world.createBody({
			type: 'dynamic',
			position: Vec2(
				slurp(
					-M_FROM_PX * PX_SIZE + m_radius,
					M_FROM_PX * PX_SIZE - m_radius,
					Math.random()
				),
				M_FROM_PX * 1.1 * PX_SIZE
			)
		});
		const vertices = [];
		for (let i = 0; i < 6; i++) {
			const angle = 2 * Math.PI * (i / 6);
			vertices.push(
				new Vec2(
					m_radius * Math.cos(angle),
					m_radius * Math.sin(angle),
				)
			)
		}
		circleBody.createFixture(new Polygon(vertices));
	}

	removeFarAwayThings() {
		for (var body = this.world.getBodyList(); body; body = body.getNext()) {
			const position = body.getPosition();
			if (position.x < -M_FROM_PX * PX_WORLD_BOUNDARY || 
				position.x > M_FROM_PX * PX_WORLD_BOUNDARY || 
				position.y < -M_FROM_PX * PX_WORLD_BOUNDARY || 
				position.y > M_FROM_PX * PX_WORLD_BOUNDARY) {
				// This is fine during the loop, thanks to how box2d uses linked-lists
				this.world.destroyBody(body);
			}
		}
	}

	/**
	 * Render the current state of the controller.
	 *
	 * @param {!CanvasRenderingContext2D} context
	 */
	render(context) {
		context.scale(PX_FROM_M, -PX_FROM_M);
		for (var body = this.world.getBodyList(); body; body = body.getNext()) {
			const bodyPos = body.getPosition();
			for (var fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
				const shape = fixture.getShape();
				switch (shape.getType()) {
					case 'circle':
						this.renderCircle(context, bodyPos, shape);
						break;
					case 'polygon':
						this.renderPolygon(context, bodyPos, shape);
				}
			}
		}
	}

	renderCircle(context, bodyPos, shape) {
		const center = shape.getCenter();
		const radius = shape.getRadius();
	
		context.beginPath();
		context.fillStyle = 'black';
		context.arc(bodyPos.x + center.x, bodyPos.y + center.y, radius, 0, 2 * Math.PI);
		context.fill();
	}

	renderPolygon(context, bodyPos, shape) {
		const vertices = shape.m_vertices;
	
		context.beginPath();
		context.fillStyle = 'black';
		for (let i = 0; i < vertices.length; i++) {
			if (i == 0) {
				context.moveTo(bodyPos.x + vertices[i].x, bodyPos.y + vertices[i].y)
			}
			else {
				context.lineTo(bodyPos.x + vertices[i].x, bodyPos.y + vertices[i].y)
			}
		}
		context.closePath();
		context.fill();
	}

}
