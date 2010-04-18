/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};
if(typeof(Flog.RayTracer.Shape) == 'undefined') Flog.RayTracer.Shape = {};

Flog.RayTracer.Shape.Sphere = Class.create();

Flog.RayTracer.Shape.Sphere.prototype = {
    initialize : function(pos, radius, material) {
        this.radius = radius;
        this.position = pos;
        this.material = material;
    },
    
    intersect: function(ray){
        var info = new Flog.RayTracer.IntersectionInfo();
        info.shape = this;
        
        var dst = Flog.RayTracer.Vector.prototype.subtract(ray.position, this.position);
        
        var B = dst.dot(ray.direction);
        var C = dst.dot(dst) - (this.radius * this.radius);
        var D = (B * B) - C;
        
        if(D > 0){ // intersection!
            info.isHit = true;
            info.distance = (-B) - Math.sqrt(D);
            info.position = Flog.RayTracer.Vector.prototype.add(
                                                ray.position, 
                                                Flog.RayTracer.Vector.prototype.multiplyScalar(
                                                    ray.direction,
                                                    info.distance
                                                )
                                            );
            info.normal = Flog.RayTracer.Vector.prototype.subtract(
                                            info.position,
                                            this.position
                                        ).normalize();
            
            info.color = this.material.getColor(0,0);
        } else {
            info.isHit = false;
        }
        return info;
    },
    bb: function(){
        return [{a:this.position.x-this.radius,b:this.radius*2},{a:this.position.y-this.radius,b:this.radius*2},{a:this.position.z-this.radius,b:this.radius*2}];
    },
        
    toString : function () {
        return 'Sphere [position=' + this.position + ', radius=' + this.radius + ']';   
    }
}