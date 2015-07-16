/// <reference path="kube3dPlugin.ts"/>

module Kube3d {

  _module.directive('requestLock', ['$document', ($document) => {
    return {
      restrict: 'A',
      scope: {
        'onLock': '&requestLock'
      },
      link: (scope, element, attr) => {
        var el = element[0] || element;
        if (havePointerLock) {
          log.debug("here!");
          var doc = $document[0];
          var body = doc.body;

          var pointerlockchange = (event) => {
            if ( doc.pointerLockElement === body || 
                 doc.mozPointerLockElement === body || 
                 doc.webkitPointerLockElement === body ) {
              el.style.display = 'none';
              scope.onLock({ lock: true });
            } else {
              el.style.display = '';
              scope.onLock({ lock: false });
            }
            Core.$apply(scope);
          };

          var pointerlockerror = (event) => {
            el.style.display = '';
          };

          doc.addEventListener( 'pointerlockchange', pointerlockchange, false );
          doc.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
          doc.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

          doc.addEventListener( 'pointerlockerror', pointerlockerror, false );
          doc.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
          doc.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

          el.addEventListener('click', (event) => {
            el.style.display = 'none';
            body.requestPointerLock = body.requestPointerLock || body.mozRequestPointerLock || body.webkitRequestPointerLock;
            body.requestPointerLock();
          });
        } else {
          el.style.display = 'none'; 
        }
      }
    }
  }]);

}
