/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Background = Class.create();

Flog.RayTracer.Background.prototype = {
    color : null,
    ambience : 0.0,
    
    initialize : function(color, ambience) {
        this.color = color;
        this.ambience = ambience;
    }
}