/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  var levelData = 
    [
      [ W, W, W, W, W, W, W, W ],
      [ W, S, S, S, S, S, S, W ],
      [ W, S, S, S, S, S, S, W ],
      [ W, S, S, S, S, S, S, W ],
      [ W, S, S, S, S, S, S, W ],
      [ W, S, S, S, S, S, S, W ],
      [ W, S, S, S, S, S, S, W ],
      [ W, W, W, W, W, W, W, W ]
    ];

  var levelWidth = levelData[0].length;
  var levelHeight = levelData.length;

  var wallTexture = THREE.ImageUtils.loadTexture('img/IMGP1450.jpg');
  wallTexture.minFilter = THREE.NearestFilter;
  var wallMaterial = new THREE.MeshPhongMaterial({
    color: 0x00ff00, 
    map: wallTexture,
    castShadow: true,
    receiveShadow: true,
    wireframe: false
  });
  var wall = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE), wallMaterial);

  var floorTexture = THREE.ImageUtils.loadTexture('img/IMGP1450.jpg');
  floorTexture.minFilter = THREE.NearestFilter;
  var floorMaterial = new THREE.MeshPhongMaterial({
    color: 0xff0000, 
    map: floorTexture,
    castShadow: true,
    receiveShadow: true,
    wireframe: false
  });
  var floor = new THREE.Mesh(new THREE.BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE), floorMaterial);

  function makeBox(cellX, cellY, isFloor = false) {
    var box = isFloor ? floor.clone() : wall.clone();
    box.position.fromArray(placeObject(cellX, cellY, isFloor));
    return box;
  }

  export class World implements Renderable {
    private ambient = new THREE.AmbientLight( 0xffffff );
    private light = new THREE.DirectionalLight( 0x888888 );

    public constructor(private scene) {
      this.ambient.color.setHSL( 0.1, 0.3, 0.2 );
      this.light.position.set( 1, 1, 0);
      //scene.fog = new THREE.Fog(0xffffff, 500, 10000)
      scene.add(this.ambient);
      scene.add(this.light);

      // skybox
      var materialArray = [];
      for (var i = 0; i < 6; i++)
        materialArray.push(new THREE.MeshBasicMaterial({
          map: THREE.ImageUtils.loadTexture('img/space-seamless.png'),
          side: THREE.BackSide
        }));
      var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
      scene.add(new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), skyMaterial));

      // walls/floor
      _.forEach(levelData, (row, y) => {
        _.forEach(row, (cell, x) => {
          switch (cell) {
            case WALL:
              scene.add(makeBox(x, y, false));
              break;
          }
          scene.add(makeBox(x, y, true));
        });
      });

      /*
      // particle cloud
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
      */
    }

    public placePlayer(object) {
      this.placeObject(object);
    }

    public placeObject(object) {
      if (!object || !object.position) {
        return;
      }
      var x, y;
      do {
        x = Math.floor(Math.random() * (levelWidth - 2) + 1);
        y = Math.floor(Math.random() * (levelHeight -2) + 1);
        log.debug("x:",x,"y:",y,"val:",levelData[y][x]);
      } while (levelData[y][x] !== SPACE)
      object.position.fromArray(placeObject(x, y));
    }

    public render() {

    }

    public destroy() {

    }

  }

}
