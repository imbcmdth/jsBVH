/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Shape) == 'undefined') Flog.RayTracer.Shape = {};

Flog.RayTracer.Shape.BaseShape = Class.create();

Flog.RayTracer.Shape.BaseShape.prototype = {
    position: null,
    material: null,
    
    initialize : function() {
        this.position = new Vector(0,0,0);
        this.material = new Flog.RayTracer.Material.SolidMaterial(
            new Flog.RayTracer.Color(1,0,1),
            0,
            0,
            0
        );
    },
        
    toString : function () {
        return 'Material [gloss=' + this.gloss + ', transparency=' + this.transparency + ', hasTexture=' + this.hasTexture +']';    
    }
}