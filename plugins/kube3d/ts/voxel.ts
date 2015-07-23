/// <reference path="kube3dPlugin.ts"/>

module Kube3d {

  var chunkSize = 32;
  var generateChunk = terrain('hawtio', 0, 20, 50);

  export var VoxelController = controller('VoxelController', ['$scope', '$element', 'KubernetesModel', ($scope, $element, model:Kubernetes.KubernetesModelService) => {

    var creatures = {};
    var bullets = [];

    var el = $element.find('.kube3d-control')[0];
    var game = createGame({
        lightsDisabled: true,
        fogDisabled: false,
        generateChunks: false,
        texturePath: './img/textures/',
        materials: [['grass', 'dirt', 'grass_dirt'], 'brick', 'dirt'],
        materialFlatColor: false,
        container: el
      }, (game, avatar) => {

        var bullet = new game.THREE.Mesh(new game.THREE.SphereGeometry(0.25, 32, 32), new game.THREE.MeshPhongMaterial({
          color: 0x888888,
        }));

        function newCreature(texture) {
          var THREE = game.THREE;
          var boxTexture = THREE.ImageUtils.loadTexture(texture);
          boxTexture.minFilter = THREE.NearestFilter;
          var boxMaterial = new THREE.MeshPhongMaterial({
            map: boxTexture,
            alphaMap: boxTexture
          });
          var box = new THREE.Mesh(new THREE.CubeGeometry(game.cubeSize, game.cubeSize, game.cubeSize), boxMaterial);
          return box;
        }

        var makeFly = fly(game);
        var target = game.controls.target();
        game.flyer = makeFly(target);

        var sky = createSky({
          game: game,
          time: 800,
          speed: 0.1,
          color: new game.THREE.Color(game.skyColor)
        });

        // highlight blocks when you look at them, hold <Ctrl> for block placement
        /*
        var blockPosPlace, blockPosErase;
        var hl = game.highlighter = highlight(game, { color: 0xff0000 });
        hl.on('highlight', function (voxelPos) { blockPosErase = voxelPos });
        hl.on('remove', function (voxelPos) { blockPosErase = null });
        hl.on('highlight-adjacent', function (voxelPos) { blockPosPlace = voxelPos });
        hl.on('remove-adjacent', function (voxelPos) { blockPosPlace = null });
        */

        // toggle between first and third person modes
        window.addEventListener('keydown', function (ev) {
          if (ev.keyCode === 'R'.charCodeAt(0)) avatar.toggle();
        });

        // block interaction stuff, uses highlight data
        var currentMaterial = 1;

        game.on('fire', function (target, state) {
          log.debug("fire, target: ", target, " state: ", state);
          if (bullets.length > 10) {
            return;
          }
          var b = bullet.clone();
          b.position.set(target.position.x, target.position.y + 1, target.position.z);
          var direction = game.cameraVector();
          var velocity = new game.THREE.Vector3(direction[0], direction[1], direction[2]);
          velocity.multiplyScalar(0.05);
          var item:any = {
            mesh: b,
            size: 0.8,
            velocity: velocity
          };
          item = game.addItem(item);
          log.debug("item: ", item);
          bullets.push(item);
        });

        game.on('tick', function(delta) {

          // player
          walk.render(target.playerSkin);
          var vx = Math.abs(target.velocity.x);
          var vz = Math.abs(target.velocity.z);
          if (vx > 0.001 || vz > 0.001) {
            walk.stopWalking();
          } else {
            walk.startWalking()
          }

          // projectiles
          var toRemove = [];
          _.forEach(bullets, (bullet) => {
            if (bullet.lastPosition) {
              var pos = bullet.mesh.position;
              var last = bullet.lastPosition;
              if (pos.x === last.x && pos.y === last.y && pos.z === last.z) {
                game.removeItem(bullet);
                toRemove.push(bullet);
              }
            }
            bullet.lastPosition = {
              x: bullet.mesh.position.x,
              y: bullet.mesh.position.y,
              z: bullet.mesh.position.z
            }
            var bulletAABB = bullet.aabb();
            var hit = false;
            _.forIn(creatures, (creature, key) => {
              if (!creature.entity || hit) {
                return;
              }
              if (bulletAABB.intersects(creature.entity.aabb())) {
                hit = true;
                game.removeItem(bullet);
                toRemove.push(bullet);
                creature.hit = true;
              }
            });
          });
          _.forEach(toRemove, (bullet) => {
            _.remove(bullets, bullet);
          });

          sky()(delta);

          if (game.pendingChunks.length) {
            log.debug("Pending chunks, skipping entity creation");
            return;
          }

          // creatures
          var creaturesToRemove = [];
          _.forIn(creatures, (creature, key) => {
            if (creature.hit && !creature.deleted) {
              model['podsResource'].delete({ id: Kubernetes.getName(creature.pod) });
              creature.deleted = true;
              if (creature.clearInterval) {
                creature.clearInterval();
                delete creature.clearInterval;
              }
              creature.entity.velocity.y = 2;
              creature.entity.resting = false;
              log.debug("Creature hit: ", creature);
            }
            if (creature.hit && creature.entity) {
              creature.entity.mesh.scale.x = creature.entity.mesh.scale.x + 0.05;
              creature.entity.mesh.scale.z = creature.entity.mesh.scale.z + 0.05;
            }
            if (!(key in model.podsByKey)) {
              log.debug("need to delete creature ", key);
              creaturesToRemove.push(key);
            }
            if (!('entity' in creature)) {
              log.debug("need to create creature ", key);
              var mesh = newCreature(creature.pod.$iconUrl);
              mesh.name = key;
              mesh.position.set(Math.random() * 20 - 10, 30, Math.random() * 20 - 10);
              var item:any = {
                mesh: mesh,
                size: 1,
                velocity: { x: 0, y: 0, z: 0 }
              };
              creature.entity = game.addItem(item);
              creature.clearInterval = game.setInterval(() => {
                if (creature.deleted) {
                  return;
                }
                creature.entity.velocity.x = (Math.random() * 10 - 5) * 0.005;
                creature.entity.velocity.z = (Math.random() * 10 - 5) * 0.005;
                creature.entity.velocity.y = (Math.random() * 10 - 5) * 0.005;
                creature.entity.resting = false;
              }, Math.random() * 5000 + 500);
            }
          });
          _.forEach(creaturesToRemove, (key) => {
            var creature = creatures[key];
            if (!creature) {
              return;
            }
            if (creature.entity) {
              game.removeItem(creature.entity);
              if (creature.clearInterval) {
                creature.clearInterval();
              }
            }
            delete creatures[key];
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
