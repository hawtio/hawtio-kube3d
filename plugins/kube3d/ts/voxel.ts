/// <reference path="kube3dPlugin.ts"/>
/// <reference path="podlek.ts"/>
/// <reference path="energyBolt.ts"/>

module Kube3d {

  var chunkSize = 32;
  var generateChunk = terrain('hawtio', 0, 20, 50);

  export var VoxelController = controller('VoxelController', ['$scope', '$element', 'KubernetesModel', ($scope, $element, model:Kubernetes.KubernetesModelService) => {

    $scope.locked = true;

    var creatures = {};
    var bullets = [];

    var el = $element.find('.kube3d-control')[0];
    var game = createGame({
        lightsDisabled: true,
        fogDisabled: false,
        generateChunks: false,
        texturePath: 'resources/textures/',
        materials: [['grass', 'dirt', 'grass_dirt'], 'brick', 'dirt'],
        materialFlatColor: false,
        container: el
      }, (game, avatar) => {

        var bullet = new game.THREE.Mesh(new game.THREE.SphereGeometry(0.25, 32, 32), new game.THREE.MeshPhongMaterial({
          color: 0x888888,
        }));

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
          if (bullets.length > 10) {
            return;
          }
          bullets.push(new EnergyBolt(game, target, game.cameraVector()));
        });

        game.on('tick', function(delta) {
          if ($scope.locked && !game.paused) {
            log.debug("Game: ", game);
            $scope.locked = false;
            Core.$apply($scope);
          }

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
            bullet.tick(delta);
            bullet.checkCollisions(creatures);
            if (bullet.isDestroyed()) {
              toRemove.push(bullet);
            }
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
              creature.die();
            }
            if (!(key in model.podsByKey)) {
              log.debug("need to delete creature ", key);
              creaturesToRemove.push(key);
            }
            if (!creature.inGame()) {
              log.debug("need to create creature ", key);
              creature.spawn(target);
            } else {
              creature.tick(delta);
            }
          });
          _.forEach(creaturesToRemove, (key) => {
            var creature = creatures[key];
            if (!creature) {
              return;
            }
            creature.destroy();
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

    function cleanup() {
      if (game) {
        game.destroy();
        delete game;
      }
    }

    // just to be on the safe side :-)
    $element.on('$destroy', cleanup);
    $scope.$on('$destroy', cleanup);

    function updatePods(e, model) {
      log.debug("model updated: ", model);
      _.forIn(model.podsByKey, (pod, key) => {
        var creature:any = creatures[key];
        if (!creature) {
          creature = creatures[key] = new Podlek(model, game, key, pod);
        } else {
          creature.pod = pod;
        }
      });
      log.debug("Creatures:", creatures);
    }
    $scope.$on('kubernetesModelUpdated', updatePods);
    updatePods(undefined, model);
  }]);
  
}
