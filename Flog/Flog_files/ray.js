/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Ray = Class.create();

Flog.RayTracer.Ray.prototype = {
    position : null,
    direction : null,
    initialize : function(pos, dir) {
        this.position = pos;
        this.direction = dir;
    },
    toIntervals : function() {
        return  [{a:this.position.x, b:this.direction.x},{a:this.position.y, b:this.direction.y},{a:this.position.z, b:this.direction.z}];
    },
    toString : function () {
        return 'Ray [' + this.position + ',' + this.direction + ']';    
    }
}