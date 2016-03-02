/// <reference path="kube3dPlugin.ts"/>

module Kube3d {

  export var Preferences = controller('Preferences', ['$scope', 'localStorage', 'angryPodsBlacklist', ($scope, localStorage, angryPodsBlacklist) => {


    var config = {
      properties: {
        'destroyPods': {
          type: 'boolean',
          default: settings.destroyPods,
          description: 'Actually destroy pods when destroyed in-game'
        },
        'music': {
          type: 'boolean',
          default: settings.music,
          description: 'Play music'
        },
        'blacklist': {
          type: 'array',
          items: {
            type: 'string'
          },
          description: "Names to match against for pods that shouldn't be brought into the game"
        }
      }
    };

    $scope.$watch('entity.destroyPods', (val, old) => {
      if (val !== old) {
        localStorage['Kube3d.destroyPods'] = val + "";
      }
    });

    $scope.$watch('entity.music', (val, old) => {
      if (val !== old) {
        localStorage['Kube3d.music'] = val + "";
      }
    });
    $scope.$watchCollection('entity.blacklist', (val, old) => {
      if (val !== old) {
        localStorage['Kube3d.blacklist'] = angular.toJson(val);
      }
    });

    $scope.entity = settings;
    $scope.config = config;

  }]);

}
