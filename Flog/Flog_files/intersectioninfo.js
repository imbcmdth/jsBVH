/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.IntersectionInfo = Class.create();

Flog.RayTracer.IntersectionInfo.prototype = {
    isHit: false,
    hitCount: 0,
    shape: null,
    position: null,
    normal: null,
    color: null,
    distance: null,
    
    initialize : function() {
        this.color = new Flog.RayTracer.Color(0,0,0);
    },
    
    toString : function () {
        return 'Intersection [' + this.position + ']';  
    }
}