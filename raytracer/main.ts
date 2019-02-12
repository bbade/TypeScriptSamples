import { RenderRequest, Scene, Sphere, Plane, Vector, Surfaces, Color, Camera, RenderResult } from "./model";

const config = {
    width: 1024,
    height: 1024,
    numWorkers: 4,
}


function defaultScene(): Scene {
    return {
        things: [new Plane(new Vector(0.0, 1.0, 0.0), 0.0, Surfaces.checkerboard),
                 new Sphere(new Vector(0.0, 1.0, -0.25), 1.0, Surfaces.shiny),
                 new Sphere(new Vector(-1.0, 0.5, 1.5), 0.5, Surfaces.shiny)],
        lights: [{ pos: new Vector(-2.0, 2.5, 0.0), color: new Color(0.49, 0.07, 0.07) },
                 { pos: new Vector(1.5, 2.5, 1.5), color: new Color(0.07, 0.07, 0.49) },
                 { pos: new Vector(1.5, 2.5, -1.5), color: new Color(0.07, 0.49, 0.071) },
                 { pos: new Vector(0.0, 3.5, 0.0), color: new Color(0.21, 0.21, 0.35) }],
        camera: new Camera(new Vector(3.0, 2.0, 4.0), new Vector(-1.0, 0.5, 0.0))
    };
}

function exec() {
    var canv: HTMLCanvasElement = document.createElement("canvas");
    canv.width = config.width;
    canv.height = config.height;
    document.body.appendChild(canv);
    var ctx = canv.getContext("2d");
    const scene = defaultScene();

    for (let i = 0; i < config.numWorkers; i++) {
        const message =  new RenderRequest(
            scene,
            config.width,
            config.height,
            i,
            config.numWorkers
        );

        const worker = new Worker("raytracer_worker.ts");
        worker.onmessage = function (event: MessageEvent) {
            const data = event.data as RenderResult
        }
        
    }
}