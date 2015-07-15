/// <reference path="kube3dPlugin.ts"/>

module Kube3d {

  var directiveName = 'threejs';

  function webglAvailable() {
    try {
      var canvas = document.createElement( 'canvas' );
      return !!( (<any>window).WebGLRenderingContext && (
            canvas.getContext( 'webgl' ) ||
            canvas.getContext( 'experimental-webgl' ) )
          );
    } catch ( e ) {
      return false;
    }
  }

  _module.directive(directiveName, [() => {
    THREE.ImageUtils.crossOrigin = '';
    return {
      restrict: 'A',
      replace: true,
      scope: {
        config: '=?' + directiveName
      },
      link: (scope, element, attrs) => {

        var scene:any = null;
        var camera:any = null;
        var renderer:any = null;
        var keepRendering = true;
        var resizeHandle:any = null;

        function stop() {
          keepRendering = false;
        }

        function cleanup() {
          $(window).off('resize', resizeFunc);
          delete renderer;
          delete camera;
          delete scene;
          element.empty();
        }

        var resizeFunc = () => {
            log.debug("resizing");
            element.find('canvas').width(element.width()).height(element.height());
            camera.aspect = element.width() / element.height();
            camera.updateProjectionMatrix();
            renderer.setSize(element.width(), element.height());
        }

        element.on('$destroy', () => {
          stop();
          log.debug("scene destroyed");
        });

        scope.$watch('config', (config) => {
          stop();
          if (!config || !config.initialize) {
            log.debug("no config, returning");
            return;
          }
          log.debug("creating scene");
          scene = new THREE.Scene();
          camera = new THREE.PerspectiveCamera(60, element.width() / element.height(), 0.1, 20000);

          camera.focus = (box3:any, angle) => {
            // adjust the camera position to keep everything in view, we'll do
            // gradual adjustments though
            var height = box3.size().y;
            var width = box3.size().x / (camera.aspect / 2);
            //log.debug("width:", width, " height:", height);
            if (width < 0 || height < 0) {
              return;
            }
            var distY = Math.round(height * Math.tan( (camera.fov / 2 ) * ( Math.PI / 180 )));
            var distX = Math.round(width * Math.tan( (camera.fov / 2 ) * ( Math.PI / 180 )));
            var distZ = (distY + distX);
            // log.debug("distY:", distY, " distX:", distX, "distZ:", distZ);
            var z = Math.round(camera.position.z);
            var period = 5.0;
            camera.position.x = distX * Math.cos(angle);
            camera.position.y = distY * Math.sin(angle);
            if (z !== distZ) {
              if (z > distZ) {
                var v = (z - distZ) / period;
                camera.position.z = z - v;
              }
              if (z < distZ) {
                var v = (distZ - z) / period;
                camera.position.z = z + v;
              }
            }
            camera.lookAt(box3.center());
          };

          if ( webglAvailable() ) {
            renderer = new THREE.WebGLRenderer();
          } else {
            renderer = new THREE.CanvasRenderer();
          }
          renderer.setPixelRatio( window.devicePixelRatio );
          renderer.setSize(element.width(), element.height());
          var domElement = renderer.domElement;
          element.append(domElement);

          $(window).on('resize', resizeFunc);
          config.initialize(renderer, scene, camera, domElement);

          var render = () => {
            if (!keepRendering) {
              cleanup();
              return;
            }
            requestAnimationFrame(render);
            if (config.render) {
              config.render(renderer, scene, camera);
            }
            renderer.render(scene, camera);
          }
          keepRendering = true;
          render();

        });
      }
    };
  }]);

}
