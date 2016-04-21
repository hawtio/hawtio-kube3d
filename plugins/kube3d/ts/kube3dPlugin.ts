/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  export var _module = angular.module(pluginName, []);
  export var controller = PluginHelpers.createControllerFunction(_module, pluginName);
  export var route = PluginHelpers.createRoutingFunction(templatePath);

  var tab = undefined;

  _module.config(['$routeProvider', "HawtioNavBuilderProvider", ($routeProvider: ng.route.IRouteProvider, builder: HawtioMainNav.BuilderFactory) => {
    tab = builder.create()
      .id(pluginName)
      .title(() => 'Angry Pods')
      .href(() => '/kubernetes/3d')
      .page(() => builder.join(templatePath, 'view.html'))
      .build();
    builder.configureRouting($routeProvider, tab);
    // also add this to a couple other paths
    ["/kubernetes",
     "/workspaces/:workspace",
     "/workspaces/:workspace/projects/:project"].forEach((context) => {
      $routeProvider.when(UrlHelpers.join(context, '/namespace/:namespace/angryPods'), route('view.html', false));
    });
  }]);

  _module.run(['HawtioNav', 'preferencesRegistry', (nav, prefs) => {
    nav.on(HawtioMainNav.Actions.ADD, pluginName, (item) => {
      if (item.id !== 'kubernetes') {
        return;
      }
      if (!_.any(item.tabs, (tab:any) => tab.id === pluginName)) {
        item.tabs.push(tab);
      }
    });
    prefs.addTab('Angry Pods', UrlHelpers.join(templatePath, 'preferences.html'));
  }]);

  _module.service('angryPodsBlacklist', ['localStorage', (localStorage) => {
    var self = {
      blacklist: settings.blacklist,
      isBlacklisted(name:string) {
        return _.some(self.blacklist, (item:any) => _.startsWith(name, item));
      }
    }
    return self;
  }]);

  _module.directive('angryPodsTitle', () => {
    return {
      restrict: 'C',
      link: (scope, element, attr) => {
        element.css({
          'background-image': "url('resources/angry-pods-title.png')",
          'background-repeat': 'no-repeat',
          'background-size': '100%'
        });
      }
    }
  });

  hawtioPluginLoader.addModule(pluginName);

}
