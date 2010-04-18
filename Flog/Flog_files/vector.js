/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Vector = Class.create();

Flog.RayTracer.Vector.prototype = {
    x : 0.0,
    y : 0.0,
    z : 0.0,
    
    initialize : function(x, y, z) {
        this.x = (x ? x : 0);
        this.y = (y ? y : 0);
        this.z = (z ? z : 0);
    },
    
    copy: function(vector){
        this.x = vector.x;
        this.y = vector.y;
        this.z = vector.z;
    },
    
    normalize : function() { 
        var m = this.magnitude();
        return new Flog.RayTracer.Vector(this.x / m, this.y / m, this.z / m);
    },
    
    magnitude : function() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y) + (this.z * this.z));
    },
    
    cross : function(w) {
        return new Flog.RayTracer.Vector(
                                            -this.z * w.y + this.y * w.z,
                                           this.z * w.x - this.x * w.z, 
                                          -this.y * w.x + this.x * w.y);
    },
    
    dot : function(w) {
        return this.x * w.x + this.y * w.y + this.z * w.z;
    },
    
    add : function(v, w) {
        return new Flog.RayTracer.Vector(w.x + v.x, w.y + v.y, w.z + v.z);  
    },
    
    subtract : function(v, w) {
        if(!w || !v) throw 'Vectors must be defined [' + v + ',' + w + ']'; 
        return new Flog.RayTracer.Vector(v.x - w.x, v.y - w.y, v.z - w.z);
    },
    
    multiplyVector : function(v, w) {
        return new Flog.RayTracer.Vector(v.x * w.x, v.y * w.y, v.z * w.z);  
    },
        
    multiplyScalar : function(v, w) {
        return new Flog.RayTracer.Vector(v.x * w, v.y * w, v.z * w);    
    },

    toString : function () {
        return 'Vector [' + this.x + ',' + this.y + ',' + this.z + ']'; 
    }
}