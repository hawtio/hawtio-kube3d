/// <reference path="kube3dHelpers.d.ts" />
declare module Kube3d {
    var _module: any;
    var controller: (name: string, inlineAnnotatedConstructor: any[]) => any;
    var route: (templateName: string, reloadOnSearch?: boolean) => {
        templateUrl: string;
        reloadOnSearch: boolean;
    };
}
