/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Scene = Class.create();

Flog.RayTracer.Scene.prototype = {
    camera : null,
    shapes : [],
    planes : [],
    lights : [],
    background : null,
    ntree : null,
    addSphere : function(sphere) {
        this.shapes.push(sphere);
        var bb = sphere.bb();
       // bb[0].a -= this.camera.position.x;
       // bb[1].a -= this.camera.position.y;
       // bb[2].a -= this.camera.position.z;
        this.ntree.insert({intervals:bb, object:sphere});
    },
    addPlane : function(plane) {
        this.shapes.push(plane);
        this.planes.push(plane);
    },
    initialize : function() {
        this.ntree = new NTree(3, 7);
        this.camera = new Flog.RayTracer.Camera(
            new Flog.RayTracer.Vector(0,0,-5), 
            new Flog.RayTracer.Vector(0,0,1), 
            new Flog.RayTracer.Vector(0,1,0)
        );
//        this.shapes = new Array();  // Why?
//        this.planes = new Array();
//        this.lights = new Array();
        this.background = new Flog.RayTracer.Background(new Flog.RayTracer.Color(0,0,0.5), 0.2);
    }
}