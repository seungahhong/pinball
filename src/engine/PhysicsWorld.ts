import type { MapData, MapEntity } from '@/types/game';

/* eslint-disable @typescript-eslint/no-explicit-any */
let cachedBox2D: any;

type Box2DInstance = any;

export async function initBox2D(): Promise<Box2DInstance> {
  if (cachedBox2D) return cachedBox2D;
  const Box2DFactory = (await import('box2d-wasm')).default;
  cachedBox2D = await Box2DFactory();
  return cachedBox2D;
}

export class PhysicsWorld {
  private Box2D: Box2DInstance;
  private world: InstanceType<Box2DInstance['b2World']>;
  private bodies: Map<number, InstanceType<Box2DInstance['b2Body']>> = new Map();
  private entityBodies: InstanceType<Box2DInstance['b2Body']>[] = [];
  private nextId = 0;

  constructor(box2d: Box2DInstance) {
    this.Box2D = box2d;
    const gravity = new this.Box2D.b2Vec2(0, 10);
    this.world = new this.Box2D.b2World(gravity);
  }

  loadMap(map: MapData): void {
    this.clearEntities();
    for (const entity of map.entities) {
      this.createEntity(entity);
    }
  }

  private createEntity(entity: MapEntity): void {
    const { Box2D } = this;
    const bodyDef = new Box2D.b2BodyDef();

    if (entity.type === 'kinematic') {
      bodyDef.set_type(Box2D.b2_kinematicBody);
    } else {
      bodyDef.set_type(Box2D.b2_staticBody);
    }

    bodyDef.set_position(new Box2D.b2Vec2(entity.position[0], entity.position[1]));
    if (entity.angle) {
      bodyDef.set_angle(entity.angle);
    }

    const body = this.world.CreateBody(bodyDef);

    if (entity.shape === 'circle' && entity.radius) {
      const shape = new Box2D.b2CircleShape();
      shape.set_m_radius(entity.radius);
      const fixDef = new Box2D.b2FixtureDef();
      fixDef.set_shape(shape);
      fixDef.set_density(entity.props?.density ?? 0);
      fixDef.set_restitution(entity.props?.restitution ?? 0.3);
      body.CreateFixture(fixDef);
    } else if (entity.shape === 'box' && entity.width && entity.height) {
      const shape = new Box2D.b2PolygonShape();
      shape.SetAsBox(entity.width / 2, entity.height / 2);
      const fixDef = new Box2D.b2FixtureDef();
      fixDef.set_shape(shape);
      fixDef.set_density(entity.props?.density ?? 0);
      fixDef.set_restitution(entity.props?.restitution ?? 0.3);
      body.CreateFixture(fixDef);
    } else if (entity.shape === 'polyline' && entity.vertices) {
      for (let i = 0; i < entity.vertices.length - 1; i++) {
        const shape = new Box2D.b2EdgeShape();
        shape.SetTwoSided(
          new Box2D.b2Vec2(entity.vertices[i][0], entity.vertices[i][1]),
          new Box2D.b2Vec2(entity.vertices[i + 1][0], entity.vertices[i + 1][1]),
        );
        const fixDef = new Box2D.b2FixtureDef();
        fixDef.set_shape(shape);
        fixDef.set_density(0);
        fixDef.set_restitution(entity.props?.restitution ?? 0.3);
        body.CreateFixture(fixDef);
      }
    }

    if (entity.type === 'kinematic' && entity.props?.angularVelocity) {
      body.SetAngularVelocity(entity.props.angularVelocity);
    }

    this.entityBodies.push(body);
  }

  getEntityTransforms(): { x: number; y: number; angle: number }[] {
    return this.entityBodies.map((body) => {
      const pos = body.GetPosition();
      return { x: pos.get_x(), y: pos.get_y(), angle: body.GetAngle() };
    });
  }

  createMarble(x: number, y: number, radius: number = 0.5): number {
    const { Box2D } = this;
    const id = this.nextId++;
    const bodyDef = new Box2D.b2BodyDef();
    bodyDef.set_type(Box2D.b2_dynamicBody);
    bodyDef.set_position(new Box2D.b2Vec2(x, y));

    const body = this.world.CreateBody(bodyDef);
    const shape = new Box2D.b2CircleShape();
    shape.set_m_radius(radius);

    const fixDef = new Box2D.b2FixtureDef();
    fixDef.set_shape(shape);
    fixDef.set_density(1);
    fixDef.set_restitution(0.4);
    fixDef.set_friction(0.3);
    body.CreateFixture(fixDef);
    body.SetAwake(false);

    this.bodies.set(id, body);
    return id;
  }

  activateMarble(id: number): void {
    this.bodies.get(id)?.SetAwake(true);
  }

  getMarblePosition(id: number): { x: number; y: number; angle: number } | null {
    const body = this.bodies.get(id);
    if (!body) return null;
    const pos = body.GetPosition();
    return { x: pos.get_x(), y: pos.get_y(), angle: body.GetAngle() };
  }

  swapMarbles(idA: number, idB: number): void {
    const bodyA = this.bodies.get(idA);
    const bodyB = this.bodies.get(idB);
    if (!bodyA || !bodyB) return;

    const posA = bodyA.GetPosition();
    const posB = bodyB.GetPosition();
    const velA = bodyA.GetLinearVelocity();
    const velB = bodyB.GetLinearVelocity();
    const angVelA = bodyA.GetAngularVelocity();
    const angVelB = bodyB.GetAngularVelocity();

    const tmpPos = { x: posA.get_x(), y: posA.get_y() };
    const tmpVel = { x: velA.get_x(), y: velA.get_y() };
    const tmpAngVel = angVelA;

    bodyA.SetTransform(new this.Box2D.b2Vec2(posB.get_x(), posB.get_y()), bodyB.GetAngle());
    bodyA.SetLinearVelocity(new this.Box2D.b2Vec2(velB.get_x(), velB.get_y()));
    bodyA.SetAngularVelocity(angVelB);

    bodyB.SetTransform(new this.Box2D.b2Vec2(tmpPos.x, tmpPos.y), bodyA.GetAngle());
    bodyB.SetLinearVelocity(new this.Box2D.b2Vec2(tmpVel.x, tmpVel.y));
    bodyB.SetAngularVelocity(tmpAngVel);
  }

  addObstacle(x: number, y: number, width: number, height: number, angle: number = 0): number {
    const { Box2D } = this;
    const id = this.nextId++;
    const bodyDef = new Box2D.b2BodyDef();
    bodyDef.set_type(Box2D.b2_staticBody);
    bodyDef.set_position(new Box2D.b2Vec2(x, y));
    bodyDef.set_angle(angle);

    const body = this.world.CreateBody(bodyDef);
    const shape = new Box2D.b2PolygonShape();
    shape.SetAsBox(width / 2, height / 2);

    const fixDef = new Box2D.b2FixtureDef();
    fixDef.set_shape(shape);
    fixDef.set_density(0);
    fixDef.set_restitution(0.5);
    body.CreateFixture(fixDef);

    this.bodies.set(id, body);
    return id;
  }

  removeBody(id: number): void {
    const body = this.bodies.get(id);
    if (body) {
      this.world.DestroyBody(body);
      this.bodies.delete(id);
    }
  }

  removeMarble(id: number): void {
    this.removeBody(id);
  }

  step(dt: number): void {
    this.world.Step(dt, 6, 2);
  }

  private clearEntities(): void {
    for (const body of this.entityBodies) {
      this.world.DestroyBody(body);
    }
    this.entityBodies = [];
  }

  destroy(): void {
    this.clearEntities();
    for (const [, body] of this.bodies) {
      this.world.DestroyBody(body);
    }
    this.bodies.clear();
  }
}
