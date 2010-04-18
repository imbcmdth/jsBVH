/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Material.Chessboard = Class.create();

Flog.RayTracer.Material.Chessboard.prototype = Object.extend(
    new Flog.RayTracer.Material.BaseMaterial(), {   
        colorEven: null,
        colorOdd: null,
        density: 0.5,
        
        initialize : function(colorEven, colorOdd, reflection, transparency, gloss, density) {
            this.colorEven = colorEven;
            this.colorOdd = colorOdd;
            this.reflection = reflection;
            this.transparency = transparency;
            this.gloss = gloss;
            this.density = density;
            this.hasTexture = true;
        },
        
        getColor: function(u, v){
            var t = this.wrapUp(u * this.density) * this.wrapUp(v * this.density);
            
            if(t < 0.0)
                return this.colorEven;
            else
                return this.colorOdd;
        },
        
        toString : function () {
            return 'ChessMaterial [gloss=' + this.gloss + ', transparency=' + this.transparency + ', hasTexture=' + this.hasTexture +']';   
        }
    }
);