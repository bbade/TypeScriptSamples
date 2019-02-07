import {
    Color, 
    Plane,
    Sphere,
    Vector,
    Surfaces,
    Scene,
    Camera,
    Intersection,
    Ray,
    Thing,
    Light,
    RenderMessage
} from './model'

export class RayTracer {
    private maxDepth = 5;

    private intersections(ray: Ray, scene: Scene) {
        var closest = +Infinity;
        var closestInter: Intersection = undefined;
        for (var i in scene.things) {
            var inter = scene.things[i].intersect(ray);
            if (inter != null && inter.dist < closest) {
                closestInter = inter;
                closest = inter.dist;
            }
        }
        return closestInter;
    }

    private testRay(ray: Ray, scene: Scene) {
        var isect = this.intersections(ray, scene);
        if (isect != null) {
            return isect.dist;
        } else {
            return undefined;
        }
    }

    private traceRay(ray: Ray, scene: Scene, depth: number): Color {
        var isect = this.intersections(ray, scene);
        if (isect === undefined) {
            return Color.background;
        } else {
            return this.shade(isect, scene, depth);
        }
    }

    private shade(isect: Intersection, scene: Scene, depth: number) {
        var d = isect.ray.dir;
        var pos = Vector.plus(Vector.times(isect.dist, d), isect.ray.start);
        var normal = isect.thing.normal(pos);
        var reflectDir = Vector.minus(d, Vector.times(2, Vector.times(Vector.dot(normal, d), normal)));
        var naturalColor = Color.plus(Color.background,
                                      this.getNaturalColor(isect.thing, pos, normal, reflectDir, scene));
        var reflectedColor = (depth >= this.maxDepth) ? Color.grey : this.getReflectionColor(isect.thing, pos, normal, reflectDir, scene, depth);
        return Color.plus(naturalColor, reflectedColor);
    }

    private getReflectionColor(thing: Thing, pos: Vector, normal: Vector, rd: Vector, scene: Scene, depth: number) {
        return Color.scale(thing.surface.reflect(pos), this.traceRay({ start: pos, dir: rd }, scene, depth + 1));
    }

    private getNaturalColor(thing: Thing, pos: Vector, norm: Vector, rd: Vector, scene: Scene) {
        var addLight = (col: Color, light: Light) => {
            var ldis = Vector.minus(light.pos, pos);
            var livec = Vector.norm(ldis);
            var neatIsect = this.testRay({ start: pos, dir: livec }, scene);
            var isInShadow = (neatIsect === undefined) ? false : (neatIsect <= Vector.mag(ldis));
            if (isInShadow) {
                return col;
            } else {
                var illum = Vector.dot(livec, norm);
                var lcolor = (illum > 0) ? Color.scale(illum, light.color)
                                          : Color.defaultColor;
                var specular = Vector.dot(livec, Vector.norm(rd));
                var scolor = (specular > 0) ? Color.scale(Math.pow(specular, thing.surface.roughness), light.color)
                                          : Color.defaultColor;
                return Color.plus(col, Color.plus(Color.times(thing.surface.diffuse(pos), lcolor),
                                                  Color.times(thing.surface.specular(pos), scolor)));
            }
        }
        return scene.lights.reduce(addLight, Color.defaultColor);
    }

    // TODO: figure out how to use webworkers to split up the rendering. We will probably want to differentiate
    // the image size from the viewport size.
    // A renderer will probably need context like (imageSize, numRenderers, myNumber)
    // also look up transfering object ownership, because we could set up the various
    // byte arrays on the main thread first https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers#Passing_data_by_transferring_ownership_(transferable_objects)
    // https://developers.google.com/web/updates/2011/12/Transferable-Objects-Lightning-Fast
    //
    renderOnWorker(state: RenderMessage) {
        const screenWidth = state.screenWidth;
        const screenHeight = state.screenHeight;
        const numWorkers = state.numWorkers;
        const outputPixels: Uint8Array = makeOutputBuffer(state);

        // split up the work into workers
        const numPixels =  screenWidth * screenHeight;
        const pixelsPerWorker = Math.floor(numPixels / numWorkers);
        const remainder = numPixels - pixelsPerWorker;
        const pixels: Uint8ClampedArray = output.data;

        for (let py = 0; py < screenHeight; py++) {
            for (var px = 0; px < screenWidth; px++) {
                drawOnArray(pixels, screenWidth, {r: 100, g:100, b:100}, px, py);
            }
            console.log("drew row" + py + "x " + px);
        }

        ctx.putImageData(outputImageData, 0, 0);
        console.log("drew gray");
        console.log(`imageData w ${outputImageData.width} h ${outputImageData.height}`);
        // if (true) {
        //     return;
        // }

        var getPoint = (x: number, y: number, camera: Camera) => {
            var recenterX = x =>(x - (screenWidth / 2.0)) / 2.0 / screenWidth;
            var recenterY = y => - (y - (screenHeight / 2.0)) / 2.0 / screenHeight;
            return Vector.norm(Vector.plus(camera.forward, Vector.plus(Vector.times(recenterX(x), camera.right), Vector.times(recenterY(y), camera.up))));
        }
        for (var y = 0; y < screenHeight; y++) {
            for (var x = 0; x < screenWidth; x++) {
                var color = this.traceRay({ start: scene.camera.pos, dir: getPoint(x, y, scene.camera) }, scene, 0);
                var c = Color.toDrawingColor(color);
                // drawOnCanvas(ctx, c, x, y);
                drawOnArray(pixels, screenWidth, c, x, y);
            }
        }
        ctx.putImageData(outputImageData, 0, 0);
        console.log("drew render");

    }
}

function drawOnArray(arr: Uint8ClampedArray, imgWidth: number,  c: Color, x: number, y: number) {
    const i = y * imgWidth * 4 + x*4;

    // array is stored in rgba order
    arr[i] = c.r;
    arr[i+1] = c.g;
    arr[i+2] = c.b;
    arr[i+3] = 255; // a
}


function makeOutputBuffer(state: RenderMessage) {

}
