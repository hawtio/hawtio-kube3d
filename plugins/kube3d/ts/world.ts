/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

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


      // floor
      var geometry = new THREE.PlaneGeometry( 30000, 30000, 100, 100 );
      geometry.applyMatrix( new THREE.Matrix4().makeRotationX( - Math.PI / 2 ) );
      var material = new THREE.MeshBasicMaterial( { color: 0x222222 } );
      var mesh = new THREE.Mesh( geometry, material );
      scene.add( mesh );

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

    public render() {

    }

    public destroy() {

    }

  }

}
