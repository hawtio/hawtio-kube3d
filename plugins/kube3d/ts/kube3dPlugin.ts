/// <reference path="kube3dHelpers.ts"/>

module Kube3d {

  export var _module = angular.module(pluginName, []);
  export var controller = PluginHelpers.createControllerFunction(_module, pluginName);

  var tab = undefined;

  _module.config(['$routeProvider', "HawtioNavBuilderProvider", ($routeProvider: ng.route.IRouteProvider, builder: HawtioMainNav.BuilderFactory) => {
    tab = builder.create()
      .id(pluginName)
      .title(() => '3D View')
      .href(() => '/kubernetes/3d')
      .page(() => builder.join(templatePath, 'view.html'))
      .build();
    builder.configureRouting($routeProvider, tab);

  }]);

  _module.run(['HawtioNav', (nav) => {
    nav.on(HawtioMainNav.Actions.ADD, pluginName, (item) => {
      if (item.id !== 'kubernetes') {
        return;
      }
      if (!_.any(item.tabs, (tab:any) => tab.id === pluginName)) {
        item.tabs.push(tab);
      }
    });
  }]);


  hawtioPluginLoader.addModule(pluginName);

}
