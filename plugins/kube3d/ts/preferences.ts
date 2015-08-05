/// <reference path="kube3dPlugin.ts"/>

module Kube3d {

  export var Preferences = controller('Preferences', ['$scope', 'localStorage', ($scope, localStorage) => {

    var config = {
      properties: {
        'destroyPods': {
          type: 'boolean',
          description: 'Actually destroy pods when destroyed in-game'
        },
        'music': {
          type: 'boolean',
          description: 'Play music'
        }
      }
    };

    $scope.$watch('entity.destroyPods', (val, old) => {
      if (val !== old) {
        localStorage['Kube3d.destroyPods'] = val;
      }
    });

    $scope.$watch('entity.music', (val, old) => {
      if (val !== old) {
        localStorage['Kube3d.music'] = val;
      }
    });

    $scope.entity = settings;
    $scope.config = config;

  }]);

}
