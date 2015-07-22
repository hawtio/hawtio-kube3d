/// <reference path="kube3dPlugin.ts"/>

module Kube3d {

  var chunkSize = 32;
  var generateChunk = terrain('hawtio', 0, 20, 50);

  export var VoxelController = controller('VoxelController', ['$scope', '$element', 'KubernetesModel', ($scope, $element, model:Kubernetes.KubernetesModelService) => {

    var creatures = {};

    var el = $element.find('.kube3d-control')[0];
    var game = createGame({
        lightsDisabled: false,
        fogDisabled: false,
        generateChunks: false,
        texturePath: './img/textures/',
        materials: [['grass', 'dirt', 'grass_dirt'], 'brick', 'dirt'],
        materialFlatColor: false,
        container: el
      }, (game, avatar) => {

        function newCreature(texture) {
          var THREE = game.THREE;
          var boxTexture = THREE.ImageUtils.loadTexture(texture);
          boxTexture.minFilter = THREE.NearestFilter;
          var boxMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00, 
            map: boxTexture,
            castShadow: true,
            receiveShadow: true,
            wireframe: false
          });
          var box = new THREE.Mesh(new THREE.CubeGeometry(1, 1, 1), boxMaterial);
          return box;
        }

        var makeFly = fly(game);
        var target = game.controls.target();
        game.flyer = makeFly(target);

        // highlight blocks when you look at them, hold <Ctrl> for block placement
        var blockPosPlace, blockPosErase;
        var hl = game.highlighter = highlight(game, { color: 0xff0000 });
        hl.on('highlight', function (voxelPos) { blockPosErase = voxelPos });
        hl.on('remove', function (voxelPos) { blockPosErase = null });
        hl.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos });
        hl.on('remove-adjacent', function (voxelPos) { blockPosPlace = null });

        // toggle between first and third person modes
        window.addEventListener('keydown', function (ev) {
          if (ev.keyCode === 'R'.charCodeAt(0)) avatar.toggle();
        });

        // block interaction stuff, uses highlight data
        var currentMaterial = 1;

        game.on('fire', function (target, state) {
          var position = blockPosPlace;
          if (position) {
            game.createBlock(position, currentMaterial);
          }
          else {
            position = blockPosErase
              if (position) game.setBlock(position, 0);
          }
        });

        game.on('tick', function(delta) {
          walk.render(target.playerSkin);
          var vx = Math.abs(target.velocity.x);
          var vz = Math.abs(target.velocity.z);
          if (vx > 0.001 || vz > 0.001) {
            walk.stopWalking();
          } else {
            walk.startWalking()
          }
          if (game.pendingChunks.length) {
            log.debug("Pending chunks, skipping entity creation");
            return;
          }
          _.forIn(creatures, (creature, key) => {
            if (!(key in model.podsByKey)) {
              log.debug("need to delete creature ", key);
              if (creature.entity) {
                game.removeItem(creature.entity);
                if (creature.clearInterval) {
                  creature.clearInterval();
                }
              }
            }
            if (!('entity' in creature)) {
              log.debug("need to create creature ", key);
              var mesh = newCreature(creature.pod.$iconUrl);
              mesh.position.set(Math.random() * 20 - 10, 30, Math.random() * 20 - 10);
              var item:any = {
                mesh: mesh,
                size: 2,
                velocity: { x: 0, y: 0.9, z: 0 }
              };
              creature.entity = game.addItem(item);
              creature.clearInterval = game.setInterval(() => {
                creature.entity.velocity.x = (Math.random() * 10 - 5) * 0.005;
                creature.entity.velocity.z = (Math.random() * 10 - 5) * 0.005;
                creature.entity.velocity.y = (Math.random() * 10 - 5) * 0.005;
                creature.entity.resting = false;
              }, Math.random() * 5000 + 500);
            }
          });
        });
      });

    // generate terrain on-demand
    game.voxels.on('missingChunk', (p) => {
      var voxels = generateChunk(p, chunkSize);
      var chunk = {
        position: p,
        dims: [chunkSize, chunkSize, chunkSize],
        voxels: voxels
      };
      game.showChunk(chunk);
    });

    $scope.$on('kubernetesModelUpdated', (e, model) => {
      log.debug("model updated: ", model);
      _.forIn(model.podsByKey, (pod, key) => {
        var creature:any = creatures[key];
        if (!creature) {
          creature = creatures[key] = <any> {
            name: key,
            pod: pod
          };
        }
      });
      log.debug("Creatures:", creatures);
    });

  }]);
  
}
