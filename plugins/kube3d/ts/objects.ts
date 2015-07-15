/// <reference path="kube3dInterfaces.ts"/>
module Kube3d {

  var log:Logging.Logger = Logger.get('Kube3d');

  export class SceneObjectBase implements SceneObject {

    private boundingBox:any = null;

    constructor(public scene:any, public geometry:any) {
      this.scene.add(geometry);
      this.boundingBox = new THREE.BoundingBoxHelper(this.geometry, 0x00ff00);
      this.scene.add(this.boundingBox);
    }

    public destroy() {
      this.scene.remove(this.geometry);
      this.geometry.dispose();
      delete this.geometry;
    }

    public debug(enable) {
      this.boundingBox.visible = enable;
    }

    public move(x, y, z) {
      this.geometry.position.x += x;
      this.geometry.position.y += y;
      this.geometry.position.z += z;
      this.boundingBox.position.x += x;
      this.boundingBox.position.y += y;
      this.boundingBox.position.z += z;
    }

    public rotate(rx, ry, rz) {
      this.geometry.rotation.x += rx;
      this.geometry.rotation.y += ry;
      this.geometry.rotation.z += rz;
      this.boundingBox.rotation.x += rx;
      this.boundingBox.rotation.y += ry;
      this.boundingBox.rotation.z += rz;
    }

    public getPosition() {
      this.boundingBox.update();
      return this.boundingBox.object.position;
    }

    public setPosition(x, y, z) {
      this.geometry.position.x = x;
      this.geometry.position.y = y;
      this.geometry.position.z = z;
      this.boundingBox.position.x = x;
      this.boundingBox.position.y = y;
      this.boundingBox.position.z = z;

    }

    public setRotation(rx, ry, rz) {
      this.geometry.rotation.x = rx;
      this.geometry.rotation.y = ry;
      this.geometry.rotation.z = rz;
      this.geometry.rotation.x = rx;
      this.geometry.rotation.y = ry;
      this.geometry.rotation.z = rz;
    }

    public render() {
      this.boundingBox.update();
    }

  }

  export class PodObject extends SceneObjectBase {
    private angle:number = undefined;
    private circle:any = undefined;
    private rotation = {
      x: Math.random() * Math.PI / 1000,
      y: Math.random() * Math.PI / 100,
      z: Math.random() * Math.PI / 1000
    };
    constructor(public scene: any, public hostObject:HostObject, public id:string, public obj:any) {
      super(scene, new THREE.Object3D());
      var texture = THREE.ImageUtils.loadTexture(obj.$iconUrl);
      texture.minFilter = THREE.NearestFilter;
      this.geometry.add(
          new THREE.Mesh(
            new THREE.BoxGeometry(50, 50, 50), 
            new THREE.MeshPhongMaterial({
              color: 0xffffff, 
              map: texture,
              bumpMap: texture,
              castShadow: true, 
              receiveShadow: true, 
              shading: THREE.SmoothShading
            })
            ));
      log.debug("Created pod object ", id);
    }

    public update(model, pod) {
      this.obj = pod;
    }

    public destroy() {
      super.destroy();
      this.hostObject.geometry.remove(this.circle);
      log.debug("Destroyed pod object ", this.id);
    }

    private distance() {
      var hostPosition = this.hostObject.getPosition();
      var myPosition = this.getPosition();
      var distX = Math.abs(hostPosition.x - myPosition.x);
      var distY = Math.abs(hostPosition.y - myPosition.y);
      return Math.sqrt(distX * distX + distY * distY);
    }

    private angleOfVelocity() {
      if (!this.angle) {
        var dist = this.distance();
        log.debug("pod id: ", this.id, " distance: ", dist);
        this.angle = (1 / dist) * 10;
        log.debug("pod id: ", this.id, " angle: ", this.angle);
        var materialArray = [];
        var face = new THREE.MeshPhongMaterial({ 
          color: 0x555555,
          castShadow: true,
          receiveShadow: true,
          wireframe: true
        });
        materialArray.push(face.clone());
        materialArray.push(face.clone());
        this.circle = new THREE.Mesh(new THREE.RingGeometry(dist - 1, dist + 1, 128), new THREE.MeshFaceMaterial(materialArray));
        this.hostObject.geometry.add(this.circle);
      }
      return this.angle;
    }

    public render() {
      var myPosition = this.getPosition();
      var hostPosition = this.hostObject.getPosition();
      var x = myPosition.x;
      var y = myPosition.y;
      var centerX = hostPosition.x;
      var centerY = hostPosition.y;
      var offsetX = x - centerX;
      var offsetY = y - centerY;
      var angle = this.angleOfVelocity();
      var newX = centerX + offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
      var newY = centerY + offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
      this.setPosition(newX, newY, 0);
      this.rotate(this.rotation.x, this.rotation.y, this.rotation.z);
      super.render();
    }
  }

  export class HostObject extends SceneObjectBase {
    private offsetX = 200;
    private offsetY = 200;
    public pods = {};
    public rotation = {
      x: 0,
      y: 0,
      z: Math.random() * Math.PI / 1000
    }

    constructor(scene: any, public id:string, public obj:any) {
      super(scene, new THREE.Object3D())
      var texture = THREE.ImageUtils.loadTexture('img/sun-texture.jpg');
      texture.minFilter = THREE.NearestFilter;
      this.geometry.add( 
          new THREE.PointLight(0xffd700, 1, 5000),
          new THREE.Mesh(
            new THREE.SphereGeometry(100, 32, 16), 
            new THREE.MeshPhongMaterial({
              color: 0xffd700, 
              map: texture,
              bumpMap: texture,
              specular: 0x00ff00, 
              shading: THREE.SmoothShading
            })
          )
        );
      log.debug("Created host object ", id);
    }

    public update(model, host) {
      this.obj = host;
      var podsToRemove = [];
      _.forIn(this.pods, (pod, key) => {
        if (!(key in model.podsByKey)) {
          podsToRemove.push(key);
        }
      });
      _.forEach(podsToRemove, (id) => this.removePod(id));
      _.forEach(this.obj.pods, (pod:any) => {
        var name = pod._key;
        if (!this.hasPod(name)) {
          this.addPod(name, pod);
        } else {
          var podObj = this.pods[name];
          podObj.update(model, pod);
        }
      });
    }

    public debug(enable) {
      var ids = _.keys(this.pods)
      _.forEach(ids, (id) => this.pods[id].debug(enable));
      super.debug(enable);
    }

    public destroy() {
      if (this.pods) {
        var podIds = _.keys(this.pods);
        _.forEach(podIds, (id) => this.removePod(id));
      }
      super.destroy();
      log.debug("Destroying host object ", this.id);
    }

    public removePod(id) {
      var pod = this.pods[id];
      if (pod) {
        pod.destroy();
        delete this.pods[id];
      }
    }

    public addPod(key, p:any) {
      if (this.hasPod(key)) {
        return;
      }
      var myPosition = this.getPosition();
      var podOffsetX = this.offsetX - myPosition.x;
      var podOffsetY = myPosition.y;
      /*
      var angle = Math.random() * 360;
      var podX = myPosition.x + podOffsetX * Math.cos(angle) - podOffsetY * Math.sin(angle);
      var podY = myPosition.y + podOffsetX * Math.sin(angle) - podOffsetY * Math.cos(angle);
      */
      var pod = new PodObject(this.scene, this, key, p);
      pod.setPosition(myPosition.x, myPosition.y, myPosition.z);
      pod.move(this.offsetX, 0, 0);
      this.offsetX = this.offsetX + Math.random() * 50 + 100;
      this.offsetY = this.offsetY + Math.random() * 50 + 100;
      this.pods[key] = pod;
    }

    public hasPod(id) {
      return (id in this.pods);
    }

    private step = 0;
    
    public render() {
      this.rotate(this.rotation.x, this.rotation.y, this.rotation.z);
      _.forIn(this.pods, (podObject, id) => {
        podObject.render();
      });
      this.step = this.step + 1;
      super.render();
    }


  }

}
