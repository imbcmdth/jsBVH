/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Color = Class.create();

Flog.RayTracer.Color.prototype = {
    red : 0.0,
    green : 0.0,
    blue : 0.0,
    
    initialize : function(r, g, b) {
        if(!r) r = 0.0;
        if(!g) g = 0.0;
        if(!b) b = 0.0;
        
        this.red = r;
        this.green = g;
        this.blue = b;
    },
    
    add : function(c1, c2){
        var result = new Flog.RayTracer.Color(0,0,0);
        
        result.red = c1.red + c2.red;
        result.green = c1.green + c2.green;
        result.blue = c1.blue + c2.blue; 
        
        return result;
    },
    
    addScalar: function(c1, s){
        var result = new Flog.RayTracer.Color(0,0,0);
        
        result.red = c1.red + s;
        result.green = c1.green + s;
        result.blue = c1.blue + s; 
        
        result.limit();
        
        return result;
    },
    
    subtract: function(c1, c2){
        var result = new Flog.RayTracer.Color(0,0,0);
        
        result.red = c1.red - c2.red;
        result.green = c1.green - c2.green;
        result.blue = c1.blue - c2.blue; 
        
        return result;
    },
    
    multiply : function(c1, c2) {
        var result = new Flog.RayTracer.Color(0,0,0);
        
        result.red = c1.red * c2.red;
        result.green = c1.green * c2.green;
        result.blue = c1.blue * c2.blue; 
        
        return result;
    },
    
    multiplyScalar : function(c1, f) {
        var result = new Flog.RayTracer.Color(0,0,0);
        
        result.red = c1.red * f;
        result.green = c1.green * f;
        result.blue = c1.blue * f; 
        
        return result;
    },
    
    divideFactor : function(c1, f) {
        var result = new Flog.RayTracer.Color(0,0,0);
        
        result.red = c1.red / f;
        result.green = c1.green / f;
        result.blue = c1.blue / f; 
        
        return result;
    },
    
    limit: function(){
        this.red = (this.red > 0.0) ? ( (this.red > 1.0) ? 1.0 : this.red ) : 0.0;
        this.green = (this.green > 0.0) ? ( (this.green > 1.0) ? 1.0 : this.green ) : 0.0;
        this.blue = (this.blue > 0.0) ? ( (this.blue > 1.0) ? 1.0 : this.blue ) : 0.0;
    },
    
    distance : function(color) {
        var d = Math.abs(this.red - color.red) + Math.abs(this.green - color.green) + Math.abs(this.blue - color.blue);
        return d;
    },

    blend: function(c1, c2, w){
        var result = new Flog.RayTracer.Color(0,0,0);
        result = Flog.RayTracer.Color.prototype.add(
                    Flog.RayTracer.Color.prototype.multiplyScalar(c1, 1 - w), 
                    Flog.RayTracer.Color.prototype.multiplyScalar(c2, w)
                  );
        return result;
    },
    
    toString : function () {
        var r = Math.floor(this.red*255);
        var g = Math.floor(this.green*255);
        var b = Math.floor(this.blue*255);
        
        return "rgb("+ r +","+ g +","+ b +")";
    }
}