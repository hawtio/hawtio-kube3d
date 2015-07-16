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
    ;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    Kube3d.pluginName = 'Kube3d';
    Kube3d.log = Logger.get(Kube3d.pluginName);
    Kube3d.templatePath = 'plugins/kube3d/html';
    Kube3d.HalfPI = Math.PI / 2;
    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    Kube3d.rgbToHex = rgbToHex;
    function randomGrey() {
        var rgbVal = Math.random() * 128 + 128;
        return rgbToHex(rgbVal, rgbVal, rgbVal);
    }
    Kube3d.randomGrey = randomGrey;
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
    var Player = (function () {
        function Player(scene, camera, d) {
            var _this = this;
            this.scene = scene;
            this.camera = camera;
            this.d = d;
            this.log = Logger.get('kube3d-player');
            this.domElement = null;
            this._lookAt = null;
            this.pitch = new THREE.Object3D();
            this.yaw = new THREE.Object3D();
            this._enabled = false;
            this._document = undefined;
            this.forward = false;
            this.backward = false;
            this.left = false;
            this.right = false;
            this.canJump = true;
            this.velocity = new THREE.Vector3();
            this.prevTime = performance.now();
            this.handlers = null;
            var camera = this.camera;
            camera.rotation.set(0, 0, 0);
            camera.position.set(0, 0, 0);
            this.pitch.add(camera);
            this.yaw.add(this.pitch);
            scene.add(this.yaw);
            var domElement = this.domElement = $(d);
            var document = this._document = $(document);
            this.handlers = {
                'keydown': function (event) {
                    switch (event.originalEvent.keyCode) {
                        case 38:
                        case 87:
                            _this.forward = true;
                            break;
                        case 37:
                        case 65:
                            _this.left = true;
                            break;
                        case 40:
                        case 83:
                            _this.backward = true;
                            break;
                        case 39:
                        case 68:
                            _this.right = true;
                            break;
                        case 32:
                            if (_this.canJump === true) {
                                _this.velocity.y += 350;
                                _this.canJump = false;
                            }
                            break;
                    }
                },
                'keyup': function (event) {
                    switch (event.originalEvent.keyCode) {
                        case 38:
                        case 87:
                            _this.forward = false;
                            break;
                        case 37:
                        case 65:
                            _this.left = false;
                            break;
                        case 40:
                        case 83:
                            _this.backward = false;
                            break;
                        case 39:
                        case 68:
                            _this.right = false;
                            break;
                    }
                },
                'mousemove': function (event) {
                    if (!_this._enabled) {
                        return;
                    }
                    var evt = event.originalEvent;
                    var yaw = _this.yaw;
                    var pitch = _this.pitch;
                    var deltaX = evt.movementX || evt.mozMovementX || evt.webkitMovementX || 0;
                    var deltaY = evt.movementY || evt.mozMovementX || evt.webkitMovementX || 0;
                    yaw.rotation.y -= deltaX * 0.002;
                    pitch.rotation.x -= deltaY * 0.002;
                    pitch.rotation.x = Math.max(-Kube3d.HalfPI, Math.min(Kube3d.HalfPI, pitch.rotation.x));
                }
            };
            _.forIn(this.handlers, function (handler, evt) { return document[evt](handler); });
        }
        Player.prototype.enable = function (enabled) {
            this._enabled = enabled;
        };
        Player.prototype.lookAt = function (box) {
            this._lookAt = box;
        };
        Player.prototype.destroy = function () {
            var _this = this;
            this.scene.remove(this.yaw);
            this.yaw.dispose();
            this.pitch.dispose();
            _.forIn(this.handlers, function (handler, evt) { return _this._document.off(evt, handler); });
        };
        Player.prototype.render = function () {
            if (this.lookAt) {
                var angle = Date.now() * 0.0001;
                this.camera.focus(this._lookAt, angle);
            }
        };
        return Player;
    })();
    Kube3d.Player = Player;
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
    var World = (function () {
        function World(scene) {
            this.scene = scene;
            this.ambient = new THREE.AmbientLight(0xffffff);
            this.light = new THREE.DirectionalLight(0x888888);
            this.ambient.color.setHSL(0.1, 0.3, 0.2);
            this.light.position.set(1, 1, 0);
            scene.add(this.ambient);
            scene.add(this.light);
            var materialArray = [];
            for (var i = 0; i < 6; i++)
                materialArray.push(new THREE.MeshBasicMaterial({
                    map: THREE.ImageUtils.loadTexture('img/space-seamless.png'),
                    side: THREE.BackSide
                }));
            var skyMaterial = new THREE.MeshFaceMaterial(materialArray);
            scene.add(new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), skyMaterial));
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
        }
        World.prototype.render = function () {
        };
        World.prototype.destroy = function () {
        };
        return World;
    })();
    Kube3d.World = World;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    Kube3d.ViewController = Kube3d.controller('ViewController', ['$scope', 'KubernetesModel', 'KubernetesState', function ($scope, model, state) {
        var debugScene = false;
        var renderer = undefined;
        var scene = undefined;
        var camera = undefined;
        var sceneGeometry = new THREE.Object3D();
        var sceneBounds = new THREE.BoundingBoxHelper(sceneGeometry, 0xff0000);
        var hostObjects = {};
        var updating = false;
        var hasMouse = false;
        var player = null;
        var world = null;
        $scope.config = {
            initialize: function (r, s, c, d) {
                Kube3d.log.debug("init called");
                renderer = r;
                scene = s;
                camera = c;
                player = new Kube3d.Player(scene, camera, d);
                world = new Kube3d.World(scene);
                scene.add(sceneGeometry);
                if (debugScene) {
                    scene.add(sceneBounds);
                    var axis = new THREE.AxisHelper(1000);
                    scene.add(axis);
                }
                sceneGeometry.rotation.x = 90;
                sceneGeometry.rotation.z = 90;
                sceneGeometry.position.x = 0;
                sceneGeometry.position.y = 0;
                sceneGeometry.position.z = 0;
                buildScene();
            },
            render: function (renderer, scene, camera) {
                world.render();
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
                player.lookAt(sceneBounds.box);
                player.render();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLnRzIiwia3ViZTNkL3RzL2t1YmUzZEludGVyZmFjZXMudHMiLCJrdWJlM2QvdHMva3ViZTNkSGVscGVycy50cyIsImt1YmUzZC90cy9rdWJlM2RQbHVnaW4udHMiLCJrdWJlM2QvdHMvb2JqZWN0cy50cyIsImt1YmUzZC90cy9wbGF5ZXIudHMiLCJrdWJlM2QvdHMvdGhyZWVKU0RpcmVjdGl2ZS50cyIsImt1YmUzZC90cy93b3JsZC50cyIsImt1YmUzZC90cy92aWV3LnRzIl0sIm5hbWVzIjpbIkt1YmUzZCIsIkt1YmUzZC5yZ2JUb0hleCIsIkt1YmUzZC5yYW5kb21HcmV5IiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZSIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UuY29uc3RydWN0b3IiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlc3Ryb3kiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlYnVnIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5tb3ZlIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5yb3RhdGUiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmdldFBvc2l0aW9uIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5zZXRQb3NpdGlvbiIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2Uuc2V0Um90YXRpb24iLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLnJlbmRlciIsIkt1YmUzZC5Qb2RPYmplY3QiLCJLdWJlM2QuUG9kT2JqZWN0LmNvbnN0cnVjdG9yIiwiS3ViZTNkLlBvZE9iamVjdC51cGRhdGUiLCJLdWJlM2QuUG9kT2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuUG9kT2JqZWN0LmRpc3RhbmNlIiwiS3ViZTNkLlBvZE9iamVjdC5hbmdsZU9mVmVsb2NpdHkiLCJLdWJlM2QuUG9kT2JqZWN0LnJlbmRlciIsIkt1YmUzZC5Ib3N0T2JqZWN0IiwiS3ViZTNkLkhvc3RPYmplY3QuY29uc3RydWN0b3IiLCJLdWJlM2QuSG9zdE9iamVjdC51cGRhdGUiLCJLdWJlM2QuSG9zdE9iamVjdC5kZWJ1ZyIsIkt1YmUzZC5Ib3N0T2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW1vdmVQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5hZGRQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5oYXNQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW5kZXIiLCJLdWJlM2QuUGxheWVyIiwiS3ViZTNkLlBsYXllci5jb25zdHJ1Y3RvciIsIkt1YmUzZC5QbGF5ZXIuZW5hYmxlIiwiS3ViZTNkLlBsYXllci5sb29rQXQiLCJLdWJlM2QuUGxheWVyLmRlc3Ryb3kiLCJLdWJlM2QuUGxheWVyLnJlbmRlciIsIkt1YmUzZC53ZWJnbEF2YWlsYWJsZSIsIkt1YmUzZC5zdG9wIiwiS3ViZTNkLmNsZWFudXAiLCJLdWJlM2QuV29ybGQiLCJLdWJlM2QuV29ybGQuY29uc3RydWN0b3IiLCJLdWJlM2QuV29ybGQucmVuZGVyIiwiS3ViZTNkLldvcmxkLmRlc3Ryb3kiLCJLdWJlM2QuYnVpbGRTY2VuZSJdLCJtYXBwaW5ncyI6IkFBa0JzQjs7QUNqQnRCLElBQU8sTUFBTSxDQVlaO0FBWkQsV0FBTyxNQUFNLEVBQUMsQ0FBQztJQVdaQSxDQUFDQTtBQUNKQSxDQUFDQSxFQVpNLE1BQU0sS0FBTixNQUFNLFFBWVo7O0FDVkQsSUFBTyxNQUFNLENBaUJaO0FBakJELFdBQU8sTUFBTSxFQUFDLENBQUM7SUFDRkEsaUJBQVVBLEdBQUdBLFFBQVFBLENBQUNBO0lBQ3RCQSxVQUFHQSxHQUFrQkEsTUFBTUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsaUJBQVVBLENBQUNBLENBQUNBO0lBQzVDQSxtQkFBWUEsR0FBR0EscUJBQXFCQSxDQUFDQTtJQUVyQ0EsYUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFFaENBLFNBQWdCQSxRQUFRQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQTtRQUM5QkMsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FB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QUNBO1lBQ3BDQSxJQUFJQSxZQUFZQSxHQUFHQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtZQUNqREEsSUFBSUEsQ0FBQ0EsR0FBR0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLEdBQUdBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1lBQ3JCQSxJQUFJQSxPQUFPQSxHQUFHQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3QkEsSUFBSUEsT0FBT0EsR0FBR0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLE9BQU9BLEdBQUdBLENBQUNBLEdBQUdBLE9BQU9BLENBQUNBO1lBQzFCQSxJQUFJQSxPQUFPQSxHQUFHQSxDQUFDQSxHQUFHQSxPQUFPQSxDQUFDQTtZQUMxQkEsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsZUFBZUEsRUFBRUEsQ0FBQ0E7WUFDbkNBLElBQUlBLElBQUlBLEdBQUdBLE9BQU9BLEdBQUdBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQzNFQSxJQUFJQSxJQUFJQSxHQUFHQSxPQUFPQSxHQUFHQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUMzRUEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDaENBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFB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QSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3Q0EsSUFBSUEsVUFBVUEsR0FBR0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFNOUJBLElBQUlBLEdBQUdBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xEQSxHQUFHQSxDQUFDQSxXQUFXQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxREEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ3ZEQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN2REEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBRU1OLDJCQUFNQSxHQUFiQSxVQUFjQSxFQUFFQTtZQUNkTyxNQUFNQSxDQUFDQSxDQUFDQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMzQkEsQ0FBQ0E7UUFJTVAsMkJBQU1BLEdBQWJBO1lBQ0VRLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVB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QUdBLElBQUlBLENBQUNBLFNBQVNBLEdBQUdBLENBQUNBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1lBRTVDQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQTtnQkFDZEEsU0FBU0EsRUFBRUEsVUFBQ0EsS0FBU0E7b0JBQ25CQSxNQUFNQSxDQUFDQSxDQUFFQSxLQUFLQSxDQUFDQSxhQUFhQSxDQUFDQSxPQUFRQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdENBLEtBQUtBLEVBQUVBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQTs0QkFDTEEsS0FBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBQ0E7NEJBQ3BCQSxLQUFLQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUEsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBOzRCQUNMQSxLQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQTs0QkFDakJBLEtBQUtBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUE7NEJBQ0xBLEtBQUlBLENBQUNBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBOzRCQUNyQkEsS0FBS0EsQ0FBQ0E7d0JBQ1JBLEtBQUtBLEVBQUVBLENBQUNBO3dCQUNSQSxLQUFLQSxFQUFFQTs0QkFDTEEsS0FBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0E7NEJBQ2xCQSxLQUFLQSxDQUFDQTt3QkFDUkEsS0FBS0EsRUFBRUE7NEJBQ0xBLEVBQUVBLENBQUNBLENBQUNBLEtBQUlBLENBQUNBLE9BQU9BLEtBQUtBLElBQUlBLENBQUNBLENBQUNBLENBQUNBO2dDQUMxQkEsS0FBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0E7Z0NBQ3ZCQSxLQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxLQUFLQSxDQUFDQTs0QkFDdkJBLENBQUNBOzRCQUNEQSxLQUFLQSxDQUFDQTtvQkFDVkEsQ0FBQ0E7Z0JBQ0hBLENBQUNBO2dCQUNEQSxPQUFPQSxFQUFFQSxVQUFDQSxL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O3dCQUNsQ0EsVUFBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0Esc0JBQXNCQSxDQUFDQSxDQUFDQTt3QkFDbENBLE1BQU1BLENBQUNBO29CQUNUQSxDQUFDQTtvQkFDREEsVUFBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxDQUFDQTtvQkFDNUJBLEtBQUtBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBO29CQUMxQkEsTUFBTUEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxFQUFFQSxFQUFFQSxPQUFPQSxDQUFDQSxLQUFLQSxFQUFFQSxHQUFHQSxPQUFPQSxDQUFDQSxNQUFNQSxFQUFFQSxFQUFFQSxHQUFHQSxFQUFFQSxLQUFLQSxDQUFDQSxDQUFDQTtvQkFFekZBLE1BQU1BLENBQUNBLEtBQUtBLEdBQUdBLFVBQUNBLElBQVFBLEVBQUVBLEtBQUtBO3dCQUc3QkEsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQzNCQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFFaERBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLElBQUlBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBOzRCQUM1QkEsTUFBTUEsQ0FBQ0E7d0JBQ1RBLENBQUNBO3dCQUNEQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFFQSxHQUFHQSxDQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbEZBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUVBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUVBLEdBQUdBLENBQUVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUVBLENBQUNBLENBQUNBLENBQUNBO3dCQUNqRkEsSUFBSUEsS0FBS0EsR0FBR0EsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBRTVCQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdENBLElBQUlBLE1BQU1BLEdBQUdBLEdBQUdBLENBQUNBO3dCQUNqQkEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBQzVDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTt3QkFDNUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBOzRCQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ2RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO2dDQUM3QkEsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQzVCQSxDQUFDQTs0QkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FB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RUEsRUFBRUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQzVFQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxJQUFJQSxXQUFXQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDekJBLFVBQVVBLENBQUNBLFdBQVdBLENBQUNBLE9BQU9BLEVBQUVBLE9BQU9BLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO29CQUM1Q0EsT0FBT0EsR0FBR0EsT0FBT0EsR0FBR0EsR0FBR0EsQ0FBQ0E7b0JBQ3hCQSxPQUFPQSxHQUFHQSxPQUFPQSxHQUFHQSxHQUFHQSxDQUFDQTtvQkFDeEJBLFdBQVdBLENBQUNBLEVBQUVBLENBQUNBLEdBQUdBLFVBQVVBLENBQUNBO2dCQUMvQkEsQ0FBQ0E7Z0JBQ0RBLFVBQVVBLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLENBQUNBLENBQUNBO2dCQUMvQkEsVUFBVUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0E7WUFDL0JBLENBQUNBLENBQUNBLENBQUNBO1lBRUhBLFVBQUdBLENBQUNBLEtBQUtBLENBQUNBLGVBQWVBLENBQUNBLENBQUNBO1lBQzNCQSxRQUFRQSxHQUFHQSxLQUFLQSxDQUFDQTtRQUNuQkEsQ0FBQ0E7UUFDRDFDLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLHdCQUF3QkEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7SUFDbkRBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBRU5BLENBQUNBLEVBdEhNLE1BQU0sS0FBTixNQUFNLFFBc0haIiwiZmlsZSI6ImNvbXBpbGVkLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIENvcHlyaWdodCAyMDE0LTIwMTUgUmVkIEhhdCwgSW5jLiBhbmQvb3IgaXRzIGFmZmlsaWF0ZXNcbi8vLyBhbmQgb3RoZXIgY29udHJpYnV0b3JzIGFzIGluZGljYXRlZCBieSB0aGUgQGF1dGhvciB0YWdzLlxuLy8vXG4vLy8gTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbi8vLyB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4vLy8gWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4vLy9cbi8vLyAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuLy8vXG4vLy8gVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuLy8vIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbi8vLyBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbi8vLyBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4vLy8gbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9saWJzL2hhd3Rpby11dGlsaXRpZXMvZGVmcy5kLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2xpYnMvaGF3dGlvLWt1YmVybmV0ZXMvZGVmcy5kLnRzXCIvPlxuXG5kZWNsYXJlIHZhciBUSFJFRTphbnk7XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vaW5jbHVkZXMudHNcIi8+XG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgaW50ZXJmYWNlIFJlbmRlcmFibGUge1xuICAgIHJlbmRlcigpOnZvaWQ7XG4gICAgZGVzdHJveSgpOnZvaWQ7XG4gIH1cblxuICBleHBvcnQgaW50ZXJmYWNlIFNjZW5lT2JqZWN0IGV4dGVuZHMgUmVuZGVyYWJsZXtcbiAgICBnZXRQb3NpdGlvbigpOmFueTtcbiAgICBzZXRQb3NpdGlvbih4LCB5LCB6KTtcbiAgICBzZXRSb3RhdGlvbihyeCwgcnksIHJ6KTtcbiAgfTtcbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RJbnRlcmZhY2VzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcbiAgZXhwb3J0IHZhciBwbHVnaW5OYW1lID0gJ0t1YmUzZCc7XG4gIGV4cG9ydCB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldChwbHVnaW5OYW1lKTtcbiAgZXhwb3J0IHZhciB0ZW1wbGF0ZVBhdGggPSAncGx1Z2lucy9rdWJlM2QvaHRtbCc7XG5cbiAgZXhwb3J0IHZhciBIYWxmUEkgPSBNYXRoLlBJIC8gMjtcblxuICBleHBvcnQgZnVuY3Rpb24gcmdiVG9IZXgociwgZywgYikge1xuICAgIHJldHVybiBcIiNcIiArICgoMSA8PCAyNCkgKyAociA8PCAxNikgKyAoZyA8PCA4KSArIGIpLnRvU3RyaW5nKDE2KS5zbGljZSgxKTtcbiAgfVxuXG4gIGV4cG9ydCBmdW5jdGlvbiByYW5kb21HcmV5KCkge1xuICAgIHZhciByZ2JWYWwgPSBNYXRoLnJhbmRvbSgpICogMTI4ICsgMTI4O1xuICAgIHJldHVybiByZ2JUb0hleChyZ2JWYWwsIHJnYlZhbCwgcmdiVmFsKTtcbiAgfVxuXG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RIZWxwZXJzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShwbHVnaW5OYW1lLCBbXSk7XG4gIGV4cG9ydCB2YXIgY29udHJvbGxlciA9IFBsdWdpbkhlbHBlcnMuY3JlYXRlQ29udHJvbGxlckZ1bmN0aW9uKF9tb2R1bGUsIHBsdWdpbk5hbWUpO1xuXG4gIHZhciB0YWIgPSB1bmRlZmluZWQ7XG5cbiAgX21vZHVsZS5jb25maWcoWyckcm91dGVQcm92aWRlcicsIFwiSGF3dGlvTmF2QnVpbGRlclByb3ZpZGVyXCIsICgkcm91dGVQcm92aWRlcjogbmcucm91dGUuSVJvdXRlUHJvdmlkZXIsIGJ1aWxkZXI6IEhhd3Rpb01haW5OYXYuQnVpbGRlckZhY3RvcnkpID0+IHtcbiAgICB0YWIgPSBidWlsZGVyLmNyZWF0ZSgpXG4gICAgICAuaWQocGx1Z2luTmFtZSlcbiAgICAgIC50aXRsZSgoKSA9PiAnM0QgVmlldycpXG4gICAgICAuaHJlZigoKSA9PiAnL2t1YmVybmV0ZXMvM2QnKVxuICAgICAgLnBhZ2UoKCkgPT4gYnVpbGRlci5qb2luKHRlbXBsYXRlUGF0aCwgJ3ZpZXcuaHRtbCcpKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgYnVpbGRlci5jb25maWd1cmVSb3V0aW5nKCRyb3V0ZVByb3ZpZGVyLCB0YWIpO1xuXG4gIH1dKTtcblxuICBfbW9kdWxlLnJ1bihbJ0hhd3Rpb05hdicsIChuYXYpID0+IHtcbiAgICBuYXYub24oSGF3dGlvTWFpbk5hdi5BY3Rpb25zLkFERCwgcGx1Z2luTmFtZSwgKGl0ZW0pID0+IHtcbiAgICAgIGlmIChpdGVtLmlkICE9PSAna3ViZXJuZXRlcycpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCFfLmFueShpdGVtLnRhYnMsICh0YWI6YW55KSA9PiB0YWIuaWQgPT09IHBsdWdpbk5hbWUpKSB7XG4gICAgICAgIGl0ZW0udGFicy5wdXNoKHRhYik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1dKTtcblxuXG4gIGhhd3Rpb1BsdWdpbkxvYWRlci5hZGRNb2R1bGUocGx1Z2luTmFtZSk7XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RJbnRlcmZhY2VzLnRzXCIvPlxubW9kdWxlIEt1YmUzZCB7XG5cbiAgdmFyIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQoJ0t1YmUzZCcpO1xuXG4gIGV4cG9ydCBjbGFzcyBTY2VuZU9iamVjdEJhc2UgaW1wbGVtZW50cyBTY2VuZU9iamVjdCB7XG5cbiAgICBwcml2YXRlIGJvdW5kaW5nQm94OmFueSA9IG51bGw7XG5cbiAgICBjb25zdHJ1Y3RvcihwdWJsaWMgc2NlbmU6YW55LCBwdWJsaWMgZ2VvbWV0cnk6YW55KSB7XG4gICAgICB0aGlzLnNjZW5lLmFkZChnZW9tZXRyeSk7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94ID0gbmV3IFRIUkVFLkJvdW5kaW5nQm94SGVscGVyKHRoaXMuZ2VvbWV0cnksIDB4MDBmZjAwKTtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKHRoaXMuYm91bmRpbmdCb3gpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xuICAgICAgdGhpcy5zY2VuZS5yZW1vdmUodGhpcy5nZW9tZXRyeSk7XG4gICAgICB0aGlzLmdlb21ldHJ5LmRpc3Bvc2UoKTtcbiAgICAgIGRlbGV0ZSB0aGlzLmdlb21ldHJ5O1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWJ1ZyhlbmFibGUpIHtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gudmlzaWJsZSA9IGVuYWJsZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgbW92ZSh4LCB5LCB6KSB7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnggKz0geDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueSArPSB5O1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi56ICs9IHo7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnggKz0geDtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueSArPSB5O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi56ICs9IHo7XG4gICAgfVxuXG4gICAgcHVibGljIHJvdGF0ZShyeCwgcnksIHJ6KSB7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnggKz0gcng7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnkgKz0gcnk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnogKz0gcno7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnJvdGF0aW9uLnggKz0gcng7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnJvdGF0aW9uLnkgKz0gcnk7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnJvdGF0aW9uLnogKz0gcno7XG4gICAgfVxuXG4gICAgcHVibGljIGdldFBvc2l0aW9uKCkge1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC51cGRhdGUoKTtcbiAgICAgIHJldHVybiB0aGlzLmJvdW5kaW5nQm94Lm9iamVjdC5wb3NpdGlvbjtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0UG9zaXRpb24oeCwgeSwgeikge1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi54ID0geDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueSA9IHk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnogPSB6O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi54ID0geDtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueSA9IHk7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnogPSB6O1xuXG4gICAgfVxuXG4gICAgcHVibGljIHNldFJvdGF0aW9uKHJ4LCByeSwgcnopIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueCA9IHJ4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi55ID0gcnk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnogPSByejtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueCA9IHJ4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi55ID0gcnk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnogPSByejtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC51cGRhdGUoKTtcbiAgICB9XG5cbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBQb2RPYmplY3QgZXh0ZW5kcyBTY2VuZU9iamVjdEJhc2Uge1xuICAgIHByaXZhdGUgYW5nbGU6bnVtYmVyID0gdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgY2lyY2xlOmFueSA9IHVuZGVmaW5lZDtcbiAgICBwcml2YXRlIHJvdGF0aW9uID0ge1xuICAgICAgeDogTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgLyAxMDAwLFxuICAgICAgeTogTWF0aC5yYW5kb20oKSAqIE1hdGguUEkgLyAxMDAsXG4gICAgICB6OiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAvIDEwMDBcbiAgICB9O1xuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBzY2VuZTogYW55LCBwdWJsaWMgaG9zdE9iamVjdDpIb3N0T2JqZWN0LCBwdWJsaWMgaWQ6c3RyaW5nLCBwdWJsaWMgb2JqOmFueSkge1xuICAgICAgc3VwZXIoc2NlbmUsIG5ldyBUSFJFRS5PYmplY3QzRCgpKTtcbiAgICAgIHZhciB0ZXh0dXJlID0gVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZShvYmouJGljb25VcmwpO1xuICAgICAgdGV4dHVyZS5taW5GaWx0ZXIgPSBUSFJFRS5OZWFyZXN0RmlsdGVyO1xuICAgICAgdGhpcy5nZW9tZXRyeS5hZGQoXG4gICAgICAgICAgbmV3IFRIUkVFLk1lc2goXG4gICAgICAgICAgICBuZXcgVEhSRUUuQm94R2VvbWV0cnkoNTAsIDUwLCA1MCksIFxuICAgICAgICAgICAgbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHtcbiAgICAgICAgICAgICAgY29sb3I6IDB4ZmZmZmZmLCBcbiAgICAgICAgICAgICAgbWFwOiB0ZXh0dXJlLFxuICAgICAgICAgICAgICBidW1wTWFwOiB0ZXh0dXJlLFxuICAgICAgICAgICAgICBjYXN0U2hhZG93OiB0cnVlLCBcbiAgICAgICAgICAgICAgcmVjZWl2ZVNoYWRvdzogdHJ1ZSwgXG4gICAgICAgICAgICAgIHNoYWRpbmc6IFRIUkVFLlNtb290aFNoYWRpbmdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICApKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIkNyZWF0ZWQgcG9kIG9iamVjdCBcIiwgaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGUobW9kZWwsIHBvZCkge1xuICAgICAgdGhpcy5vYmogPSBwb2Q7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgICBzdXBlci5kZXN0cm95KCk7XG4gICAgICB0aGlzLmhvc3RPYmplY3QuZ2VvbWV0cnkucmVtb3ZlKHRoaXMuY2lyY2xlKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIkRlc3Ryb3llZCBwb2Qgb2JqZWN0IFwiLCB0aGlzLmlkKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGRpc3RhbmNlKCkge1xuICAgICAgdmFyIGhvc3RQb3NpdGlvbiA9IHRoaXMuaG9zdE9iamVjdC5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIG15UG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgZGlzdFggPSBNYXRoLmFicyhob3N0UG9zaXRpb24ueCAtIG15UG9zaXRpb24ueCk7XG4gICAgICB2YXIgZGlzdFkgPSBNYXRoLmFicyhob3N0UG9zaXRpb24ueSAtIG15UG9zaXRpb24ueSk7XG4gICAgICByZXR1cm4gTWF0aC5zcXJ0KGRpc3RYICogZGlzdFggKyBkaXN0WSAqIGRpc3RZKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFuZ2xlT2ZWZWxvY2l0eSgpIHtcbiAgICAgIGlmICghdGhpcy5hbmdsZSkge1xuICAgICAgICB2YXIgZGlzdCA9IHRoaXMuZGlzdGFuY2UoKTtcbiAgICAgICAgbG9nLmRlYnVnKFwicG9kIGlkOiBcIiwgdGhpcy5pZCwgXCIgZGlzdGFuY2U6IFwiLCBkaXN0KTtcbiAgICAgICAgdGhpcy5hbmdsZSA9ICgxIC8gZGlzdCkgKiAxMDtcbiAgICAgICAgbG9nLmRlYnVnKFwicG9kIGlkOiBcIiwgdGhpcy5pZCwgXCIgYW5nbGU6IFwiLCB0aGlzLmFuZ2xlKTtcbiAgICAgICAgdmFyIG1hdGVyaWFsQXJyYXkgPSBbXTtcbiAgICAgICAgdmFyIGZhY2UgPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoeyBcbiAgICAgICAgICBjb2xvcjogMHg1NTU1NTUsXG4gICAgICAgICAgY2FzdFNoYWRvdzogdHJ1ZSxcbiAgICAgICAgICByZWNlaXZlU2hhZG93OiB0cnVlLFxuICAgICAgICAgIHdpcmVmcmFtZTogdHJ1ZVxuICAgICAgICB9KTtcbiAgICAgICAgbWF0ZXJpYWxBcnJheS5wdXNoKGZhY2UuY2xvbmUoKSk7XG4gICAgICAgIG1hdGVyaWFsQXJyYXkucHVzaChmYWNlLmNsb25lKCkpO1xuICAgICAgICB0aGlzLmNpcmNsZSA9IG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5SaW5nR2VvbWV0cnkoZGlzdCAtIDEsIGRpc3QgKyAxLCAxMjgpLCBuZXcgVEhSRUUuTWVzaEZhY2VNYXRlcmlhbChtYXRlcmlhbEFycmF5KSk7XG4gICAgICAgIHRoaXMuaG9zdE9iamVjdC5nZW9tZXRyeS5hZGQodGhpcy5jaXJjbGUpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRoaXMuYW5nbGU7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIHZhciBteVBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIGhvc3RQb3NpdGlvbiA9IHRoaXMuaG9zdE9iamVjdC5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIHggPSBteVBvc2l0aW9uLng7XG4gICAgICB2YXIgeSA9IG15UG9zaXRpb24ueTtcbiAgICAgIHZhciBjZW50ZXJYID0gaG9zdFBvc2l0aW9uLng7XG4gICAgICB2YXIgY2VudGVyWSA9IGhvc3RQb3NpdGlvbi55O1xuICAgICAgdmFyIG9mZnNldFggPSB4IC0gY2VudGVyWDtcbiAgICAgIHZhciBvZmZzZXRZID0geSAtIGNlbnRlclk7XG4gICAgICB2YXIgYW5nbGUgPSB0aGlzLmFuZ2xlT2ZWZWxvY2l0eSgpO1xuICAgICAgdmFyIG5ld1ggPSBjZW50ZXJYICsgb2Zmc2V0WCAqIE1hdGguY29zKGFuZ2xlKSAtIG9mZnNldFkgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICB2YXIgbmV3WSA9IGNlbnRlclkgKyBvZmZzZXRYICogTWF0aC5zaW4oYW5nbGUpICsgb2Zmc2V0WSAqIE1hdGguY29zKGFuZ2xlKTtcbiAgICAgIHRoaXMuc2V0UG9zaXRpb24obmV3WCwgbmV3WSwgMCk7XG4gICAgICB0aGlzLnJvdGF0ZSh0aGlzLnJvdGF0aW9uLngsIHRoaXMucm90YXRpb24ueSwgdGhpcy5yb3RhdGlvbi56KTtcbiAgICAgIHN1cGVyLnJlbmRlcigpO1xuICAgIH1cbiAgfVxuXG4gIGV4cG9ydCBjbGFzcyBIb3N0T2JqZWN0IGV4dGVuZHMgU2NlbmVPYmplY3RCYXNlIHtcbiAgICBwcml2YXRlIG9mZnNldFggPSAyMDA7XG4gICAgcHJpdmF0ZSBvZmZzZXRZID0gMjAwO1xuICAgIHB1YmxpYyBwb2RzID0ge307XG4gICAgcHVibGljIHJvdGF0aW9uID0ge1xuICAgICAgeDogMCxcbiAgICAgIHk6IDAsXG4gICAgICB6OiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAvIDEwMDBcbiAgICB9XG5cbiAgICBjb25zdHJ1Y3RvcihzY2VuZTogYW55LCBwdWJsaWMgaWQ6c3RyaW5nLCBwdWJsaWMgb2JqOmFueSkge1xuICAgICAgc3VwZXIoc2NlbmUsIG5ldyBUSFJFRS5PYmplY3QzRCgpKVxuICAgICAgdmFyIHRleHR1cmUgPSBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCdpbWcvc3VuLXRleHR1cmUuanBnJyk7XG4gICAgICB0ZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gICAgICB0aGlzLmdlb21ldHJ5LmFkZCggXG4gICAgICAgICAgbmV3IFRIUkVFLlBvaW50TGlnaHQoMHhmZmQ3MDAsIDEsIDUwMDApLFxuICAgICAgICAgIG5ldyBUSFJFRS5NZXNoKFxuICAgICAgICAgICAgbmV3IFRIUkVFLlNwaGVyZUdlb21ldHJ5KDEwMCwgMzIsIDE2KSwgXG4gICAgICAgICAgICBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoe1xuICAgICAgICAgICAgICBjb2xvcjogMHhmZmQ3MDAsIFxuICAgICAgICAgICAgICBtYXA6IHRleHR1cmUsXG4gICAgICAgICAgICAgIGJ1bXBNYXA6IHRleHR1cmUsXG4gICAgICAgICAgICAgIHNwZWN1bGFyOiAweDAwZmYwMCwgXG4gICAgICAgICAgICAgIHNoYWRpbmc6IFRIUkVFLlNtb290aFNoYWRpbmdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKVxuICAgICAgICApO1xuICAgICAgbG9nLmRlYnVnKFwiQ3JlYXRlZCBob3N0IG9iamVjdCBcIiwgaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyB1cGRhdGUobW9kZWwsIGhvc3QpIHtcbiAgICAgIHRoaXMub2JqID0gaG9zdDtcbiAgICAgIHZhciBwb2RzVG9SZW1vdmUgPSBbXTtcbiAgICAgIF8uZm9ySW4odGhpcy5wb2RzLCAocG9kLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKCEoa2V5IGluIG1vZGVsLnBvZHNCeUtleSkpIHtcbiAgICAgICAgICBwb2RzVG9SZW1vdmUucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIF8uZm9yRWFjaChwb2RzVG9SZW1vdmUsIChpZCkgPT4gdGhpcy5yZW1vdmVQb2QoaWQpKTtcbiAgICAgIF8uZm9yRWFjaCh0aGlzLm9iai5wb2RzLCAocG9kOmFueSkgPT4ge1xuICAgICAgICB2YXIgbmFtZSA9IHBvZC5fa2V5O1xuICAgICAgICBpZiAoIXRoaXMuaGFzUG9kKG5hbWUpKSB7XG4gICAgICAgICAgdGhpcy5hZGRQb2QobmFtZSwgcG9kKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgcG9kT2JqID0gdGhpcy5wb2RzW25hbWVdO1xuICAgICAgICAgIHBvZE9iai51cGRhdGUobW9kZWwsIHBvZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWJ1ZyhlbmFibGUpIHtcbiAgICAgIHZhciBpZHMgPSBfLmtleXModGhpcy5wb2RzKVxuICAgICAgXy5mb3JFYWNoKGlkcywgKGlkKSA9PiB0aGlzLnBvZHNbaWRdLmRlYnVnKGVuYWJsZSkpO1xuICAgICAgc3VwZXIuZGVidWcoZW5hYmxlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIGlmICh0aGlzLnBvZHMpIHtcbiAgICAgICAgdmFyIHBvZElkcyA9IF8ua2V5cyh0aGlzLnBvZHMpO1xuICAgICAgICBfLmZvckVhY2gocG9kSWRzLCAoaWQpID0+IHRoaXMucmVtb3ZlUG9kKGlkKSk7XG4gICAgICB9XG4gICAgICBzdXBlci5kZXN0cm95KCk7XG4gICAgICBsb2cuZGVidWcoXCJEZXN0cm95aW5nIGhvc3Qgb2JqZWN0IFwiLCB0aGlzLmlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVtb3ZlUG9kKGlkKSB7XG4gICAgICB2YXIgcG9kID0gdGhpcy5wb2RzW2lkXTtcbiAgICAgIGlmIChwb2QpIHtcbiAgICAgICAgcG9kLmRlc3Ryb3koKTtcbiAgICAgICAgZGVsZXRlIHRoaXMucG9kc1tpZF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFkZFBvZChrZXksIHA6YW55KSB7XG4gICAgICBpZiAodGhpcy5oYXNQb2Qoa2V5KSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgbXlQb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciBwb2RPZmZzZXRYID0gdGhpcy5vZmZzZXRYIC0gbXlQb3NpdGlvbi54O1xuICAgICAgdmFyIHBvZE9mZnNldFkgPSBteVBvc2l0aW9uLnk7XG4gICAgICAvKlxuICAgICAgdmFyIGFuZ2xlID0gTWF0aC5yYW5kb20oKSAqIDM2MDtcbiAgICAgIHZhciBwb2RYID0gbXlQb3NpdGlvbi54ICsgcG9kT2Zmc2V0WCAqIE1hdGguY29zKGFuZ2xlKSAtIHBvZE9mZnNldFkgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICB2YXIgcG9kWSA9IG15UG9zaXRpb24ueSArIHBvZE9mZnNldFggKiBNYXRoLnNpbihhbmdsZSkgLSBwb2RPZmZzZXRZICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgKi9cbiAgICAgIHZhciBwb2QgPSBuZXcgUG9kT2JqZWN0KHRoaXMuc2NlbmUsIHRoaXMsIGtleSwgcCk7XG4gICAgICBwb2Quc2V0UG9zaXRpb24obXlQb3NpdGlvbi54LCBteVBvc2l0aW9uLnksIG15UG9zaXRpb24ueik7XG4gICAgICBwb2QubW92ZSh0aGlzLm9mZnNldFgsIDAsIDApO1xuICAgICAgdGhpcy5vZmZzZXRYID0gdGhpcy5vZmZzZXRYICsgTWF0aC5yYW5kb20oKSAqIDUwICsgMTAwO1xuICAgICAgdGhpcy5vZmZzZXRZID0gdGhpcy5vZmZzZXRZICsgTWF0aC5yYW5kb20oKSAqIDUwICsgMTAwO1xuICAgICAgdGhpcy5wb2RzW2tleV0gPSBwb2Q7XG4gICAgfVxuXG4gICAgcHVibGljIGhhc1BvZChpZCkge1xuICAgICAgcmV0dXJuIChpZCBpbiB0aGlzLnBvZHMpO1xuICAgIH1cblxuICAgIHByaXZhdGUgc3RlcCA9IDA7XG4gICAgXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIHRoaXMucm90YXRlKHRoaXMucm90YXRpb24ueCwgdGhpcy5yb3RhdGlvbi55LCB0aGlzLnJvdGF0aW9uLnopO1xuICAgICAgXy5mb3JJbih0aGlzLnBvZHMsIChwb2RPYmplY3QsIGlkKSA9PiB7XG4gICAgICAgIHBvZE9iamVjdC5yZW5kZXIoKTtcbiAgICAgIH0pO1xuICAgICAgdGhpcy5zdGVwID0gdGhpcy5zdGVwICsgMTtcbiAgICAgIHN1cGVyLnJlbmRlcigpO1xuICAgIH1cblxuXG4gIH1cblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZEhlbHBlcnMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCBjbGFzcyBQbGF5ZXIgaW1wbGVtZW50cyBSZW5kZXJhYmxlIHtcbiAgICBwcml2YXRlIGxvZzpMb2dnaW5nLkxvZ2dlciA9IExvZ2dlci5nZXQoJ2t1YmUzZC1wbGF5ZXInKTtcbiAgICBwcml2YXRlIGRvbUVsZW1lbnQ6YW55ID0gbnVsbDtcbiAgICBwcml2YXRlIF9sb29rQXQ6YW55ID0gbnVsbDtcbiAgICBwcml2YXRlIHBpdGNoID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgcHJpdmF0ZSB5YXcgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcblxuICAgIHByaXZhdGUgX2VuYWJsZWQgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9kb2N1bWVudCA9IHVuZGVmaW5lZDtcblxuICAgIC8vIG1vdmVtZW50IGJvb2xlYW5zXG4gICAgcHJpdmF0ZSBmb3J3YXJkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBiYWNrd2FyZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgbGVmdCA9IGZhbHNlO1xuICAgIHByaXZhdGUgcmlnaHQgPSBmYWxzZTtcbiAgICBwcml2YXRlIGNhbkp1bXAgPSB0cnVlO1xuXG4gICAgLy8gbW92ZW1lbnQgdmVsb2NpdHlcbiAgICBwcml2YXRlIHZlbG9jaXR5ID0gbmV3IFRIUkVFLlZlY3RvcjMoKTtcbiAgICBwcml2YXRlIHByZXZUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XG5cbiAgICBwcml2YXRlIGhhbmRsZXJzOmFueSA9IG51bGw7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBzY2VuZSwgcHJpdmF0ZSBjYW1lcmEsIHByaXZhdGUgZCkge1xuICAgICAgdmFyIGNhbWVyYSA9IHRoaXMuY2FtZXJhO1xuICAgICAgY2FtZXJhLnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICB0aGlzLnBpdGNoLmFkZChjYW1lcmEpO1xuICAgICAgdGhpcy55YXcuYWRkKHRoaXMucGl0Y2gpO1xuICAgICAgc2NlbmUuYWRkKHRoaXMueWF3KTtcblxuICAgICAgdmFyIGRvbUVsZW1lbnQgPSB0aGlzLmRvbUVsZW1lbnQgPSAkKGQpO1xuICAgICAgdmFyIGRvY3VtZW50ID0gdGhpcy5fZG9jdW1lbnQgPSAkKGRvY3VtZW50KTtcblxuICAgICAgdGhpcy5oYW5kbGVycyA9IHtcbiAgICAgICAgJ2tleWRvd24nOiAoZXZlbnQ6YW55KSA9PiB7XG4gICAgICAgICAgc3dpdGNoICggZXZlbnQub3JpZ2luYWxFdmVudC5rZXlDb2RlICkge1xuICAgICAgICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgICAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgICAgICAgdGhpcy5mb3J3YXJkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICAgICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgICAgICAgIHRoaXMubGVmdCA9IHRydWU7IFxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgICAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgICAgICAgdGhpcy5iYWNrd2FyZCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgICAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgICAgICAgdGhpcy5yaWdodCA9IHRydWU7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzMjogLy8gc3BhY2VcbiAgICAgICAgICAgICAgaWYgKHRoaXMuY2FuSnVtcCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMudmVsb2NpdHkueSArPSAzNTA7XG4gICAgICAgICAgICAgICAgdGhpcy5jYW5KdW1wID0gZmFsc2U7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICAna2V5dXAnOiAoZXZlbnQ6YW55KSA9PiB7XG4gICAgICAgICAgc3dpdGNoICggZXZlbnQub3JpZ2luYWxFdmVudC5rZXlDb2RlICkge1xuICAgICAgICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgICAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgICAgICAgdGhpcy5mb3J3YXJkID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICAgICAgICB0aGlzLmxlZnQgPSBmYWxzZTsgXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgICAgICAgY2FzZSA4MzogLy8gc1xuICAgICAgICAgICAgICB0aGlzLmJhY2t3YXJkID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgICAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgICAgICAgdGhpcy5yaWdodCA9IGZhbHNlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgICdtb3VzZW1vdmUnOiAoZXZlbnQ6YW55KSA9PiB7XG4gICAgICAgICAgaWYgKCF0aGlzLl9lbmFibGVkKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBldnQgPSBldmVudC5vcmlnaW5hbEV2ZW50O1xuICAgICAgICAgIHZhciB5YXcgPSB0aGlzLnlhdztcbiAgICAgICAgICB2YXIgcGl0Y2ggPSB0aGlzLnBpdGNoO1xuICAgICAgICAgIHZhciBkZWx0YVggPSBldnQubW92ZW1lbnRYIHx8IGV2dC5tb3pNb3ZlbWVudFggfHwgZXZ0LndlYmtpdE1vdmVtZW50WCB8fCAwO1xuICAgICAgICAgIHZhciBkZWx0YVkgPSBldnQubW92ZW1lbnRZIHx8IGV2dC5tb3pNb3ZlbWVudFggfHwgZXZ0LndlYmtpdE1vdmVtZW50WCB8fCAwO1xuICAgICAgICAgIHlhdy5yb3RhdGlvbi55IC09IGRlbHRhWCAqIDAuMDAyO1xuICAgICAgICAgIHBpdGNoLnJvdGF0aW9uLnggLT0gZGVsdGFZICogMC4wMDI7XG4gICAgICAgICAgcGl0Y2gucm90YXRpb24ueCA9IE1hdGgubWF4KCAtIEhhbGZQSSwgTWF0aC5taW4oSGFsZlBJLCBwaXRjaC5yb3RhdGlvbi54KSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgICBfLmZvckluKHRoaXMuaGFuZGxlcnMsIChoYW5kbGVyLCBldnQpID0+IGRvY3VtZW50W2V2dF0oaGFuZGxlcikpO1xuICAgIH1cblxuICAgIHB1YmxpYyBlbmFibGUoZW5hYmxlZCkge1xuICAgICAgdGhpcy5fZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGxvb2tBdChib3gpIHtcbiAgICAgIHRoaXMuX2xvb2tBdCA9IGJveDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIHRoaXMuc2NlbmUucmVtb3ZlKHRoaXMueWF3KTtcbiAgICAgIHRoaXMueWF3LmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMucGl0Y2guZGlzcG9zZSgpO1xuICAgICAgXy5mb3JJbih0aGlzLmhhbmRsZXJzLCAoaGFuZGxlciwgZXZ0KSA9PiB0aGlzLl9kb2N1bWVudC5vZmYoZXZ0LCBoYW5kbGVyKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIGlmICh0aGlzLmxvb2tBdCkge1xuICAgICAgICB2YXIgYW5nbGUgPSBEYXRlLm5vdygpICogMC4wMDAxO1xuICAgICAgICB0aGlzLmNhbWVyYS5mb2N1cyh0aGlzLl9sb29rQXQsIGFuZ2xlKTtcbiAgICAgIH1cblxuICAgIH1cblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIHZhciBkaXJlY3RpdmVOYW1lID0gJ3RocmVlanMnO1xuXG4gIGZ1bmN0aW9uIHdlYmdsQXZhaWxhYmxlKCkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgY2FudmFzID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCggJ2NhbnZhcycgKTtcbiAgICAgIHJldHVybiAhISggKDxhbnk+d2luZG93KS5XZWJHTFJlbmRlcmluZ0NvbnRleHQgJiYgKFxuICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoICd3ZWJnbCcgKSB8fFxuICAgICAgICAgICAgY2FudmFzLmdldENvbnRleHQoICdleHBlcmltZW50YWwtd2ViZ2wnICkgKVxuICAgICAgICAgICk7XG4gICAgfSBjYXRjaCAoIGUgKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoZGlyZWN0aXZlTmFtZSwgWygpID0+IHtcbiAgICBUSFJFRS5JbWFnZVV0aWxzLmNyb3NzT3JpZ2luID0gJyc7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgY29uZmlnOiAnPT8nICsgZGlyZWN0aXZlTmFtZVxuICAgICAgfSxcbiAgICAgIGxpbms6IChzY29wZSwgZWxlbWVudCwgYXR0cnMpID0+IHtcblxuICAgICAgICB2YXIgc2NlbmU6YW55ID0gbnVsbDtcbiAgICAgICAgdmFyIGNhbWVyYTphbnkgPSBudWxsO1xuICAgICAgICB2YXIgcmVuZGVyZXI6YW55ID0gbnVsbDtcbiAgICAgICAgdmFyIGtlZXBSZW5kZXJpbmcgPSB0cnVlO1xuICAgICAgICB2YXIgcmVzaXplSGFuZGxlOmFueSA9IG51bGw7XG5cbiAgICAgICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICBrZWVwUmVuZGVyaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIHJlc2l6ZUZ1bmMpO1xuICAgICAgICAgIGRlbGV0ZSByZW5kZXJlcjtcbiAgICAgICAgICBkZWxldGUgY2FtZXJhO1xuICAgICAgICAgIGRlbGV0ZSBzY2VuZTtcbiAgICAgICAgICBlbGVtZW50LmVtcHR5KCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzaXplRnVuYyA9ICgpID0+IHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcInJlc2l6aW5nXCIpO1xuICAgICAgICAgICAgZWxlbWVudC5maW5kKCdjYW52YXMnKS53aWR0aChlbGVtZW50LndpZHRoKCkpLmhlaWdodChlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgICAgIGNhbWVyYS5hc3BlY3QgPSBlbGVtZW50LndpZHRoKCkgLyBlbGVtZW50LmhlaWdodCgpO1xuICAgICAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoZWxlbWVudC53aWR0aCgpLCBlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQub24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICBsb2cuZGVidWcoXCJzY2VuZSBkZXN0cm95ZWRcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNjb3BlLiR3YXRjaCgnY29uZmlnJywgKGNvbmZpZykgPT4ge1xuICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICBpZiAoIWNvbmZpZyB8fCAhY29uZmlnLmluaXRpYWxpemUpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIm5vIGNvbmZpZywgcmV0dXJuaW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsb2cuZGVidWcoXCJjcmVhdGluZyBzY2VuZVwiKTtcbiAgICAgICAgICBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgICAgICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg2MCwgZWxlbWVudC53aWR0aCgpIC8gZWxlbWVudC5oZWlnaHQoKSwgMC4xLCAyMDAwMCk7XG5cbiAgICAgICAgICBjYW1lcmEuZm9jdXMgPSAoYm94MzphbnksIGFuZ2xlKSA9PiB7XG4gICAgICAgICAgICAvLyBhZGp1c3QgdGhlIGNhbWVyYSBwb3NpdGlvbiB0byBrZWVwIGV2ZXJ5dGhpbmcgaW4gdmlldywgd2UnbGwgZG9cbiAgICAgICAgICAgIC8vIGdyYWR1YWwgYWRqdXN0bWVudHMgdGhvdWdoXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gYm94My5zaXplKCkueTtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGJveDMuc2l6ZSgpLnggLyAoY2FtZXJhLmFzcGVjdCAvIDIpO1xuICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJ3aWR0aDpcIiwgd2lkdGgsIFwiIGhlaWdodDpcIiwgaGVpZ2h0KTtcbiAgICAgICAgICAgIGlmICh3aWR0aCA8IDAgfHwgaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZGlzdFkgPSBNYXRoLnJvdW5kKGhlaWdodCAqIE1hdGgudGFuKCAoY2FtZXJhLmZvdiAvIDIgKSAqICggTWF0aC5QSSAvIDE4MCApKSk7XG4gICAgICAgICAgICB2YXIgZGlzdFggPSBNYXRoLnJvdW5kKHdpZHRoICogTWF0aC50YW4oIChjYW1lcmEuZm92IC8gMiApICogKCBNYXRoLlBJIC8gMTgwICkpKTtcbiAgICAgICAgICAgIHZhciBkaXN0WiA9IChkaXN0WSArIGRpc3RYKTtcbiAgICAgICAgICAgIC8vIGxvZy5kZWJ1ZyhcImRpc3RZOlwiLCBkaXN0WSwgXCIgZGlzdFg6XCIsIGRpc3RYLCBcImRpc3RaOlwiLCBkaXN0Wik7XG4gICAgICAgICAgICB2YXIgeiA9IE1hdGgucm91bmQoY2FtZXJhLnBvc2l0aW9uLnopO1xuICAgICAgICAgICAgdmFyIHBlcmlvZCA9IDUuMDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi54ID0gZGlzdFggKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueSA9IGRpc3RZICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICAgICAgaWYgKHogIT09IGRpc3RaKSB7XG4gICAgICAgICAgICAgIGlmICh6ID4gZGlzdFopIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9ICh6IC0gZGlzdFopIC8gcGVyaW9kO1xuICAgICAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi56ID0geiAtIHY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHogPCBkaXN0Wikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKGRpc3RaIC0geikgLyBwZXJpb2Q7XG4gICAgICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnogPSB6ICsgdjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FtZXJhLmxvb2tBdChib3gzLmNlbnRlcigpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKCB3ZWJnbEF2YWlsYWJsZSgpICkge1xuICAgICAgICAgICAgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5DYW52YXNSZW5kZXJlcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZW5kZXJlci5zZXRQaXhlbFJhdGlvKCB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyApO1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoZWxlbWVudC53aWR0aCgpLCBlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgICB2YXIgZG9tRWxlbWVudCA9IHJlbmRlcmVyLmRvbUVsZW1lbnQ7XG4gICAgICAgICAgZWxlbWVudC5hcHBlbmQoZG9tRWxlbWVudCk7XG5cbiAgICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHJlc2l6ZUZ1bmMpO1xuICAgICAgICAgIGNvbmZpZy5pbml0aWFsaXplKHJlbmRlcmVyLCBzY2VuZSwgY2FtZXJhLCBkb21FbGVtZW50KTtcblxuICAgICAgICAgIHZhciByZW5kZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWtlZXBSZW5kZXJpbmcpIHtcbiAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICAgICAgICAgIGlmIChjb25maWcucmVuZGVyKSB7XG4gICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXIocmVuZGVyZXIsIHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBrZWVwUmVuZGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgICByZW5kZXIoKTtcblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSk7XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RIZWxwZXJzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgY2xhc3MgV29ybGQgaW1wbGVtZW50cyBSZW5kZXJhYmxlIHtcbiAgICBwcml2YXRlIGFtYmllbnQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KCAweGZmZmZmZiApO1xuICAgIHByaXZhdGUgbGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCggMHg4ODg4ODggKTtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHNjZW5lKSB7XG4gICAgICB0aGlzLmFtYmllbnQuY29sb3Iuc2V0SFNMKCAwLjEsIDAuMywgMC4yICk7XG4gICAgICB0aGlzLmxpZ2h0LnBvc2l0aW9uLnNldCggMSwgMSwgMCk7XG4gICAgICBzY2VuZS5hZGQodGhpcy5hbWJpZW50KTtcbiAgICAgIHNjZW5lLmFkZCh0aGlzLmxpZ2h0KTtcblxuICAgICAgLy8gc2t5Ym94XG4gICAgICB2YXIgbWF0ZXJpYWxBcnJheSA9IFtdO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA2OyBpKyspXG4gICAgICAgIG1hdGVyaWFsQXJyYXkucHVzaChuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgIG1hcDogVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSgnaW1nL3NwYWNlLXNlYW1sZXNzLnBuZycpLFxuICAgICAgICAgIHNpZGU6IFRIUkVFLkJhY2tTaWRlXG4gICAgICAgIH0pKTtcbiAgICAgIHZhciBza3lNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoRmFjZU1hdGVyaWFsKG1hdGVyaWFsQXJyYXkpO1xuICAgICAgc2NlbmUuYWRkKG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSgxMDAwMCwgMTAwMDAsIDEwMDAwKSwgc2t5TWF0ZXJpYWwpKTtcblxuICAgICAgLy8gcGFydGljbGUgY2xvdWRcbiAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDAwMDsgaSsrKSB7XG4gICAgICAgIHZhciB2ZXJ0ZXggPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgICAgICB2ZXJ0ZXgueCA9IFRIUkVFLk1hdGgucmFuZEZsb2F0U3ByZWFkKCAxMDAwMCApO1xuICAgICAgICB2ZXJ0ZXgueSA9IFRIUkVFLk1hdGgucmFuZEZsb2F0U3ByZWFkKCAxMDAwMCApO1xuICAgICAgICB2ZXJ0ZXgueiA9IFRIUkVFLk1hdGgucmFuZEZsb2F0U3ByZWFkKCAxMDAwMCApO1xuICAgICAgICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKHZlcnRleCk7XG4gICAgICB9XG4gICAgICB2YXIgcGFydGljbGVzID0gbmV3IFRIUkVFLlBvaW50Q2xvdWQoIGdlb21ldHJ5LCBuZXcgVEhSRUUuUG9pbnRDbG91ZE1hdGVyaWFsKHtjb2xvcjogMHg4ODg4ODgsIGZvZzogdHJ1ZX0pKTtcbiAgICAgIHNjZW5lLmFkZChwYXJ0aWNsZXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcblxuICAgIH1cblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwicGxheWVyLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIndvcmxkLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdHMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCB2YXIgVmlld0NvbnRyb2xsZXIgPSBjb250cm9sbGVyKCdWaWV3Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJ0t1YmVybmV0ZXNNb2RlbCcsICdLdWJlcm5ldGVzU3RhdGUnLCAoJHNjb3BlLCBtb2RlbDpLdWJlcm5ldGVzLkt1YmVybmV0ZXNNb2RlbFNlcnZpY2UsIHN0YXRlKSA9PiB7XG5cbiAgICB2YXIgZGVidWdTY2VuZSA9IGZhbHNlO1xuXG4gICAgdmFyIHJlbmRlcmVyOmFueSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgc2NlbmU6YW55ID0gdW5kZWZpbmVkO1xuICAgIHZhciBjYW1lcmE6YW55ID0gdW5kZWZpbmVkO1xuXG4gICAgdmFyIHNjZW5lR2VvbWV0cnkgPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICB2YXIgc2NlbmVCb3VuZHMgPSBuZXcgVEhSRUUuQm91bmRpbmdCb3hIZWxwZXIoc2NlbmVHZW9tZXRyeSwgMHhmZjAwMDApO1xuXG4gICAgdmFyIGhvc3RPYmplY3RzID0ge307XG5cbiAgICB2YXIgdXBkYXRpbmcgPSBmYWxzZTtcbiAgICB2YXIgaGFzTW91c2UgPSBmYWxzZTtcblxuICAgIHZhciBwbGF5ZXI6UGxheWVyID0gbnVsbDtcbiAgICB2YXIgd29ybGQ6V29ybGQgPSBudWxsO1xuXG4gICAgJHNjb3BlLmNvbmZpZyA9IHtcbiAgICAgIGluaXRpYWxpemU6IChyLCBzLCBjLCBkKSA9PiB7XG4gICAgICAgIGxvZy5kZWJ1ZyhcImluaXQgY2FsbGVkXCIpO1xuICAgICAgICByZW5kZXJlciA9IHI7XG4gICAgICAgIHNjZW5lID0gcztcbiAgICAgICAgY2FtZXJhID0gYztcblxuICAgICAgICBwbGF5ZXIgPSBuZXcgUGxheWVyKHNjZW5lLCBjYW1lcmEsIGQpO1xuICAgICAgICB3b3JsZCA9IG5ldyBXb3JsZChzY2VuZSk7XG5cbiAgICAgICAgc2NlbmUuYWRkKHNjZW5lR2VvbWV0cnkpO1xuXG4gICAgICAgIGlmIChkZWJ1Z1NjZW5lKSB7XG4gICAgICAgICAgLy8gZGVidWcgc3R1ZmZcbiAgICAgICAgICAvLyBwdXRzIGEgYm91bmRpbmcgYm94IGFyb3VuZCB0aGUgc2NlbmUgd2Ugd2FudCB0byB2aWV3XG4gICAgICAgICAgc2NlbmUuYWRkKHNjZW5lQm91bmRzKTtcblxuICAgICAgICAgIC8vIGFkZHMgbGluZXMgZm9yIHRoZSB4L3kveiBheGlzXG4gICAgICAgICAgLy8gVGhlIFggYXhpcyBpcyByZWQuIFRoZSBZIGF4aXMgaXMgZ3JlZW4uIFRoZSBaIGF4aXMgaXMgYmx1ZVxuICAgICAgICAgIHZhciBheGlzID0gbmV3IFRIUkVFLkF4aXNIZWxwZXIoMTAwMCk7XG4gICAgICAgICAgc2NlbmUuYWRkKGF4aXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi54ID0gOTA7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueiA9IDkwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnggPSAwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnkgPSAwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnogPSAwO1xuICAgICAgICBidWlsZFNjZW5lKCk7XG4gICAgICB9LFxuICAgICAgcmVuZGVyOiAocmVuZGVyZXIsIHNjZW5lLCBjYW1lcmEpID0+IHtcbiAgICAgICAgd29ybGQucmVuZGVyKCk7XG4gICAgICAgIC8vIE5PVEUgLSB0aGlzIGZ1bmN0aW9uIHJ1bnMgYXQgfiA2MGZwcyFcbiAgICAgICAgaWYgKHVwZGF0aW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciBhbmdsZSA9IERhdGUubm93KCkgKiAwLjAwMDE7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueCA9IDEwMDAgKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgIHNjZW5lR2VvbWV0cnkucG9zaXRpb24ueiA9IDEwMDAgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgIC8vIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueCArPSAwLjAwMTtcbiAgICAgICAgLy8gc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi55ICs9IDAuMDAxO1xuICAgICAgICAvLyBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnogKz0gMC4wMDE7XG4gICAgICAgIF8uZm9ySW4oaG9zdE9iamVjdHMsIChob3N0T2JqZWN0LCBrZXkpID0+IHtcbiAgICAgICAgICBob3N0T2JqZWN0LnJlbmRlcigpO1xuICAgICAgICB9KTtcbiAgICAgICAgc2NlbmVCb3VuZHMudXBkYXRlKCk7XG4gICAgICAgIHBsYXllci5sb29rQXQoc2NlbmVCb3VuZHMuYm94KTtcbiAgICAgICAgcGxheWVyLnJlbmRlcigpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGJ1aWxkU2NlbmUoKSB7XG4gICAgICBpZiAoIXNjZW5lKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHVwZGF0aW5nID0gdHJ1ZTtcbiAgICAgIHZhciBvcmlnaW5YID0gMDtcbiAgICAgIHZhciBvcmlnaW5ZID0gMDtcblxuICAgICAgdmFyIGhvc3RzVG9SZW1vdmUgPSBbXTtcblxuICAgICAgXy5mb3JJbihob3N0T2JqZWN0cywgKGhvc3RPYmplY3QsIGtleSkgPT4ge1xuICAgICAgICBpZiAoXy5hbnkobW9kZWwuaG9zdHMsIChob3N0KSA9PiBob3N0LmVsZW1lbnRJZCA9PT0ga2V5KSkge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcIktlZXBpbmcgaG9zdDogXCIsIGtleSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaG9zdHNUb1JlbW92ZS5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBfLmZvckVhY2goaG9zdHNUb1JlbW92ZSwgKGtleSkgPT4ge1xuICAgICAgICB2YXIgaG9zdE9iamVjdCA9IGhvc3RPYmplY3RzW2tleV07XG4gICAgICAgIGlmIChob3N0T2JqZWN0KSB7XG4gICAgICAgICAgaG9zdE9iamVjdC5kZXN0cm95KCk7XG4gICAgICAgICAgZGVsZXRlIGhvc3RPYmplY3RzW2tleV07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBfLmZvckVhY2gobW9kZWwuaG9zdHMsIChob3N0KSA9PiB7XG4gICAgICAgIHZhciBpZCA9IGhvc3QuZWxlbWVudElkO1xuICAgICAgICBsb2cuZGVidWcoXCJob3N0OiBcIiwgaG9zdCk7XG4gICAgICAgIHZhciBob3N0T2JqZWN0ID0gaG9zdE9iamVjdHNbaWRdIHx8IG5ldyBIb3N0T2JqZWN0KHNjZW5lR2VvbWV0cnksIGlkLCBob3N0KTtcbiAgICAgICAgaWYgKCEoaWQgaW4gaG9zdE9iamVjdHMpKSB7XG4gICAgICAgICAgaG9zdE9iamVjdC5zZXRQb3NpdGlvbihvcmlnaW5YLCBvcmlnaW5ZLCAwKTtcbiAgICAgICAgICBvcmlnaW5YID0gb3JpZ2luWCArIDUwMDtcbiAgICAgICAgICBvcmlnaW5ZID0gb3JpZ2luWSArIDUwMDtcbiAgICAgICAgICBob3N0T2JqZWN0c1tpZF0gPSBob3N0T2JqZWN0O1xuICAgICAgICB9XG4gICAgICAgIGhvc3RPYmplY3QudXBkYXRlKG1vZGVsLCBob3N0KTtcbiAgICAgICAgaG9zdE9iamVjdC5kZWJ1ZyhkZWJ1Z1NjZW5lKTtcbiAgICAgIH0pO1xuXG4gICAgICBsb2cuZGVidWcoXCJtb2RlbCB1cGRhdGVkXCIpO1xuICAgICAgdXBkYXRpbmcgPSBmYWxzZTtcbiAgICB9XG4gICAgJHNjb3BlLiRvbigna3ViZXJuZXRlc01vZGVsVXBkYXRlZCcsIGJ1aWxkU2NlbmUpO1xuICB9XSk7XG5cbn1cbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
angular.module("hawtio-kube3d-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/kube3d/html/view.html","<div class=\"kube3d-viewport\" ng-controller=\"Kube3d.ViewController\">\n  <div class=\"kube3d-control\" threejs=\"config\"></div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-kube3d-templates");