import { World, Vec2, Edge, Circle, Polygon } from "planck-js";
import { slurp, seededRandom } from './util';

const PX_FROM_M = 50;
const M_FROM_PX = 1 / PX_FROM_M;
const PX_SIZE = 250;
const PX_WORLD_BOUNDARY = 1.2 * PX_SIZE;
const STEPS_PER_SECOND = 60;
const TICKS_PER_SHAPE = 10;
const SHAPES_PER_ROW = 10;
const SHAPES_PER_SUBLOOP = 19;
const M_SHAPE_INNER_RADIUS = M_FROM_PX * PX_SIZE / SHAPES_PER_ROW;
const M_SHAPE_OUTER_RADIUS = M_SHAPE_INNER_RADIUS / Math.cos(Math.PI / 6)

export default class Controller {

	constructor() {
		this.animAmt = 0;
		this.period = 10;

		this.lastStep = 0;
		this.timeCount = 0;
		this.stepTime = 1 / STEPS_PER_SECOND;
		this.numSteps = 0;

		this.rng = seededRandom("qertjioflkasndq");
		this.positions = [];
		for (let i = 0; i < SHAPES_PER_SUBLOOP; i++) {
			this.positions.push(this.rng());
		}

		this.world = World({gravity: Vec2(0, -10)})

		this.numShapes = 0;

		this.addWalls();
		this.addFloor();
	}

	addWalls() {
		const walls = this.world.createBody({
			type: 'static',
			position: Vec2(0, 0),
		});
		walls.createFixture({
			shape: Edge(
				Vec2(-M_FROM_PX * PX_SIZE, M_FROM_PX * -2 * PX_SIZE),
				Vec2(-M_FROM_PX * PX_SIZE, M_FROM_PX * 100 * PX_SIZE)),
		});
		walls.createFixture({
			shape: Edge(
				Vec2(M_FROM_PX * PX_SIZE, M_FROM_PX * -2 * PX_SIZE),
				Vec2(M_FROM_PX * PX_SIZE, M_FROM_PX * 100 * PX_SIZE))
		});
	}

	addFloor() {
		for (let i = 0; i < SHAPES_PER_ROW + 1; i++) {
			const amt = i / SHAPES_PER_ROW;
			const point = Vec2(
				slurp(-M_FROM_PX * PX_SIZE, M_FROM_PX * PX_SIZE, amt),
				0
			);
			const body = this.world.createBody({
				type: 'static',
				position: point,
			});
			body.createFixture({
				shape: getHexShape(0.95 * M_SHAPE_OUTER_RADIUS)
			});
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
			this.numSteps ++;
		}
		this.lastStep = Math.ceil(this.timeCount / this.stepTime) * this.stepTime;
	}

	physicsStep() {
		if (this.numSteps % TICKS_PER_SHAPE == 0) {
			this.addShape();
		}
		this.world.step(this.stepTime);
	}

	addShape() {
		const subLoopAmt = this.numShapes / SHAPES_PER_SUBLOOP;
		const circleBody = this.world.createBody({
			type: 'dynamic',
			position: Vec2(
				slurp(
					-M_FROM_PX * PX_SIZE + M_SHAPE_OUTER_RADIUS,
					M_FROM_PX * PX_SIZE - M_SHAPE_OUTER_RADIUS,
					this.positions[this.numShapes % SHAPES_PER_SUBLOOP]
				),
				(M_FROM_PX * 1.1 * PX_SIZE) + (3 * M_SHAPE_OUTER_RADIUS * subLoopAmt)
			),
			fixedRotation: false,
			// angularVelocity: 4 * 2 * Math.PI / 60,
			angularDamping: 0.9
		});
		const vertices = [];
		for (let i = 0; i < 6; i++) {
			const angle = 2 * Math.PI * ((i + 0.45) / 6);
			vertices.push(
				new Vec2(
					M_SHAPE_OUTER_RADIUS * Math.cos(angle),
					M_SHAPE_OUTER_RADIUS * Math.sin(angle),
				)
			)
		}
		circleBody.createFixture(
			{
				shape: getHexShape(0.95 * M_SHAPE_OUTER_RADIUS),
				friction: 0.1,
				restitution: 0.1,
				density: 1
			}
		);

		this.numShapes++;
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
		const subLoopAmt = ((this.timeCount * STEPS_PER_SECOND) / TICKS_PER_SHAPE) / SHAPES_PER_SUBLOOP;
		context.scale(PX_FROM_M, -PX_FROM_M);
		context.translate(0, -3 * M_SHAPE_OUTER_RADIUS * subLoopAmt);
		for (var body = this.world.getBodyList(); body; body = body.getNext()) {
			if (!body.isAwake) {
				continue;
			}
			context.save();
			const bodyPos = body.getPosition();
			context.translate(bodyPos.x, bodyPos.y);
			context.rotate(body.getAngle());
			for (var fixture = body.getFixtureList(); fixture; fixture = fixture.getNext()) {
				const shape = fixture.getShape();
				switch (shape.getType()) {
					case 'circle':
						this.renderCircle(context, shape);
						break;
					case 'polygon':
						this.renderPolygon(context, shape);
				}
			}
			context.restore();
		}
	}

	renderCircle(context, shape) {
		const center = shape.getCenter();
		const radius = shape.getRadius();
	
		context.beginPath();
		context.fillStyle = 'black';
		context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
		context.fill();
	}

	renderPolygon(context, shape) {
		const vertices = shape.m_vertices;
	
		context.beginPath();
		context.fillStyle = 'black';
		for (let i = 0; i < vertices.length; i++) {
			if (i == 0) {
				context.moveTo(vertices[i].x, vertices[i].y);
			}
			else {
				context.lineTo(vertices[i].x, vertices[i].y);
			}
		}
		context.closePath();
		context.fill();
	}

}


function getHexShape(outerRadius) {
	const vertices = [];
	for (let i = 0; i < 6; i++) {
		const angle = 2 * Math.PI * ((i + 0.5) / 6);
		vertices.push(
			new Vec2(
				outerRadius * Math.cos(angle),
				outerRadius * Math.sin(angle),
			)
		)
	}
	return Polygon(vertices);
}