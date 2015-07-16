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
    Kube3d.havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;
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
    function webglAvailable() {
        try {
            var canvas = document.createElement('canvas');
            return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
        }
        catch (e) {
            return false;
        }
    }
    Kube3d.webglAvailable = webglAvailable;
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

var Kube3d;
(function (Kube3d) {
    Kube3d._module.directive('requestLock', ['$document', function ($document) {
        return {
            restrict: 'A',
            scope: {
                'onLock': '&requestLock'
            },
            link: function (scope, element, attr) {
                var el = element[0] || element;
                if (Kube3d.havePointerLock) {
                    Kube3d.log.debug("here!");
                    var doc = $document[0];
                    var body = doc.body;
                    var pointerlockchange = function (event) {
                        if (doc.pointerLockElement === body || doc.mozPointerLockElement === body || doc.webkitPointerLockElement === body) {
                            el.style.display = 'none';
                            scope.onLock({ lock: true });
                        }
                        else {
                            el.style.display = '';
                            scope.onLock({ lock: false });
                        }
                        Core.$apply(scope);
                    };
                    var pointerlockerror = function (event) {
                        el.style.display = '';
                    };
                    doc.addEventListener('pointerlockchange', pointerlockchange, false);
                    doc.addEventListener('mozpointerlockchange', pointerlockchange, false);
                    doc.addEventListener('webkitpointerlockchange', pointerlockchange, false);
                    doc.addEventListener('pointerlockerror', pointerlockerror, false);
                    doc.addEventListener('mozpointerlockerror', pointerlockerror, false);
                    doc.addEventListener('webkitpointerlockerror', pointerlockerror, false);
                    el.addEventListener('click', function (event) {
                        el.style.display = 'none';
                        body.requestPointerLock = body.requestPointerLock || body.mozRequestPointerLock || body.webkitRequestPointerLock;
                        body.requestPointerLock();
                    });
                }
                else {
                    el.style.display = 'none';
                }
            }
        };
    }]);
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
            camera.rotation.set(0, 0, 0);
            camera.position.set(0, 0, 0);
            this.pitch.add(camera);
            this.yaw.add(this.pitch);
            scene.add(this.yaw);
            var domElement = this.domElement = $(d);
            if (!Kube3d.havePointerLock) {
                this.enabled = true;
            }
            var self = this;
            self.handlers = {
                'keydown': function (event) {
                    switch (event.originalEvent.keyCode) {
                        case 38:
                        case 87:
                            self.forward = true;
                            break;
                        case 37:
                        case 65:
                            self.left = true;
                            break;
                        case 40:
                        case 83:
                            self.backward = true;
                            break;
                        case 39:
                        case 68:
                            self.right = true;
                            break;
                        case 32:
                            if (self.canJump === true) {
                                self.velocity.y += 350;
                                self.canJump = false;
                            }
                            break;
                    }
                },
                'keyup': function (event) {
                    switch (event.originalEvent.keyCode) {
                        case 38:
                        case 87:
                            self.forward = false;
                            break;
                        case 37:
                        case 65:
                            self.left = false;
                            break;
                        case 40:
                        case 83:
                            self.backward = false;
                            break;
                        case 39:
                        case 68:
                            self.right = false;
                            break;
                    }
                },
                'mousemove': function (event) {
                    if (!self._enabled || !Kube3d.havePointerLock) {
                        return;
                    }
                    var yaw = self.yaw;
                    var pitch = self.pitch;
                    var deltaX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
                    var deltaY = event.movementY || event.mozMovementX || event.webkitMovementX || 0;
                    yaw.rotation.y -= deltaX * 0.002;
                    pitch.rotation.x -= deltaY * 0.002;
                    pitch.rotation.x = Math.max(-Kube3d.HalfPI, Math.min(Kube3d.HalfPI, pitch.rotation.x));
                }
            };
            _.forIn(this.handlers, function (handler, evt) { return document.addEventListener(evt, handler, false); });
        }
        Object.defineProperty(Player.prototype, "enabled", {
            get: function () {
                return this._enabled;
            },
            set: function (enabled) {
                this._enabled = enabled;
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype.lookAt = function (box) {
            this._lookAt = box;
        };
        Player.prototype.destroy = function () {
            this.scene.remove(this.yaw);
            this.yaw.dispose();
            this.pitch.dispose();
            _.forIn(this.handlers, function (handler, evt) { return document.removeEventListener(evt, handler); });
        };
        Player.prototype.render = function () {
            if (!this.enabled || !Kube3d.havePointerLock) {
                if (this.lookAt) {
                    var angle = Date.now() * 0.0001;
                    this.camera.focus(this._lookAt, angle);
                }
                return;
            }
        };
        return Player;
    })();
    Kube3d.Player = Player;
})(Kube3d || (Kube3d = {}));

var Kube3d;
(function (Kube3d) {
    var directiveName = 'threejs';
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
                    if (Kube3d.webglAvailable()) {
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
    Kube3d.ViewController = Kube3d.controller('ViewController', ['$scope', 'KubernetesModel', 'KubernetesState', '$element', function ($scope, model, state, $element) {
        var debugScene = false;
        var renderer = undefined;
        var scene = undefined;
        var camera = undefined;
        var domElement = undefined;
        var sceneGeometry = new THREE.Object3D();
        var sceneBounds = new THREE.BoundingBoxHelper(sceneGeometry, 0xff0000);
        var hostObjects = {};
        var updating = false;
        var hasMouse = false;
        var player = null;
        var world = null;
        $scope.onLock = function (lock) {
            if (!player) {
                return;
            }
            player.enabled = lock;
        };
        $scope.config = {
            initialize: function (r, s, c, d) {
                Kube3d.log.debug("init called");
                renderer = r;
                scene = s;
                camera = c;
                domElement = d;
                $scope.player = player = new Kube3d.Player(scene, camera, d);
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
                if (updating) {
                    return;
                }
                world.render();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLnRzIiwia3ViZTNkL3RzL2t1YmUzZEludGVyZmFjZXMudHMiLCJrdWJlM2QvdHMva3ViZTNkSGVscGVycy50cyIsImt1YmUzZC90cy9rdWJlM2RQbHVnaW4udHMiLCJrdWJlM2QvdHMvbG9ja1JlcXVlc3QudHMiLCJrdWJlM2QvdHMvb2JqZWN0cy50cyIsImt1YmUzZC90cy9wbGF5ZXIudHMiLCJrdWJlM2QvdHMvdGhyZWVKU0RpcmVjdGl2ZS50cyIsImt1YmUzZC90cy93b3JsZC50cyIsImt1YmUzZC90cy92aWV3LnRzIl0sIm5hbWVzIjpbIkt1YmUzZCIsIkt1YmUzZC5yZ2JUb0hleCIsIkt1YmUzZC5yYW5kb21HcmV5IiwiS3ViZTNkLndlYmdsQXZhaWxhYmxlIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZSIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UuY29uc3RydWN0b3IiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlc3Ryb3kiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlYnVnIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5tb3ZlIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5yb3RhdGUiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmdldFBvc2l0aW9uIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5zZXRQb3NpdGlvbiIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2Uuc2V0Um90YXRpb24iLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLnJlbmRlciIsIkt1YmUzZC5Qb2RPYmplY3QiLCJLdWJlM2QuUG9kT2JqZWN0LmNvbnN0cnVjdG9yIiwiS3ViZTNkLlBvZE9iamVjdC51cGRhdGUiLCJLdWJlM2QuUG9kT2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuUG9kT2JqZWN0LmRpc3RhbmNlIiwiS3ViZTNkLlBvZE9iamVjdC5hbmdsZU9mVmVsb2NpdHkiLCJLdWJlM2QuUG9kT2JqZWN0LnJlbmRlciIsIkt1YmUzZC5Ib3N0T2JqZWN0IiwiS3ViZTNkLkhvc3RPYmplY3QuY29uc3RydWN0b3IiLCJLdWJlM2QuSG9zdE9iamVjdC51cGRhdGUiLCJLdWJlM2QuSG9zdE9iamVjdC5kZWJ1ZyIsIkt1YmUzZC5Ib3N0T2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW1vdmVQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5hZGRQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5oYXNQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW5kZXIiLCJLdWJlM2QuUGxheWVyIiwiS3ViZTNkLlBsYXllci5jb25zdHJ1Y3RvciIsIkt1YmUzZC5QbGF5ZXIuZW5hYmxlZCIsIkt1YmUzZC5QbGF5ZXIubG9va0F0IiwiS3ViZTNkLlBsYXllci5kZXN0cm95IiwiS3ViZTNkLlBsYXllci5yZW5kZXIiLCJLdWJlM2Quc3RvcCIsIkt1YmUzZC5jbGVhbnVwIiwiS3ViZTNkLldvcmxkIiwiS3ViZTNkLldvcmxkLmNvbnN0cnVjdG9yIiwiS3ViZTNkLldvcmxkLnJlbmRlciIsIkt1YmUzZC5Xb3JsZC5kZXN0cm95IiwiS3ViZTNkLmJ1aWxkU2NlbmUiXSwibWFwcGluZ3MiOiJBQWtCc0I7O0FDakJ0QixJQUFPLE1BQU0sQ0FZWjtBQVpELFdBQU8sTUFBTSxFQUFDLENBQUM7SUFXWkEsQ0FBQ0E7QUFDSkEsQ0FBQ0EsRUFaTSxNQUFNLEtBQU4sTUFBTSxRQVlaOztBQ1ZELElBQU8sTUFBTSxDQWdDWjtBQWhDRCxXQUFPLE1BQU0sRUFBQyxDQUFDO0lBQ0ZBLGlCQUFVQSxHQUFHQSxRQUFRQSxDQUFDQTtJQUN0QkEsVUFBR0EsR0FBa0JBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLGlCQUFVQSxDQUFDQSxDQUFDQTtJQUM1Q0EsbUJBQVlBLEdBQUdBLHFCQUFxQkEsQ0FBQ0E7SUFDckNBLHNCQUFlQSxHQUFHQSxvQkFBb0JBLElBQUlBLFFBQVFBLElBQUlBLHVCQUF1QkEsSUFBSUEsUUFBUUEsSUFBSUEsMEJBQTBCQSxJQUFJQSxRQUFRQSxDQUFDQTtJQUdwSUEsYUFBTUEs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QSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtRQUNwQ0EsQ0FBQ0E7UUFFTUwscUNBQVdBLEdBQWxCQTtZQUNFTSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUFDQTtZQUMxQkEsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7UUFDMUNBLENBQUNBO1FBRU1OLHFDQUFXQSxHQUFsQkEsVUFBbUJBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBO1lBQ3hCTyxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUM3QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzdCQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDaENBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1FBRWxDQSxDQUFDQTtRQUVNUCxxQ0FBV0EsR0FBbEJBLFVBQW1CQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQTtZQUMzQlEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOUJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzlCQSxJQUFJQSxDQUFDQSxR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QSxHQUFHQSxJQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtZQUNwQ0EsSUFBSUEsVUFBVUEsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0NBLElBQUlBLFVBQVVBLEdBQUdBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1lBTTlCQSxJQUFJQSxHQUFHQSxHQUFHQSxJQUFJQSxTQUFTQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxFQUFFQSxJQUFJQSxFQUFFQSxHQUFHQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNsREEsR0FBR0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDMURBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQzdCQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN2REEsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDdkRBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBO1FBQ3ZCQSxDQUFDQTtRQUVNTiwyQkFBTUEsR0FBYkEsVUFBY0EsRUFBRUE7WUFDZE8sTUFBTUEsQ0FBQ0EsQ0FBQ0EsRUFBRUEsSUFBSUEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7UUFDM0JBLENBQUNBO1FBSU1QLDJCQUFNQSxHQUFiQTtZQUNFUSxJQUFJQSxDQUFD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Q0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7b0JBQzFCQSxNQUFNQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxpQkFBaUJBLENBQUNBLEVBQUVBLEVBQUVBLE9BQU9BLENBQUNBLEtBQUtBLEVBQUVBLEdBQUdBLE9BQU9BLENBQUNBLE1BQU1BLEVBQUVBLEVBQUVBLEdBQUdBLEVBQUVBLEtBQUtBLENBQUNBLENBQUNBO29CQUV6RkEsTUFBTUEsQ0FBQ0EsS0FBS0EsR0FBR0EsVUFBQ0EsSUFBUUEsRUFBRUEsS0FBS0E7d0JBRzdCQSxJQUFJQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDM0JBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBO3dCQUVoREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsR0FBR0EsQ0FBQ0EsSUFBSUEsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQzVCQSxNQUFNQSxDQUFDQTt3QkFDVEEsQ0FBQ0E7d0JBQ0RBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUVBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUVBLEdBQUdBLENBQUVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUVBLENBQUNBLENBQUNBLENBQUNBO3dCQUNsRkEsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBRUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBRUEsR0FBR0EsQ0FBRUEsSUFBSUEsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0EsQ0FBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQ2pGQSxJQUFJQSxLQUFLQSxHQUFHQSxDQUFDQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQTt3QkFFNUJBLElBQUlBLENBQUNBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO3dCQUN0Q0EsSUFBSUEsTUFBTUEsR0FBR0EsR0FBR0EsQ0FBQ0E7d0JBQ2pCQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTt3QkFDNUNBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO3dCQUM1Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsS0FBS0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7NEJBQ2hCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDZEEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsR0FBR0EsTUFBTUEsQ0FBQ0E7Z0NBQzdCQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTs0QkFDNUJBLENBQUNBOzRCQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtnQ0FDZEEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsTUFBTUEsQ0FBQ0E7Z0NBQzdCQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTs0QkFDNUJB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NSBSZWQgSGF0LCBJbmMuIGFuZC9vciBpdHMgYWZmaWxpYXRlc1xuLy8vIGFuZCBvdGhlciBjb250cmlidXRvcnMgYXMgaW5kaWNhdGVkIGJ5IHRoZSBAYXV0aG9yIHRhZ3MuXG4vLy9cbi8vLyBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuLy8vIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbi8vLyBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbi8vL1xuLy8vICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4vLy9cbi8vLyBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4vLy8gZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuLy8vIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuLy8vIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbi8vLyBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cblxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2xpYnMvaGF3dGlvLXV0aWxpdGllcy9kZWZzLmQudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbGlicy9oYXd0aW8ta3ViZXJuZXRlcy9kZWZzLmQudHNcIi8+XG5cbmRlY2xhcmUgdmFyIFRIUkVFOmFueTtcbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi8uLi9pbmNsdWRlcy50c1wiLz5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyYWJsZSB7XG4gICAgcmVuZGVyKCk6dm9pZDtcbiAgICBkZXN0cm95KCk6dm9pZDtcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgU2NlbmVPYmplY3QgZXh0ZW5kcyBSZW5kZXJhYmxle1xuICAgIGdldFBvc2l0aW9uKCk6YW55O1xuICAgIHNldFBvc2l0aW9uKHgsIHksIHopO1xuICAgIHNldFJvdGF0aW9uKHJ4LCByeSwgcnopO1xuICB9O1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZEludGVyZmFjZXMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSAnS3ViZTNkJztcbiAgZXhwb3J0IHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KHBsdWdpbk5hbWUpO1xuICBleHBvcnQgdmFyIHRlbXBsYXRlUGF0aCA9ICdwbHVnaW5zL2t1YmUzZC9odG1sJztcbiAgZXhwb3J0IHZhciBoYXZlUG9pbnRlckxvY2sgPSAncG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCB8fCAnbW96UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCB8fCAnd2Via2l0UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudDtcblxuXG4gIGV4cG9ydCB2YXIgSGFsZlBJID0gTWF0aC5QSSAvIDI7XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHJnYlRvSGV4KHIsIGcsIGIpIHtcbiAgICByZXR1cm4gXCIjXCIgKyAoKDEgPDwgMjQpICsgKHIgPDwgMTYpICsgKGcgPDwgOCkgKyBiKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gcmFuZG9tR3JleSgpIHtcbiAgICB2YXIgcmdiVmFsID0gTWF0aC5yYW5kb20oKSAqIDEyOCArIDEyODtcbiAgICByZXR1cm4gcmdiVG9IZXgocmdiVmFsLCByZ2JWYWwsIHJnYlZhbCk7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gd2ViZ2xBdmFpbGFibGUoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuICAgICAgcmV0dXJuICEhKCAoPGFueT53aW5kb3cpLldlYkdMUmVuZGVyaW5nQ29udGV4dCAmJiAoXG4gICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCggJ3dlYmdsJyApIHx8XG4gICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCggJ2V4cGVyaW1lbnRhbC13ZWJnbCcgKSApXG4gICAgICAgICAgKTtcbiAgICB9IGNhdGNoICggZSApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuXG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RIZWxwZXJzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShwbHVnaW5OYW1lLCBbXSk7XG4gIGV4cG9ydCB2YXIgY29udHJvbGxlciA9IFBsdWdpbkhlbHBlcnMuY3JlYXRlQ29udHJvbGxlckZ1bmN0aW9uKF9tb2R1bGUsIHBsdWdpbk5hbWUpO1xuXG4gIHZhciB0YWIgPSB1bmRlZmluZWQ7XG5cbiAgX21vZHVsZS5jb25maWcoWyckcm91dGVQcm92aWRlcicsIFwiSGF3dGlvTmF2QnVpbGRlclByb3ZpZGVyXCIsICgkcm91dGVQcm92aWRlcjogbmcucm91dGUuSVJvdXRlUHJvdmlkZXIsIGJ1aWxkZXI6IEhhd3Rpb01haW5OYXYuQnVpbGRlckZhY3RvcnkpID0+IHtcbiAgICB0YWIgPSBidWlsZGVyLmNyZWF0ZSgpXG4gICAgICAuaWQocGx1Z2luTmFtZSlcbiAgICAgIC50aXRsZSgoKSA9PiAnM0QgVmlldycpXG4gICAgICAuaHJlZigoKSA9PiAnL2t1YmVybmV0ZXMvM2QnKVxuICAgICAgLnBhZ2UoKCkgPT4gYnVpbGRlci5qb2luKHRlbXBsYXRlUGF0aCwgJ3ZpZXcuaHRtbCcpKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgYnVpbGRlci5jb25maWd1cmVSb3V0aW5nKCRyb3V0ZVByb3ZpZGVyLCB0YWIpO1xuXG4gIH1dKTtcblxuICBfbW9kdWxlLnJ1bihbJ0hhd3Rpb05hdicsIChuYXYpID0+IHtcbiAgICBuYXYub24oSGF3dGlvTWFpbk5hdi5BY3Rpb25zLkFERCwgcGx1Z2luTmFtZSwgKGl0ZW0pID0+IHtcbiAgICAgIGlmIChpdGVtLmlkICE9PSAna3ViZXJuZXRlcycpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCFfLmFueShpdGVtLnRhYnMsICh0YWI6YW55KSA9PiB0YWIuaWQgPT09IHBsdWdpbk5hbWUpKSB7XG4gICAgICAgIGl0ZW0udGFicy5wdXNoKHRhYik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1dKTtcblxuXG4gIGhhd3Rpb1BsdWdpbkxvYWRlci5hZGRNb2R1bGUocGx1Z2luTmFtZSk7XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIF9tb2R1bGUuZGlyZWN0aXZlKCdyZXF1ZXN0TG9jaycsIFsnJGRvY3VtZW50JywgKCRkb2N1bWVudCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgJ29uTG9jayc6ICcmcmVxdWVzdExvY2snXG4gICAgICB9LFxuICAgICAgbGluazogKHNjb3BlLCBlbGVtZW50LCBhdHRyKSA9PiB7XG4gICAgICAgIHZhciBlbCA9IGVsZW1lbnRbMF0gfHwgZWxlbWVudDtcbiAgICAgICAgaWYgKGhhdmVQb2ludGVyTG9jaykge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcImhlcmUhXCIpO1xuICAgICAgICAgIHZhciBkb2MgPSAkZG9jdW1lbnRbMF07XG4gICAgICAgICAgdmFyIGJvZHkgPSBkb2MuYm9keTtcblxuICAgICAgICAgIHZhciBwb2ludGVybG9ja2NoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKCBkb2MucG9pbnRlckxvY2tFbGVtZW50ID09PSBib2R5IHx8IFxuICAgICAgICAgICAgICAgICBkb2MubW96UG9pbnRlckxvY2tFbGVtZW50ID09PSBib2R5IHx8IFxuICAgICAgICAgICAgICAgICBkb2Mud2Via2l0UG9pbnRlckxvY2tFbGVtZW50ID09PSBib2R5ICkge1xuICAgICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICBzY29wZS5vbkxvY2soeyBsb2NrOiB0cnVlIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgICBzY29wZS5vbkxvY2soeyBsb2NrOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENvcmUuJGFwcGx5KHNjb3BlKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdmFyIHBvaW50ZXJsb2NrZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoICdwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSApO1xuICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCAnbW96cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UgKTtcbiAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lciggJ3dlYmtpdHBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlICk7XG5cbiAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSApO1xuICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCAnbW96cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlICk7XG4gICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoICd3ZWJraXRwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UgKTtcblxuICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgYm9keS5yZXF1ZXN0UG9pbnRlckxvY2sgPSBib2R5LnJlcXVlc3RQb2ludGVyTG9jayB8fCBib2R5Lm1velJlcXVlc3RQb2ludGVyTG9jayB8fCBib2R5LndlYmtpdFJlcXVlc3RQb2ludGVyTG9jaztcbiAgICAgICAgICAgIGJvZHkucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZEludGVyZmFjZXMudHNcIi8+XG5tb2R1bGUgS3ViZTNkIHtcblxuICB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldCgnS3ViZTNkJyk7XG5cbiAgZXhwb3J0IGNsYXNzIFNjZW5lT2JqZWN0QmFzZSBpbXBsZW1lbnRzIFNjZW5lT2JqZWN0IHtcblxuICAgIHByaXZhdGUgYm91bmRpbmdCb3g6YW55ID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBzY2VuZTphbnksIHB1YmxpYyBnZW9tZXRyeTphbnkpIHtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGdlb21ldHJ5KTtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3ggPSBuZXcgVEhSRUUuQm91bmRpbmdCb3hIZWxwZXIodGhpcy5nZW9tZXRyeSwgMHgwMGZmMDApO1xuICAgICAgdGhpcy5zY2VuZS5hZGQodGhpcy5ib3VuZGluZ0JveCk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgICB0aGlzLnNjZW5lLnJlbW92ZSh0aGlzLmdlb21ldHJ5KTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICAgICAgZGVsZXRlIHRoaXMuZ2VvbWV0cnk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlYnVnKGVuYWJsZSkge1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC52aXNpYmxlID0gZW5hYmxlO1xuICAgIH1cblxuICAgIHB1YmxpYyBtb3ZlKHgsIHksIHopIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueCArPSB4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi55ICs9IHk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnogKz0gejtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueCArPSB4O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi55ICs9IHk7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnogKz0gejtcbiAgICB9XG5cbiAgICBwdWJsaWMgcm90YXRlKHJ4LCByeSwgcnopIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueCArPSByeDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueSArPSByeTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueiArPSByejtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucm90YXRpb24ueCArPSByeDtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucm90YXRpb24ueSArPSByeTtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucm90YXRpb24ueiArPSByejtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UG9zaXRpb24oKSB7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnVwZGF0ZSgpO1xuICAgICAgcmV0dXJuIHRoaXMuYm91bmRpbmdCb3gub2JqZWN0LnBvc2l0aW9uO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQb3NpdGlvbih4LCB5LCB6KSB7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnggPSB4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi55ID0geTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueiA9IHo7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnggPSB4O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi55ID0geTtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueiA9IHo7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Um90YXRpb24ocngsIHJ5LCByeikge1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi54ID0gcng7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnkgPSByeTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueiA9IHJ6O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi54ID0gcng7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnkgPSByeTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueiA9IHJ6O1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnVwZGF0ZSgpO1xuICAgIH1cblxuICB9XG5cbiAgZXhwb3J0IGNsYXNzIFBvZE9iamVjdCBleHRlbmRzIFNjZW5lT2JqZWN0QmFzZSB7XG4gICAgcHJpdmF0ZSBhbmdsZTpudW1iZXIgPSB1bmRlZmluZWQ7XG4gICAgcHJpdmF0ZSBjaXJjbGU6YW55ID0gdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgcm90YXRpb24gPSB7XG4gICAgICB4OiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAvIDEwMDAsXG4gICAgICB5OiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAvIDEwMCxcbiAgICAgIHo6IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJIC8gMTAwMFxuICAgIH07XG4gICAgY29uc3RydWN0b3IocHVibGljIHNjZW5lOiBhbnksIHB1YmxpYyBob3N0T2JqZWN0Okhvc3RPYmplY3QsIHB1YmxpYyBpZDpzdHJpbmcsIHB1YmxpYyBvYmo6YW55KSB7XG4gICAgICBzdXBlcihzY2VuZSwgbmV3IFRIUkVFLk9iamVjdDNEKCkpO1xuICAgICAgdmFyIHRleHR1cmUgPSBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKG9iai4kaWNvblVybCk7XG4gICAgICB0ZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gICAgICB0aGlzLmdlb21ldHJ5LmFkZChcbiAgICAgICAgICBuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgICAgIG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSg1MCwgNTAsIDUwKSwgXG4gICAgICAgICAgICBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoe1xuICAgICAgICAgICAgICBjb2xvcjogMHhmZmZmZmYsIFxuICAgICAgICAgICAgICBtYXA6IHRleHR1cmUsXG4gICAgICAgICAgICAgIGJ1bXBNYXA6IHRleHR1cmUsXG4gICAgICAgICAgICAgIGNhc3RTaGFkb3c6IHRydWUsIFxuICAgICAgICAgICAgICByZWNlaXZlU2hhZG93OiB0cnVlLCBcbiAgICAgICAgICAgICAgc2hhZGluZzogVEhSRUUuU21vb3RoU2hhZGluZ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICkpO1xuICAgICAgbG9nLmRlYnVnKFwiQ3JlYXRlZCBwb2Qgb2JqZWN0IFwiLCBpZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZShtb2RlbCwgcG9kKSB7XG4gICAgICB0aGlzLm9iaiA9IHBvZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuaG9zdE9iamVjdC5nZW9tZXRyeS5yZW1vdmUodGhpcy5jaXJjbGUpO1xuICAgICAgbG9nLmRlYnVnKFwiRGVzdHJveWVkIHBvZCBvYmplY3QgXCIsIHRoaXMuaWQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZGlzdGFuY2UoKSB7XG4gICAgICB2YXIgaG9zdFBvc2l0aW9uID0gdGhpcy5ob3N0T2JqZWN0LmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgbXlQb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciBkaXN0WCA9IE1hdGguYWJzKGhvc3RQb3NpdGlvbi54IC0gbXlQb3NpdGlvbi54KTtcbiAgICAgIHZhciBkaXN0WSA9IE1hdGguYWJzKGhvc3RQb3NpdGlvbi55IC0gbXlQb3NpdGlvbi55KTtcbiAgICAgIHJldHVybiBNYXRoLnNxcnQoZGlzdFggKiBkaXN0WCArIGRpc3RZICogZGlzdFkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYW5nbGVPZlZlbG9jaXR5KCkge1xuICAgICAgaWYgKCF0aGlzLmFuZ2xlKSB7XG4gICAgICAgIHZhciBkaXN0ID0gdGhpcy5kaXN0YW5jZSgpO1xuICAgICAgICBsb2cuZGVidWcoXCJwb2QgaWQ6IFwiLCB0aGlzLmlkLCBcIiBkaXN0YW5jZTogXCIsIGRpc3QpO1xuICAgICAgICB0aGlzLmFuZ2xlID0gKDEgLyBkaXN0KSAqIDEwO1xuICAgICAgICBsb2cuZGVidWcoXCJwb2QgaWQ6IFwiLCB0aGlzLmlkLCBcIiBhbmdsZTogXCIsIHRoaXMuYW5nbGUpO1xuICAgICAgICB2YXIgbWF0ZXJpYWxBcnJheSA9IFtdO1xuICAgICAgICB2YXIgZmFjZSA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7IFxuICAgICAgICAgIGNvbG9yOiAweDU1NTU1NSxcbiAgICAgICAgICBjYXN0U2hhZG93OiB0cnVlLFxuICAgICAgICAgIHJlY2VpdmVTaGFkb3c6IHRydWUsXG4gICAgICAgICAgd2lyZWZyYW1lOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRlcmlhbEFycmF5LnB1c2goZmFjZS5jbG9uZSgpKTtcbiAgICAgICAgbWF0ZXJpYWxBcnJheS5wdXNoKGZhY2UuY2xvbmUoKSk7XG4gICAgICAgIHRoaXMuY2lyY2xlID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLlJpbmdHZW9tZXRyeShkaXN0IC0gMSwgZGlzdCArIDEsIDEyOCksIG5ldyBUSFJFRS5NZXNoRmFjZU1hdGVyaWFsKG1hdGVyaWFsQXJyYXkpKTtcbiAgICAgICAgdGhpcy5ob3N0T2JqZWN0Lmdlb21ldHJ5LmFkZCh0aGlzLmNpcmNsZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5hbmdsZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgdmFyIG15UG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgaG9zdFBvc2l0aW9uID0gdGhpcy5ob3N0T2JqZWN0LmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgeCA9IG15UG9zaXRpb24ueDtcbiAgICAgIHZhciB5ID0gbXlQb3NpdGlvbi55O1xuICAgICAgdmFyIGNlbnRlclggPSBob3N0UG9zaXRpb24ueDtcbiAgICAgIHZhciBjZW50ZXJZID0gaG9zdFBvc2l0aW9uLnk7XG4gICAgICB2YXIgb2Zmc2V0WCA9IHggLSBjZW50ZXJYO1xuICAgICAgdmFyIG9mZnNldFkgPSB5IC0gY2VudGVyWTtcbiAgICAgIHZhciBhbmdsZSA9IHRoaXMuYW5nbGVPZlZlbG9jaXR5KCk7XG4gICAgICB2YXIgbmV3WCA9IGNlbnRlclggKyBvZmZzZXRYICogTWF0aC5jb3MoYW5nbGUpIC0gb2Zmc2V0WSAqIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgIHZhciBuZXdZID0gY2VudGVyWSArIG9mZnNldFggKiBNYXRoLnNpbihhbmdsZSkgKyBvZmZzZXRZICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgdGhpcy5zZXRQb3NpdGlvbihuZXdYLCBuZXdZLCAwKTtcbiAgICAgIHRoaXMucm90YXRlKHRoaXMucm90YXRpb24ueCwgdGhpcy5yb3RhdGlvbi55LCB0aGlzLnJvdGF0aW9uLnopO1xuICAgICAgc3VwZXIucmVuZGVyKCk7XG4gICAgfVxuICB9XG5cbiAgZXhwb3J0IGNsYXNzIEhvc3RPYmplY3QgZXh0ZW5kcyBTY2VuZU9iamVjdEJhc2Uge1xuICAgIHByaXZhdGUgb2Zmc2V0WCA9IDIwMDtcbiAgICBwcml2YXRlIG9mZnNldFkgPSAyMDA7XG4gICAgcHVibGljIHBvZHMgPSB7fTtcbiAgICBwdWJsaWMgcm90YXRpb24gPSB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICAgIHo6IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJIC8gMTAwMFxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHNjZW5lOiBhbnksIHB1YmxpYyBpZDpzdHJpbmcsIHB1YmxpYyBvYmo6YW55KSB7XG4gICAgICBzdXBlcihzY2VuZSwgbmV3IFRIUkVFLk9iamVjdDNEKCkpXG4gICAgICB2YXIgdGV4dHVyZSA9IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoJ2ltZy9zdW4tdGV4dHVyZS5qcGcnKTtcbiAgICAgIHRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcbiAgICAgIHRoaXMuZ2VvbWV0cnkuYWRkKCBcbiAgICAgICAgICBuZXcgVEhSRUUuUG9pbnRMaWdodCgweGZmZDcwMCwgMSwgNTAwMCksXG4gICAgICAgICAgbmV3IFRIUkVFLk1lc2goXG4gICAgICAgICAgICBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoMTAwLCAzMiwgMTYpLCBcbiAgICAgICAgICAgIG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7XG4gICAgICAgICAgICAgIGNvbG9yOiAweGZmZDcwMCwgXG4gICAgICAgICAgICAgIG1hcDogdGV4dHVyZSxcbiAgICAgICAgICAgICAgYnVtcE1hcDogdGV4dHVyZSxcbiAgICAgICAgICAgICAgc3BlY3VsYXI6IDB4MDBmZjAwLCBcbiAgICAgICAgICAgICAgc2hhZGluZzogVEhSRUUuU21vb3RoU2hhZGluZ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICBsb2cuZGVidWcoXCJDcmVhdGVkIGhvc3Qgb2JqZWN0IFwiLCBpZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZShtb2RlbCwgaG9zdCkge1xuICAgICAgdGhpcy5vYmogPSBob3N0O1xuICAgICAgdmFyIHBvZHNUb1JlbW92ZSA9IFtdO1xuICAgICAgXy5mb3JJbih0aGlzLnBvZHMsIChwb2QsIGtleSkgPT4ge1xuICAgICAgICBpZiAoIShrZXkgaW4gbW9kZWwucG9kc0J5S2V5KSkge1xuICAgICAgICAgIHBvZHNUb1JlbW92ZS5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXy5mb3JFYWNoKHBvZHNUb1JlbW92ZSwgKGlkKSA9PiB0aGlzLnJlbW92ZVBvZChpZCkpO1xuICAgICAgXy5mb3JFYWNoKHRoaXMub2JqLnBvZHMsIChwb2Q6YW55KSA9PiB7XG4gICAgICAgIHZhciBuYW1lID0gcG9kLl9rZXk7XG4gICAgICAgIGlmICghdGhpcy5oYXNQb2QobmFtZSkpIHtcbiAgICAgICAgICB0aGlzLmFkZFBvZChuYW1lLCBwb2QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBwb2RPYmogPSB0aGlzLnBvZHNbbmFtZV07XG4gICAgICAgICAgcG9kT2JqLnVwZGF0ZShtb2RlbCwgcG9kKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlYnVnKGVuYWJsZSkge1xuICAgICAgdmFyIGlkcyA9IF8ua2V5cyh0aGlzLnBvZHMpXG4gICAgICBfLmZvckVhY2goaWRzLCAoaWQpID0+IHRoaXMucG9kc1tpZF0uZGVidWcoZW5hYmxlKSk7XG4gICAgICBzdXBlci5kZWJ1ZyhlbmFibGUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xuICAgICAgaWYgKHRoaXMucG9kcykge1xuICAgICAgICB2YXIgcG9kSWRzID0gXy5rZXlzKHRoaXMucG9kcyk7XG4gICAgICAgIF8uZm9yRWFjaChwb2RJZHMsIChpZCkgPT4gdGhpcy5yZW1vdmVQb2QoaWQpKTtcbiAgICAgIH1cbiAgICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIkRlc3Ryb3lpbmcgaG9zdCBvYmplY3QgXCIsIHRoaXMuaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVQb2QoaWQpIHtcbiAgICAgIHZhciBwb2QgPSB0aGlzLnBvZHNbaWRdO1xuICAgICAgaWYgKHBvZCkge1xuICAgICAgICBwb2QuZGVzdHJveSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5wb2RzW2lkXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkUG9kKGtleSwgcDphbnkpIHtcbiAgICAgIGlmICh0aGlzLmhhc1BvZChrZXkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBteVBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIHBvZE9mZnNldFggPSB0aGlzLm9mZnNldFggLSBteVBvc2l0aW9uLng7XG4gICAgICB2YXIgcG9kT2Zmc2V0WSA9IG15UG9zaXRpb24ueTtcbiAgICAgIC8qXG4gICAgICB2YXIgYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgICAgdmFyIHBvZFggPSBteVBvc2l0aW9uLnggKyBwb2RPZmZzZXRYICogTWF0aC5jb3MoYW5nbGUpIC0gcG9kT2Zmc2V0WSAqIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgIHZhciBwb2RZID0gbXlQb3NpdGlvbi55ICsgcG9kT2Zmc2V0WCAqIE1hdGguc2luKGFuZ2xlKSAtIHBvZE9mZnNldFkgKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAqL1xuICAgICAgdmFyIHBvZCA9IG5ldyBQb2RPYmplY3QodGhpcy5zY2VuZSwgdGhpcywga2V5LCBwKTtcbiAgICAgIHBvZC5zZXRQb3NpdGlvbihteVBvc2l0aW9uLngsIG15UG9zaXRpb24ueSwgbXlQb3NpdGlvbi56KTtcbiAgICAgIHBvZC5tb3ZlKHRoaXMub2Zmc2V0WCwgMCwgMCk7XG4gICAgICB0aGlzLm9mZnNldFggPSB0aGlzLm9mZnNldFggKyBNYXRoLnJhbmRvbSgpICogNTAgKyAxMDA7XG4gICAgICB0aGlzLm9mZnNldFkgPSB0aGlzLm9mZnNldFkgKyBNYXRoLnJhbmRvbSgpICogNTAgKyAxMDA7XG4gICAgICB0aGlzLnBvZHNba2V5XSA9IHBvZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgaGFzUG9kKGlkKSB7XG4gICAgICByZXR1cm4gKGlkIGluIHRoaXMucG9kcyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGVwID0gMDtcbiAgICBcbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgdGhpcy5yb3RhdGUodGhpcy5yb3RhdGlvbi54LCB0aGlzLnJvdGF0aW9uLnksIHRoaXMucm90YXRpb24ueik7XG4gICAgICBfLmZvckluKHRoaXMucG9kcywgKHBvZE9iamVjdCwgaWQpID0+IHtcbiAgICAgICAgcG9kT2JqZWN0LnJlbmRlcigpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnN0ZXAgPSB0aGlzLnN0ZXAgKyAxO1xuICAgICAgc3VwZXIucmVuZGVyKCk7XG4gICAgfVxuXG5cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSGVscGVycy50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgZXhwb3J0IGNsYXNzIFBsYXllciBpbXBsZW1lbnRzIFJlbmRlcmFibGUge1xuICAgIHByaXZhdGUgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldCgna3ViZTNkLXBsYXllcicpO1xuICAgIHByaXZhdGUgZG9tRWxlbWVudDphbnkgPSBudWxsO1xuICAgIHByaXZhdGUgX2xvb2tBdDphbnkgPSBudWxsO1xuICAgIHByaXZhdGUgcGl0Y2ggPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICBwcml2YXRlIHlhdyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgcHJpdmF0ZSBfZW5hYmxlZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2RvY3VtZW50ID0gdW5kZWZpbmVkO1xuXG4gICAgLy8gbW92ZW1lbnQgYm9vbGVhbnNcbiAgICBwcml2YXRlIGZvcndhcmQgPSBmYWxzZTtcbiAgICBwcml2YXRlIGJhY2t3YXJkID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBsZWZ0ID0gZmFsc2U7XG4gICAgcHJpdmF0ZSByaWdodCA9IGZhbHNlO1xuICAgIHByaXZhdGUgY2FuSnVtcCA9IHRydWU7XG5cbiAgICAvLyBtb3ZlbWVudCB2ZWxvY2l0eVxuICAgIHByaXZhdGUgdmVsb2NpdHkgPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgIHByaXZhdGUgcHJldlRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcblxuICAgIHByaXZhdGUgaGFuZGxlcnM6YW55ID0gbnVsbDtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHNjZW5lLCBwcml2YXRlIGNhbWVyYSwgcHJpdmF0ZSBkKSB7XG5cbiAgICAgIGNhbWVyYS5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgdGhpcy5waXRjaC5hZGQoY2FtZXJhKTtcbiAgICAgIHRoaXMueWF3LmFkZCh0aGlzLnBpdGNoKTtcbiAgICAgIHNjZW5lLmFkZCh0aGlzLnlhdyk7XG5cbiAgICAgIHZhciBkb21FbGVtZW50ID0gdGhpcy5kb21FbGVtZW50ID0gJChkKTtcblxuICAgICAgaWYgKCFoYXZlUG9pbnRlckxvY2spIHtcbiAgICAgICAgdGhpcy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICBzZWxmLmhhbmRsZXJzID0ge1xuICAgICAgICAna2V5ZG93bic6IChldmVudDphbnkpID0+IHtcbiAgICAgICAgICBzd2l0Y2ggKCBldmVudC5vcmlnaW5hbEV2ZW50LmtleUNvZGUgKSB7XG4gICAgICAgICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICAgICAgICBzZWxmLmZvcndhcmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgICAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgICAgICAgc2VsZi5sZWZ0ID0gdHJ1ZTsgXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgICAgICAgY2FzZSA4MzogLy8gc1xuICAgICAgICAgICAgICBzZWxmLmJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICAgICAgICBzZWxmLnJpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICAgICAgICBpZiAoc2VsZi5jYW5KdW1wID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgc2VsZi52ZWxvY2l0eS55ICs9IDM1MDtcbiAgICAgICAgICAgICAgICBzZWxmLmNhbkp1bXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgICdrZXl1cCc6IChldmVudDphbnkpID0+IHtcbiAgICAgICAgICBzd2l0Y2ggKCBldmVudC5vcmlnaW5hbEV2ZW50LmtleUNvZGUgKSB7XG4gICAgICAgICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICAgICAgICBzZWxmLmZvcndhcmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICAgICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgICAgICAgIHNlbGYubGVmdCA9IGZhbHNlOyBcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICAgICAgICBjYXNlIDgzOiAvLyBzXG4gICAgICAgICAgICAgIHNlbGYuYmFja3dhcmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICAgICAgICBzZWxmLnJpZ2h0ID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgJ21vdXNlbW92ZSc6IChldmVudDphbnkpID0+IHtcbiAgICAgICAgICBpZiAoIXNlbGYuX2VuYWJsZWQgfHwgIWhhdmVQb2ludGVyTG9jaykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgeWF3ID0gc2VsZi55YXc7XG4gICAgICAgICAgdmFyIHBpdGNoID0gc2VsZi5waXRjaDtcbiAgICAgICAgICB2YXIgZGVsdGFYID0gZXZlbnQubW92ZW1lbnRYIHx8IGV2ZW50Lm1vek1vdmVtZW50WCB8fCBldmVudC53ZWJraXRNb3ZlbWVudFggfHwgMDtcbiAgICAgICAgICB2YXIgZGVsdGFZID0gZXZlbnQubW92ZW1lbnRZIHx8IGV2ZW50Lm1vek1vdmVtZW50WCB8fCBldmVudC53ZWJraXRNb3ZlbWVudFggfHwgMDtcbiAgICAgICAgICB5YXcucm90YXRpb24ueSAtPSBkZWx0YVggKiAwLjAwMjtcbiAgICAgICAgICBwaXRjaC5yb3RhdGlvbi54IC09IGRlbHRhWSAqIDAuMDAyO1xuICAgICAgICAgIHBpdGNoLnJvdGF0aW9uLnggPSBNYXRoLm1heCggLSBIYWxmUEksIE1hdGgubWluKEhhbGZQSSwgcGl0Y2gucm90YXRpb24ueCkpO1xuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgXy5mb3JJbih0aGlzLmhhbmRsZXJzLCAoaGFuZGxlciwgZXZ0KSA9PiBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKGV2dCwgaGFuZGxlciwgZmFsc2UpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0IGVuYWJsZWQoZW5hYmxlZCkge1xuICAgICAgdGhpcy5fZW5hYmxlZCA9IGVuYWJsZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBlbmFibGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGxvb2tBdChib3gpIHtcbiAgICAgIHRoaXMuX2xvb2tBdCA9IGJveDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIHRoaXMuc2NlbmUucmVtb3ZlKHRoaXMueWF3KTtcbiAgICAgIHRoaXMueWF3LmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMucGl0Y2guZGlzcG9zZSgpO1xuICAgICAgXy5mb3JJbih0aGlzLmhhbmRsZXJzLCAoaGFuZGxlciwgZXZ0KSA9PiBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2dCwgaGFuZGxlcikpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICBpZiAoIXRoaXMuZW5hYmxlZCB8fCAhaGF2ZVBvaW50ZXJMb2NrKSB7XG4gICAgICAgIGlmICh0aGlzLmxvb2tBdCkge1xuICAgICAgICAgIHZhciBhbmdsZSA9IERhdGUubm93KCkgKiAwLjAwMDE7XG4gICAgICAgICAgdGhpcy5jYW1lcmEuZm9jdXModGhpcy5fbG9va0F0LCBhbmdsZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZFBsdWdpbi50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgdmFyIGRpcmVjdGl2ZU5hbWUgPSAndGhyZWVqcyc7XG5cbiAgX21vZHVsZS5kaXJlY3RpdmUoZGlyZWN0aXZlTmFtZSwgWygpID0+IHtcbiAgICBUSFJFRS5JbWFnZVV0aWxzLmNyb3NzT3JpZ2luID0gJyc7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICByZXBsYWNlOiB0cnVlLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgY29uZmlnOiAnPT8nICsgZGlyZWN0aXZlTmFtZVxuICAgICAgfSxcbiAgICAgIGxpbms6IChzY29wZSwgZWxlbWVudCwgYXR0cnMpID0+IHtcblxuICAgICAgICB2YXIgc2NlbmU6YW55ID0gbnVsbDtcbiAgICAgICAgdmFyIGNhbWVyYTphbnkgPSBudWxsO1xuICAgICAgICB2YXIgcmVuZGVyZXI6YW55ID0gbnVsbDtcbiAgICAgICAgdmFyIGtlZXBSZW5kZXJpbmcgPSB0cnVlO1xuICAgICAgICB2YXIgcmVzaXplSGFuZGxlOmFueSA9IG51bGw7XG5cbiAgICAgICAgZnVuY3Rpb24gc3RvcCgpIHtcbiAgICAgICAgICBrZWVwUmVuZGVyaW5nID0gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBmdW5jdGlvbiBjbGVhbnVwKCkge1xuICAgICAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZScsIHJlc2l6ZUZ1bmMpO1xuICAgICAgICAgIGRlbGV0ZSByZW5kZXJlcjtcbiAgICAgICAgICBkZWxldGUgY2FtZXJhO1xuICAgICAgICAgIGRlbGV0ZSBzY2VuZTtcbiAgICAgICAgICBlbGVtZW50LmVtcHR5KCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcmVzaXplRnVuYyA9ICgpID0+IHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcInJlc2l6aW5nXCIpO1xuICAgICAgICAgICAgZWxlbWVudC5maW5kKCdjYW52YXMnKS53aWR0aChlbGVtZW50LndpZHRoKCkpLmhlaWdodChlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgICAgIGNhbWVyYS5hc3BlY3QgPSBlbGVtZW50LndpZHRoKCkgLyBlbGVtZW50LmhlaWdodCgpO1xuICAgICAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoZWxlbWVudC53aWR0aCgpLCBlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsZW1lbnQub24oJyRkZXN0cm95JywgKCkgPT4ge1xuICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICBsb2cuZGVidWcoXCJzY2VuZSBkZXN0cm95ZWRcIik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNjb3BlLiR3YXRjaCgnY29uZmlnJywgKGNvbmZpZykgPT4ge1xuICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICBpZiAoIWNvbmZpZyB8fCAhY29uZmlnLmluaXRpYWxpemUpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIm5vIGNvbmZpZywgcmV0dXJuaW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsb2cuZGVidWcoXCJjcmVhdGluZyBzY2VuZVwiKTtcbiAgICAgICAgICBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgICAgICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg2MCwgZWxlbWVudC53aWR0aCgpIC8gZWxlbWVudC5oZWlnaHQoKSwgMC4xLCAyMDAwMCk7XG5cbiAgICAgICAgICBjYW1lcmEuZm9jdXMgPSAoYm94MzphbnksIGFuZ2xlKSA9PiB7XG4gICAgICAgICAgICAvLyBhZGp1c3QgdGhlIGNhbWVyYSBwb3NpdGlvbiB0byBrZWVwIGV2ZXJ5dGhpbmcgaW4gdmlldywgd2UnbGwgZG9cbiAgICAgICAgICAgIC8vIGdyYWR1YWwgYWRqdXN0bWVudHMgdGhvdWdoXG4gICAgICAgICAgICB2YXIgaGVpZ2h0ID0gYm94My5zaXplKCkueTtcbiAgICAgICAgICAgIHZhciB3aWR0aCA9IGJveDMuc2l6ZSgpLnggLyAoY2FtZXJhLmFzcGVjdCAvIDIpO1xuICAgICAgICAgICAgLy9sb2cuZGVidWcoXCJ3aWR0aDpcIiwgd2lkdGgsIFwiIGhlaWdodDpcIiwgaGVpZ2h0KTtcbiAgICAgICAgICAgIGlmICh3aWR0aCA8IDAgfHwgaGVpZ2h0IDwgMCkge1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgZGlzdFkgPSBNYXRoLnJvdW5kKGhlaWdodCAqIE1hdGgudGFuKCAoY2FtZXJhLmZvdiAvIDIgKSAqICggTWF0aC5QSSAvIDE4MCApKSk7XG4gICAgICAgICAgICB2YXIgZGlzdFggPSBNYXRoLnJvdW5kKHdpZHRoICogTWF0aC50YW4oIChjYW1lcmEuZm92IC8gMiApICogKCBNYXRoLlBJIC8gMTgwICkpKTtcbiAgICAgICAgICAgIHZhciBkaXN0WiA9IChkaXN0WSArIGRpc3RYKTtcbiAgICAgICAgICAgIC8vIGxvZy5kZWJ1ZyhcImRpc3RZOlwiLCBkaXN0WSwgXCIgZGlzdFg6XCIsIGRpc3RYLCBcImRpc3RaOlwiLCBkaXN0Wik7XG4gICAgICAgICAgICB2YXIgeiA9IE1hdGgucm91bmQoY2FtZXJhLnBvc2l0aW9uLnopO1xuICAgICAgICAgICAgdmFyIHBlcmlvZCA9IDUuMDtcbiAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi54ID0gZGlzdFggKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAgICAgICBjYW1lcmEucG9zaXRpb24ueSA9IGRpc3RZICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICAgICAgaWYgKHogIT09IGRpc3RaKSB7XG4gICAgICAgICAgICAgIGlmICh6ID4gZGlzdFopIHtcbiAgICAgICAgICAgICAgICB2YXIgdiA9ICh6IC0gZGlzdFopIC8gcGVyaW9kO1xuICAgICAgICAgICAgICAgIGNhbWVyYS5wb3NpdGlvbi56ID0geiAtIHY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHogPCBkaXN0Wikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKGRpc3RaIC0geikgLyBwZXJpb2Q7XG4gICAgICAgICAgICAgICAgY2FtZXJhLnBvc2l0aW9uLnogPSB6ICsgdjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2FtZXJhLmxvb2tBdChib3gzLmNlbnRlcigpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgaWYgKCB3ZWJnbEF2YWlsYWJsZSgpICkge1xuICAgICAgICAgICAgcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcigpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5DYW52YXNSZW5kZXJlcigpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZW5kZXJlci5zZXRQaXhlbFJhdGlvKCB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyApO1xuICAgICAgICAgIHJlbmRlcmVyLnNldFNpemUoZWxlbWVudC53aWR0aCgpLCBlbGVtZW50LmhlaWdodCgpKTtcbiAgICAgICAgICB2YXIgZG9tRWxlbWVudCA9IHJlbmRlcmVyLmRvbUVsZW1lbnQ7XG4gICAgICAgICAgZWxlbWVudC5hcHBlbmQoZG9tRWxlbWVudCk7XG5cbiAgICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHJlc2l6ZUZ1bmMpO1xuICAgICAgICAgIGNvbmZpZy5pbml0aWFsaXplKHJlbmRlcmVyLCBzY2VuZSwgY2FtZXJhLCBkb21FbGVtZW50KTtcblxuICAgICAgICAgIHZhciByZW5kZXIgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoIWtlZXBSZW5kZXJpbmcpIHtcbiAgICAgICAgICAgICAgY2xlYW51cCgpO1xuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICAgICAgICAgIGlmIChjb25maWcucmVuZGVyKSB7XG4gICAgICAgICAgICAgIGNvbmZpZy5yZW5kZXIocmVuZGVyZXIsIHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmVuZGVyZXIucmVuZGVyKHNjZW5lLCBjYW1lcmEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBrZWVwUmVuZGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgICByZW5kZXIoKTtcblxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuICB9XSk7XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RIZWxwZXJzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgY2xhc3MgV29ybGQgaW1wbGVtZW50cyBSZW5kZXJhYmxlIHtcbiAgICBwcml2YXRlIGFtYmllbnQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KCAweGZmZmZmZiApO1xuICAgIHByaXZhdGUgbGlnaHQgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCggMHg4ODg4ODggKTtcblxuICAgIHB1YmxpYyBjb25zdHJ1Y3Rvcihwcml2YXRlIHNjZW5lKSB7XG4gICAgICB0aGlzLmFtYmllbnQuY29sb3Iuc2V0SFNMKCAwLjEsIDAuMywgMC4yICk7XG4gICAgICB0aGlzLmxpZ2h0LnBvc2l0aW9uLnNldCggMSwgMSwgMCk7XG4gICAgICBzY2VuZS5hZGQodGhpcy5hbWJpZW50KTtcbiAgICAgIHNjZW5lLmFkZCh0aGlzLmxpZ2h0KTtcblxuICAgICAgLy8gc2t5Ym94XG4gICAgICB2YXIgbWF0ZXJpYWxBcnJheSA9IFtdO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA2OyBpKyspXG4gICAgICAgIG1hdGVyaWFsQXJyYXkucHVzaChuZXcgVEhSRUUuTWVzaEJhc2ljTWF0ZXJpYWwoe1xuICAgICAgICAgIG1hcDogVEhSRUUuSW1hZ2VVdGlscy5sb2FkVGV4dHVyZSgnaW1nL3NwYWNlLXNlYW1sZXNzLnBuZycpLFxuICAgICAgICAgIHNpZGU6IFRIUkVFLkJhY2tTaWRlXG4gICAgICAgIH0pKTtcbiAgICAgIHZhciBza3lNYXRlcmlhbCA9IG5ldyBUSFJFRS5NZXNoRmFjZU1hdGVyaWFsKG1hdGVyaWFsQXJyYXkpO1xuICAgICAgc2NlbmUuYWRkKG5ldyBUSFJFRS5NZXNoKG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSgxMDAwMCwgMTAwMDAsIDEwMDAwKSwgc2t5TWF0ZXJpYWwpKTtcblxuICAgICAgLy8gcGFydGljbGUgY2xvdWRcbiAgICAgIHZhciBnZW9tZXRyeSA9IG5ldyBUSFJFRS5HZW9tZXRyeSgpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCAxMDAwMDsgaSsrKSB7XG4gICAgICAgIHZhciB2ZXJ0ZXggPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xuICAgICAgICB2ZXJ0ZXgueCA9IFRIUkVFLk1hdGgucmFuZEZsb2F0U3ByZWFkKCAxMDAwMCApO1xuICAgICAgICB2ZXJ0ZXgueSA9IFRIUkVFLk1hdGgucmFuZEZsb2F0U3ByZWFkKCAxMDAwMCApO1xuICAgICAgICB2ZXJ0ZXgueiA9IFRIUkVFLk1hdGgucmFuZEZsb2F0U3ByZWFkKCAxMDAwMCApO1xuICAgICAgICBnZW9tZXRyeS52ZXJ0aWNlcy5wdXNoKHZlcnRleCk7XG4gICAgICB9XG4gICAgICB2YXIgcGFydGljbGVzID0gbmV3IFRIUkVFLlBvaW50Q2xvdWQoIGdlb21ldHJ5LCBuZXcgVEhSRUUuUG9pbnRDbG91ZE1hdGVyaWFsKHtjb2xvcjogMHg4ODg4ODgsIGZvZzogdHJ1ZX0pKTtcbiAgICAgIHNjZW5lLmFkZChwYXJ0aWNsZXMpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcblxuICAgIH1cblxuICB9XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwicGxheWVyLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIndvcmxkLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cIm9iamVjdHMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIGV4cG9ydCB2YXIgVmlld0NvbnRyb2xsZXIgPSBjb250cm9sbGVyKCdWaWV3Q29udHJvbGxlcicsIFsnJHNjb3BlJywgJ0t1YmVybmV0ZXNNb2RlbCcsICdLdWJlcm5ldGVzU3RhdGUnLCAnJGVsZW1lbnQnLCAoJHNjb3BlLCBtb2RlbDpLdWJlcm5ldGVzLkt1YmVybmV0ZXNNb2RlbFNlcnZpY2UsIHN0YXRlLCAkZWxlbWVudCkgPT4ge1xuXG4gICAgdmFyIGRlYnVnU2NlbmUgPSBmYWxzZTtcblxuICAgIHZhciByZW5kZXJlcjphbnkgPSB1bmRlZmluZWQ7XG4gICAgdmFyIHNjZW5lOmFueSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgY2FtZXJhOmFueSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgZG9tRWxlbWVudDphbnkgPSB1bmRlZmluZWQ7XG5cbiAgICB2YXIgc2NlbmVHZW9tZXRyeSA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuICAgIHZhciBzY2VuZUJvdW5kcyA9IG5ldyBUSFJFRS5Cb3VuZGluZ0JveEhlbHBlcihzY2VuZUdlb21ldHJ5LCAweGZmMDAwMCk7XG5cbiAgICB2YXIgaG9zdE9iamVjdHMgPSB7fTtcblxuICAgIHZhciB1cGRhdGluZyA9IGZhbHNlO1xuICAgIHZhciBoYXNNb3VzZSA9IGZhbHNlO1xuXG4gICAgdmFyIHBsYXllcjpQbGF5ZXIgPSBudWxsO1xuICAgIHZhciB3b3JsZDpXb3JsZCA9IG51bGw7XG5cbiAgICAkc2NvcGUub25Mb2NrID0gKGxvY2spID0+IHtcbiAgICAgIGlmICghcGxheWVyKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHBsYXllci5lbmFibGVkID0gbG9jaztcbiAgICB9XG5cbiAgICAkc2NvcGUuY29uZmlnID0ge1xuICAgICAgaW5pdGlhbGl6ZTogKHIsIHMsIGMsIGQpID0+IHtcbiAgICAgICAgbG9nLmRlYnVnKFwiaW5pdCBjYWxsZWRcIik7XG4gICAgICAgIHJlbmRlcmVyID0gcjtcbiAgICAgICAgc2NlbmUgPSBzO1xuICAgICAgICBjYW1lcmEgPSBjO1xuICAgICAgICBkb21FbGVtZW50ID0gZDtcblxuICAgICAgICAkc2NvcGUucGxheWVyID0gcGxheWVyID0gbmV3IFBsYXllcihzY2VuZSwgY2FtZXJhLCBkKTtcbiAgICAgICAgd29ybGQgPSBuZXcgV29ybGQoc2NlbmUpO1xuXG4gICAgICAgIHNjZW5lLmFkZChzY2VuZUdlb21ldHJ5KTtcblxuICAgICAgICBpZiAoZGVidWdTY2VuZSkge1xuICAgICAgICAgIC8vIGRlYnVnIHN0dWZmXG4gICAgICAgICAgLy8gcHV0cyBhIGJvdW5kaW5nIGJveCBhcm91bmQgdGhlIHNjZW5lIHdlIHdhbnQgdG8gdmlld1xuICAgICAgICAgIHNjZW5lLmFkZChzY2VuZUJvdW5kcyk7XG5cbiAgICAgICAgICAvLyBhZGRzIGxpbmVzIGZvciB0aGUgeC95L3ogYXhpc1xuICAgICAgICAgIC8vIFRoZSBYIGF4aXMgaXMgcmVkLiBUaGUgWSBheGlzIGlzIGdyZWVuLiBUaGUgWiBheGlzIGlzIGJsdWVcbiAgICAgICAgICB2YXIgYXhpcyA9IG5ldyBUSFJFRS5BeGlzSGVscGVyKDEwMDApO1xuICAgICAgICAgIHNjZW5lLmFkZChheGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueCA9IDkwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnogPSA5MDtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5wb3NpdGlvbi54ID0gMDtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5wb3NpdGlvbi55ID0gMDtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5wb3NpdGlvbi56ID0gMDtcbiAgICAgICAgYnVpbGRTY2VuZSgpO1xuICAgICAgfSxcbiAgICAgIHJlbmRlcjogKHJlbmRlcmVyLCBzY2VuZSwgY2FtZXJhKSA9PiB7XG4gICAgICAgIC8vIE5PVEUgLSB0aGlzIGZ1bmN0aW9uIHJ1bnMgYXQgfiA2MGZwcyFcbiAgICAgICAgaWYgKHVwZGF0aW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHdvcmxkLnJlbmRlcigpO1xuICAgICAgICB2YXIgYW5nbGUgPSBEYXRlLm5vdygpICogMC4wMDAxO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnggPSAxMDAwICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnogPSAxMDAwICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICAvLyBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnggKz0gMC4wMDE7XG4gICAgICAgIC8vIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueSArPSAwLjAwMTtcbiAgICAgICAgLy8gc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi56ICs9IDAuMDAxO1xuICAgICAgICBfLmZvckluKGhvc3RPYmplY3RzLCAoaG9zdE9iamVjdCwga2V5KSA9PiB7XG4gICAgICAgICAgaG9zdE9iamVjdC5yZW5kZXIoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNjZW5lQm91bmRzLnVwZGF0ZSgpO1xuICAgICAgICBwbGF5ZXIubG9va0F0KHNjZW5lQm91bmRzLmJveCk7XG4gICAgICAgIHBsYXllci5yZW5kZXIoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBidWlsZFNjZW5lKCkge1xuICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB1cGRhdGluZyA9IHRydWU7XG4gICAgICB2YXIgb3JpZ2luWCA9IDA7XG4gICAgICB2YXIgb3JpZ2luWSA9IDA7XG5cbiAgICAgIHZhciBob3N0c1RvUmVtb3ZlID0gW107XG5cbiAgICAgIF8uZm9ySW4oaG9zdE9iamVjdHMsIChob3N0T2JqZWN0LCBrZXkpID0+IHtcbiAgICAgICAgaWYgKF8uYW55KG1vZGVsLmhvc3RzLCAoaG9zdCkgPT4gaG9zdC5lbGVtZW50SWQgPT09IGtleSkpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJLZWVwaW5nIGhvc3Q6IFwiLCBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhvc3RzVG9SZW1vdmUucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgXy5mb3JFYWNoKGhvc3RzVG9SZW1vdmUsIChrZXkpID0+IHtcbiAgICAgICAgdmFyIGhvc3RPYmplY3QgPSBob3N0T2JqZWN0c1trZXldO1xuICAgICAgICBpZiAoaG9zdE9iamVjdCkge1xuICAgICAgICAgIGhvc3RPYmplY3QuZGVzdHJveSgpO1xuICAgICAgICAgIGRlbGV0ZSBob3N0T2JqZWN0c1trZXldO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgXy5mb3JFYWNoKG1vZGVsLmhvc3RzLCAoaG9zdCkgPT4ge1xuICAgICAgICB2YXIgaWQgPSBob3N0LmVsZW1lbnRJZDtcbiAgICAgICAgbG9nLmRlYnVnKFwiaG9zdDogXCIsIGhvc3QpO1xuICAgICAgICB2YXIgaG9zdE9iamVjdCA9IGhvc3RPYmplY3RzW2lkXSB8fCBuZXcgSG9zdE9iamVjdChzY2VuZUdlb21ldHJ5LCBpZCwgaG9zdCk7XG4gICAgICAgIGlmICghKGlkIGluIGhvc3RPYmplY3RzKSkge1xuICAgICAgICAgIGhvc3RPYmplY3Quc2V0UG9zaXRpb24ob3JpZ2luWCwgb3JpZ2luWSwgMCk7XG4gICAgICAgICAgb3JpZ2luWCA9IG9yaWdpblggKyA1MDA7XG4gICAgICAgICAgb3JpZ2luWSA9IG9yaWdpblkgKyA1MDA7XG4gICAgICAgICAgaG9zdE9iamVjdHNbaWRdID0gaG9zdE9iamVjdDtcbiAgICAgICAgfVxuICAgICAgICBob3N0T2JqZWN0LnVwZGF0ZShtb2RlbCwgaG9zdCk7XG4gICAgICAgIGhvc3RPYmplY3QuZGVidWcoZGVidWdTY2VuZSk7XG4gICAgICB9KTtcblxuICAgICAgbG9nLmRlYnVnKFwibW9kZWwgdXBkYXRlZFwiKTtcbiAgICAgIHVwZGF0aW5nID0gZmFsc2U7XG4gICAgfVxuICAgICRzY29wZS4kb24oJ2t1YmVybmV0ZXNNb2RlbFVwZGF0ZWQnLCBidWlsZFNjZW5lKTtcbiAgfV0pO1xuXG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
angular.module("hawtio-kube3d-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/kube3d/html/view.html","<div class=\"kube3d-viewport\" ng-controller=\"Kube3d.ViewController\">\n  <div class=\"kube3d-control\" threejs=\"config\"></div>\n  <div class=\"kube3d-instructions\" request-lock=\'onLock(lock)\'>\n    <div class=\"kube3d-instructions-wrapper\">\n      <span class=\"kube3d-start-title\">Click to play</span>\n    </div>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-kube3d-templates");