/// <reference path="kube3dPlugin.ts"/>
/// <reference path="player.ts"/>
/// <reference path="world.ts"/>
/// <reference path="objects.ts"/>

module Kube3d {

  export var ViewController = controller('ViewController', ['$scope', 'KubernetesModel', 'KubernetesState', '$element', ($scope, model:Kubernetes.KubernetesModelService, state, $element) => {

    var debugScene = false;

    var renderer:any = undefined;
    var scene:any = undefined;
    var camera:any = undefined;
    var domElement:any = undefined;

    var sceneGeometry = new THREE.Object3D();
    var sceneBounds = new THREE.BoundingBoxHelper(sceneGeometry, 0xff0000);

    var hostObjects = {};

    var updating = false;
    var hasMouse = false;

    var player:Player = null;
    var world:World = null;

    $scope.onLock = (lock) => {
      if (!player) {
        return;
      }
      player.enabled = lock;
    }

    $scope.config = {
      initialize: (r, s, c, d) => {
        log.debug("init called");
        renderer = r;
        scene = s;
        camera = c;
        domElement = d;

        $scope.player = player = new Player(scene, camera, d);
        world = new World(scene);

        scene.add(sceneGeometry);

        if (debugScene) {
          // debug stuff
          // puts a bounding box around the scene we want to view
          scene.add(sceneBounds);

        }
        // adds lines for the x/y/z axis
        // The X axis is red. The Y axis is green. The Z axis is blue
        var axis = new THREE.AxisHelper(1000);
        scene.add(axis);

        sceneGeometry.rotation.x = 90;
        sceneGeometry.rotation.z = 90;
        sceneGeometry.position.x = 0;
        sceneGeometry.position.y = 0;
        sceneGeometry.position.z = 0;
        buildScene();
      },
      render: (renderer, scene, camera) => {
        // NOTE - this function runs at ~ 60fps!
        if (updating) {
          return;
        }
        world.render();
        var angle = Date.now() * 0.0001;
        sceneGeometry.position.x = 1000 * Math.cos(angle);
        sceneGeometry.position.z = 1000 * Math.sin(angle);
        // sceneGeometry.rotation.x += 0.001;
        // sceneGeometry.rotation.y += 0.001;
        // sceneGeometry.rotation.z += 0.001;
        _.forIn(hostObjects, (hostObject, key) => {
          hostObject.render();
        });
        sceneBounds.update();
        player.lookAt(sceneBounds.box);
        player.render();
      }
    }

    function buildScene() {
      if (!scene) {
        return;
      }
      updating = true;
      var originX = 0;
      var originY = 0;

      var hostsToRemove = [];

      _.forIn(hostObjects, (hostObject, key) => {
        if (_.any(model.hosts, (host) => host.elementId === key)) {
          log.debug("Keeping host: ", key);
        } else {
          hostsToRemove.push(key);
        }
      });

      _.forEach(hostsToRemove, (key) => {
        var hostObject = hostObjects[key];
        if (hostObject) {
          hostObject.destroy();
          delete hostObjects[key];
        }
      });

      _.forEach(model.hosts, (host) => {
        var id = host.elementId;
        log.debug("host: ", host);
        var hostObject = hostObjects[id] || new HostObject(sceneGeometry, id, host);
        if (!(id in hostObjects)) {
          hostObject.setPosition(originX, originY, 0);
          originX = originX + 500;
          originY = originY + 500;
          hostObjects[id] = hostObject;
        }
        hostObject.update(model, host);
        hostObject.debug(debugScene);
      });

      log.debug("model updated");
      updating = false;
    }
    $scope.$on('kubernetesModelUpdated', buildScene);
  }]);

}
