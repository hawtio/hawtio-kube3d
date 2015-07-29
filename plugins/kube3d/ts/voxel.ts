/// <reference path="kube3dPlugin.ts"/>
/// <reference path="podlek.ts"/>
/// <reference path="energyBolt.ts"/>
/// <reference path="player.ts"/>
/// <reference path="sounds.ts"/>

module Kube3d {

  var maxProjectiles = 20;
  var chunkSize = 32;
  var generateChunk = terrain('hawtio', 0, 30, 50);

  export var VoxelController = controller('VoxelController', ['$scope', '$element', 'KubernetesModel', ($scope, $element, model:Kubernetes.KubernetesModelService) => {

    $scope.locked = true;

    var entities = {};

    function projectileCount() {
      return _.filter(_.keys(entities), (key) => _.startsWith('projectile-', key)).length;
    }

    var el = $element.find('.kube3d-control')[0];
    var game = createGame({
        lightsDisabled: true,
        fogDisabled: false,
        generateChunks: false,
        texturePath: 'resources/textures/',
        materials: [['grass', 'dirt', 'grass_dirt'], 'dirt', 'brick'],
        materialFlatColor: false,
        container: el
      }, (game, avatar) => {

        var target = game.controls.target();

        var player = new Player(game, avatar, target);
        entities[player.getName()] = player;

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
          if (projectileCount() > maxProjectiles) {
            return;
          }
          var bolt = new EnergyBolt(game, target, game.cameraVector(), player.getName());
          entities[bolt.getName()] = bolt;

          playerLaser.play();
        });

        game.on('tick', function(delta) {
          if ($scope.locked && !game.paused) {
            log.debug("Game: ", game);
            $scope.locked = false;
            Core.$apply($scope);
          }
          _.forIn(model.podsByKey, (pod, key) => {
            var creature:any = entities[key];
            if (!creature) {
              creature = entities[key] = new Podlek(model, game, key, pod);
            }
          });

          sky()(delta);

          // entities
          var entitiesToRemove = [];
          _.forIn(entities, (entity, key) => {
            if (entity.needsSpawning()) {
              log.debug("need to create entity ", key);
              entity.spawn(target);
            } else {

              if (entity.shouldDie()) {
                entity.die(false);
              }

              entity.tick(delta);
              entity.checkCollisions(entities);

              if (entity.isDestroyed()) {
                entitiesToRemove.push(entity.getName());
              }
            }
          });
          _.forEach(entitiesToRemove, (key) => {
            var creature = entities[key];
            if (!creature) {
              return;
            }
            delete entities[key];
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
        var creature:any = entities[key];
        if (!creature) {
          creature = entities[key] = new Podlek(model, game, key, pod);
        } else {
          creature.pod = pod;
        }
      });
      log.debug("Creatures:", entities);
    }
    $scope.$on('kubernetesModelUpdated', updatePods);
    updatePods(undefined, model);
  }]);
  
}
