/* Fake a Flog.* namespace */
if(typeof(Flog) == 'undefined') var Flog = {};
if(typeof(Flog.RayTracer) == 'undefined') Flog.RayTracer = {};

Flog.RayTracer.Engine = Class.create();

Flog.RayTracer.Engine.prototype = {
    canvas: null, /* 2d context we can render to */
    currentX:0,
    currentY:0,
    initialize: function(options){
        this.options = Object.extend({  
                canvasHeight: 100,
                canvasWidth: 100,
                pixelWidth: 2,
                pixelHeight: 2,
                renderDiffuse: false,
                renderShadows: false,
                renderHighlights: false,
                renderReflections: false,
                renderTree: "ITree",
                rayDepth: 3
            }, options || {});
    
        this.options.canvasHeight /= this.options.pixelHeight;
        this.options.canvasWidth /= this.options.pixelWidth;
        
        /* TODO: dynamically include other scripts */
    },
    
    setPixel: function(x, y, color){
        var pxW, pxH;
        pxW = this.options.pixelWidth;
        pxH = this.options.pixelHeight;

        this.canvas.fillStyle = color.toString();
        this.canvas.fillRect (x * pxW, y * pxH, pxW, pxH);
    },
    
    renderScene: function(scene, canvas, finished_callback){
        /* Get canvas */    
        this.canvas = canvas.getContext("2d");
        
        var canvasHeight = this.options.canvasHeight;
        var canvasWidth = this.options.canvasWidth;

        for(var y = this.currentY; y < canvasHeight; y++){
            for(var x = this.currentX; x < canvasWidth; x++){
                var yp = y * 1.0 / canvasHeight * 2 - 1;
                var xp = x * 1.0 / canvasWidth * 2 - 1;
    
                var ray = scene.camera.getRay(xp, yp);
            
                this.setPixel(x, y, this.getPixelColor(ray, scene));
            }
            this.currentY = y + 1;
            this.currentX = 0;
            if(this.currentY < canvasHeight){
                setTimeout( (function(myscene, mycanvas, mycallback, myengine){ return(function(){ myengine.renderScene(myscene, mycanvas, mycallback); });})(scene, canvas, finished_callback, this) , 100);
                return;
            } else {
                finished_callback();
            }
        }
    },

    getPixelColor: function(ray, scene){
        var info = this.testIntersection(ray, scene, null);
        if(info.isHit){
            var color = this.rayTrace(info, ray, scene, 0);
            return color;
        }
        return scene.background.color;
    },
    
    testIntersection: function(ray, scene, exclude){
        var hits = 0;
        var tests = 0;
        var best = new Flog.RayTracer.IntersectionInfo();
        best.distance = 2000;
        var shape_set = [];

        best.position = Flog.RayTracer.Vector.prototype.add(
                        ray.position,
                        Flog.RayTracer.Vector.prototype.multiplyScalar(
                            ray.direction,
                            best.distance
                        )
                    );

        if( this.options.renderTree == "NTree" ){
            var r = ray.toIntervals();
            var bb_intersections = scene.ntree.intersect({ray:r});
            for(var j = bb_intersections.length-1; j>=0; j--)
            {
                shape_set.push(bb_intersections[j]);
            }
        } else {
            shape_set = scene.shapes;
        }
        
        for(var i=shape_set.length-1; i>=0; i--){
            var shape = shape_set[i];
            var shape_bb = shape.bb();
            if( shape != exclude /*&&
               Math.abs(ray.position.x - shape_bb[0].a) <= Math.abs(ray.position.x - best.position.x) &&
               Math.abs(ray.position.y - shape_bb[1].a) <= Math.abs(ray.position.y - best.position.y) &&
               Math.abs(ray.position.z - shape_bb[2].a) <= Math.abs(ray.position.z - best.position.z) */){
                var info = shape.intersect(ray);
                if(info.isHit && info.distance >= 0 && info.distance < best.distance){
                    best = info;
                    hits++;
                }
                tests++;
            }
        }
        best.hitCount = hits;
        best.testCount = tests;
        return best;
    },
    
    getReflectionRay: function(P,N,V){
        var c1 = -N.dot(V);
        var R1 = Flog.RayTracer.Vector.prototype.add(
            Flog.RayTracer.Vector.prototype.multiplyScalar(N, 2*c1),
            V
        );
        return new Flog.RayTracer.Ray(P, R1);
    },
    
    rayTrace: function(info, ray, scene, depth){
        // Calc ambient
        var color = Flog.RayTracer.Color.prototype.multiplyScalar(info.color, scene.background.ambience);
        var oldColor = color;
        var shininess = Math.pow(10, info.shape.material.gloss + 1);
        
        for(var i=0; i<scene.lights.length; i++){
            var light = scene.lights[i];
            
            // Calc diffuse lighting
            var v = Flog.RayTracer.Vector.prototype.subtract(
                                light.position,
                                info.position
                            ).normalize();
            
            if(this.options.renderDiffuse){
                var L = v.dot(info.normal);
                if(L > 0.0){
                    color = Flog.RayTracer.Color.prototype.add(
                                        color,
                                        Flog.RayTracer.Color.prototype.multiply(
                                            info.color,
                                            Flog.RayTracer.Color.prototype.multiplyScalar(
                                                light.color,
                                                L
                                            )
                                        )
                                    );
                }
            }
                
            // The greater the depth the more accurate the colours, but
            // this is exponentially (!) expensive
            if(depth <= this.options.rayDepth){
          // calculate reflection ray
          if(this.options.renderReflections && info.shape.material.reflection > 0)
          {
              var reflectionRay = this.getReflectionRay(info.position, info.normal, ray.direction);
              var refl = this.testIntersection(reflectionRay, scene, info.shape);
              
              if (refl.isHit && refl.distance > 0){
                  refl.color = this.rayTrace(refl, reflectionRay, scene, depth + 1);
              } else {
                  refl.color = scene.background.color;
              }
                        
                  color = Flog.RayTracer.Color.prototype.blend(
                    color, 
                    refl.color,
                    info.shape.material.reflection
                  );
          }

                // Refraction
                /* TODO */
            }
            
            /* Render shadows and highlights */
            
            var shadowInfo = new Flog.RayTracer.IntersectionInfo();
            
            if(this.options.renderShadows){
                var shadowRay = new Flog.RayTracer.Ray(info.position, v);
                
                shadowInfo = this.testIntersection(shadowRay, scene, info.shape);
                if(shadowInfo.isHit && shadowInfo.shape != info.shape /*&& shadowInfo.shape.type != 'PLANE'*/){
                    var vA = Flog.RayTracer.Color.prototype.multiplyScalar(color, 0.5);
                    var dB = (0.5 * Math.pow(shadowInfo.shape.material.transparency, 0.5));
                    color = Flog.RayTracer.Color.prototype.addScalar(vA,dB);
                }
            }
      
      // Phong specular highlights
      if(this.options.renderHighlights && !shadowInfo.isHit && info.shape.material.gloss > 0){
        var Lv = Flog.RayTracer.Vector.prototype.subtract(
                            info.shape.position,
                            light.position
                        ).normalize();
        
        var E = Flog.RayTracer.Vector.prototype.subtract(
                            scene.camera.position,
                            info.shape.position
                        ).normalize();
        
        var H = Flog.RayTracer.Vector.prototype.subtract(
                            E,
                            Lv
                        ).normalize();
        
        var glossWeight = Math.pow(Math.max(info.normal.dot(H), 0), shininess);
        color = Flog.RayTracer.Color.prototype.add(
                            Flog.RayTracer.Color.prototype.multiplyScalar(light.color, glossWeight),
                            color
                        );
      }
        }
        //var new_color = new Flog.RayTracer.Color(info.testCount/255, info.testCount/255, info.testCount/255);
        color.limit();
        //return(new_color);
        return color;
    }
};