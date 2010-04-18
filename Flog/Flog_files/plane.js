/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Shape) == 'undefined') Flog.RayTracer.Shape = {};

Flog.RayTracer.Shape.Plane = Class.create();

Flog.RayTracer.Shape.Plane.prototype = {
    d: 0.0,
    
    initialize : function(pos, d, material) {
        this.position = pos;
        this.d = d;
        this.material = material;
    },
    
    intersect: function(ray){
        var info = new Flog.RayTracer.IntersectionInfo();
        
        var Vd = this.position.dot(ray.direction);
        if(Vd == 0) return info; // no intersection
        
        var t = -(this.position.dot(ray.position) + this.d) / Vd;
        if(t <= 0) return info;

        info.shape = this;
        info.isHit = true;      
        info.position = Flog.RayTracer.Vector.prototype.add(
                                            ray.position, 
                                            Flog.RayTracer.Vector.prototype.multiplyScalar(
                                                ray.direction,
                                                t
                                            )
                                        );
        info.normal = this.position;
        info.distance = t;
        
        if(this.material.hasTexture){
            var vU = new Flog.RayTracer.Vector(this.position.y, this.position.z, -this.position.x);
            var vV = vU.cross(this.position);
            var u = info.position.dot(vU);
            var v = info.position.dot(vV);
            info.color = this.material.getColor(u,v);
        } else {
            info.color = this.material.getColor(0,0);
        }
        
        return info;
    },
        
    toString : function () {
        return 'Plane [' + this.position + ', d=' + this.d + ']';   
    }
}