/// <reference path="kube3dPlugin.ts"/>

module Kube3d {

  var chunkSize = 32;
  var generateChunk = terrain('hawtio', 0, 5, 20);

  export var VoxelController = controller('VoxelController', ['$scope', '$element', 'KubernetesModel', ($scope, $element, model:Kubernetes.KubernetesModelService) => {

    var el = $element.find('.kube3d-control')[0];
    var game = createGame({
      generateChunks: false,
      texturePath: './img/textures/',
      materials: [['grass', 'dirt', 'grass_dirt'], 'brick', 'dirt'],
      materialFlatColor: false,
      container: el
    });

    game.voxels.on('missingChunk', (p) => {
      var voxels = generateChunk(p, chunkSize);
      var chunk = {
        position: p,
        dims: [chunkSize, chunkSize, chunkSize],
        voxels: voxels
      };
      game.showChunk(chunk);
    });

  }]);
  
}
