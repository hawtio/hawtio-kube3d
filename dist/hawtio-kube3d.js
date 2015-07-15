/// Copyright 2014-2015 Red Hat, Inc. and/or its affiliates
/// and other contributors as indicated by the @author tags.
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///   http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.


var Kube3d;
(function (Kube3d) {
    Kube3d.pluginName = 'Kube3d';
    Kube3d.log = Logger.get(Kube3d.pluginName);
    Kube3d.templatePath = 'plugins/kube3d/html';
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    function randomGrey() {
        var rgbVal = Math.random() * 128 + 128;
        return rgbToHex(rgbVal, rgbVal, rgbVal);
    }
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    ;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    Kube3d._module = angular.module(Kube3d.pluginName, []);
    Kube3d.controller = PluginHelpers.createControllerFunction(Kube3d._module, Kube3d.pluginName);
    var tab = undefined;
    Kube3d._module.config(['$routeProvider', "HawtioNavBuilderProvider", function ($routeProvider, builder) {
        tab = builder.create().id(Kube3d.pluginName).title(function () { return '3D View'; }).href(function () { return '/kubernetes/3d'; }).page(function () { return builder.join(Kube3d.templatePath, 'view.html'); }).build();
        builder.configureRouting($routeProvider, tab);
    }]);
    Kube3d._module.run(['HawtioNav', function (nav) {
        nav.on(HawtioMainNav.Actions.ADD, Kube3d.pluginName, function (item) {
            if (item.id !== 'kubernetes') {
                return;
            }
            if (!_.any(item.tabs, function (tab) { return tab.id === Kube3d.pluginName; })) {
                item.tabs.push(tab);
            }
        });
    }]);
    hawtioPluginLoader.addModule(Kube3d.pluginName);
})(Kube3d || (Kube3d = {}));

var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var Kube3d;
(function (Kube3d) {
    var log = Logger.get('Kube3d');
    var SceneObjectBase = (function () {
        function SceneObjectBase(scene, geometry) {
            this.scene = scene;
            this.geometry = geometry;
            this.boundingBox = null;
            this.scene.add(geometry);
            this.boundingBox = new THREE.BoundingBoxHelper(this.geometry, 0x00ff00);
            this.scene.add(this.boundingBox);
        }
        SceneObjectBase.prototype.destroy = function () {
            this.scene.remove(this.geometry);
            this.geometry.dispose();
            delete this.geometry;
        };
        SceneObjectBase.prototype.debug = function (enable) {
            this.boundingBox.visible = enable;
        };
        SceneObjectBase.prototype.move = function (x, y, z) {
            this.geometry.position.x += x;
            this.geometry.position.y += y;
            this.geometry.position.z += z;
            this.boundingBox.position.x += x;
            this.boundingBox.position.y += y;
            this.boundingBox.position.z += z;
        };
        SceneObjectBase.prototype.rotate = function (rx, ry, rz) {
            this.geometry.rotation.x += rx;
            this.geometry.rotation.y += ry;
            this.geometry.rotation.z += rz;
            this.boundingBox.rotation.x += rx;
            this.boundingBox.rotation.y += ry;
            this.boundingBox.rotation.z += rz;
        };
        SceneObjectBase.prototype.getPosition = function () {
            this.boundingBox.update();
            return this.boundingBox.object.position;
        };
        SceneObjectBase.prototype.setPosition = function (x, y, z) {
            this.geometry.position.x = x;
            this.geometry.position.y = y;
            this.geometry.position.z = z;
            this.boundingBox.position.x = x;
            this.boundingBox.position.y = y;
            this.boundingBox.position.z = z;
        };
        SceneObjectBase.prototype.setRotation = function (rx, ry, rz) {
            this.geometry.rotation.x = rx;
            this.geometry.rotation.y = ry;
            this.geometry.rotation.z = rz;
            this.geometry.rotation.x = rx;
            this.geometry.rotation.y = ry;
            this.geometry.rotation.z = rz;
        };
        SceneObjectBase.prototype.render = function () {
            this.boundingBox.update();
        };
        return SceneObjectBase;
    })();
    Kube3d.SceneObjectBase = SceneObjectBase;
    var PodObject = (function (_super) {
        __extends(PodObject, _super);
        function PodObject(scene, hostObject, id, obj) {
            _super.call(this, scene, new THREE.Object3D());
            this.scene = scene;
            this.hostObject = hostObject;
            this.id = id;
            this.obj = obj;
            this.angle = undefined;
            this.circle = undefined;
            this.rotation = {
                x: Math.random() * Math.PI / 1000,
                y: Math.random() * Math.PI / 100,
                z: Math.random() * Math.PI / 1000
            };
            var texture = THREE.ImageUtils.loadTexture(obj.$iconUrl);
            texture.minFilter = THREE.NearestFilter;
            this.geometry.add(new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), new THREE.MeshPhongMaterial({
                color: 0xffffff,
                map: texture,
                bumpMap: texture,
                castShadow: true,
                receiveShadow: true,
                shading: THREE.SmoothShading
            })));
            log.debug("Created pod object ", id);
        }
        PodObject.prototype.update = function (model, pod) {
            this.obj = pod;
        };
        PodObject.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            this.hostObject.geometry.remove(this.circle);
            log.debug("Destroyed pod object ", this.id);
        };
        PodObject.prototype.distance = function () {
            var hostPosition = this.hostObject.getPosition();
            var myPosition = this.getPosition();
            var distX = Math.abs(hostPosition.x - myPosition.x);
            var distY = Math.abs(hostPosition.y - myPosition.y);
            return Math.sqrt(distX * distX + distY * distY);
        };
        PodObject.prototype.angleOfVelocity = function () {
            if (!this.angle) {
                var dist = this.distance();
                log.debug("pod id: ", this.id, " distance: ", dist);
                this.angle = (1 / dist) * 10;
                log.debug("pod id: ", this.id, " angle: ", this.angle);
                var materialArray = [];
                var face = new THREE.MeshPhongMaterial({
                    color: 0x555555,
                    castShadow: true,
                    receiveShadow: true,
                    wireframe: true
                });
                materialArray.push(face.clone());
                materialArray.push(face.clone());
                this.circle = new THREE.Mesh(new THREE.RingGeometry(dist - 1, dist + 1, 128), new THREE.MeshFaceMaterial(materialArray));
                this.hostObject.geometry.add(this.circle);
            }
            return this.angle;
        };
        PodObject.prototype.render = function () {
            var myPosition = this.getPosition();
            var hostPosition = this.hostObject.getPosition();
            var x = myPosition.x;
            var y = myPosition.y;
            var centerX = hostPosition.x;
            var centerY = hostPosition.y;
            var offsetX = x - centerX;
            var offsetY = y - centerY;
            var angle = this.angleOfVelocity();
            var newX = centerX + offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
            var newY = centerY + offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
            this.setPosition(newX, newY, 0);
            this.rotate(this.rotation.x, this.rotation.y, this.rotation.z);
            _super.prototype.render.call(this);
        };
        return PodObject;
    })(SceneObjectBase);
    Kube3d.PodObject = PodObject;
    var HostObject = (function (_super) {
        __extends(HostObject, _super);
        function HostObject(scene, id, obj) {
            _super.call(this, scene, new THREE.Object3D());
            this.id = id;
            this.obj = obj;
            this.offsetX = 200;
            this.offsetY = 200;
            this.pods = {};
            this.rotation = {
                x: 0,
                y: 0,
                z: Math.random() * Math.PI / 1000
            };
            this.step = 0;
            var texture = THREE.ImageUtils.loadTexture('img/sun-texture.jpg');
            texture.minFilter = THREE.NearestFilter;
            this.geometry.add(new THREE.PointLight(0xffd700, 1, 5000), new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.MeshPhongMaterial({
                color: 0xffd700,
                map: texture,
                bumpMap: texture,
                specular: 0x00ff00,
                shading: THREE.SmoothShading
            })));
            log.debug("Created host object ", id);
        }
        HostObject.prototype.update = function (model, host) {
            var _this = this;
            this.obj = host;
            var podsToRemove = [];
            _.forIn(this.pods, function (pod, key) {
                if (!(key in model.podsByKey)) {
                    podsToRemove.push(key);
                }
            });
            _.forEach(podsToRemove, function (id) { return _this.removePod(id); });
            _.forEach(this.obj.pods, function (pod) {
                var name = pod._key;
                if (!_this.hasPod(name)) {
                    _this.addPod(name, pod);
                }
                else {
                    var podObj = _this.pods[name];
                    podObj.update(model, pod);
                }
            });
        };
        HostObject.prototype.debug = function (enable) {
            var _this = this;
            var ids = _.keys(this.pods);
            _.forEach(ids, function (id) { return _this.pods[id].debug(enable); });
            _super.prototype.debug.call(this, enable);
        };
        HostObject.prototype.destroy = function () {
            var _this = this;
            if (this.pods) {
                var podIds = _.keys(this.pods);
                _.forEach(podIds, function (id) { return _this.removePod(id); });
            }
            _super.prototype.destroy.call(this);
            log.debug("Destroying host object ", this.id);
        };
        HostObject.prototype.removePod = function (id) {
            var pod = this.pods[id];
            if (pod) {
                pod.destroy();
                delete this.pods[id];
            }
        };
        HostObject.prototype.addPod = function (key, p) {
            if (this.hasPod(key)) {
                return;
            }
            var myPosition = this.getPosition();
            var podOffsetX = this.offsetX - myPosition.x;
            var podOffsetY = myPosition.y;
            var pod = new PodObject(this.scene, this, key, p);
            pod.setPosition(myPosition.x, myPosition.y, myPosition.z);
            pod.move(this.offsetX, 0, 0);
            this.offsetX = this.offsetX + Math.random() * 50 + 100;
            this.offsetY = this.offsetY + Math.random() * 50 + 100;
            this.pods[key] = pod;
        };
        HostObject.prototype.hasPod = function (id) {
            return (id in this.pods);
        };
        HostObject.prototype.render = function () {
            this.rotate(this.rotation.x, this.rotation.y, this.rotation.z);
            _.forIn(this.pods, function (podObject, id) {
                podObject.render();
            });
            this.step = this.step + 1;
            _super.prototype.render.call(this);
        };
        return HostObject;
    })(SceneObjectBase);
    Kube3d.HostObject = HostObject;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    var directiveName = 'threejs';
    function webglAvailable() {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        }
        catch (e) {
            return false;
        }
    }
    Kube3d._module.directive(directiveName, [function () {
        THREE.ImageUtils.crossOrigin = '';
        return {
            restrict: 'A',
            replace: true,
            scope: {
                config: '=?' + directiveName
            },
            link: function (scope, element, attrs) {
                var scene = null;
                var camera = null;
                var renderer = null;
                var keepRendering = true;
                var resizeHandle = null;
                function stop() {
                    keepRendering = false;
                }
                function cleanup() {
                    $(window).off('resize', resizeFunc);
                    delete renderer;
                    delete camera;
                    delete scene;
                    element.empty();
                }
                var resizeFunc = function () {
                    Kube3d.log.debug("resizing");
                    element.find('canvas').width(element.width()).height(element.height());
                    camera.aspect = element.width() / element.height();
                    camera.updateProjectionMatrix();
                    renderer.setSize(element.width(), element.height());
                };
                element.on('$destroy', function () {
                    stop();
                    Kube3d.log.debug("scene destroyed");
                });
                scope.$watch('config', function (config) {
                    stop();
                    if (!config || !config.initialize) {
                        Kube3d.log.debug("no config, returning");
                        return;
                    }
                    Kube3d.log.debug("creating scene");
                    scene = new THREE.Scene();
                    camera = new THREE.PerspectiveCamera(60, element.width() / element.height(), 0.1, 20000);
                    camera.focus = function (box3, angle) {
                        var height = box3.size().y;
                        var width = box3.size().x / (camera.aspect / 2);
                        if (width < 0 || height < 0) {
                            return;
                        }
                        var distY = Math.round(height * Math.tan((camera.fov / 2) * (Math.PI / 180)));
                        var distX = Math.round(width * Math.tan((camera.fov / 2) * (Math.PI / 180)));
                        var distZ = (distY + distX);
                        var z = Math.round(camera.position.z);
                        var period = 5.0;
                        camera.position.x = distX * Math.cos(angle);
                        camera.position.y = distY * Math.sin(angle);
                        if (z !== distZ) {
                            if (z > distZ) {
                                var v = (z - distZ) / period;
                                camera.position.z = z - v;
                            }
                            if (z < distZ) {
                                var v = (distZ - z) / period;
                                camera.position.z = z + v;
                            }
                        }
                        camera.lookAt(box3.center());
                    };
                    if (webglAvailable()) {
                        renderer = new THREE.WebGLRenderer();
                    }
                    else {
                        renderer = new THREE.CanvasRenderer();
                    }
                    renderer.setPixelRatio(window.devicePixelRatio);
                    renderer.setSize(element.width(), element.height());
                    var domElement = renderer.domElement;
                    element.append(domElement);
                    $(window).on('resize', resizeFunc);
                    config.initialize(renderer, scene, camera, domElement);
                    var render = function () {
                        if (!keepRendering) {
                            cleanup();
                            return;
                        }
                        requestAnimationFrame(render);
                        if (config.render) {
                            config.render(renderer, scene, camera);
                        }
                        renderer.render(scene, camera);
                    };
                    keepRendering = true;
                    render();
                });
            }
        };
    }]);
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    Kube3d.ViewController = Kube3d.controller('ViewController', ['$scope', 'KubernetesModel', 'KubernetesState', function ($scope, model, state) {
        var geometry = new THREE.SphereGeometry(50, 32, 16);
        var material = new THREE.MeshLambertMaterial({ color: 0xffffff, shading: THREE.FlatShading });
        var hostGeometry = new THREE.SphereGeometry(100, 32, 16);
        var hostMaterial = new THREE.MeshLambertMaterial({ color: 0x88ff88, shading: THREE.FlatShading });
        var ambient = new THREE.AmbientLight(0xffffff);
        ambient.color.setHSL(0.1, 0.3, 0.2);
        var light = new THREE.DirectionalLight(0x888888);
        light.position.set(1, 1, 0);
        var debugScene = false;
        var renderer = undefined;
        var scene = undefined;
        var camera = undefined;
        var domElement = undefined;
        var sceneGeometry = new THREE.Object3D();
        var sceneBounds = new THREE.BoundingBoxHelper(sceneGeometry, 0xff0000);
        var raycaster = new THREE.Raycaster();
        var mouse = new THREE.Vector2();
        var podObjects = {};
        var hostObjects = {};
        var updating = false;
        var hasMouse = false;
        $scope.config = {
            initialize: function (r, s, c, d) {
                Kube3d.log.debug("init called");
                renderer = r;
                scene = s;
                camera = c;
                domElement = $(d);
                domElement.on('wheel', function (event) {
                    camera.position.z += event.originalEvent.wheelDelta;
                });
                domElement.mouseenter(function (event) {
                    hasMouse = true;
                });
                domElement.mouseleave(function (event) {
                    hasMouse = false;
                });
                domElement.mousemove(function (event) {
                    event.preventDefault();
                    mouse.x = (event.clientX / domElement.width()) * 2 - 1;
                    mouse.y = -(event.clientY / domElement.height()) * 2 - 1;
                    raycaster.setFromCamera(mouse, camera);
                    var objects = _.map(_.values(podObjects), function (podObject) { return podObject.obj; });
                    var intersects = raycaster.intersectObjects(objects);
                });
                scene.add(ambient);
                scene.add(light);
                scene.add(sceneGeometry);
                var materialArray = [];
                for (var i = 0; i < 6; i++)
                    materialArray.push(new THREE.MeshBasicMaterial({
                        map: THREE.ImageUtils.loadTexture('img/space-seamless.png'),
                        side: THREE.BackSide
                    }));
                var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
                scene.add(new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), skyMaterial));
                if (debugScene) {
                    scene.add(sceneBounds);
                    var axis = new THREE.AxisHelper(1000);
                    scene.add(axis);
                }
                camera.position.x = 0;
                camera.position.y = 0;
                camera.position.z = 0;
                sceneGeometry.rotation.x = 90;
                sceneGeometry.rotation.z = 90;
                sceneGeometry.position.x = 0;
                sceneGeometry.position.y = 0;
                sceneGeometry.position.z = 0;
                var geometry = new THREE.Geometry();
                for (var i = 0; i < 10000; i++) {
                    var vertex = new THREE.Vector3();
                    vertex.x = THREE.Math.randFloatSpread(10000);
                    vertex.y = THREE.Math.randFloatSpread(10000);
                    vertex.z = THREE.Math.randFloatSpread(10000);
                    geometry.vertices.push(vertex);
                }
                var particles = new THREE.PointCloud(geometry, new THREE.PointCloudMaterial({ color: 0x888888, fog: true }));
                scene.add(particles);
                buildScene();
            },
            render: function (renderer, scene, camera) {
                if (updating) {
                    return;
                }
                var angle = Date.now() * 0.0001;
                sceneGeometry.position.x = 1000 * Math.cos(angle);
                sceneGeometry.position.z = 1000 * Math.sin(angle);
                _.forIn(hostObjects, function (hostObject, key) {
                    hostObject.render();
                });
                sceneBounds.update();
                camera.focus(sceneBounds.box, angle);
            }
        };
        function buildScene() {
            if (!scene) {
                return;
            }
            updating = true;
            var originX = 0;
            var originY = 0;
            var hostsToRemove = [];
            _.forIn(hostObjects, function (hostObject, key) {
                if (_.any(model.hosts, function (host) { return host.elementId === key; })) {
                    Kube3d.log.debug("Keeping host: ", key);
                }
                else {
                    hostsToRemove.push(key);
                }
            });
            _.forEach(hostsToRemove, function (key) {
                var hostObject = hostObjects[key];
                if (hostObject) {
                    hostObject.destroy();
                    delete hostObjects[key];
                }
            });
            _.forEach(model.hosts, function (host) {
                var id = host.elementId;
                Kube3d.log.debug("host: ", host);
                var hostObject = hostObjects[id] || new Kube3d.HostObject(sceneGeometry, id, host);
                if (!(id in hostObjects)) {
                    hostObject.setPosition(originX, originY, 0);
                    originX = originX + 500;
                    originY = originY + 500;
                    hostObjects[id] = hostObject;
                }
                hostObject.update(model, host);
                hostObject.debug(debugScene);
            });
            Kube3d.log.debug("model updated");
            updating = false;
        }
        $scope.$on('kubernetesModelUpdated', buildScene);
    }]);
})(Kube3d || (Kube3d = {}));

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLnRzIiwia3ViZTNkL3RzL2t1YmUzZEhlbHBlcnMudHMiLCJrdWJlM2QvdHMva3ViZTNkSW50ZXJmYWNlcy50cyIsImt1YmUzZC90cy9rdWJlM2RQbHVnaW4udHMiLCJrdWJlM2QvdHMvb2JqZWN0cy50cyIsImt1YmUzZC90cy90aHJlZUpTRGlyZWN0aXZlLnRzIiwia3ViZTNkL3RzL3ZpZXcudHMiXSwibmFtZXMiOlsiS3ViZTNkIiwiS3ViZTNkLnJnYlRvSGV4IiwiS3ViZTNkLnJhbmRvbUdyZXkiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5jb25zdHJ1Y3RvciIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UuZGVzdHJveSIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UuZGVidWciLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLm1vdmUiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLnJvdGF0ZSIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UuZ2V0UG9zaXRpb24iLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLnNldFBvc2l0aW9uIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5zZXRSb3RhdGlvbiIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UucmVuZGVyIiwiS3ViZTNkLlBvZE9iamVjdCIsIkt1YmUzZC5Qb2RPYmplY3QuY29uc3RydWN0b3IiLCJLdWJlM2QuUG9kT2JqZWN0LnVwZGF0ZSIsIkt1YmUzZC5Qb2RPYmplY3QuZGVzdHJveSIsIkt1YmUzZC5Qb2RPYmplY3QuZGlzdGFuY2UiLCJLdWJlM2QuUG9kT2JqZWN0LmFuZ2xlT2ZWZWxvY2l0eSIsIkt1YmUzZC5Qb2RPYmplY3QucmVuZGVyIiwiS3ViZTNkLkhvc3RPYmplY3QiLCJLdWJlM2QuSG9zdE9iamVjdC5jb25zdHJ1Y3RvciIsIkt1YmUzZC5Ib3N0T2JqZWN0LnVwZGF0ZSIsIkt1YmUzZC5Ib3N0T2JqZWN0LmRlYnVnIiwiS3ViZTNkLkhvc3RPYmplY3QuZGVzdHJveSIsIkt1YmUzZC5Ib3N0T2JqZWN0LnJlbW92ZVBvZCIsIkt1YmUzZC5Ib3N0T2JqZWN0LmFkZFBvZCIsIkt1YmUzZC5Ib3N0T2JqZWN0Lmhhc1BvZCIsIkt1YmUzZC5Ib3N0T2JqZWN0LnJlbmRlciIsIkt1YmUzZC53ZWJnbEF2YWlsYWJsZSIsIkt1YmUzZC5zdG9wIiwiS3ViZTNkLmNsZWFudXAiLCJLdWJlM2QuYnVpbGRTY2VuZSJdLCJtYXBwaW5ncyI6IkFBa0JzQjs7QUNoQnRCLElBQU8sTUFBTSxDQWVaO0FBZkQsV0FBTyxNQUFNLEVBQUMsQ0FBQztJQUNGQSxpQkFBVUEsR0FBR0EsUUFBUUEsQ0FBQ0E7SUFDdEJBLFVBQUdBLEdBQWtCQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxpQkFBVUEsQ0FBQ0EsQ0FBQ0E7SUFDNUNBLG1CQUFZQSxHQUFHQSxxQkFBcUJBLENBQUNBO0lBRWhEQSxTQUFTQSxRQUFRQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQTtRQUN2QkMsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDNUVBLENBQUNBO0lBRURELFNBQVNBLFVBQVVBO1FBQ2pCRSxJQUFJQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxHQUFHQSxHQUFHQSxHQUFHQSxDQUFDQTtRQUN2Q0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsTUFBTUEsRUFBRUEsTUFBTUEsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7SUFDMUNBLENBQUNBO0FBR0hGLENBQUNBLEVBZk0sTUFBTSxLQUFOLE1B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LENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzdCQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDaENBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBRWxDQSxDQUFDQTtRQUVNUCxxQ0FBV0EsR0FBbEJBLFVBQW1CQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQTtZQUMzQlEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOUJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzlCQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUM5QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOUJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzlCQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtRQUNoQ0EsQ0FBQ0E7UUFFTVIsZ0NBQU1BLEdBQWJBO1lBQ0VTLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1FBQzVCQSxDQUFDQTtRQUVIVCxzQkFBQ0E7SUFBREEsQ0FsRUFILElBa0VDQTtJQWxFWUEsc0JBQWVBLEdBQWZBLGVBa0VaQSxDQUFBQTtJQUVEQSxJQUFhQSxTQUFTQTtRQUFTYSxV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LEtBQUtBLEdBQUdBLENBQUNBLElBQUlBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBOzRCQUM1QkEsTUFBTUEsQ0FBQ0E7d0JBQ1RBLENBQUNBO3dCQUNEQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFFQSxHQUFHQSxDQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbEZBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUVBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUVBLEdBQUdBLENBQUVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUVBLENBQUNBLENBQUNBLENBQUNBO3dCQUNqRkEsSUFBSUEsS0FBS0EsR0FBR0EsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBRTVCQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdENBLElBQUlBLE1BQU1BLEdBQUdBLEdBQUdBLENBQUNBO3dCQUNqQkEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBQzVDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTt3QkFDNUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNB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QUNYQSxVQUFVQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFFbEJBLFVBQVVBLENBQUNBLEVBQUVBLENBQUNBLE9BQU9BLEVBQUVBLFVBQUNBLEtBQUtBO29CQUMzQkEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsS0FBS0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsVUFBVUEsQ0FBQ0E7Z0JBQ3REQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFFSEEsVUFBVUEsQ0FBQ0EsVUFBVUEsQ0FBQ0EsVUFBQ0EsS0FBS0E7b0JBQzFCQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQTtnQkFDbEJBLENBQUNBLENBQUNBLENBQUNBO2dCQUVIQSxVQUFVQSxDQUFDQSxVQUFVQSxDQUFDQSxVQUFDQSxLQUFLQTtvQkFDMUJBLFFBQVFBLEdBQUdBLEtBQUtBLENBQUNBO2dCQUNuQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBRUhBLFVBQVVBLENBQUNBLFNBQVNBLENBQUNBLFVBQUNBLEtBQUtBO29CQUV6QkEsS0FBS0EsQ0FBQ0EsY0FBY0EsRUFBRUEsQ0FBQ0E7b0JBQ3ZCQSxLQUFLQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxHQUFHQSxVQUFVQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtvQkFDdkRBLEtBQUtBLENBQUNBLENBQUNBLEdBQUdBLENBQUVBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLEdBQUdBLFVBQVVBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO29CQUMxREEsU0FBU0EsQ0FBQ0EsYUFBYUEsQ0FBQ0EsS0FBS0EsRUFBRUEsTUFBTUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3ZDQSxJQUFJQSxPQUFPQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxFQUFFQSxVQUFD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TUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsZUFBZUEsQ0FBRUEsS0FBS0EsQ0FBRUEsQ0FBQ0E7b0JBQy9DQSxNQUFNQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFFQSxLQUFLQSxDQUFFQSxDQUFDQTtvQkFDL0NBLE1BQU1BLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLGVBQWVBLENBQUVBLEtBQUtBLENBQUVBLENBQUNBO29CQUMvQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ2hDQSxDQUFDQTtnQkFDREEsSUFBSUEsU0FBU0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBRUEsUUFBUUEsRUFBRUEsSUFBSUEsS0FBS0EsQ0FBQ0Esa0JBQWtCQSxDQUFDQSxFQUFDQSxLQUFLQSxFQUFFQSxRQUFRQSxFQUFFQSxHQUFHQSxFQUFFQSxJQUFJQSxFQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDNUdBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLFNBQVNBLENBQUNBLENBQUNBO2dCQUNqQkEsVUFBVUEsRUFBRUEsQ0FBQ0E7WUFDZkEsQ0FBQ0E7WUFDREEsTUFBTUEsRUFBRUEsVUFBQ0EsUUFBUUEsRUFBRUEsS0FBS0EsRUFBRUEsTUFBTUE7Z0JBRTlCQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDYkEsTUFBTUEsQ0FBQ0E7Z0JBQ1RBLENBQUNBO2dCQUNEQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxFQUFFQSxHQUFHQSxNQUFNQSxDQUFDQTtnQkFDaENBLGFBQWFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO2dCQUNsREEsYUFBYUEs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LE9BQU9BLEdBQUdBLE9BQU9BLEdBQUdBLEdBQUdBLENBQUNBO29CQUN4QkEsV0FBV0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsR0FBR0EsVUFBVUEsQ0FBQ0E7Z0JBQy9CQSxDQUFDQTtnQkFDREEsVUFBVUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQy9CQSxVQUFVQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtZQUMvQkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFFSEEsVUFBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZUFBZUEsQ0FBQ0EsQ0FBQ0E7WUFDM0JBLFFBQVFBLEdBQUdBLEtBQUtBLENBQUNBO1FBQ25CQSxDQUFDQTtRQUNEaEMsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0Esd0JBQXdCQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQTtJQUNuREEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7QUFFTkEsQ0FBQ0EsRUFuTE0sTUFBTSxLQUFOLE1BQU0sUUFtTFoiLCJmaWxlIjoiY29tcGlsZWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy8gQ29weXJpZ2h0IDIwMTQtMjAxNSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2xpYnMvaGF3dGlvLXV0aWxpdGllcy9kZWZzLmQudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbGlicy9oYXd0aW8ta3ViZXJuZXRlcy9kZWZzLmQudHNcIi8+XG5cbmRlY2xhcmUgdmFyIFRIUkVFOmFueTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG4gIGV4cG9ydCB2YXIgcGx1Z2luTmFtZSA9ICdLdWJlM2QnO1xuICBleHBvcnQgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQocGx1Z2luTmFtZSk7XG4gIGV4cG9ydCB2YXIgdGVtcGxhdGVQYXRoID0gJ3BsdWdpbnMva3ViZTNkL2h0bWwnO1xuXG4gIGZ1bmN0aW9uIHJnYlRvSGV4KHIsIGcsIGIpIHtcbiAgICByZXR1cm4gXCIjXCIgKyAoKDEgPDwgMjQpICsgKHIgPDwgMTYpICsgKGcgPDwgOCkgKyBiKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG4gIH1cblxuICBmdW5jdGlvbiByYW5kb21HcmV5KCkge1xuICAgIHZhciByZ2JWYWwgPSBNYXRoLnJhbmRvbSgpICogMTI4ICsgMTI4O1xuICAgIHJldHVybiByZ2JUb0hleChyZ2JWYWwsIHJnYlZhbCwgcmdiVmFsKTtcbiAgfVxuXG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCBpbnRlcmZhY2UgUG9pbnQzZCB7XG4gICAgeDpudW1iZXI7XG4gICAgeTpudW1iZXI7XG4gICAgejpudW1iZXI7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIFNpemUzZCB7XG4gICAgd2lkdGg6IG51bWJlcjtcbiAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICBkZXB0aDogbnVtYmVyO1xuICB9XG5cbiAgZXhwb3J0IGludGVyZmFjZSBTY2VuZU9iamVjdCB7XG4gICAgcmVuZGVyKCk6dm9pZDtcbiAgICBkZXN0cm95KCk6dm9pZDtcbiAgICBnZXRQb3NpdGlvbigpOlBvaW50M2Q7XG4gICAgc2V0UG9zaXRpb24oeCwgeSwgeik7XG4gICAgc2V0Um90YXRpb24ocngsIHJ5LCByeik7XG4gIH07XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSGVscGVycy50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgZXhwb3J0IHZhciBfbW9kdWxlID0gYW5ndWxhci5tb2R1bGUocGx1Z2luTmFtZSwgW10pO1xuICBleHBvcnQgdmFyIGNvbnRyb2xsZXIgPSBQbHVnaW5IZWxwZXJzLmNyZWF0ZUNvbnRyb2xsZXJGdW5jdGlvbihfbW9kdWxlLCBwbHVnaW5OYW1lKTtcblxuICB2YXIgdGFiID0gdW5kZWZpbmVkO1xuXG4gIF9tb2R1bGUuY29uZmlnKFsnJHJvdXRlUHJvdmlkZXInLCBcIkhhd3Rpb05hdkJ1aWxkZXJQcm92aWRlclwiLCAoJHJvdXRlUHJvdmlkZXI6IG5nLnJvdXRlLklSb3V0ZVByb3ZpZGVyLCBidWlsZGVyOiBIYXd0aW9NYWluTmF2LkJ1aWxkZXJGYWN0b3J5KSA9PiB7XG4gICAgdGFiID0gYnVpbGRlci5jcmVhdGUoKVxuICAgICAgLmlkKHBsdWdpbk5hbWUpXG4gICAgICAudGl0bGUoKCkgPT4gJzNEIFZpZXcnKVxuICAgICAgLmhyZWYoKCkgPT4gJy9rdWJlcm5ldGVzLzNkJylcbiAgICAgIC5wYWdlKCgpID0+IGJ1aWxkZXIuam9pbih0ZW1wbGF0ZVBhdGgsICd2aWV3Lmh0bWwnKSlcbiAgICAgIC5idWlsZCgpO1xuICAgIGJ1aWxkZXIuY29uZmlndXJlUm91dGluZygkcm91dGVQcm92aWRlciwgdGFiKTtcblxuICB9XSk7XG5cbiAgX21vZHVsZS5ydW4oWydIYXd0aW9OYXYnLCAobmF2KSA9PiB7XG4gICAgbmF2Lm9uKEhhd3Rpb01haW5OYXYuQWN0aW9ucy5BREQsIHBsdWdpbk5hbWUsIChpdGVtKSA9PiB7XG4gICAgICBpZiAoaXRlbS5pZCAhPT0gJ2t1YmVybmV0ZXMnKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICghXy5hbnkoaXRlbS50YWJzLCAodGFiOmFueSkgPT4gdGFiLmlkID09PSBwbHVnaW5OYW1lKSkge1xuICAgICAgICBpdGVtLnRhYnMucHVzaCh0YWIpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XSk7XG5cblxuICBoYXd0aW9QbHVnaW5Mb2FkZXIuYWRkTW9kdWxlKHBsdWdpbk5hbWUpO1xuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSW50ZXJmYWNlcy50c1wiLz5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KCdLdWJlM2QnKTtcblxuICBleHBvcnQgY2xhc3MgU2NlbmVPYmplY3RCYXNlIGltcGxlbWVudHMgU2NlbmVPYmplY3Qge1xuXG4gICAgcHJpdmF0ZSBib3VuZGluZ0JveDphbnkgPSBudWxsO1xuXG4gICAgY29uc3RydWN0b3IocHVibGljIHNjZW5lOmFueSwgcHVibGljIGdlb21ldHJ5OmFueSkge1xuICAgICAgdGhpcy5zY2VuZS5hZGQoZ2VvbWV0cnkpO1xuICAgICAgdGhpcy5ib3VuZGluZ0JveCA9IG5ldyBUSFJFRS5Cb3VuZGluZ0JveEhlbHBlcih0aGlzLmdlb21ldHJ5LCAweDAwZmYwMCk7XG4gICAgICB0aGlzLnNjZW5lLmFkZCh0aGlzLmJvdW5kaW5nQm94KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIHRoaXMuc2NlbmUucmVtb3ZlKHRoaXMuZ2VvbWV0cnkpO1xuICAgICAgdGhpcy5nZW9tZXRyeS5kaXNwb3NlKCk7XG4gICAgICBkZWxldGUgdGhpcy5nZW9tZXRyeTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVidWcoZW5hYmxlKSB7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnZpc2libGUgPSBlbmFibGU7XG4gICAgfVxuXG4gICAgcHVibGljIG1vdmUoeCwgeSwgeikge1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi54ICs9IHg7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnkgKz0geTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueiArPSB6O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi54ICs9IHg7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnkgKz0geTtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueiArPSB6O1xuICAgIH1cblxuICAgIHB1YmxpYyByb3RhdGUocngsIHJ5LCByeikge1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi54ICs9IHJ4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi55ICs9IHJ5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi56ICs9IHJ6O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5yb3RhdGlvbi54ICs9IHJ4O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5yb3RhdGlvbi55ICs9IHJ5O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5yb3RhdGlvbi56ICs9IHJ6O1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXRQb3NpdGlvbigpIHtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gudXBkYXRlKCk7XG4gICAgICByZXR1cm4gdGhpcy5ib3VuZGluZ0JveC5vYmplY3QucG9zaXRpb247XG4gICAgfVxuXG4gICAgcHVibGljIHNldFBvc2l0aW9uKHgsIHksIHopIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueCA9IHg7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnkgPSB5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi56ID0gejtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueCA9IHg7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnkgPSB5O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi56ID0gejtcblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRSb3RhdGlvbihyeCwgcnksIHJ6KSB7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnggPSByeDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueSA9IHJ5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi56ID0gcno7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnggPSByeDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueSA9IHJ5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi56ID0gcno7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gudXBkYXRlKCk7XG4gICAgfVxuXG4gIH1cblxuICBleHBvcnQgY2xhc3MgUG9kT2JqZWN0IGV4dGVuZHMgU2NlbmVPYmplY3RCYXNlIHtcbiAgICBwcml2YXRlIGFuZ2xlOm51bWJlciA9IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIGNpcmNsZTphbnkgPSB1bmRlZmluZWQ7XG4gICAgcHJpdmF0ZSByb3RhdGlvbiA9IHtcbiAgICAgIHg6IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJIC8gMTAwMCxcbiAgICAgIHk6IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJIC8gMTAwLFxuICAgICAgejogTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgLyAxMDAwXG4gICAgfTtcbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgc2NlbmU6IGFueSwgcHVibGljIGhvc3RPYmplY3Q6SG9zdE9iamVjdCwgcHVibGljIGlkOnN0cmluZywgcHVibGljIG9iajphbnkpIHtcbiAgICAgIHN1cGVyKHNjZW5lLCBuZXcgVEhSRUUuT2JqZWN0M0QoKSk7XG4gICAgICB2YXIgdGV4dHVyZSA9IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUob2JqLiRpY29uVXJsKTtcbiAgICAgIHRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcbiAgICAgIHRoaXMuZ2VvbWV0cnkuYWRkKFxuICAgICAgICAgIG5ldyBUSFJFRS5NZXNoKFxuICAgICAgICAgICAgbmV3IFRIUkVFLkJveEdlb21ldHJ5KDUwLCA1MCwgNTApLCBcbiAgICAgICAgICAgIG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7XG4gICAgICAgICAgICAgIGNvbG9yOiAweGZmZmZmZiwgXG4gICAgICAgICAgICAgIG1hcDogdGV4dHVyZSxcbiAgICAgICAgICAgICAgYnVtcE1hcDogdGV4dHVyZSxcbiAgICAgICAgICAgICAgY2FzdFNoYWRvdzogdHJ1ZSwgXG4gICAgICAgICAgICAgIHJlY2VpdmVTaGFkb3c6IHRydWUsIFxuICAgICAgICAgICAgICBzaGFkaW5nOiBUSFJFRS5TbW9vdGhTaGFkaW5nXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgKSk7XG4gICAgICBsb2cuZGVidWcoXCJDcmVhdGVkIHBvZCBvYmplY3QgXCIsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlKG1vZGVsLCBwb2QpIHtcbiAgICAgIHRoaXMub2JqID0gcG9kO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xuICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgICAgdGhpcy5ob3N0T2JqZWN0Lmdlb21ldHJ5LnJlbW92ZSh0aGlzLmNpcmNsZSk7XG4gICAgICBsb2cuZGVidWcoXCJEZXN0cm95ZWQgcG9kIG9iamVjdCBcIiwgdGhpcy5pZCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBkaXN0YW5jZSgpIHtcbiAgICAgIHZhciBob3N0UG9zaXRpb24gPSB0aGlzLmhvc3RPYmplY3QuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciBteVBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIGRpc3RYID0gTWF0aC5hYnMoaG9zdFBvc2l0aW9uLnggLSBteVBvc2l0aW9uLngpO1xuICAgICAgdmFyIGRpc3RZID0gTWF0aC5hYnMoaG9zdFBvc2l0aW9uLnkgLSBteVBvc2l0aW9uLnkpO1xuICAgICAgcmV0dXJuIE1hdGguc3FydChkaXN0WCAqIGRpc3RYICsgZGlzdFkgKiBkaXN0WSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhbmdsZU9mVmVsb2NpdHkoKSB7XG4gICAgICBpZiAoIXRoaXMuYW5nbGUpIHtcbiAgICAgICAgdmFyIGRpc3QgPSB0aGlzLmRpc3RhbmNlKCk7XG4gICAgICAgIGxvZy5kZWJ1ZyhcInBvZCBpZDogXCIsIHRoaXMuaWQsIFwiIGRpc3RhbmNlOiBcIiwgZGlzdCk7XG4gICAgICAgIHRoaXMuYW5nbGUgPSAoMSAvIGRpc3QpICogMTA7XG4gICAgICAgIGxvZy5kZWJ1ZyhcInBvZCBpZDogXCIsIHRoaXMuaWQsIFwiIGFuZ2xlOiBcIiwgdGhpcy5hbmdsZSk7XG4gICAgICAgIHZhciBtYXRlcmlhbEFycmF5ID0gW107XG4gICAgICAgIHZhciBmYWNlID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHsgXG4gICAgICAgICAgY29sb3I6IDB4NTU1NTU1LFxuICAgICAgICAgIGNhc3RTaGFkb3c6IHRydWUsXG4gICAgICAgICAgcmVjZWl2ZVNoYWRvdzogdHJ1ZSxcbiAgICAgICAgICB3aXJlZnJhbWU6IHRydWVcbiAgICAgICAgfSk7XG4gICAgICAgIG1hdGVyaWFsQXJyYXkucHVzaChmYWNlLmNsb25lKCkpO1xuICAgICAgICBtYXRlcmlhbEFycmF5LnB1c2goZmFjZS5jbG9uZSgpKTtcbiAgICAgICAgdGhpcy5jaXJjbGUgPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuUmluZ0dlb21ldHJ5KGRpc3QgLSAxLCBkaXN0ICsgMSwgMTI4KSwgbmV3IFRIUkVFLk1lc2hGYWNlTWF0ZXJpYWwobWF0ZXJpYWxBcnJheSkpO1xuICAgICAgICB0aGlzLmhvc3RPYmplY3QuZ2VvbWV0cnkuYWRkKHRoaXMuY2lyY2xlKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLmFuZ2xlO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICB2YXIgbXlQb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciBob3N0UG9zaXRpb24gPSB0aGlzLmhvc3RPYmplY3QuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciB4ID0gbXlQb3NpdGlvbi54O1xuICAgICAgdmFyIHkgPSBteVBvc2l0aW9uLnk7XG4gICAgICB2YXIgY2VudGVyWCA9IGhvc3RQb3NpdGlvbi54O1xuICAgICAgdmFyIGNlbnRlclkgPSBob3N0UG9zaXRpb24ueTtcbiAgICAgIHZhciBvZmZzZXRYID0geCAtIGNlbnRlclg7XG4gICAgICB2YXIgb2Zmc2V0WSA9IHkgLSBjZW50ZXJZO1xuICAgICAgdmFyIGFuZ2xlID0gdGhpcy5hbmdsZU9mVmVsb2NpdHkoKTtcbiAgICAgIHZhciBuZXdYID0gY2VudGVyWCArIG9mZnNldFggKiBNYXRoLmNvcyhhbmdsZSkgLSBvZmZzZXRZICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgdmFyIG5ld1kgPSBjZW50ZXJZICsgb2Zmc2V0WCAqIE1hdGguc2luKGFuZ2xlKSArIG9mZnNldFkgKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICB0aGlzLnNldFBvc2l0aW9uKG5ld1gsIG5ld1ksIDApO1xuICAgICAgdGhpcy5yb3RhdGUodGhpcy5yb3RhdGlvbi54LCB0aGlzLnJvdGF0aW9uLnksIHRoaXMucm90YXRpb24ueik7XG4gICAgICBzdXBlci5yZW5kZXIoKTtcbiAgICB9XG4gIH1cblxuICBleHBvcnQgY2xhc3MgSG9zdE9iamVjdCBleHRlbmRzIFNjZW5lT2JqZWN0QmFzZSB7XG4gICAgcHJpdmF0ZSBvZmZzZXRYID0gMjAwO1xuICAgIHByaXZhdGUgb2Zmc2V0WSA9IDIwMDtcbiAgICBwdWJsaWMgcG9kcyA9IHt9O1xuICAgIHB1YmxpYyByb3RhdGlvbiA9IHtcbiAgICAgIHg6IDAsXG4gICAgICB5OiAwLFxuICAgICAgejogTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgLyAxMDAwXG4gICAgfVxuXG4gICAgY29uc3RydWN0b3Ioc2NlbmU6IGFueSwgcHVibGljIGlkOnN0cmluZywgcHVibGljIG9iajphbnkpIHtcbiAgICAgIHN1cGVyKHNjZW5lLCBuZXcgVEhSRUUuT2JqZWN0M0QoKSlcbiAgICAgIHZhciB0ZXh0dXJlID0gVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSgnaW1nL3N1bi10ZXh0dXJlLmpwZycpO1xuICAgICAgdGV4dHVyZS5taW5GaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICAgICAgdGhpcy5nZW9tZXRyeS5hZGQoIFxuICAgICAgICAgIG5ldyBUSFJFRS5Qb2ludExpZ2h0KDB4ZmZkNzAwLCAxLCA1MDAwKSxcbiAgICAgICAgICBuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgICAgIG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgxMDAsIDMyLCAxNiksIFxuICAgICAgICAgICAgbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHtcbiAgICAgICAgICAgICAgY29sb3I6IDB4ZmZkNzAwLCBcbiAgICAgICAgICAgICAgbWFwOiB0ZXh0dXJlLFxuICAgICAgICAgICAgICBidW1wTWFwOiB0ZXh0dXJlLFxuICAgICAgICAgICAgICBzcGVjdWxhcjogMHgwMGZmMDAsIFxuICAgICAgICAgICAgICBzaGFkaW5nOiBUSFJFRS5TbW9vdGhTaGFkaW5nXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIClcbiAgICAgICAgKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIkNyZWF0ZWQgaG9zdCBvYmplY3QgXCIsIGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgdXBkYXRlKG1vZGVsLCBob3N0KSB7XG4gICAgICB0aGlzLm9iaiA9IGhvc3Q7XG4gICAgICB2YXIgcG9kc1RvUmVtb3ZlID0gW107XG4gICAgICBfLmZvckluKHRoaXMucG9kcywgKHBvZCwga2V5KSA9PiB7XG4gICAgICAgIGlmICghKGtleSBpbiBtb2RlbC5wb2RzQnlLZXkpKSB7XG4gICAgICAgICAgcG9kc1RvUmVtb3ZlLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICBfLmZvckVhY2gocG9kc1RvUmVtb3ZlLCAoaWQpID0+IHRoaXMucmVtb3ZlUG9kKGlkKSk7XG4gICAgICBfLmZvckVhY2godGhpcy5vYmoucG9kcywgKHBvZDphbnkpID0+IHtcbiAgICAgICAgdmFyIG5hbWUgPSBwb2QuX2tleTtcbiAgICAgICAgaWYgKCF0aGlzLmhhc1BvZChuYW1lKSkge1xuICAgICAgICAgIHRoaXMuYWRkUG9kKG5hbWUsIHBvZCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHBvZE9iaiA9IHRoaXMucG9kc1tuYW1lXTtcbiAgICAgICAgICBwb2RPYmoudXBkYXRlKG1vZGVsLCBwb2QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVidWcoZW5hYmxlKSB7XG4gICAgICB2YXIgaWRzID0gXy5rZXlzKHRoaXMucG9kcylcbiAgICAgIF8uZm9yRWFjaChpZHMsIChpZCkgPT4gdGhpcy5wb2RzW2lkXS5kZWJ1ZyhlbmFibGUpKTtcbiAgICAgIHN1cGVyLmRlYnVnKGVuYWJsZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgICBpZiAodGhpcy5wb2RzKSB7XG4gICAgICAgIHZhciBwb2RJZHMgPSBfLmtleXModGhpcy5wb2RzKTtcbiAgICAgICAgXy5mb3JFYWNoKHBvZElkcywgKGlkKSA9PiB0aGlzLnJlbW92ZVBvZChpZCkpO1xuICAgICAgfVxuICAgICAgc3VwZXIuZGVzdHJveSgpO1xuICAgICAgbG9nLmRlYnVnKFwiRGVzdHJveWluZyBob3N0IG9iamVjdCBcIiwgdGhpcy5pZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbW92ZVBvZChpZCkge1xuICAgICAgdmFyIHBvZCA9IHRoaXMucG9kc1tpZF07XG4gICAgICBpZiAocG9kKSB7XG4gICAgICAgIHBvZC5kZXN0cm95KCk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnBvZHNbaWRdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHB1YmxpYyBhZGRQb2Qoa2V5LCBwOmFueSkge1xuICAgICAgaWYgKHRoaXMuaGFzUG9kKGtleSkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIG15UG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgcG9kT2Zmc2V0WCA9IHRoaXMub2Zmc2V0WCAtIG15UG9zaXRpb24ueDtcbiAgICAgIHZhciBwb2RPZmZzZXRZID0gbXlQb3NpdGlvbi55O1xuICAgICAgLypcbiAgICAgIHZhciBhbmdsZSA9IE1hdGgucmFuZG9tKCkgKiAzNjA7XG4gICAgICB2YXIgcG9kWCA9IG15UG9zaXRpb24ueCArIHBvZE9mZnNldFggKiBNYXRoLmNvcyhhbmdsZSkgLSBwb2RPZmZzZXRZICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgdmFyIHBvZFkgPSBteVBvc2l0aW9uLnkgKyBwb2RPZmZzZXRYICogTWF0aC5zaW4oYW5nbGUpIC0gcG9kT2Zmc2V0WSAqIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgICovXG4gICAgICB2YXIgcG9kID0gbmV3IFBvZE9iamVjdCh0aGlzLnNjZW5lLCB0aGlzLCBrZXksIHApO1xuICAgICAgcG9kLnNldFBvc2l0aW9uKG15UG9zaXRpb24ueCwgbXlQb3NpdGlvbi55LCBteVBvc2l0aW9uLnopO1xuICAgICAgcG9kLm1vdmUodGhpcy5vZmZzZXRYLCAwLCAwKTtcbiAgICAgIHRoaXMub2Zmc2V0WCA9IHRoaXMub2Zmc2V0WCArIE1hdGgucmFuZG9tKCkgKiA1MCArIDEwMDtcbiAgICAgIHRoaXMub2Zmc2V0WSA9IHRoaXMub2Zmc2V0WSArIE1hdGgucmFuZG9tKCkgKiA1MCArIDEwMDtcbiAgICAgIHRoaXMucG9kc1trZXldID0gcG9kO1xuICAgIH1cblxuICAgIHB1YmxpYyBoYXNQb2QoaWQpIHtcbiAgICAgIHJldHVybiAoaWQgaW4gdGhpcy5wb2RzKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIHN0ZXAgPSAwO1xuICAgIFxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICB0aGlzLnJvdGF0ZSh0aGlzLnJvdGF0aW9uLngsIHRoaXMucm90YXRpb24ueSwgdGhpcy5yb3RhdGlvbi56KTtcbiAgICAgIF8uZm9ySW4odGhpcy5wb2RzLCAocG9kT2JqZWN0LCBpZCkgPT4ge1xuICAgICAgICBwb2RPYmplY3QucmVuZGVyKCk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuc3RlcCA9IHRoaXMuc3RlcCArIDE7XG4gICAgICBzdXBlci5yZW5kZXIoKTtcbiAgICB9XG5cblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIHZhciBkaXJlY3RpdmVOYW1lID0gJ3RocmVlanMnO1xuXG4gIGZ1bmN0aW9uIHdlYmdsQXZhaWxhYmxlKCkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgICAgIHJldHVybiAhISggKDxhbnk+d2luZG93KS5XZWJHTFJlbmRlcmluZ0NvbnRleHQgJiYgKFxuICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoICd3ZWJnbCcgKSB8fFxuICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoICdleHBlcmltZW50YWwtd2ViZ2wnICkgKVxuICAgICAgICAgICk7XG4gICAgfSBjYXRjaCAoIGUgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoZGlyZWN0aXZlTmFtZSwgWygpID0+IHtcbiAgICBUSFJFRS5JbWFnZVV0aWxzLmNyb3NzT3JpZ2luID0gJyc7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgY29uZmlnOiAnPT8nICsgZGlyZWN0aXZlTmFtZVxuICAgICAgfSxcbiAgICAgIGxpbms6IChzY29wZSwgZWxlbWVudCwgYXR0cnMpID0+IHtcblxuICAgICAgICB2YXIgc2NlbmU6YW55ID0gbnVsbDtcbiAgICAgICAgdmFyIGNhbWVyYTphbnkgPSBudWxsO1xuICAgICAgICB2YXIgcmVuZGVyZXI6YW55ID0gbnVsbDtcbiAgICAgICAgdmFyIGtlZXBSZW5kZXJpbmcgPSB0cnVlO1xuICAgICAgICB2YXIgcmVzaXplSGFuZGxlOmFueSA9IG51bGw7XG5cbiAgICAgICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICBrZWVwUmVuZGVyaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIHJlc2l6ZUZ1bmMpO1xuICAgICAgICAgIGRlbGV0ZSByZW5kZXJlcjtcbiAgICAgICAgICBkZWxldGUgY2FtZXJhO1xuICAgICAgICAgIGRlbGV0ZSBzY2VuZTtcbiAgICAgICAgICBlbGVtZW50LmVtcHR5KCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzaXplRnVuYyA9ICgpID0+IHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcInJlc2l6aW5nXCIpO1xuICAgICAgICAgICAgZWxlbWVudC5maW5kKCdjYW52YXMnKS53aWR0aChlbGVtZW50LndpZHRoKCkpLmhlaWdodChlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgICAgIGNhbWVyYS5hc3BlY3QgPSBlbGVtZW50LndpZHRoKCkgLyBlbGVtZW50LmhlaWdodCgpO1xuICAgICAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoZWxlbWVudC53aWR0aCgpLCBlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQub24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICBsb2cuZGVidWcoXCJzY2VuZSBkZXN0cm95ZWRcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNjb3BlLiR3YXRjaCgnY29uZmlnJywgKGNvbmZpZykgPT4ge1xuICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICBpZiAoIWNvbmZpZyB8fCAhY29uZmlnLmluaXRpYWxpemUpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIm5vIGNvbmZpZywgcmV0dXJuaW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsb2cuZGVidWcoXCJjcmVhdGluZyBzY2VuZVwiKTtcbiAgICAgICAgICBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgICAgICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg2MCwgZWxlbWVudC53aWR0aCgpIC8gZWxlbWVudC5oZWlnaHQoKSwgMC4xLCAyMDAwMCk7XG5cbiAgICAgICAgICBjYW1lcmEuZm9jdXMgPSAoYm94MzphbnksIGFuZ2xlKSA9PiB7XG4gICAgICAgICAgICAvLyBhZGp1c3QgdGhlIGNhbWVyYSBwb3NpdGlvbiB0byBrZWVwIGV2ZXJ5dGhpbmcgaW4gdmlldywgd2UnbGwgZG9cbiAgICAgICAgICAgIC8vIGdyYWR1YWwgYWRqdXN0bWVudHMgdGhvdWdoXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gYm94My5zaXplKCkueTtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGJveDMuc2l6ZSgpLnggLyAoY2FtZXJhLmFzcGVjdCAvIDIpO1xuICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJ3aWR0aDpcIiwgd2lkdGgsIFwiIGhlaWdodDpcIiwgaGVpZ2h0KTtcbiAgICAgICAgICAgIGlmICh3aWR0aCA8IDAgfHwgaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZGlzdFkgPSBNYXRoLnJvdW5kKGhlaWdodCAqIE1hdGgudGFuKCAoY2FtZXJhLmZvdiAvIDIgKSAqICggTWF0aC5QSSAvIDE4MCApKSk7XG4gICAgICAgICAgICB2YXIgZGlzdFggPSBNYXRoLnJvdW5kKHdpZHRoICogTWF0aC50YW4oIChjYW1lcmEuZm92IC8gMiApICogKCBNYXRoLlBJIC8gMTgwICkpKTtcbiAgICAgICAgICAgIHZhciBkaXN0WiA9IChkaXN0WSArIGRpc3RYKTtcbiAgICAgICAgICAgIC8vIGxvZy5kZWJ1ZyhcImRpc3RZOlwiLCBkaXN0WSwgXCIgZGlzdFg6XCIsIGRpc3RYLCBcImRpc3RaOlwiLCBkaXN0Wik7XG4gICAgICAgICAgICB2YXIgeiA9IE1hdGgucm91bmQoY2FtZXJhLnBvc2l0aW9uLnopO1xuICAgICAgICAgICAgdmFyIHBlcmlvZCA9IDUuMDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi54ID0gZGlzdFggKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueSA9IGRpc3RZICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICAgICAgaWYgKHogIT09IGRpc3RaKSB7XG4gICAgICAgICAgICAgIGlmICh6ID4gZGlzdFopIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9ICh6IC0gZGlzdFopIC8gcGVyaW9kO1xuICAgICAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi56ID0geiAtIHY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHogPCBkaXN0Wikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKGRpc3RaIC0geikgLyBwZXJpb2Q7XG4gICAgICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnogPSB6ICsgdjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FtZXJhLmxvb2tBdChib3gzLmNlbnRlcigpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKCB3ZWJnbEF2YWlsYWJsZSgpICkge1xuICAgICAgICAgICAgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5DYW52YXNSZW5kZXJlcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZW5kZXJlci5zZXRQaXhlbFJhdGlvKCB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyApO1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoZWxlbWVudC53aWR0aCgpLCBlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgICB2YXIgZG9tRWxlbWVudCA9IHJlbmRlcmVyLmRvbUVsZW1lbnQ7XG4gICAgICAgICAgZWxlbWVudC5hcHBlbmQoZG9tRWxlbWVudCk7XG5cbiAgICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHJlc2l6ZUZ1bmMpO1xuICAgICAgICAgIGNvbmZpZy5pbml0aWFsaXplKHJlbmRlcmVyLCBzY2VuZSwgY2FtZXJhLCBkb21FbGVtZW50KTtcblxuICAgICAgICAgIHZhciByZW5kZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWtlZXBSZW5kZXJpbmcpIHtcbiAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICAgICAgICAgIGlmIChjb25maWcucmVuZGVyKSB7XG4gICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXIocmVuZGVyZXIsIHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBrZWVwUmVuZGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgICByZW5kZXIoKTtcblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSk7XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwib2JqZWN0cy50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgZXhwb3J0IHZhciBWaWV3Q29udHJvbGxlciA9IGNvbnRyb2xsZXIoJ1ZpZXdDb250cm9sbGVyJywgWyckc2NvcGUnLCAnS3ViZXJuZXRlc01vZGVsJywgJ0t1YmVybmV0ZXNTdGF0ZScsICgkc2NvcGUsIG1vZGVsOkt1YmVybmV0ZXMuS3ViZXJuZXRlc01vZGVsU2VydmljZSwgc3RhdGUpID0+IHtcblxuICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSg1MCwgMzIsIDE2KTtcbiAgICB2YXIgbWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaExhbWJlcnRNYXRlcmlhbCh7Y29sb3I6IDB4ZmZmZmZmLCBzaGFkaW5nOiBUSFJFRS5GbGF0U2hhZGluZ30pO1xuXG4gICAgdmFyIGhvc3RHZW9tZXRyeSA9IG5ldyBUSFJFRS5TcGhlcmVHZW9tZXRyeSgxMDAsIDMyLCAxNik7XG4gICAgdmFyIGhvc3RNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoTGFtYmVydE1hdGVyaWFsKHtjb2xvcjogMHg4OGZmODgsIHNoYWRpbmc6IFRIUkVFLkZsYXRTaGFkaW5nfSk7XG5cbiAgICB2YXIgYW1iaWVudCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4ZmZmZmZmICk7XG4gICAgYW1iaWVudC5jb2xvci5zZXRIU0woIDAuMSwgMC4zLCAwLjIgKTtcblxuICAgIHZhciBsaWdodCA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KCAweDg4ODg4OCApO1xuICAgIGxpZ2h0LnBvc2l0aW9uLnNldCggMSwgMSwgMCk7XG5cbiAgICB2YXIgZGVidWdTY2VuZSA9IGZhbHNlO1xuXG4gICAgdmFyIHJlbmRlcmVyOmFueSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgc2NlbmU6YW55ID0gdW5kZWZpbmVkO1xuICAgIHZhciBjYW1lcmE6YW55ID0gdW5kZWZpbmVkO1xuICAgIHZhciBkb21FbGVtZW50OmFueSA9IHVuZGVmaW5lZDtcblxuICAgIHZhciBzY2VuZUdlb21ldHJ5ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgdmFyIHNjZW5lQm91bmRzID0gbmV3IFRIUkVFLkJvdW5kaW5nQm94SGVscGVyKHNjZW5lR2VvbWV0cnksIDB4ZmYwMDAwKTtcblxuICAgIHZhciByYXljYXN0ZXI6YW55ID0gbmV3IFRIUkVFLlJheWNhc3RlcigpO1xuICAgIHZhciBtb3VzZTphbnkgPSBuZXcgVEhSRUUuVmVjdG9yMigpO1xuXG4gICAgdmFyIHBvZE9iamVjdHMgPSB7fTtcbiAgICB2YXIgaG9zdE9iamVjdHMgPSB7fTtcblxuICAgIHZhciB1cGRhdGluZyA9IGZhbHNlO1xuICAgIHZhciBoYXNNb3VzZSA9IGZhbHNlO1xuXG4gICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgIGluaXRpYWxpemU6IChyLCBzLCBjLCBkKSA9PiB7XG4gICAgICAgIGxvZy5kZWJ1ZyhcImluaXQgY2FsbGVkXCIpO1xuICAgICAgICByZW5kZXJlciA9IHI7XG4gICAgICAgIHNjZW5lID0gcztcbiAgICAgICAgY2FtZXJhID0gYztcbiAgICAgICAgZG9tRWxlbWVudCA9ICQoZCk7XG5cbiAgICAgICAgZG9tRWxlbWVudC5vbignd2hlZWwnLCAoZXZlbnQpID0+IHtcbiAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueiArPSBldmVudC5vcmlnaW5hbEV2ZW50LndoZWVsRGVsdGE7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRvbUVsZW1lbnQubW91c2VlbnRlcigoZXZlbnQpID0+IHtcbiAgICAgICAgICBoYXNNb3VzZSA9IHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRvbUVsZW1lbnQubW91c2VsZWF2ZSgoZXZlbnQpID0+IHtcbiAgICAgICAgICBoYXNNb3VzZSA9IGZhbHNlO1xuICAgICAgICB9KTtcblxuICAgICAgICBkb21FbGVtZW50Lm1vdXNlbW92ZSgoZXZlbnQpID0+IHtcbiAgICAgICAgICAvL2xvZy5kZWJ1ZyhcImhhc01vdXNlOiBcIiwgaGFzTW91c2UsIFwiIGV2ZW50OiBcIiwgZXZlbnQpO1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgbW91c2UueCA9IChldmVudC5jbGllbnRYIC8gZG9tRWxlbWVudC53aWR0aCgpKSAqIDIgLSAxO1xuICAgICAgICAgIG1vdXNlLnkgPSAtIChldmVudC5jbGllbnRZIC8gZG9tRWxlbWVudC5oZWlnaHQoKSkgKiAyIC0gMTtcbiAgICAgICAgICByYXljYXN0ZXIuc2V0RnJvbUNhbWVyYShtb3VzZSwgY2FtZXJhKTtcbiAgICAgICAgICB2YXIgb2JqZWN0cyA9IF8ubWFwKF8udmFsdWVzKHBvZE9iamVjdHMpLCAocG9kT2JqZWN0KSA9PiBwb2RPYmplY3Qub2JqKTtcbiAgICAgICAgICB2YXIgaW50ZXJzZWN0cyA9IHJheWNhc3Rlci5pbnRlcnNlY3RPYmplY3RzKG9iamVjdHMpO1xuICAgICAgICAgIC8vbG9nLmRlYnVnKFwiaW50ZXJzZWN0czogXCIsIGludGVyc2VjdHMpO1xuICAgICAgICB9KTtcblxuICAgICAgICAvL3NjZW5lLmZvZyA9IG5ldyBUSFJFRS5Gb2coIDB4MDAwMDAwLCAzNTAwLCAxNTAwMCApO1xuXHRcdFx0XHQvL3NjZW5lLmZvZy5jb2xvci5zZXRIU0woIDAuNTEsIDAuNCwgMC4wMSApO1xuICAgICAgICBzY2VuZS5hZGQoYW1iaWVudCk7XG4gICAgICAgIHNjZW5lLmFkZChsaWdodCk7XG4gICAgICAgIHNjZW5lLmFkZChzY2VuZUdlb21ldHJ5KTtcblxuICAgICAgICB2YXIgbWF0ZXJpYWxBcnJheSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDY7IGkrKylcbiAgICAgICAgICBtYXRlcmlhbEFycmF5LnB1c2gobmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICAgIG1hcDogVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSgnaW1nL3NwYWNlLXNlYW1sZXNzLnBuZycpLFxuICAgICAgICAgICAgc2lkZTogVEhSRUUuQmFja1NpZGVcbiAgICAgICAgICB9KSk7XG4gICAgICAgIHZhciBza3lNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoRmFjZU1hdGVyaWFsKG1hdGVyaWFsQXJyYXkpO1xuICAgICAgICBzY2VuZS5hZGQobmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLkJveEdlb21ldHJ5KDEwMDAwLCAxMDAwMCwgMTAwMDApLCBza3lNYXRlcmlhbCkpO1xuXG4gICAgICAgIGlmIChkZWJ1Z1NjZW5lKSB7XG4gICAgICAgICAgLy8gZGVidWcgc3R1ZmZcbiAgICAgICAgICAvLyBwdXRzIGEgYm91bmRpbmcgYm94IGFyb3VuZCB0aGUgc2NlbmUgd2Ugd2FudCB0byB2aWV3XG4gICAgICAgICAgc2NlbmUuYWRkKHNjZW5lQm91bmRzKTtcblxuICAgICAgICAgIC8vIGFkZHMgbGluZXMgZm9yIHRoZSB4L3kveiBheGlzXG4gICAgICAgICAgLy8gVGhlIFggYXhpcyBpcyByZWQuIFRoZSBZIGF4aXMgaXMgZ3JlZW4uIFRoZSBaIGF4aXMgaXMgYmx1ZVxuICAgICAgICAgIHZhciBheGlzID0gbmV3IFRIUkVFLkF4aXNIZWxwZXIoMTAwMCk7XG4gICAgICAgICAgc2NlbmUuYWRkKGF4aXMpO1xuICAgICAgICB9XG5cblxuICAgICAgICBjYW1lcmEucG9zaXRpb24ueCA9IDA7XG4gICAgICAgIGNhbWVyYS5wb3NpdGlvbi55ID0gMDtcbiAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnogPSAwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnggPSA5MDtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi56ID0gOTA7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueCA9IDA7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueSA9IDA7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueiA9IDA7XG5cblx0XHRcdFx0dmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG5cdFx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTAwMDA7IGkrKykge1xuXHRcdFx0XHRcdHZhciB2ZXJ0ZXggPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuXHRcdFx0XHRcdHZlcnRleC54ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG5cdFx0XHRcdFx0dmVydGV4LnkgPSBUSFJFRS5NYXRoLnJhbmRGbG9hdFNwcmVhZCggMTAwMDAgKTtcblx0XHRcdFx0XHR2ZXJ0ZXgueiA9IFRIUkVFLk1hdGgucmFuZEZsb2F0U3ByZWFkKCAxMDAwMCApO1xuXHRcdFx0XHRcdGdlb21ldHJ5LnZlcnRpY2VzLnB1c2godmVydGV4KTtcblx0XHRcdFx0fVxuXHRcdFx0XHR2YXIgcGFydGljbGVzID0gbmV3IFRIUkVFLlBvaW50Q2xvdWQoIGdlb21ldHJ5LCBuZXcgVEhSRUUuUG9pbnRDbG91ZE1hdGVyaWFsKHtjb2xvcjogMHg4ODg4ODgsIGZvZzogdHJ1ZX0pKTtcblx0XHRcdFx0c2NlbmUuYWRkKHBhcnRpY2xlcyk7XG4gICAgICAgIGJ1aWxkU2NlbmUoKTtcbiAgICAgIH0sXG4gICAgICByZW5kZXI6IChyZW5kZXJlciwgc2NlbmUsIGNhbWVyYSkgPT4ge1xuICAgICAgICAvLyBOT1RFIC0gdGhpcyBmdW5jdGlvbiBydW5zIGF0IH4gNjBmcHMhXG4gICAgICAgIGlmICh1cGRhdGluZykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgYW5nbGUgPSBEYXRlLm5vdygpICogMC4wMDAxO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnggPSAxMDAwICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnogPSAxMDAwICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICAvLyBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnggKz0gMC4wMDE7XG4gICAgICAgIC8vIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueSArPSAwLjAwMTtcbiAgICAgICAgLy8gc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi56ICs9IDAuMDAxO1xuICAgICAgICBfLmZvckluKGhvc3RPYmplY3RzLCAoaG9zdE9iamVjdCwga2V5KSA9PiB7XG4gICAgICAgICAgaG9zdE9iamVjdC5yZW5kZXIoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNjZW5lQm91bmRzLnVwZGF0ZSgpO1xuICAgICAgICBjYW1lcmEuZm9jdXMoc2NlbmVCb3VuZHMuYm94LCBhbmdsZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYnVpbGRTY2VuZSgpIHtcbiAgICAgIGlmICghc2NlbmUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdXBkYXRpbmcgPSB0cnVlO1xuICAgICAgdmFyIG9yaWdpblggPSAwO1xuICAgICAgdmFyIG9yaWdpblkgPSAwO1xuXG4gICAgICB2YXIgaG9zdHNUb1JlbW92ZSA9IFtdO1xuXG4gICAgICBfLmZvckluKGhvc3RPYmplY3RzLCAoaG9zdE9iamVjdCwga2V5KSA9PiB7XG4gICAgICAgIGlmIChfLmFueShtb2RlbC5ob3N0cywgKGhvc3QpID0+IGhvc3QuZWxlbWVudElkID09PSBrZXkpKSB7XG4gICAgICAgICAgbG9nLmRlYnVnKFwiS2VlcGluZyBob3N0OiBcIiwga2V5KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBob3N0c1RvUmVtb3ZlLnB1c2goa2V5KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIF8uZm9yRWFjaChob3N0c1RvUmVtb3ZlLCAoa2V5KSA9PiB7XG4gICAgICAgIHZhciBob3N0T2JqZWN0ID0gaG9zdE9iamVjdHNba2V5XTtcbiAgICAgICAgaWYgKGhvc3RPYmplY3QpIHtcbiAgICAgICAgICBob3N0T2JqZWN0LmRlc3Ryb3koKTtcbiAgICAgICAgICBkZWxldGUgaG9zdE9iamVjdHNba2V5XTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIF8uZm9yRWFjaChtb2RlbC5ob3N0cywgKGhvc3QpID0+IHtcbiAgICAgICAgdmFyIGlkID0gaG9zdC5lbGVtZW50SWQ7XG4gICAgICAgIGxvZy5kZWJ1ZyhcImhvc3Q6IFwiLCBob3N0KTtcbiAgICAgICAgdmFyIGhvc3RPYmplY3QgPSBob3N0T2JqZWN0c1tpZF0gfHwgbmV3IEhvc3RPYmplY3Qoc2NlbmVHZW9tZXRyeSwgaWQsIGhvc3QpO1xuICAgICAgICBpZiAoIShpZCBpbiBob3N0T2JqZWN0cykpIHtcbiAgICAgICAgICBob3N0T2JqZWN0LnNldFBvc2l0aW9uKG9yaWdpblgsIG9yaWdpblksIDApO1xuICAgICAgICAgIG9yaWdpblggPSBvcmlnaW5YICsgNTAwO1xuICAgICAgICAgIG9yaWdpblkgPSBvcmlnaW5ZICsgNTAwO1xuICAgICAgICAgIGhvc3RPYmplY3RzW2lkXSA9IGhvc3RPYmplY3Q7XG4gICAgICAgIH1cbiAgICAgICAgaG9zdE9iamVjdC51cGRhdGUobW9kZWwsIGhvc3QpO1xuICAgICAgICBob3N0T2JqZWN0LmRlYnVnKGRlYnVnU2NlbmUpO1xuICAgICAgfSk7XG5cbiAgICAgIGxvZy5kZWJ1ZyhcIm1vZGVsIHVwZGF0ZWRcIik7XG4gICAgICB1cGRhdGluZyA9IGZhbHNlO1xuICAgIH1cbiAgICAkc2NvcGUuJG9uKCdrdWJlcm5ldGVzTW9kZWxVcGRhdGVkJywgYnVpbGRTY2VuZSk7XG4gIH1dKTtcblxufVxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
angular.module("hawtio-kube3d-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/kube3d/html/view.html","<div class=\"kube3d-viewport\" ng-controller=\"Kube3d.ViewController\">\n  <div class=\"kube3d-control\" threejs=\"config\"></div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-kube3d-templates");