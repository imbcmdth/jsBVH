/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Material.Solid = Class.create();

Flog.RayTracer.Material.Solid.prototype = Object.extend(
    new Flog.RayTracer.Material.BaseMaterial(), {   
        initialize : function(color, reflection, refraction, transparency, gloss) {
            this.color = color;
            this.reflection = reflection;
            this.transparency = transparency;
            this.gloss = gloss;
            this.hasTexture = false;
        },
        
        getColor: function(u, v){
            return this.color;
        },
        
        toString : function () {
            return 'SolidMaterial [gloss=' + this.gloss + ', transparency=' + this.transparency + ', hasTexture=' + this.hasTexture +']';   
        }
    }
);