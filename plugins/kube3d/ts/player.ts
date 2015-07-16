/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  export class Player implements Renderable {
    private log:Logging.Logger = Logger.get('kube3d-player');
    private domElement:any = null;
    private _lookAt:any = null;
    private pitch = new THREE.Object3D();
    private yaw = new THREE.Object3D();

    private _enabled = false;
    private _document = undefined;

    // movement booleans
    private forward = false;
    private backward = false;
    private left = false;
    private right = false;
    private canJump = true;

    // movement velocity
    private velocity = new THREE.Vector3();
    private prevTime = performance.now();

    private handlers:any = null;

    public constructor(private scene, private camera, private d) {
      var camera = this.camera;
      camera.rotation.set(0, 0, 0);
      camera.position.set(0, 0, 0);
      this.pitch.add(camera);
      this.yaw.add(this.pitch);
      scene.add(this.yaw);

      var domElement = this.domElement = $(d);
      var document = this._document = $(document);

      this.handlers = {
        'keydown': (event:any) => {
          switch ( event.originalEvent.keyCode ) {
            case 38: // up
            case 87: // w
              this.forward = true;
              break;
            case 37: // left
            case 65: // a
              this.left = true; 
              break;
            case 40: // down
            case 83: // s
              this.backward = true;
              break;
            case 39: // right
            case 68: // d
              this.right = true;
              break;
            case 32: // space
              if (this.canJump === true) {
                this.velocity.y += 350;
                this.canJump = false;
              }
              break;
          }
        },
        'keyup': (event:any) => {
          switch ( event.originalEvent.keyCode ) {
            case 38: // up
            case 87: // w
              this.forward = false;
              break;
            case 37: // left
            case 65: // a
              this.left = false; 
              break;
            case 40: // down
            case 83: // s
              this.backward = false;
              break;
            case 39: // right
            case 68: // d
              this.right = false;
              break;
          }
        },
        'mousemove': (event:any) => {
          if (!this._enabled) {
            return;
          }
          var evt = event.originalEvent;
          var yaw = this.yaw;
          var pitch = this.pitch;
          var deltaX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || 0;
          var deltaY = evt.movementY || evt.mozMovementX || evt.webkitMovementX || 0;
          yaw.rotation.y -= deltaX * 0.002;
          pitch.rotation.x -= deltaY * 0.002;
          pitch.rotation.x = Math.max( - HalfPI, Math.min(HalfPI, pitch.rotation.x));
        }
      };
      _.forIn(this.handlers, (handler, evt) => document[evt](handler));
    }

    public enable(enabled) {
      this._enabled = enabled;
    }

    public lookAt(box) {
      this._lookAt = box;
    }

    public destroy() {
      this.scene.remove(this.yaw);
      this.yaw.dispose();
      this.pitch.dispose();
      _.forIn(this.handlers, (handler, evt) => this._document.off(evt, handler));
    }

    public render() {
      if (this.lookAt) {
        var angle = Date.now() * 0.0001;
        this.camera.focus(this._lookAt, angle);
      }

    }

  }

}
