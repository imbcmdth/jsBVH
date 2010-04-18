/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Light = Class.create();

Flog.RayTracer.Light.prototype = {
    position: null,
    color: null,
    intensity: 10.0,

    initialize : function(pos, color, intensity) {
        this.position = pos;
        this.color = color;
        this.intensity = (intensity ? intensity : 10.0);
    },
    
    getIntensity: function(distance){
        if(distance >= intensity) return 0;
        
        return Math.pow((intensity - distance) / strength, 0.2);
    },
    
    toString : function () {
        return 'Light [' + this.position.x + ',' + this.position.y + ',' + this.position.z + ']';   
    }
}