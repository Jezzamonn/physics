import { World, Vec2, Edge, Polygon } from "planck-js";
import { slurp, seededRandom } from './util';

const PX_FROM_M = 50;
const M_FROM_PX = 1 / PX_FROM_M;
const PX_SIZE = 250;

const PX_WALL_SIZE = 1.2 * PX_SIZE;
const PX_WORLD_BOUNDARY = 1.2 * PX_WALL_SIZE;
const SHAPES_PER_ROW = 10;
const M_SHAPE_INNER_RADIUS = M_FROM_PX * PX_WALL_SIZE / SHAPES_PER_ROW;
const M_SHAPE_OUTER_RADIUS = M_SHAPE_INNER_RADIUS / Math.cos(Math.PI / 6)

const TICKS_PER_SHAPE = 10;

export class PhysicsSim {
    constructor() {
        this.rng = seededRandom("qertjioflkasndq");
		this.world = World({gravity: Vec2(0, -10)})

		this.numShapes = 0;
		this.numSteps = 0;

        this.addWalls();
		this.addFloor();
    }

	physicsStep(stepTime) {
		if (this.numSteps % TICKS_PER_SHAPE == 0 && this.numShapes < 150) {
			this.addShape();
		}
        this.world.step(stepTime);

        this.numSteps ++;
    }
    
    // ------------ Adding / Removing Physics Stuff ------------

	addWalls() {
		const walls = this.world.createBody({
			type: 'static',
			position: Vec2(0, 0),
		});
		walls.createFixture({
			shape: Edge(
				Vec2(-M_FROM_PX * PX_WALL_SIZE, M_FROM_PX * -2 * PX_SIZE),
				Vec2(-M_FROM_PX * PX_WALL_SIZE, M_FROM_PX * 100 * PX_SIZE)),
		});
		walls.createFixture({
			shape: Edge(
				Vec2(M_FROM_PX * PX_WALL_SIZE, M_FROM_PX * -2 * PX_SIZE),
				Vec2(M_FROM_PX * PX_WALL_SIZE, M_FROM_PX * 100 * PX_SIZE))
		});
	}

	addFloor() {
		for (let i = 0; i < SHAPES_PER_ROW + 1; i++) {
			const amt = i / SHAPES_PER_ROW;
			const point = Vec2(
				slurp(-M_FROM_PX * PX_WALL_SIZE, M_FROM_PX * PX_WALL_SIZE, amt),
				-M_FROM_PX * PX_SIZE
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

	addShape() {
		const mDropHeight = 1.5 * M_SHAPE_OUTER_RADIUS * (this.numShapes / SHAPES_PER_ROW);
		const hexBody = this.world.createBody({
			type: 'dynamic',
			position: Vec2(
				slurp(
					-M_FROM_PX * PX_WALL_SIZE + M_SHAPE_OUTER_RADIUS,
					M_FROM_PX * PX_WALL_SIZE - M_SHAPE_OUTER_RADIUS,
					this.rng()
				),
				(M_FROM_PX * 1.1 * PX_SIZE) + mDropHeight
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
		hexBody.createFixture(
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

    // ------------ Rendering ------------

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	render(context) {
        context.save();
		context.scale(PX_FROM_M, -PX_FROM_M);
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
					case 'polygon':
                        this.renderPolygon(context, shape);
                        break;
				}
			}
			context.restore();
		}
        context.restore();
	}

	/**
	 * @param {!CanvasRenderingContext2D} context
	 */
	renderPolygon(context, shape) {
		const vertices = shape.m_vertices;
		const centerX = shape.m_centroid.x;
		const centerY = shape.m_centroid.y;

		context.beginPath();
		context.fillStyle = 'black';
		for (let i = 0; i < vertices.length; i++) {
			const diffX = centerX - vertices[i].x;
			const diffY = centerY - vertices[i].y;
			const drawX = centerX + 1.1 * diffX;
			const drawY = centerY + 1.1 * diffY;
			if (i == 0) {
				context.moveTo(drawX, drawY);
			}
			else {
				context.lineTo(drawX, drawY);
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