/// <reference path="kube3dPlugin.ts"/>
/// <reference path="objects.ts"/>

module Kube3d {

  export var ViewController = controller('ViewController', ['$scope', 'KubernetesModel', 'KubernetesState', ($scope, model:Kubernetes.KubernetesModelService, state) => {

    var geometry = new THREE.SphereGeometry(50, 32, 16);
    var material = new THREE.MeshLambertMaterial({color: 0xffffff, shading: THREE.FlatShading});

    var hostGeometry = new THREE.SphereGeometry(100, 32, 16);
    var hostMaterial = new THREE.MeshLambertMaterial({color: 0x88ff88, shading: THREE.FlatShading});

    var ambient = new THREE.AmbientLight( 0xffffff );
    ambient.color.setHSL( 0.1, 0.3, 0.2 );

    var light = new THREE.DirectionalLight( 0x888888 );
    light.position.set( 1, 1, 0);

    var debugScene = false;

    var renderer:any = undefined;
    var scene:any = undefined;
    var camera:any = undefined;
    var domElement:any = undefined;

    var sceneGeometry = new THREE.Object3D();
    var sceneBounds = new THREE.BoundingBoxHelper(sceneGeometry, 0xff0000);

    var raycaster:any = new THREE.Raycaster();
    var mouse:any = new THREE.Vector2();

    var podObjects = {};
    var hostObjects = {};

    var updating = false;
    var hasMouse = false;

    $scope.config = {
      initialize: (r, s, c, d) => {
        log.debug("init called");
        renderer = r;
        scene = s;
        camera = c;
        domElement = $(d);

        domElement.on('wheel', (event) => {
          camera.position.z += event.originalEvent.wheelDelta;
        });

        domElement.mouseenter((event) => {
          hasMouse = true;
        });

        domElement.mouseleave((event) => {
          hasMouse = false;
        });

        domElement.mousemove((event) => {
          //log.debug("hasMouse: ", hasMouse, " event: ", event);
          event.preventDefault();
          mouse.x = (event.clientX / domElement.width()) * 2 - 1;
          mouse.y = - (event.clientY / domElement.height()) * 2 - 1;
          raycaster.setFromCamera(mouse, camera);
          var objects = _.map(_.values(podObjects), (podObject) => podObject.obj);
          var intersects = raycaster.intersectObjects(objects);
          //log.debug("intersects: ", intersects);
        });

        //scene.fog = new THREE.Fog( 0x000000, 3500, 15000 );
				//scene.fog.color.setHSL( 0.51, 0.4, 0.01 );
        scene.add(ambient);
        scene.add(light);
        scene.add(sceneGeometry);

        var materialArray = [];
        for (var i = 0; i < 6; i++)
          materialArray.push(new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture('img/space-seamless.png'),
            side: THREE.BackSide
          }));
        var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
        scene.add(new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), skyMaterial));

        if (debugScene) {
          // debug stuff
          // puts a bounding box around the scene we want to view
          scene.add(sceneBounds);

          // adds lines for the x/y/z axis
          // The X axis is red. The Y axis is green. The Z axis is blue
          var axis = new THREE.AxisHelper(1000);
          scene.add(axis);
        }


        camera.position.x = 0;
        camera.position.y = 0;
        camera.position.z = 0;
        sceneGeometry.rotation.x = 90;
        sceneGeometry.rotation.z = 90;
        sceneGeometry.position.x = 0;
        sceneGeometry.position.y = 0;
        sceneGeometry.position.z = 0;

				var geometry = new THREE.Geometry();
				for (var i = 0; i < 10000; i++) {
					var vertex = new THREE.Vector3();
					vertex.x = THREE.Math.randFloatSpread( 10000 );
					vertex.y = THREE.Math.randFloatSpread( 10000 );
					vertex.z = THREE.Math.randFloatSpread( 10000 );
					geometry.vertices.push(vertex);
				}
				var particles = new THREE.PointCloud( geometry, new THREE.PointCloudMaterial({color: 0x888888, fog: true}));
				scene.add(particles);
        buildScene();
      },
      render: (renderer, scene, camera) => {
        // NOTE - this function runs at ~ 60fps!
        if (updating) {
          return;
        }
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
        camera.focus(sceneBounds.box, angle);
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
