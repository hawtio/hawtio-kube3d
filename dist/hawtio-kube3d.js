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
    Kube3d.W = 1;
    Kube3d.S = 0;
    Kube3d.WALL = Kube3d.W;
    Kube3d.SPACE = Kube3d.S;
    Kube3d.CELL_SIZE = 100;
    Kube3d.FLOOR_LEVEL = -Kube3d.CELL_SIZE;
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
    function placeObject(cellX, cellY, isFloor) {
        if (isFloor === void 0) { isFloor = false; }
        var x = cellX * Kube3d.CELL_SIZE;
        var z = cellY * Kube3d.CELL_SIZE;
        var y = isFloor ? Kube3d.FLOOR_LEVEL : 0;
        return [x, y, z];
    }
    Kube3d.placeObject = placeObject;
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
    var levelData = [
        [Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.S, Kube3d.W],
        [Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W, Kube3d.W]
    ];
    var levelWidth = levelData[0].length;
    var levelHeight = levelData.length;
    var wallTexture = THREE.ImageUtils.loadTexture('img/IMGP1450.jpg');
    wallTexture.minFilter = THREE.NearestFilter;
    var wallMaterial = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        map: wallTexture,
        castShadow: true,
        receiveShadow: true,
        wireframe: false
    });
    var wall = new THREE.Mesh(new THREE.BoxGeometry(Kube3d.CELL_SIZE, Kube3d.CELL_SIZE, Kube3d.CELL_SIZE), wallMaterial);
    var floorTexture = THREE.ImageUtils.loadTexture('img/IMGP1450.jpg');
    floorTexture.minFilter = THREE.NearestFilter;
    var floorMaterial = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        map: floorTexture,
        castShadow: true,
        receiveShadow: true,
        wireframe: false
    });
    var floor = new THREE.Mesh(new THREE.BoxGeometry(Kube3d.CELL_SIZE, Kube3d.CELL_SIZE, Kube3d.CELL_SIZE), floorMaterial);
    function makeBox(cellX, cellY, isFloor) {
        if (isFloor === void 0) { isFloor = false; }
        var box = isFloor ? floor.clone() : wall.clone();
        box.position.fromArray(Kube3d.placeObject(cellX, cellY, isFloor));
        return box;
    }
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
            _.forEach(levelData, function (row, y) {
                _.forEach(row, function (cell, x) {
                    switch (cell) {
                        case Kube3d.WALL:
                            scene.add(makeBox(x, y, false));
                            break;
                    }
                    scene.add(makeBox(x, y, true));
                });
            });
        }
        World.prototype.placePlayer = function (object) {
            this.placeObject(object);
        };
        World.prototype.placeObject = function (object) {
            if (!object || !object.position) {
                return;
            }
            var x, y;
            do {
                x = Math.floor(Math.random() * (levelWidth - 2) + 1);
                y = Math.floor(Math.random() * (levelHeight - 2) + 1);
                Kube3d.log.debug("x:", x, "y:", y, "val:", levelData[y][x]);
            } while (levelData[y][x] !== Kube3d.SPACE);
            object.position.fromArray(Kube3d.placeObject(x, y));
        };
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
    var Player = (function () {
        function Player(scene, camera, d, world) {
            this.scene = scene;
            this.camera = camera;
            this.d = d;
            this.world = world;
            this.log = Logger.get('kube3d-player');
            this.domElement = null;
            this._lookAt = null;
            this.pitch = new THREE.Object3D();
            this.yaw = new THREE.Object3D();
            this._enabled = false;
            this._document = undefined;
            this.getWorldObjects = function () { return []; };
            this.raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
            this.forward = false;
            this.backward = false;
            this.left = false;
            this.right = false;
            this.canJump = true;
            this.running = false;
            this.velocity = new THREE.Vector3();
            this.prevTime = performance.now();
            this.handlers = null;
            this.walkingModifier = 500;
            this.runningModifier = 200;
            camera.rotation.set(0, 0, 0);
            camera.position.set(0, 0, 0);
            this.pitch.add(camera);
            this.yaw.add(this.pitch);
            scene.add(this.yaw);
            this.yaw.position.set(0, 0, -5);
            var domElement = this.domElement = $(d);
            if (!Kube3d.havePointerLock) {
                this.enabled = true;
            }
            var self = this;
            self.handlers = {
                'keydown': function (event) {
                    switch (event.keyCode) {
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
                        case 16:
                            self.running = true;
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
                    switch (event.keyCode) {
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
                        case 16:
                            self.running = false;
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
                if (enabled) {
                    this.camera.position.set(0, 0, 0);
                    this.camera.rotation.set(0, 0, 0);
                    this.object.position.set(0, 0, 0);
                    var angle = THREE.Math.degToRad(THREE.Math.random16() * 360);
                    this.yaw.rotation.set(0, angle, 0);
                    this.world.placePlayer(this.object);
                }
                else {
                    this.yaw.position.set(0, 0, 0);
                    this.yaw.rotation.set(0, 0, 0);
                    this.pitch.rotation.set(0, 0, 0);
                }
            },
            enumerable: true,
            configurable: true
        });
        Player.prototype.setWorldObjectsCallback = function (func) {
            this.getWorldObjects = func;
        };
        Object.defineProperty(Player.prototype, "object", {
            get: function () {
                return this.yaw;
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
                if (this._lookAt) {
                    var angle = Date.now() * 0.0001;
                    this.camera.focus(this._lookAt, angle);
                }
                return;
            }
            var raycaster = this.raycaster;
            var velocity = this.velocity;
            var me = this.object;
            raycaster.ray.origin.copy(this.yaw.position);
            raycaster.ray.origin.y -= 10;
            var objects = this.getWorldObjects();
            var intersections = raycaster.intersectObjects(objects);
            var isOnObject = intersections.length > 0;
            var time = performance.now();
            var modifier = this.running ? this.runningModifier : this.walkingModifier;
            var delta = (time - this.prevTime) / modifier;
            velocity.x -= velocity.x * 10.0 * delta;
            velocity.z -= velocity.z * 10.0 * delta;
            velocity.y -= 9.8 * 100.0 * delta;
            if (this.forward)
                velocity.z -= 400.0 * delta;
            if (this.backward)
                velocity.z += 400.0 * delta;
            if (this.left)
                velocity.x -= 400.0 * delta;
            if (this.right)
                velocity.x += 400.0 * delta;
            if (isOnObject === true) {
                velocity.y = Math.max(0, velocity.y);
                this.canJump = true;
            }
            me.translateX(velocity.x * delta);
            me.translateY(velocity.y * delta);
            me.translateZ(velocity.z * delta);
            if (me.position.y < 10) {
                velocity.y = 0;
                me.position.y = 10;
                this.canJump = true;
            }
            this.prevTime = time;
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
                scope.$watch('config', _.debounce(function (config) {
                    stop();
                    if (!config || !config.initialize) {
                        Kube3d.log.debug("no config, returning");
                        return;
                    }
                    Kube3d.log.debug("creating scene");
                    scene = new THREE.Scene();
                    camera = new THREE.PerspectiveCamera(60, element.width() / element.height(), 0.1, 20000);
                    camera.focus = function (box3, angle, c) {
                        if (c === void 0) { c = camera; }
                        var height = box3.size().y;
                        var width = box3.size().x / (camera.aspect / 2);
                        if (width < 0 || height < 0) {
                            return;
                        }
                        var distY = Math.round(height * Math.tan((camera.fov / 2) * (Math.PI / 180)));
                        var distX = Math.round(width * Math.tan((camera.fov / 2) * (Math.PI / 180)));
                        var distZ = (distY + distX);
                        var z = Math.round(c.position.z);
                        var period = 5.0;
                        c.position.x = distX * Math.cos(angle);
                        c.position.y = distY * Math.sin(angle);
                        if (z !== distZ) {
                            if (z > distZ) {
                                var v = (z - distZ) / period;
                                c.position.z = z - v;
                            }
                            if (z < distZ) {
                                var v = (distZ - z) / period;
                                c.position.z = z + v;
                            }
                        }
                        c.lookAt(box3.center());
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
                    config.initialize(renderer, scene, camera, domElement);
                    element.append(domElement);
                    $(window).on('resize', resizeFunc);
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
                }, 500, { trailing: true }));
            }
        };
    }]);
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
                world = new Kube3d.World(scene);
                player = new Kube3d.Player(scene, camera, d, world);
                scene.add(sceneGeometry);
                if (debugScene) {
                    scene.add(sceneBounds);
                }
                var axis = new THREE.AxisHelper(1000);
                scene.add(axis);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluY2x1ZGVzLnRzIiwia3ViZTNkL3RzL2t1YmUzZEludGVyZmFjZXMudHMiLCJrdWJlM2QvdHMva3ViZTNkSGVscGVycy50cyIsImt1YmUzZC90cy9rdWJlM2RQbHVnaW4udHMiLCJrdWJlM2QvdHMvbG9ja1JlcXVlc3QudHMiLCJrdWJlM2QvdHMvb2JqZWN0cy50cyIsImt1YmUzZC90cy93b3JsZC50cyIsImt1YmUzZC90cy9wbGF5ZXIudHMiLCJrdWJlM2QvdHMvdGhyZWVKU0RpcmVjdGl2ZS50cyIsImt1YmUzZC90cy92aWV3LnRzIl0sIm5hbWVzIjpbIkt1YmUzZCIsIkt1YmUzZC5yZ2JUb0hleCIsIkt1YmUzZC5yYW5kb21HcmV5IiwiS3ViZTNkLndlYmdsQXZhaWxhYmxlIiwiS3ViZTNkLnBsYWNlT2JqZWN0IiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZSIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2UuY29uc3RydWN0b3IiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlc3Ryb3kiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmRlYnVnIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5tb3ZlIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5yb3RhdGUiLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLmdldFBvc2l0aW9uIiwiS3ViZTNkLlNjZW5lT2JqZWN0QmFzZS5zZXRQb3NpdGlvbiIsIkt1YmUzZC5TY2VuZU9iamVjdEJhc2Uuc2V0Um90YXRpb24iLCJLdWJlM2QuU2NlbmVPYmplY3RCYXNlLnJlbmRlciIsIkt1YmUzZC5Qb2RPYmplY3QiLCJLdWJlM2QuUG9kT2JqZWN0LmNvbnN0cnVjdG9yIiwiS3ViZTNkLlBvZE9iamVjdC51cGRhdGUiLCJLdWJlM2QuUG9kT2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuUG9kT2JqZWN0LmRpc3RhbmNlIiwiS3ViZTNkLlBvZE9iamVjdC5hbmdsZU9mVmVsb2NpdHkiLCJLdWJlM2QuUG9kT2JqZWN0LnJlbmRlciIsIkt1YmUzZC5Ib3N0T2JqZWN0IiwiS3ViZTNkLkhvc3RPYmplY3QuY29uc3RydWN0b3IiLCJLdWJlM2QuSG9zdE9iamVjdC51cGRhdGUiLCJLdWJlM2QuSG9zdE9iamVjdC5kZWJ1ZyIsIkt1YmUzZC5Ib3N0T2JqZWN0LmRlc3Ryb3kiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW1vdmVQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5hZGRQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5oYXNQb2QiLCJLdWJlM2QuSG9zdE9iamVjdC5yZW5kZXIiLCJLdWJlM2QubWFrZUJveCIsIkt1YmUzZC5Xb3JsZCIsIkt1YmUzZC5Xb3JsZC5jb25zdHJ1Y3RvciIsIkt1YmUzZC5Xb3JsZC5wbGFjZVBsYXllciIsIkt1YmUzZC5Xb3JsZC5wbGFjZU9iamVjdCIsIkt1YmUzZC5Xb3JsZC5yZW5kZXIiLCJLdWJlM2QuV29ybGQuZGVzdHJveSIsIkt1YmUzZC5QbGF5ZXIiLCJLdWJlM2QuUGxheWVyLmNvbnN0cnVjdG9yIiwiS3ViZTNkLlBsYXllci5lbmFibGVkIiwiS3ViZTNkLlBsYXllci5zZXRXb3JsZE9iamVjdHNDYWxsYmFjayIsIkt1YmUzZC5QbGF5ZXIub2JqZWN0IiwiS3ViZTNkLlBsYXllci5sb29rQXQiLCJLdWJlM2QuUGxheWVyLmRlc3Ryb3kiLCJLdWJlM2QuUGxheWVyLnJlbmRlciIsIkt1YmUzZC5zdG9wIiwiS3ViZTNkLmNsZWFudXAiLCJLdWJlM2QuYnVpbGRTY2VuZSJdLCJtYXBwaW5ncyI6IkFBa0JzQjs7QUNqQnRCLElBQU8sTUFBTSxDQW9CWjtBQXBCRCxXQUFPLE1BQU0sRUFBQyxDQUFDO0lBRUZBLFFBQUNBLEdBQUdBLENBQUNBLENBQUNBO0lBQ05BLFFBQUNBLEdBQUdBLENBQUNBLENBQUNBO0lBQ05BLFdBQUlBLEdBQUdBLFFBQUNBLENBQUNBO0lBQ1RBLFlBQUtBLEdBQUdBLFFBQUNBLENBQUNBO0lBRVZBLGdCQUFTQSxHQUFHQSxHQUFHQSxDQUFDQTtJQUNoQkEsa0JBQVdBLEdBQUdBLENBQUNBLGdCQUFTQSxDQUFDQTtJQVduQ0EsQ0FBQ0E7QUFDSkEsQ0FBQ0EsRUFwQk0sTUFBTSxLQUFOLE1BQU0sUUFvQlo7O0FDbEJELElBQU8sTUFBTSxDQXVDWjtBQXZDRCxXQUFPLE1BQU0sRUFBQyxDQUFDO0lBQ0ZBLGlCQUFVQSxHQUFHQSxRQUFRQSxDQUFDQTtJQUN0QkEsVUFBR0EsR0FBa0JBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLGlCQUFVQSxDQUFDQSxDQUFDQTtJQUM1Q0EsbUJBQVlBLEdBQUdBLHFCQUFxQkEsQ0FBQ0E7SUFDckNBLHNCQUFlQSxHQUFHQSxvQkFBb0JBLElBQUlBLFFBQVFBLElBQUlBLHVCQUF1QkEsSUFBSUEsUUFBUUEsSUFBSUEsMEJBQTBCQSxJQUFJQSxRQUFRQSxDQUFDQTtJQUdwSUEsYUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7SUFFaENBLFNBQWdCQSxRQUFRQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQTtRQUM5QkMsTUFBTUEsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFDNUVBLENBQUNBO0lBRmVELGVBQVFBLEdBQVJBLFFBRWZBLENBQUFBO0lBRURBLFNBQWdCQSxVQUFVQTtRQUN4QkUsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7UUFDdkNBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLEVBQUVBLE1BQU1BLEVBQUVBLE1BQU1BLENBQUNBLENBQUNBO0lBQzFDQSxDQUFDQTtJQUhlRixpQkFBVUEsR0FBVkEsVUFHZkEsQ0FBQUE7SUFFREEsU0FBZ0JBLGNBQWNBO1FBQzVCRyxJQUFBQSxDQUFDQTtZQUNDQSxJQUFJQSxNQUFNQSxHQUFHQSxRQUFRQSxDQUFDQSxhQUFhQSxDQUFFQSxRQUFRQSxDQUFFQSxDQUFDQTtZQUNoREEsTUFBTUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBUUEsTUFBT0EsQ0FBQ0EscUJBQXFCQSxJQUFJQSxDQUM1Q0EsTUFBTUEsQ0FBQ0EsVUFBVUEsQ0FBRUEsT0FBT0EsQ0FBRUEsSUFDNUJBLE1BQU1BLENBQUNBLFVBQVVBLENBQUVBLG9CQUFvQkEsQ0FBRUEsQ0FBRUEsQ0FDNUNBLENBQUNBO1FBQ1JBLENBQUVBO1FBQUFBLEtBQUtBLENBQUNBLENBQUVBLENBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQ2JBLE1BQU1BLENBQUNBLEtBQUtBLENBQUNBO1FBQ2ZBLENBQUNBO0lBQ0hBLENBQUNBO0lBVmVILHFCQUFjQSxHQUFkQSxjQVVmQSxDQUFBQTtJQUVEQSxTQUFnQkEsV0FBV0EsQ0FBQ0EsS0FBS0EsRUFBRUEsS0FBS0EsRUFBRUEsT0FBZUE7UUFBZkksdUJBQWVBLEdBQWZBLGVBQWVBO1FBQ3ZEQSxJQUFJQSxDQUFDQSxHQUFHQSxLQUFLQSxHQUFHQSxnQkFBU0EsQ0FBQ0E7UUFDMUJBLElBQUlBLENBQUNBLEdBQUdBLEtBQUtBLEdBQUdBLGdCQUFTQSxDQUFDQTtRQUMxQkEsSUFBSUEsQ0FBQ0EsR0FBR0EsT0FBT0EsR0FBR0Esa0JBQVdBLEdBQUdBLENBQUNBLENBQUNBO1FBQ2xDQSxNQUFNQSxDQUFDQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNuQkEsQ0FBQ0E7SUFMZUosa0JBQVdBLEdBQVhBLFdBS2ZBLENBQUFBO0FBSUhBLENBQUNBLEVBdkNNLE1BQU0sS0FBTixNQUFNLFFBdUNaOztBQ3hDRCxJQUFPLE1BQU0sQ0FnQ1o7QUFoQ0QsV0FBTyxNQUFNLEVBQUMsQ0FBQztJQUVGQSxjQUFPQSxHQUFHQSxPQUFPQSxDQUFDQSxNQUFNQSxDQUFDQSxpQkFBVUEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7SUFDekNBLGlCQUFVQSxHQUFHQSxhQUFhQSxDQUFDQSx3QkFBd0JBLENBQUNBLGNBQU9BLEVBQUVBLGlCQUFVQSxDQUFDQSxDQUFDQTtJQUVwRkEsSUFBSUEsR0FBR0EsR0FBR0EsU0FBU0EsQ0FBQ0E7SUFFcEJBLGNBQU9BLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLGdCQUFnQkEsRUFBRUEsMEJBQTBCQSxFQUFFQSxVQUFDQSxjQUF1Q0EsRUFBRUEsT0FBcUNBO1FBQzNJQSxHQUFHQSxHQUFHQSxPQUFPQSxDQUFDQSxNQUFNQSxFQUFFQSxDQUNuQkEsRUFBRUEsQ0FBQ0EsaUJBQVVBLENBQUNBLENBQ2RBLEtBQUtBLENBQUNBLGNBQU1BLGdCQUFTQSxFQUFUQSxDQUFTQSxDQUFDQSxDQUN0QkEsSUFBSUEsQ0FBQ0EsY0FBTUEsdUJBQWdCQSxFQUFoQkEsQ0FBZ0JBLENBQUNBLENBQzVCQSxJQUFJQSxDQUFDQSxjQUFNQSxPQUFBQSxPQUFPQSxDQUFDQSxJQUFJQSxDQUFDQSxtQkFBWUEsRUFBRUEsV0FBV0EsQ0FBQ0EsRUFBdkNBLENBQXVDQSxDQUFDQSxDQUNuREEsS0FBS0EsRUFBRUEsQ0FBQ0E7UUFDWEEsT0FBT0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxjQUFjQSxFQUFFQSxHQUFHQSxDQUFDQSxDQUFDQTtJQUVoREEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7SUFFSkEsY0FBT0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsV0FBV0EsRUFBRUEsVUFBQ0EsR0FBR0E7UUFDNUJBLEdBQUdBLENBQUNBLEVBQUVBLENBQUNBLGFBQWFBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLEVBQUVBLGlCQUFVQSxFQUFFQSxVQUFDQSxJQUFJQTtZQUNqREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsRUFBRUEsS0FBS0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzdCQSxNQUFNQSxDQUFDQTtZQUNUQSxDQUFDQTtZQUNEQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFDQSxHQUFPQSxJQUFLQSxPQUFBQSxHQUFHQSxDQUFDQSxFQUFFQSxLQUFLQSxpQkFBVUEsRUFBckJBLENBQXFCQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDMURBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ3RCQSxDQUFDQTtRQUNIQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUNMQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtJQUdKQSxrQkFBa0JBLENBQUNBLFNBQVNBLENBQUNBLGlCQUFVQSxDQUFDQSxDQUFDQTtBQUUzQ0EsQ0FBQ0EsRUFoQ00sTUFBTSxLQUFOLE1BQU0sUUFnQ1o7O0FDaENELElBQU8sTUFBTSxDQW9EWjtBQXBERCxXQUFPLE1BQU0sRUFBQyxDQUFDO0lBRWJBLGNBQU9BLENBQUNBLFNBQVNBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBLFdBQVdBLEVBQUVBLFVBQUNBLFNBQVNBO1FBQ3ZEQSxNQUFNQSxDQUFDQTtZQUNMQSxRQUFRQSxFQUFFQSxHQUFHQTtZQUNiQSxLQUFLQSxFQUFFQTtnQkFDTEEsUUFBUUEsRUFBRUEsY0FBY0E7YUFDekJBO1lBQ0RBLElBQUlBLEVBQUVBLFVBQUNBLEtBQUtBLEVBQUVBLE9BQU9BLEVBQUVBLElBQUlBO2dCQUN6QkEsSUFBSUEsRUFBRUEsR0FBR0EsT0FBT0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsT0FBT0EsQ0FBQ0E7Z0JBQy9CQSxFQUFFQSxDQUFDQSxDQUFDQSxzQkFBZUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3BCQSxVQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtvQkFDbkJBLElBQUlBLEdBQUdBLEdBQUdBLFNBQVNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO29CQUN2QkEsSUFBSUEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7b0JBRXBCQSxJQUFJQSxpQkFBaUJBLEdBQUdBLFVBQUNBLEtBQUtBO3dCQUM1QkEsRUFBRUEsQ0FBQ0EsQ0FBRUEsR0FBR0EsQ0FBQ0Esa0JBQWtCQSxLQUFLQSxJQUFJQSxJQUMvQkEsR0FBR0EsQ0FBQ0EscUJBQXFCQSxLQUFLQSxJQUFJQSxJQUNsQ0EsR0FBR0EsQ0FBQ0Esd0JBQXdCQSxLQUFLQSxJQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTs0QkFDNUNBLEVBQUVBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLEdBQUdBLE1BQU1BLENBQUNBOzRCQUMxQkEsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7d0JBQy9CQSxDQUFDQTt3QkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7NEJBQ05BLEVBQUVBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLEdBQUdBLEVBQUVBLENBQUNBOzRCQUN0QkEsS0FBS0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsRUFBRUEsSUFBSUEsRUFBRUEsS0FBS0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7d0JBQ2hDQSxDQUFDQTt3QkFDREEsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7b0JBQ3JCQSxDQUFDQSxDQUFDQTtvQkFFRkEsSUFBSUEsZ0JBQWdCQSxHQUFHQSxVQUFDQSxLQUFLQTt3QkFDM0JBLEVBQUVBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLEdBQUdBLEVBQUVBLENBQUNBO29CQUN4QkEsQ0FBQ0EsQ0FBQ0E7b0JBRUZBLEdBQUdBLENBQUNBLGdCQUFnQkEsQ0FBRUEsbUJBQW1CQSxFQUFFQSxpQkFBaUJBLEVBQUVBLEtBQUtBLENBQUVBLENBQUNBO29CQUN0RUEsR0FBR0EsQ0FBQ0EsZ0JBQWdCQSxDQUFFQSxzQkFBc0JBLEVBQUVBLGlCQUFpQkEsRUFBRUEsS0FBS0EsQ0FBRUEsQ0FBQ0E7b0JBQ3pFQSxHQUFHQSxDQUFDQSxnQkFBZ0JBLENBQUVBLHlCQUF5QkEsRUFBRUEsaUJBQWlCQSxFQUFFQSxLQUFLQSxDQUFFQSxDQUFDQTtvQkFFNUVBLEdBQUdBLENBQUNBLGdCQUFnQkEsQ0FBRUEsa0JBQWtCQSxFQUFFQSxnQkFBZ0JBLEVBQUVBLEtBQUtBLENBQUVBLENBQUNBO29CQUNwRUEsR0FBR0EsQ0FBQ0EsZ0JBQWdCQSxDQUFFQSxxQkFBcUJBLEVBQUVBLGdCQUFnQkEsRUFBRUEsS0FBS0EsQ0FBRUEsQ0FBQ0E7b0JBQ3ZFQSxHQUFHQSxDQUFDQSxnQkFBZ0JBLENBQUVBLHdCQUF3QkEsRUFBRUEsZ0JBQWdCQSxFQUFFQSxLQUFLQSxDQUFFQSxDQUFDQTtvQkFFMUVBLEVBQUVBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsT0FBT0EsRUFBRUEsVUFBQ0EsS0FBS0E7d0JBQ2pDQSxFQUFFQSxDQUFDQSxLQUFLQSxDQUFDQSxPQUFPQSxHQUFHQSxNQUFNQSxDQUFDQTt3QkFDMUJBLElBQUlBLENBQUNBLGtCQUFrQkEsR0FBR0EsSUFBSUEsQ0FBQ0Esa0JBQWtCQSxJQUFJQSxJQUFJQSxDQUFDQSxxQkFBcUJBLElBQUlBLElBQUlBLENBQUNBLHdCQUF3QkEsQ0FBQ0E7d0JBQ2pIQSxJQUFJQSxDQUFDQSxrQkFBa0JBLEVBQUVBLENBQUNBO29CQUM1QkEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ0xBLENBQUNBO2dCQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDTkEsRUFBRUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsT0FBT0EsR0FBR0EsTUFBTUEsQ0FBQ0E7Z0JBQzVCQSxDQUFDQTtZQUNIQSxDQUFDQTtTQUNGQSxDQUFBQTtJQUNIQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtBQUVOQSxDQUFDQSxFQXBETSxNQUFNLEtBQU4sTUFBTSxRQW9EWjs7Ozs7Ozs7QUNyREQsSUFBTyxNQUFNLENBMlFaO0FBM1FELFdBQU8sTUFBTSxFQUFDLENBQUM7SUFFYkEsSUFBSUEsR0FBR0EsR0FBa0JBLE1BQU1BLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO0lBRTlDQSxJQUFhQSxlQUFlQTtRQUkxQkssU0FKV0EsZUFBZUEsQ0FJUEEsS0FBU0EsRUFBU0EsUUFBWUE7WUFBOUJDLFVBQUtBLEdBQUxBLEtBQUtBLENBQUlBO1lBQVNBLGFBQVFBLEdBQVJBLFFBQVFBLENBQUlBO1lBRnpDQSxnQkFBV0EsR0FBT0EsSUFBSUEsQ0FBQ0E7WUFHN0JBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1lBQ3pCQSxJQUFJQSxDQUFDQSxXQUFXQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxpQkFBaUJBLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBLFFBQVFBLENBQUNBLENBQUNBO1lBQ3hFQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxDQUFDQTtRQUNuQ0EsQ0FBQ0E7UUFFTUQsaUNBQU9BLEdBQWRBO1lBQ0VFLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBO1lBQ2pDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxPQUFPQSxFQUFFQSxDQUFDQTtZQUN4QkEsT0FBT0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBRU1GLCtCQUFLQSxHQUFaQSxVQUFhQSxNQUFNQTtZQUNqQkcsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsT0FBT0EsR0FBR0EsTUFBTUEsQ0FBQ0E7UUFDcENBLENBQUNBO1FBRU1ILDhCQUFJQSxHQUFYQSxVQUFZQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQTtZQUNqQkksSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDOUJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQzlCQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtZQUM5QkEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7WUFDakNBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLENBQUNBO1lBQ2pDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUNuQ0EsQ0FBQ0E7UUFFTUosZ0NBQU1BLEdBQWJBLFVBQWNBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBO1lBQ3RCSyxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUMvQkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7WUFDL0JBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1lBQy9CQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQTtZQUNsQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0E7WUFDbENBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1FBQ3BDQSxDQUFDQTtRQUVNTCxxQ0FBV0EsR0FBbEJBO1lBQ0VNLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBQzFCQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQTtRQUMxQ0EsQ0FBQ0E7UUFFTU4scUNBQVdBLEdBQWxCQSxVQUFtQkEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7WUFDeEJPLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQzdCQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUM3QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLENBQUNBLFdBQVdBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO1lBQ2hDQSxJQUFJQSxDQUFDQSxXQUFXQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUNoQ0EsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7UUFFbENBLENBQUNBO1FBRU1QLHFDQUFXQSxHQUFsQkEsVUFBbUJBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBLEVBQUVBO1lBQzNCUSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUM5QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOUJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzlCQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtZQUM5QkEsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDOUJBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2hDQSxDQUFDQTtRQUVNUixnQ0FBTUEsR0FBYkE7WUFDRVMsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7UUFDNUJBLENBQUNBO1FBRUhULHNCQUFDQTtJQUFEQSxDQWxFQUwsQUFrRUNLLElBQUFMO0lBbEVZQSxzQkFBZUEsR0FBZkEsZUFrRVpBLENBQUFBO0lBRURBLElBQWFBLFNBQVNBO1FBQVNlLFVBQWxCQSxTQUFTQSxVQUF3QkE7UUFRNUNBLFNBUldBLFNBQVNBLENBUURBLEtBQVVBLEVBQVNBLFVBQXFCQSxFQUFTQSxFQUFTQSxFQUFTQSxHQUFPQTtZQUMzRkMsa0JBQU1BLEtBQUtBLEVBQUVBLElBQUlBLEtBQUtBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBLENBQUNBO1lBRGxCQSxVQUFLQSxHQUFMQSxLQUFLQSxDQUFLQTtZQUFTQSxlQUFVQSxHQUFWQSxVQUFVQSxDQUFXQTtZQUFTQSxPQUFFQSxHQUFGQSxFQUFFQSxDQUFPQTtZQUFTQSxRQUFHQSxHQUFIQSxHQUFHQSxDQUFJQTtZQVByRkEsVUFBS0EsR0FBVUEsU0FBU0EsQ0FBQ0E7WUFDekJBLFdBQU1BLEdBQU9BLFNBQVNBLENBQUNBO1lBQ3ZCQSxhQUFRQSxHQUFHQTtnQkFDakJBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLElBQUlBO2dCQUNqQ0EsQ0FBQ0EsRUFBRUEsSUFBSUEsQ0FBQ0EsTUFBTUEsRUFBRUEsR0FBR0EsSUFBSUEsQ0FBQ0EsRUFBRUEsR0FBR0EsR0FBR0E7Z0JBQ2hDQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxJQUFJQTthQUNsQ0EsQ0FBQ0E7WUFHQUEsSUFBSUEsT0FBT0EsR0FBR0EsS0FBS0EsQ0FBQ0EsVUFBVUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0E7WUFDekRBLE9BQU9BLENBQUNBLFNBQVNBLEdBQUdBLEtBQUtBLENBQUNBLGFBQWFBLENBQUNBO1lBQ3hDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUNiQSxJQUFJQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUNaQSxJQUFJQSxLQUFLQSxDQUFDQSxXQUFXQSxDQUFDQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxFQUFFQSxDQUFDQSxFQUNqQ0EsSUFBSUEsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQTtnQkFDMUJBLEtBQUtBLEVBQUVBLFFBQVFBO2dCQUNmQSxHQUFHQSxFQUFFQSxPQUFPQTtnQkFDWkEsT0FBT0EsRUFBRUEsT0FBT0E7Z0JBQ2hCQSxVQUFVQSxFQUFFQSxJQUFJQTtnQkFDaEJBLGFBQWFBLEVBQUVBLElBQUlBO2dCQUNuQkEsT0FBT0EsRUFBRUEsS0FBS0EsQ0FBQ0EsYUFBYUE7YUFDN0JBLENBQUNBLENBQ0RBLENBQUNBLENBQUNBO1lBQ1RBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLHFCQUFxQkEsRUFBRUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDdkNBLENBQUNBO1FBRU1ELDBCQUFNQSxHQUFiQSxVQUFjQSxLQUFLQSxFQUFFQSxHQUFHQTtZQUN0QkUsSUFBSUEsQ0FBQ0EsR0FBR0EsR0FBR0EsR0FBR0EsQ0FBQ0E7UUFDakJBLENBQUNBO1FBRU1GLDJCQUFPQSxHQUFkQTtZQUNFRyxnQkFBS0EsQ0FBQ0EsT0FBT0EsV0FBRUEsQ0FBQ0E7WUFDaEJBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFFBQVFBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1lBQzdDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSx1QkFBdUJBLEVBQUVBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBO1FBQzlDQSxDQUFDQTtRQUVPSCw0QkFBUUEsR0FBaEJBO1lBQ0VJLElBQUlBLFlBQVlBLEdBQUdBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBO1lBQ2pEQSxJQUFJQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtZQUNwQ0EsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDcERBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFlBQVlBLENBQUNBLENBQUNBLEdBQUdBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQ3BEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxLQUFLQSxHQUFHQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQSxDQUFDQTtRQUNsREEsQ0FBQ0E7UUFFT0osbUNBQWVBLEdBQXZCQTtZQUNFSyxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDaEJBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLEVBQUVBLENBQUNBO2dCQUMzQkEsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsVUFBVUEsRUFBRUEsSUFBSUEsQ0FBQ0EsRUFBRUEsRUFBRUEsYUFBYUEsRUFBRUEsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3BEQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDN0JBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLEVBQUVBLEVBQUVBLFVBQVVBLEVBQUVBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO2dCQUN2REEsSUFBSUEsYUFBYUEsR0FBR0EsRUFBRUEsQ0FBQ0E7Z0JBQ3ZCQSxJQUFJQSxJQUFJQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxpQkFBaUJBLENBQUNBO29CQUNyQ0EsS0FBS0EsRUFBRUEsUUFBUUE7b0JBQ2ZBLFVBQVVBLEVBQUVBLElBQUlBO29CQUNoQkEsYUFBYUEsRUFBRUEsSUFBSUE7b0JBQ25CQSxTQUFTQSxFQUFFQSxJQUFJQTtpQkFDaEJBLENBQUNBLENBQUNBO2dCQUNIQSxhQUFhQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQSxDQUFDQTtnQkFDakNBLGFBQWFBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBO2dCQUNqQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsS0FBS0EsQ0FBQ0EsWUFBWUEsQ0FBQ0EsSUFBSUEsR0FBR0EsQ0FBQ0EsRUFBRUEsSUFBSUEsR0FBR0EsQ0FBQ0EsRUFBRUEsR0FBR0EsQ0FBQ0EsRUFBRUEsSUFBSUEsS0FBS0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxhQUFhQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDekhBLElBQUlBLENBQUNBLFVBQVVBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBO1lBQzVDQSxDQUFDQTtZQUNEQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQTtRQUNwQkEsQ0FBQ0E7UUFFTUwsMEJBQU1BLEdBQWJBO1lBQ0VNLElBQUlBLFVBQVVBLEdBQUdBLElBQUlBLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBO1lBQ3BDQSxJQUFJQSxZQUFZQSxHQUFHQSxJQUFJQSxDQUFDQSxVQUFVQSxDQUFDQSxXQUFXQSxFQUFFQSxDQUFDQTtZQUNqREEsSUFBSUEsQ0FBQ0EsR0FBR0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDckJBLElBQUlBLENBQUNBLEdBQUdBLFVBQVVBLENBQUNBLENBQUNBLENBQUNBO1lBQ3JCQSxJQUFJQSxPQUFPQSxHQUFHQSxZQUFZQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3QkEsSUFBSUEsT0FBT0EsR0FBR0EsWUFBWUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLE9BQU9BLEdBQUdBLENBQUNBLEdBQUdBLE9BQU9BLENBQUNBO1lBQzFCQSxJQUFJQSxPQUFPQSxHQUFHQSxDQUFDQSxHQUFHQSxPQUFPQSxDQUFDQTtZQUMxQkEsSUFBSUEsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsZUFBZUEsRUFBRUEsQ0FBQ0E7WUFDbkNBLElBQUlBLElBQUlBLEdBQUdBLE9BQU9BLEdBQUdBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLENBQUNBO1lBQzNFQSxJQUFJQSxJQUFJQSxHQUFHQSxPQUFPQSxHQUFHQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxHQUFHQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTtZQUMzRUEsSUFBSUEsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsRUFBRUEsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDaENBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQy9EQSxnQkFBS0EsQ0FBQ0EsTUFBTUEsV0FBRUEsQ0FBQ0E7UUFDakJBLENBQUNBO1FBQ0hOLGdCQUFDQTtJQUFEQSxDQWxGQWYsQUFrRkNlLEVBbEY4QmYsZUFBZUEsRUFrRjdDQTtJQWxGWUEsZ0JBQVNBLEdBQVRBLFNBa0ZaQSxDQUFBQTtJQUVEQSxJQUFhQSxVQUFVQTtRQUFTc0IsVUFBbkJBLFVBQVVBLFVBQXdCQTtRQVU3Q0EsU0FWV0EsVUFBVUEsQ0FVVEEsS0FBVUEsRUFBU0EsRUFBU0EsRUFBU0EsR0FBT0E7WUFDdERDLGtCQUFNQSxLQUFLQSxFQUFFQSxJQUFJQSxLQUFLQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQSxDQUFBQTtZQURMQSxPQUFFQSxHQUFGQSxFQUFFQSxDQUFPQTtZQUFTQSxRQUFHQSxHQUFIQSxHQUFHQSxDQUFJQTtZQVRoREEsWUFBT0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDZEEsWUFBT0EsR0FBR0EsR0FBR0EsQ0FBQ0E7WUFDZkEsU0FBSUEsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDVkEsYUFBUUEsR0FBR0E7Z0JBQ2hCQSxDQUFDQSxFQUFFQSxDQUFDQTtnQkFDSkEsQ0FBQ0EsRUFBRUEsQ0FBQ0E7Z0JBQ0pBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLElBQUlBO2FBQ2xDQSxDQUFBQTtZQXlGT0EsU0FBSUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFyRmZBLElBQUlBLE9BQU9BLEdBQUdBLEtBQUtBLENBQUNBLFVBQVVBLENBQUNBLFdBQVdBLENBQUNBLHFCQUFxQkEsQ0FBQ0EsQ0FBQ0E7WUFDbEVBLE9BQU9BLENBQUNBLFNBQVNBLEdBQUdBLEtBQUtBLENBQUNBLGFBQWFBLENBQUNBO1lBQ3hDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUNiQSxJQUFJQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQSxFQUFFQSxJQUFJQSxDQUFDQSxFQUN2Q0EsSUFBSUEsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FDWkEsSUFBSUEsS0FBS0EsQ0FBQ0EsY0FBY0EsQ0FBQ0EsR0FBR0EsRUFBRUEsRUFBRUEsRUFBRUEsRUFBRUEsQ0FBQ0EsRUFDckNBLElBQUlBLEtBQUtBLENBQUNBLGlCQUFpQkEsQ0FBQ0E7Z0JBQzFCQSxLQUFLQSxFQUFFQSxRQUFRQTtnQkFDZkEsR0FBR0EsRUFBRUEsT0FBT0E7Z0JBQ1pBLE9BQU9BLEVBQUVBLE9BQU9BO2dCQUNoQkEsUUFBUUEsRUFBRUEsUUFBUUE7Z0JBQ2xCQSxPQUFPQSxFQUFFQSxLQUFLQSxDQUFDQSxhQUFhQTthQUM3QkEsQ0FBQ0EsQ0FDSEEsQ0FDRkEsQ0FBQ0E7WUFDSkEsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0Esc0JBQXNCQSxFQUFFQSxFQUFFQSxDQUFDQSxDQUFDQTtRQUN4Q0EsQ0FBQ0E7UUFFTUQsMkJBQU1BLEdBQWJBLFVBQWNBLEtBQUtBLEVBQUVBLElBQUlBO1lBQXpCRSxpQkFrQkNBO1lBakJDQSxJQUFJQSxDQUFDQSxHQUFHQSxHQUFHQSxJQUFJQSxDQUFDQTtZQUNoQkEsSUFBSUEsWUFBWUEsR0FBR0EsRUFBRUEsQ0FBQ0E7WUFDdEJBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLEVBQUVBLFVBQUNBLEdBQUdBLEVBQUVBLEdBQUdBO2dCQUMxQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQzlCQSxZQUFZQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtnQkFDekJBLENBQUNBO1lBQ0hBLENBQUNBLENBQUNBLENBQUNBO1lBQ0hBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLFlBQVlBLEVBQUVBLFVBQUNBLEVBQUVBLElBQUtBLE9BQUFBLEtBQUlBLENBQUNBLFNBQVNBLENBQUNBLEVBQUVBLENBQUNBLEVBQWxCQSxDQUFrQkEsQ0FBQ0EsQ0FBQ0E7WUFDcERBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLElBQUlBLEVBQUVBLFVBQUNBLEdBQU9BO2dCQUMvQkEsSUFBSUEsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0E7Z0JBQ3BCQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxLQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDdkJBLEtBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO2dCQUN6QkEsQ0FBQ0E7Z0JBQUNBLElBQUlBLENBQUNBLENBQUNBO29CQUNOQSxJQUFJQSxNQUFNQSxHQUFHQSxLQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtvQkFDN0JBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBLEtBQUtBLEVBQUVBLEdBQUdBLENBQUNBLENBQUNBO2dCQUM1QkEsQ0FBQ0E7WUFDSEEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7UUFDTEEsQ0FBQ0E7UUFFTUYsMEJBQUtBLEdBQVpBLFVBQWFBLE1BQU1BO1lBQW5CRyxpQkFJQ0E7WUFIQ0EsSUFBSUEsR0FBR0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQUE7WUFDM0JBLENBQUNBLENBQUNBLE9BQU9BLENBQUNBLEdBQUdBLEVBQUVBLFVBQUNBLEVBQUVBLElBQUtBLE9BQUFBLEtBQUlBLENBQUNBLElBQUlBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE1BQU1BLENBQUNBLEVBQTNCQSxDQUEyQkEsQ0FBQ0EsQ0FBQ0E7WUFDcERBLGdCQUFLQSxDQUFDQSxLQUFLQSxZQUFDQSxNQUFNQSxDQUFDQSxDQUFDQTtRQUN0QkEsQ0FBQ0E7UUFFTUgsNEJBQU9BLEdBQWRBO1lBQUFJLGlCQU9DQTtZQU5DQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDZEEsSUFBSUEsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7Z0JBQy9CQSxDQUFDQSxDQUFDQSxPQUFPQSxDQUFDQSxNQUFNQSxFQUFFQSxVQUFDQSxFQUFFQSxJQUFLQSxPQUFBQSxLQUFJQSxDQUFDQSxTQUFTQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFsQkEsQ0FBa0JBLENBQUNBLENBQUNBO1lBQ2hEQSxDQUFDQTtZQUNEQSxnQkFBS0EsQ0FBQ0EsT0FBT0EsV0FBRUEsQ0FBQ0E7WUFDaEJBLEdBQUdBLENBQUNBLEtBQUtBLENBQUNBLHlCQUF5QkEsRUFBRUEsSUFBSUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0E7UUFDaERBLENBQUNBO1FBRU1KLDhCQUFTQSxHQUFoQkEsVUFBaUJBLEVBQUVBO1lBQ2pCSyxJQUFJQSxHQUFHQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUN4QkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ1JBLEdBQUdBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO2dCQUNkQSxPQUFPQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQTtZQUN2QkEsQ0FBQ0E7UUFDSEEsQ0FBQ0E7UUFFTUwsMkJBQU1BLEdBQWJBLFVBQWNBLEdBQUdBLEVBQUVBLENBQUtBO1lBQ3RCTSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDckJBLE1BQU1BLENBQUNBO1lBQ1RBLENBQUNBO1lBQ0RBLElBQUlBLFVBQVVBLEdBQUdBLElBQUlBLENBQUNBLFdBQVdBLEVBQUVBLENBQUNBO1lBQ3BDQSxJQUFJQSxVQUFVQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUM3Q0EsSUFBSUEsVUFBVUEsR0FBR0EsVUFBVUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFNOUJBLElBQUlBLEdBQUdBLEdBQUdBLElBQUlBLFNBQVNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLEVBQUVBLElBQUlBLEVBQUVBLEdBQUdBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO1lBQ2xEQSxHQUFHQSxDQUFDQSxXQUFXQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQSxFQUFFQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUMxREEsR0FBR0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDN0JBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLEdBQUdBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUNBO1lBQ3ZEQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxFQUFFQSxHQUFHQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQTtZQUN2REEsSUFBSUEsQ0FBQ0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsR0FBR0EsQ0FBQ0E7UUFDdkJBLENBQUNBO1FBRU1OLDJCQUFNQSxHQUFiQSxVQUFjQSxFQUFFQTtZQUNkTyxNQUFNQSxDQUFDQSxDQUFDQSxFQUFFQSxJQUFJQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQSxDQUFDQTtRQUMzQkEsQ0FBQ0E7UUFJTVAsMkJBQU1BLEdBQWJBO1lBQ0VRLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEVBQUVBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO1lBQy9EQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxVQUFDQSxTQUFTQSxFQUFFQSxFQUFFQTtnQkFDL0JBLFNBQVNBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBO1lBQ3JCQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUNIQSxJQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUMxQkEsZ0JBQUtBLENBQUNBLE1BQU1BLFdBQUVBLENBQUNBO1FBQ2pCQSxDQUFDQTtRQUdIUixpQkFBQ0E7SUFBREEsQ0E3R0F0QixBQTZHQ3NCLEVBN0crQnRCLGVBQWVBLEVBNkc5Q0E7SUE3R1lBLGlCQUFVQSxHQUFWQSxVQTZHWkEsQ0FBQUE7QUFFSEEsQ0FBQ0EsRUEzUU0sTUFBTSxLQUFOLE1BQU0sUUEyUVo7O0FDMVFELElBQU8sTUFBTSxDQXdIWjtBQXhIRCxXQUFPLE1BQU0sRUFBQyxDQUFDO0lBRWJBLElBQUlBLFNBQVNBLEdBQ1hBO1FBQ0VBLENBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLENBQUVBO1FBQzFCQSxDQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxDQUFFQTtRQUMxQkEsQ0FBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsQ0FBRUE7UUFDMUJBLENBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLENBQUVBO1FBQzFCQSxDQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxDQUFFQTtRQUMxQkEsQ0FBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsRUFBRUEsUUFBQ0EsQ0FBRUE7UUFDMUJBLENBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLEVBQUVBLFFBQUNBLENBQUVBO1FBQzFCQSxDQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxFQUFFQSxRQUFDQSxDQUFFQTtLQUMzQkEsQ0FBQ0E7SUFFSkEsSUFBSUEsVUFBVUEsR0FBR0EsU0FBU0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0E7SUFDckNBLElBQUlBLFdBQVdBLEdBQUdBLFNBQVNBLENBQUNBLE1BQU1BLENBQUNBO0lBRW5DQSxJQUFJQSxXQUFXQSxHQUFHQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxXQUFXQSxDQUFDQSxrQkFBa0JBLENBQUNBLENBQUNBO0lBQ25FQSxXQUFXQSxDQUFDQSxTQUFTQSxHQUFHQSxLQUFLQSxDQUFDQSxhQUFhQSxDQUFDQTtJQUM1Q0EsSUFBSUEsWUFBWUEsR0FBR0EsSUFBSUEsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQTtRQUM3Q0EsS0FBS0EsRUFBRUEsUUFBUUE7UUFDZkEsR0FBR0EsRUFBRUEsV0FBV0E7UUFDaEJBLFVBQVVBLEVBQUVBLElBQUlBO1FBQ2hCQSxhQUFhQSxFQUFFQSxJQUFJQTtRQUNuQkEsU0FBU0EsRUFBRUEsS0FBS0E7S0FDakJBLENBQUNBLENBQUNBO0lBQ0hBLElBQUlBLElBQUlBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLElBQUlBLENBQUNBLElBQUlBLEtBQUtBLENBQUNB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LENBQUNBO29CQUNaQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDbENBLElBQUlBLENBQUNBLE1BQU1BLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO29CQUNsQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQ2xDQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFDQTtvQkFDN0RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO29CQUNuQ0EsSUFBSUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsV0FBV0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RDQSxDQUFDQTtnQkFBQ0EsSUFBSUEsQ0FBQ0EsQ0FBQ0E7b0JBQ05BLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLFFBQVFBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEVBQUVBLENBQUNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBO29CQUMvQkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7b0JBQy9CQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxRQUFRQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQSxFQUFFQSxDQUFDQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFDbkNBLENBQUNBO1lBRUhBLENBQUNBOzs7V0FBQUY7UUFFTUEsd0NBQXVCQSxHQUE5QkEsVUFBK0JBLElBQUlBO1lBQ2pDRyxJQUFJQSxDQUFDQSxlQUFlQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUM5QkEsQ0FBQ0E7UUFNREgsc0JBQVdBLDBCQUFNQTtpQkFBakJBO2dCQUNFSSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQTtZQUNsQkEsQ0FBQ0E7OztXQUFBSjtRQUVNQSx1QkFBTUEsR0FBYkEsVUFBY0EsR0FBR0E7WUFDZkssSUFBSUEsQ0FBQ0EsT0FBT0EsR0FBR0EsR0FBR0EsQ0FBQ0E7UUFDckJBLENBQUNBO1FBRU1MLHdCQUFPQSxHQUFkQTtZQUNFTSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxDQUFDQTtZQUM1QkEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsT0FBT0EsRUFBRUEsQ0FBQ0E7WUFDbkJBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLEVBQUVBLENBQUNBO1lBQ3JCQSxDQUFDQSxDQUFDQSxLQUFLQSxDQUFDQSxJQUFJQSxDQUFDQSxRQUFRQSxFQUFFQSxVQUFDQSxPQUFPQSxFQUFFQSxHQUFHQSxJQUFLQSxPQUFBQSxRQUFRQSxDQUFDQSxtQkFBbUJBLENBQUNBLEdBQUdBLEVBQUVBLE9BQU9BLENBQUNBLEVBQTFDQSxDQUEwQ0EsQ0FBQ0EsQ0FBQ0E7UUFDdkZBLENBQUNBO1FBS01OLHVCQUFNQSxHQUFiQTtZQUNFTyxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxJQUFJQSxDQUFDQSxzQkFBZUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3RDQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQSxDQUFDQTtvQkFDakJBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLEVBQUVBLEdBQUdBLE1BQU1BLENBQUNBO29CQUNoQ0EsSUFBSUEsQ0FBQ0EsTUFBTUEsQ0FBQ0EsS0FBS0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsT0FBT0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7Z0JBQ3pDQSxDQUFDQTtnQkFDREEsTUFBTUEsQ0FBQ0E7WUFDVEEsQ0FBQ0E7WUFFREEsSUFBSUEsU0FBU0EsR0FBR0EsSUFBSUEsQ0FBQ0EsU0FBU0EsQ0FBQ0E7WUFDL0JBLElBQUlBLFFBQVFBLEdBQUdBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBO1lBQzdCQSxJQUFJQSxFQUFFQSxHQUFHQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQTtZQUVyQkEsU0FBU0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsSUFBSUEsQ0FBRUEsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsQ0FBRUEsQ0FBQ0E7WUFDL0NBLFNBQVNBLENBQUNBLEdBQUdBLENBQUNBLE1BQU1BLENBQUNBLENBQUNBLElBQUlBLEVBQUVBLENBQUNBO1lBRTdCQSxJQUFJQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxlQUFlQSxFQUFFQSxDQUFDQTtZQUVyQ0EsSUFBSUEsYUFBYUEsR0FBR0EsU0FBU0EsQ0FBQ0EsZ0JBQWdCQSxDQUFDQSxPQUFPQSxDQUFDQSxDQUFDQTtZQUV4REEsSUFBSUEsVUFBVUEsR0FBR0EsYUFBYUEsQ0FBQ0EsTUFBTUEsR0FBR0EsQ0FBQ0EsQ0FBQ0E7WUFFMUNBLElBQUlBLElBQUlBLEdBQUdBLFdBQVdBLENBQUNBLEdBQUdBLEVBQUVBLENBQUNBO1lBQzdCQSxJQUFJQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQSxPQUFPQSxHQUFHQSxJQUFJQSxDQUFDQSxlQUFlQSxHQUFHQSxJQUFJQSxDQUFDQSxlQUFlQSxDQUFDQTtZQUMxRUEsSUFBSUEsS0FBS0EsR0FBR0EsQ0FBQ0EsSUFBSUEsR0FBR0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0EsR0FBR0EsUUFBUUEsQ0FBQ0E7WUFFOUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLElBQUlBLEdBQUdBLEtBQUtBLENBQUNBO1lBQ3hDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUV4Q0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsR0FBR0EsR0FBR0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFFbENBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLE9BQU9BLENBQUNBO2dCQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUM5Q0EsRUFBRUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsQ0FBQ0EsUUFBUUEsQ0FBQ0E7Z0JBQUNBLFFBQVFBLENBQUNBLENBQUNBLElBQUlBLEtBQUtBLEdBQUdBLEtBQUtBLENBQUNBO1lBQy9DQSxFQUFFQSxDQUFDQSxDQUFDQSxJQUFJQSxDQUFDQSxJQUFJQSxDQUFDQTtnQkFBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsSUFBSUEsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0E7WUFDM0NBLEVBQUVBLENBQUNBLENBQUNBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBO2dCQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxJQUFJQSxLQUFLQSxHQUFHQSxLQUFLQSxDQUFDQTtZQUU1Q0EsRUFBRUEsQ0FBQ0EsQ0FBRUEsVUFBVUEsS0FBS0EsSUFBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0JBQzFCQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFFQSxDQUFDQSxFQUFFQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFFQSxDQUFDQTtnQkFDdkNBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBO1lBQ3RCQSxDQUFDQTtZQUVEQSxFQUFFQSxDQUFDQSxVQUFVQSxDQUFFQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxDQUFFQSxDQUFDQTtZQUNwQ0EsRUFBRUEsQ0FBQ0EsVUFBVUEsQ0FBRUEsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBRUEsQ0FBQ0E7WUFDcENBLEVBQUVBLENBQUNBLFVBQVVBLENBQUVBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUVBLENBQUNBO1lBRXBDQSxFQUFFQSxDQUFDQSxDQUFFQSxFQUFFQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTtnQkFFekJBLFFBQVFBLENBQUNBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBO2dCQUNmQSxFQUFFQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxFQUFFQSxDQUFDQTtnQkFDbkJBLElBQUlBLENBQUNBLE9BQU9BLEdBQUdBLElBQUlBLENBQUNBO1lBQ3RCQSxDQUFDQTtZQUVEQSxJQUFJQSxDQUFDQSxRQUFRQSxHQUFHQSxJQUFJQSxDQUFDQTtRQUN2QkEsQ0FBQ0E7UUFDSFAsYUFBQ0E7SUFBREEsQ0FyTkF0QyxBQXFOQ3NDLElBQUF0QztJQXJOWUEsYUFBTUEsR0FBTkEsTUFxTlpBLENBQUFBO0FBQ0hBLENBQUNBLEVBeE5NLE1BQU0sS0FBTixNQUFNLFFBd05aOztBQ3pORCxJQUFPLE1BQU0sQ0FxSFo7QUFySEQsV0FBTyxNQUFNLEVBQUMsQ0FBQztJQUViQSxJQUFJQSxhQUFhQSxHQUFHQSxTQUFTQSxDQUFDQTtJQUU5QkEsY0FBT0EsQ0FBQ0EsU0FBU0EsQ0FBQ0EsYUFBYUEsRUFBRUEsQ0FBQ0E7UUFDaENBLEtBQUtBLENBQUNBLFVBQVVBLENBQUNBLFdBQVdBLEdBQUdBLEVBQUVBLENBQUNBO1FBQ2xDQSxNQUFNQSxDQUFDQTtZQUNMQSxRQUFRQSxFQUFFQSxHQUFHQTtZQUNiQSxPQUFPQSxFQUFFQSxJQUFJQTtZQUNiQSxLQUFLQSxFQUFFQTtnQkFDTEEsTUFBTUEsRUFBRUEsSUFBSUEsR0FBR0EsYUFBYUE7YUFDN0JBO1lBQ0RBLElBQUlBLEVBQUVBLFVBQUNBLEtBQUtBLEVBQUVBLE9BQU9BLEVBQUVBLEtBQUtBO2dCQUUxQkEsSUFBSUEsS0FBS0EsR0FBT0EsSUFBSUEsQ0FBQ0E7Z0JBQ3JCQSxJQUFJQSxNQUFNQSxHQUFPQSxJQUFJQSxDQUFDQTtnQkFDdEJBLElBQUlBLFFBQVFBLEdBQU9BLElBQUlBLENBQUNBO2dCQUN4QkEsSUFBSUEsYUFBYUEsR0FBR0EsSUFBSUEsQ0FBQ0E7Z0JBQ3pCQSxJQUFJQSxZQUFZQSxHQUFPQSxJQUFJQSxDQUFDQTtnQkFFNUJBLFNBQVNBLElBQUlBO29CQUNYOEMsYUFBYUEsR0FBR0EsS0FBS0EsQ0FBQ0E7Z0JBQ3hCQSxDQUFDQTtnQkFFRDlDLFNBQVNBLE9BQU9BO29CQUNkK0MsQ0FBQ0EsQ0FBQ0EsTUFBTUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsUUFBUUEsRUFBRUEsVUFBVUEsQ0FBQ0EsQ0FBQ0E7b0JBQ3BDQSxPQUFPQSxRQUFRQSxDQUFDQTtvQkFDaEJBLE9BQU9BLE1BQU1BLENBQUNBO29CQUNkQSxPQUFPQSxLQUFLQSxDQUFDQTtvQkFDYkEsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsQ0FBQ0E7Z0JBQ2xCQSxDQUFDQTtnQkFFRC9DLElBQUlBLFVBQVVBLEdBQUdBO29CQUNiQSxVQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQTtvQkFDdEJBLE9BQU9BLENBQUNBLElBQUlBLENBQUNBLFFBQVFBLENBQUNBLENBQUNBLEtBQUtBLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLEVBQUVBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLE9BQU9BLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBO29CQUN2RUEsTUFBTUEsQ0FBQ0EsTUFBTUEsR0FBR0EsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0E7b0JBQ25EQSxNQUFNQSxDQUFDQSxzQkFBc0JBLEVBQUVBLENBQUNBO29CQUNoQ0EsUUFBUUEsQ0FBQ0EsT0FBT0EsQ0FBQ0EsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsRUFBRUEsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsQ0FBQ0EsQ0FBQ0E7Z0JBQ3hEQSxDQUFDQSxDQUFBQTtnQkFFREEsT0FBT0EsQ0FBQ0EsRUFBRUEsQ0FBQ0EsVUFBVUEsRUFBRUE7b0JBQ3JCQSxJQUFJQSxFQUFFQSxDQUFDQTtvQkFDUEEsVUFBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsaUJBQWlCQSxDQUFDQSxDQUFDQTtnQkFDL0JBLENBQUNBLENBQUNBLENBQUNBO2dCQUVIQSxLQUFLQSxDQUFDQSxNQUFNQSxDQUFDQSxRQUFRQSxFQUFFQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxVQUFDQSxNQUFNQTtvQkFDdkNBLElBQUlBLEVBQUVBLENBQUNBO29CQUNQQSxFQUFFQSxDQUFDQSxDQUFDQSxDQUFDQSxNQUFNQSxJQUFJQSxDQUFDQSxNQUFNQSxDQUFDQSxVQUFVQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbENBLFVBQUdBLENBQUNBLEtBQUtBLENBQUNBLHNCQUFzQkEsQ0FBQ0EsQ0FBQ0E7d0JBQ2xDQSxNQUFNQSxDQUFDQTtvQkFDVEEsQ0FBQ0E7b0JBQ0RBLFVBQUdBLENBQUNBLEtBQUtBLENBQUNBLGdCQUFnQkEsQ0FBQ0EsQ0FBQ0E7b0JBQzVCQSxLQUFLQSxHQUFHQSxJQUFJQSxLQUFLQSxDQUFDQSxLQUFLQSxFQUFFQSxDQUFDQTtvQkFDMUJBLE1BQU1BLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLGlCQUFpQkEsQ0FBQ0EsRUFBRUEsRUFBRUEsT0FBT0EsQ0FBQ0EsS0FBS0EsRUFBRUEsR0FBR0EsT0FBT0EsQ0FBQ0EsTUFBTUEsRUFBRUEsRUFBRUEsR0FBR0EsRUFBRUEsS0FBS0EsQ0FBQ0EsQ0FBQ0E7b0JBRXpGQSxNQUFNQSxDQUFDQSxLQUFLQSxHQUFHQSxVQUFDQSxJQUFRQSxFQUFFQSxLQUFLQSxFQUFFQSxDQUFjQTt3QkFBZEEsaUJBQWNBLEdBQWRBLFVBQWNBO3dCQUc3Q0EsSUFBSUEsTUFBTUEsR0FBR0EsSUFBSUEsQ0FBQ0EsSUFBSUEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7d0JBQzNCQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxJQUFJQSxFQUFFQSxDQUFDQSxDQUFDQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxNQUFNQSxHQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFFaERBLEVBQUVBLENBQUNBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLElBQUlBLE1BQU1BLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBOzRCQUM1QkEsTUFBTUEsQ0FBQ0E7d0JBQ1RBLENBQUNBO3dCQUNEQSxJQUFJQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFFQSxDQUFDQSxNQUFNQSxDQUFDQSxHQUFHQSxHQUFHQSxDQUFDQSxDQUFFQSxHQUFHQSxDQUFFQSxJQUFJQSxDQUFDQSxFQUFFQSxHQUFHQSxHQUFHQSxDQUFFQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDbEZBLElBQUlBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEtBQUtBLENBQUNBLEtBQUtBLEdBQUdBLElBQUlBLENBQUNBLEdBQUdBLENBQUVBLENBQUNBLE1BQU1BLENBQUNBLEdBQUdBLEdBQUdBLENBQUNBLENBQUVBLEdBQUdBLENBQUVBLElBQUlBLENBQUNBLEVBQUVBLEdBQUdBLEdBQUdBLENBQUVBLENBQUNBLENBQUNBLENBQUNBO3dCQUNqRkEsSUFBSUEsS0FBS0EsR0FBR0EsQ0FBQ0EsS0FBS0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBRTVCQSxJQUFJQSxDQUFDQSxHQUFHQSxJQUFJQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDakNBLElBQUlBLE1BQU1BLEdBQUdBLEdBQUdBLENBQUNBO3dCQUNqQkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsR0FBR0EsQ0FBQ0EsS0FBS0EsQ0FBQ0EsQ0FBQ0E7d0JBQ3ZDQSxDQUFDQSxDQUFDQSxRQUFRQSxDQUFDQSxDQUFDQSxHQUFHQSxLQUFLQSxHQUFHQSxJQUFJQSxDQUFDQSxHQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxDQUFDQTt3QkFDdkNBLEVBQUVBLENBQUNBLENBQUNBLENBQUNBLEtBQUtBLEtBQUtBLENBQUNBLENBQUNBLENBQUNBOzRCQUNoQkEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ2RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLEtBQUtBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO2dDQUM3QkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3ZCQSxDQUFDQTs0QkFDREEsRUFBRUEsQ0FBQ0EsQ0FBQ0EsQ0FBQ0EsR0FBR0EsS0FBS0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7Z0NBQ2RBLElBQUlBLENBQUNBLEdBQUdBLENBQUNBLEtBQUtBLEdBQUdBLENBQUNBLENBQUNBLEdBQUdBLE1BQU1BLENBQUNBO2dDQUM3QkEsQ0FBQ0EsQ0FBQ0EsUUFBUUEsQ0FBQ0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsR0FBR0EsQ0FBQ0EsQ0FBQ0E7NEJBQ3ZCQSxDQUFDQTt3QkFDSEEsQ0FBQ0E7d0JBQ0RBLENBQUNBLENBQUNBLE1BQU1BLENBQUNBLElBQUlBLENBQUNBLE1BQU1BLEVBQUVBLENBQUNBLENBQUNBO29CQUMxQkEsQ0FBQ0EsQ0FBQ0E7b0JBRUZBLEVBQUVBLENBQUNBLENBQUVBLHFCQUFjQSxFQUFHQSxDQUFDQSxDQUFDQSxDQUFDQTt3QkFDdkJBLFFBQVFBLEdBQUdBLElBQUlBLEtBQUtBLENBQUNBLGFBQWFBLEVBQUVBLENBQUNBO29CQUN2Q0EsQ0FBQ0E7b0JBQUNBLElBQUlBLENBQUNBLENB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QUFDQSxDQUFDQTtnQkFDL0JBLFVBQVVBLENBQUNBLEtBQUtBLENBQUNBLFVBQVVBLENBQUNBLENBQUNBO1lBQy9CQSxDQUFDQSxDQUFDQSxDQUFDQTtZQUVIQSxVQUFHQSxDQUFDQSxLQUFLQSxDQUFDQSxlQUFlQSxDQUFDQSxDQUFDQTtZQUMzQkEsUUFBUUEsR0FBR0EsS0FBS0EsQ0FBQ0E7UUFDbkJBLENBQUNBO1FBQ0RoRCxNQUFNQSxDQUFDQSxHQUFHQSxDQUFDQSx3QkFBd0JBLEVBQUVBLFVBQVVBLENBQUNBLENBQUNBO0lBQ25EQSxDQUFDQSxDQUFDQSxDQUFDQSxDQUFDQTtBQUVOQSxDQUFDQSxFQS9ITSxNQUFNLEtBQU4sTUFBTSxRQStIWiIsImZpbGUiOiJjb21waWxlZC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vLyBDb3B5cmlnaHQgMjAxNC0yMDE1IFJlZCBIYXQsIEluYy4gYW5kL29yIGl0cyBhZmZpbGlhdGVzXG4vLy8gYW5kIG90aGVyIGNvbnRyaWJ1dG9ycyBhcyBpbmRpY2F0ZWQgYnkgdGhlIEBhdXRob3IgdGFncy5cbi8vL1xuLy8vIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4vLy8geW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuLy8vIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuLy8vXG4vLy8gICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbi8vL1xuLy8vIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbi8vLyBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4vLy8gV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4vLy8gU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuLy8vIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vbGlicy9oYXd0aW8tdXRpbGl0aWVzL2RlZnMuZC50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCIuLi9saWJzL2hhd3Rpby1rdWJlcm5ldGVzL2RlZnMuZC50c1wiLz5cblxuZGVjbGFyZSB2YXIgVEhSRUU6YW55O1xuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxubW9kdWxlIEt1YmUzZCB7XG5cbiAgZXhwb3J0IHZhciBXID0gMTtcbiAgZXhwb3J0IHZhciBTID0gMDtcbiAgZXhwb3J0IHZhciBXQUxMID0gVztcbiAgZXhwb3J0IHZhciBTUEFDRSA9IFM7XG5cbiAgZXhwb3J0IHZhciBDRUxMX1NJWkUgPSAxMDA7XG4gIGV4cG9ydCB2YXIgRkxPT1JfTEVWRUwgPSAtQ0VMTF9TSVpFO1xuXG4gIGV4cG9ydCBpbnRlcmZhY2UgUmVuZGVyYWJsZSB7XG4gICAgcmVuZGVyKCk6dm9pZDtcbiAgICBkZXN0cm95KCk6dm9pZDtcbiAgfVxuXG4gIGV4cG9ydCBpbnRlcmZhY2UgU2NlbmVPYmplY3QgZXh0ZW5kcyBSZW5kZXJhYmxle1xuICAgIGdldFBvc2l0aW9uKCk6YW55O1xuICAgIHNldFBvc2l0aW9uKHgsIHksIHopO1xuICAgIHNldFJvdGF0aW9uKHJ4LCByeSwgcnopO1xuICB9O1xufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uLy4uL2luY2x1ZGVzLnRzXCIvPlxuLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZEludGVyZmFjZXMudHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuICBleHBvcnQgdmFyIHBsdWdpbk5hbWUgPSAnS3ViZTNkJztcbiAgZXhwb3J0IHZhciBsb2c6TG9nZ2luZy5Mb2dnZXIgPSBMb2dnZXIuZ2V0KHBsdWdpbk5hbWUpO1xuICBleHBvcnQgdmFyIHRlbXBsYXRlUGF0aCA9ICdwbHVnaW5zL2t1YmUzZC9odG1sJztcbiAgZXhwb3J0IHZhciBoYXZlUG9pbnRlckxvY2sgPSAncG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCB8fCAnbW96UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCB8fCAnd2Via2l0UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudDtcblxuXG4gIGV4cG9ydCB2YXIgSGFsZlBJID0gTWF0aC5QSSAvIDI7XG5cbiAgZXhwb3J0IGZ1bmN0aW9uIHJnYlRvSGV4KHIsIGcsIGIpIHtcbiAgICByZXR1cm4gXCIjXCIgKyAoKDEgPDwgMjQpICsgKHIgPDwgMTYpICsgKGcgPDwgOCkgKyBiKS50b1N0cmluZygxNikuc2xpY2UoMSk7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gcmFuZG9tR3JleSgpIHtcbiAgICB2YXIgcmdiVmFsID0gTWF0aC5yYW5kb20oKSAqIDEyOCArIDEyODtcbiAgICByZXR1cm4gcmdiVG9IZXgocmdiVmFsLCByZ2JWYWwsIHJnYlZhbCk7XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gd2ViZ2xBdmFpbGFibGUoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBjYW52YXMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCAnY2FudmFzJyApO1xuICAgICAgcmV0dXJuICEhKCAoPGFueT53aW5kb3cpLldlYkdMUmVuZGVyaW5nQ29udGV4dCAmJiAoXG4gICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCggJ3dlYmdsJyApIHx8XG4gICAgICAgICAgICBjYW52YXMuZ2V0Q29udGV4dCggJ2V4cGVyaW1lbnRhbC13ZWJnbCcgKSApXG4gICAgICAgICAgKTtcbiAgICB9IGNhdGNoICggZSApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBleHBvcnQgZnVuY3Rpb24gcGxhY2VPYmplY3QoY2VsbFgsIGNlbGxZLCBpc0Zsb29yID0gZmFsc2UpIHtcbiAgICB2YXIgeCA9IGNlbGxYICogQ0VMTF9TSVpFO1xuICAgIHZhciB6ID0gY2VsbFkgKiBDRUxMX1NJWkU7XG4gICAgdmFyIHkgPSBpc0Zsb29yID8gRkxPT1JfTEVWRUwgOiAwO1xuICAgIHJldHVybiBbeCwgeSwgel07XG4gIH1cblxuXG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RIZWxwZXJzLnRzXCIvPlxuXG5tb2R1bGUgS3ViZTNkIHtcblxuICBleHBvcnQgdmFyIF9tb2R1bGUgPSBhbmd1bGFyLm1vZHVsZShwbHVnaW5OYW1lLCBbXSk7XG4gIGV4cG9ydCB2YXIgY29udHJvbGxlciA9IFBsdWdpbkhlbHBlcnMuY3JlYXRlQ29udHJvbGxlckZ1bmN0aW9uKF9tb2R1bGUsIHBsdWdpbk5hbWUpO1xuXG4gIHZhciB0YWIgPSB1bmRlZmluZWQ7XG5cbiAgX21vZHVsZS5jb25maWcoWyckcm91dGVQcm92aWRlcicsIFwiSGF3dGlvTmF2QnVpbGRlclByb3ZpZGVyXCIsICgkcm91dGVQcm92aWRlcjogbmcucm91dGUuSVJvdXRlUHJvdmlkZXIsIGJ1aWxkZXI6IEhhd3Rpb01haW5OYXYuQnVpbGRlckZhY3RvcnkpID0+IHtcbiAgICB0YWIgPSBidWlsZGVyLmNyZWF0ZSgpXG4gICAgICAuaWQocGx1Z2luTmFtZSlcbiAgICAgIC50aXRsZSgoKSA9PiAnM0QgVmlldycpXG4gICAgICAuaHJlZigoKSA9PiAnL2t1YmVybmV0ZXMvM2QnKVxuICAgICAgLnBhZ2UoKCkgPT4gYnVpbGRlci5qb2luKHRlbXBsYXRlUGF0aCwgJ3ZpZXcuaHRtbCcpKVxuICAgICAgLmJ1aWxkKCk7XG4gICAgYnVpbGRlci5jb25maWd1cmVSb3V0aW5nKCRyb3V0ZVByb3ZpZGVyLCB0YWIpO1xuXG4gIH1dKTtcblxuICBfbW9kdWxlLnJ1bihbJ0hhd3Rpb05hdicsIChuYXYpID0+IHtcbiAgICBuYXYub24oSGF3dGlvTWFpbk5hdi5BY3Rpb25zLkFERCwgcGx1Z2luTmFtZSwgKGl0ZW0pID0+IHtcbiAgICAgIGlmIChpdGVtLmlkICE9PSAna3ViZXJuZXRlcycpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCFfLmFueShpdGVtLnRhYnMsICh0YWI6YW55KSA9PiB0YWIuaWQgPT09IHBsdWdpbk5hbWUpKSB7XG4gICAgICAgIGl0ZW0udGFicy5wdXNoKHRhYik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1dKTtcblxuXG4gIGhhd3Rpb1BsdWdpbkxvYWRlci5hZGRNb2R1bGUocGx1Z2luTmFtZSk7XG5cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIF9tb2R1bGUuZGlyZWN0aXZlKCdyZXF1ZXN0TG9jaycsIFsnJGRvY3VtZW50JywgKCRkb2N1bWVudCkgPT4ge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgc2NvcGU6IHtcbiAgICAgICAgJ29uTG9jayc6ICcmcmVxdWVzdExvY2snXG4gICAgICB9LFxuICAgICAgbGluazogKHNjb3BlLCBlbGVtZW50LCBhdHRyKSA9PiB7XG4gICAgICAgIHZhciBlbCA9IGVsZW1lbnRbMF0gfHwgZWxlbWVudDtcbiAgICAgICAgaWYgKGhhdmVQb2ludGVyTG9jaykge1xuICAgICAgICAgIGxvZy5kZWJ1ZyhcImhlcmUhXCIpO1xuICAgICAgICAgIHZhciBkb2MgPSAkZG9jdW1lbnRbMF07XG4gICAgICAgICAgdmFyIGJvZHkgPSBkb2MuYm9keTtcblxuICAgICAgICAgIHZhciBwb2ludGVybG9ja2NoYW5nZSA9IChldmVudCkgPT4ge1xuICAgICAgICAgICAgaWYgKCBkb2MucG9pbnRlckxvY2tFbGVtZW50ID09PSBib2R5IHx8IFxuICAgICAgICAgICAgICAgICBkb2MubW96UG9pbnRlckxvY2tFbGVtZW50ID09PSBib2R5IHx8IFxuICAgICAgICAgICAgICAgICBkb2Mud2Via2l0UG9pbnRlckxvY2tFbGVtZW50ID09PSBib2R5ICkge1xuICAgICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgICBzY29wZS5vbkxvY2soeyBsb2NrOiB0cnVlIH0pO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgICBzY29wZS5vbkxvY2soeyBsb2NrOiBmYWxzZSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIENvcmUuJGFwcGx5KHNjb3BlKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgdmFyIHBvaW50ZXJsb2NrZXJyb3IgPSAoZXZlbnQpID0+IHtcbiAgICAgICAgICAgIGVsLnN0eWxlLmRpc3BsYXkgPSAnJztcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoICdwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSApO1xuICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCAnbW96cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UgKTtcbiAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lciggJ3dlYmtpdHBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlICk7XG5cbiAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lciggJ3BvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSApO1xuICAgICAgICAgIGRvYy5hZGRFdmVudExpc3RlbmVyKCAnbW96cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlICk7XG4gICAgICAgICAgZG9jLmFkZEV2ZW50TGlzdGVuZXIoICd3ZWJraXRwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UgKTtcblxuICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgICAgICBlbC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICAgICAgYm9keS5yZXF1ZXN0UG9pbnRlckxvY2sgPSBib2R5LnJlcXVlc3RQb2ludGVyTG9jayB8fCBib2R5Lm1velJlcXVlc3RQb2ludGVyTG9jayB8fCBib2R5LndlYmtpdFJlcXVlc3RQb2ludGVyTG9jaztcbiAgICAgICAgICAgIGJvZHkucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgZWwuc3R5bGUuZGlzcGxheSA9ICdub25lJzsgXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1dKTtcblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZEludGVyZmFjZXMudHNcIi8+XG5tb2R1bGUgS3ViZTNkIHtcblxuICB2YXIgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldCgnS3ViZTNkJyk7XG5cbiAgZXhwb3J0IGNsYXNzIFNjZW5lT2JqZWN0QmFzZSBpbXBsZW1lbnRzIFNjZW5lT2JqZWN0IHtcblxuICAgIHByaXZhdGUgYm91bmRpbmdCb3g6YW55ID0gbnVsbDtcblxuICAgIGNvbnN0cnVjdG9yKHB1YmxpYyBzY2VuZTphbnksIHB1YmxpYyBnZW9tZXRyeTphbnkpIHtcbiAgICAgIHRoaXMuc2NlbmUuYWRkKGdlb21ldHJ5KTtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3ggPSBuZXcgVEhSRUUuQm91bmRpbmdCb3hIZWxwZXIodGhpcy5nZW9tZXRyeSwgMHgwMGZmMDApO1xuICAgICAgdGhpcy5zY2VuZS5hZGQodGhpcy5ib3VuZGluZ0JveCk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG4gICAgICB0aGlzLnNjZW5lLnJlbW92ZSh0aGlzLmdlb21ldHJ5KTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkuZGlzcG9zZSgpO1xuICAgICAgZGVsZXRlIHRoaXMuZ2VvbWV0cnk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlYnVnKGVuYWJsZSkge1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC52aXNpYmxlID0gZW5hYmxlO1xuICAgIH1cblxuICAgIHB1YmxpYyBtb3ZlKHgsIHksIHopIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueCArPSB4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi55ICs9IHk7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnogKz0gejtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueCArPSB4O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi55ICs9IHk7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnogKz0gejtcbiAgICB9XG5cbiAgICBwdWJsaWMgcm90YXRlKHJ4LCByeSwgcnopIHtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueCArPSByeDtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueSArPSByeTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueiArPSByejtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucm90YXRpb24ueCArPSByeDtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucm90YXRpb24ueSArPSByeTtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucm90YXRpb24ueiArPSByejtcbiAgICB9XG5cbiAgICBwdWJsaWMgZ2V0UG9zaXRpb24oKSB7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnVwZGF0ZSgpO1xuICAgICAgcmV0dXJuIHRoaXMuYm91bmRpbmdCb3gub2JqZWN0LnBvc2l0aW9uO1xuICAgIH1cblxuICAgIHB1YmxpYyBzZXRQb3NpdGlvbih4LCB5LCB6KSB7XG4gICAgICB0aGlzLmdlb21ldHJ5LnBvc2l0aW9uLnggPSB4O1xuICAgICAgdGhpcy5nZW9tZXRyeS5wb3NpdGlvbi55ID0geTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucG9zaXRpb24ueiA9IHo7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnBvc2l0aW9uLnggPSB4O1xuICAgICAgdGhpcy5ib3VuZGluZ0JveC5wb3NpdGlvbi55ID0geTtcbiAgICAgIHRoaXMuYm91bmRpbmdCb3gucG9zaXRpb24ueiA9IHo7XG5cbiAgICB9XG5cbiAgICBwdWJsaWMgc2V0Um90YXRpb24ocngsIHJ5LCByeikge1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi54ID0gcng7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnkgPSByeTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueiA9IHJ6O1xuICAgICAgdGhpcy5nZW9tZXRyeS5yb3RhdGlvbi54ID0gcng7XG4gICAgICB0aGlzLmdlb21ldHJ5LnJvdGF0aW9uLnkgPSByeTtcbiAgICAgIHRoaXMuZ2VvbWV0cnkucm90YXRpb24ueiA9IHJ6O1xuICAgIH1cblxuICAgIHB1YmxpYyByZW5kZXIoKSB7XG4gICAgICB0aGlzLmJvdW5kaW5nQm94LnVwZGF0ZSgpO1xuICAgIH1cblxuICB9XG5cbiAgZXhwb3J0IGNsYXNzIFBvZE9iamVjdCBleHRlbmRzIFNjZW5lT2JqZWN0QmFzZSB7XG4gICAgcHJpdmF0ZSBhbmdsZTpudW1iZXIgPSB1bmRlZmluZWQ7XG4gICAgcHJpdmF0ZSBjaXJjbGU6YW55ID0gdW5kZWZpbmVkO1xuICAgIHByaXZhdGUgcm90YXRpb24gPSB7XG4gICAgICB4OiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAvIDEwMDAsXG4gICAgICB5OiBNYXRoLnJhbmRvbSgpICogTWF0aC5QSSAvIDEwMCxcbiAgICAgIHo6IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJIC8gMTAwMFxuICAgIH07XG4gICAgY29uc3RydWN0b3IocHVibGljIHNjZW5lOiBhbnksIHB1YmxpYyBob3N0T2JqZWN0Okhvc3RPYmplY3QsIHB1YmxpYyBpZDpzdHJpbmcsIHB1YmxpYyBvYmo6YW55KSB7XG4gICAgICBzdXBlcihzY2VuZSwgbmV3IFRIUkVFLk9iamVjdDNEKCkpO1xuICAgICAgdmFyIHRleHR1cmUgPSBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKG9iai4kaWNvblVybCk7XG4gICAgICB0ZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gICAgICB0aGlzLmdlb21ldHJ5LmFkZChcbiAgICAgICAgICBuZXcgVEhSRUUuTWVzaChcbiAgICAgICAgICAgIG5ldyBUSFJFRS5Cb3hHZW9tZXRyeSg1MCwgNTAsIDUwKSwgXG4gICAgICAgICAgICBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoe1xuICAgICAgICAgICAgICBjb2xvcjogMHhmZmZmZmYsIFxuICAgICAgICAgICAgICBtYXA6IHRleHR1cmUsXG4gICAgICAgICAgICAgIGJ1bXBNYXA6IHRleHR1cmUsXG4gICAgICAgICAgICAgIGNhc3RTaGFkb3c6IHRydWUsIFxuICAgICAgICAgICAgICByZWNlaXZlU2hhZG93OiB0cnVlLCBcbiAgICAgICAgICAgICAgc2hhZGluZzogVEhSRUUuU21vb3RoU2hhZGluZ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICkpO1xuICAgICAgbG9nLmRlYnVnKFwiQ3JlYXRlZCBwb2Qgb2JqZWN0IFwiLCBpZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZShtb2RlbCwgcG9kKSB7XG4gICAgICB0aGlzLm9iaiA9IHBvZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICAgIHRoaXMuaG9zdE9iamVjdC5nZW9tZXRyeS5yZW1vdmUodGhpcy5jaXJjbGUpO1xuICAgICAgbG9nLmRlYnVnKFwiRGVzdHJveWVkIHBvZCBvYmplY3QgXCIsIHRoaXMuaWQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgZGlzdGFuY2UoKSB7XG4gICAgICB2YXIgaG9zdFBvc2l0aW9uID0gdGhpcy5ob3N0T2JqZWN0LmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgbXlQb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb24oKTtcbiAgICAgIHZhciBkaXN0WCA9IE1hdGguYWJzKGhvc3RQb3NpdGlvbi54IC0gbXlQb3NpdGlvbi54KTtcbiAgICAgIHZhciBkaXN0WSA9IE1hdGguYWJzKGhvc3RQb3NpdGlvbi55IC0gbXlQb3NpdGlvbi55KTtcbiAgICAgIHJldHVybiBNYXRoLnNxcnQoZGlzdFggKiBkaXN0WCArIGRpc3RZICogZGlzdFkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYW5nbGVPZlZlbG9jaXR5KCkge1xuICAgICAgaWYgKCF0aGlzLmFuZ2xlKSB7XG4gICAgICAgIHZhciBkaXN0ID0gdGhpcy5kaXN0YW5jZSgpO1xuICAgICAgICBsb2cuZGVidWcoXCJwb2QgaWQ6IFwiLCB0aGlzLmlkLCBcIiBkaXN0YW5jZTogXCIsIGRpc3QpO1xuICAgICAgICB0aGlzLmFuZ2xlID0gKDEgLyBkaXN0KSAqIDEwO1xuICAgICAgICBsb2cuZGVidWcoXCJwb2QgaWQ6IFwiLCB0aGlzLmlkLCBcIiBhbmdsZTogXCIsIHRoaXMuYW5nbGUpO1xuICAgICAgICB2YXIgbWF0ZXJpYWxBcnJheSA9IFtdO1xuICAgICAgICB2YXIgZmFjZSA9IG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7IFxuICAgICAgICAgIGNvbG9yOiAweDU1NTU1NSxcbiAgICAgICAgICBjYXN0U2hhZG93OiB0cnVlLFxuICAgICAgICAgIHJlY2VpdmVTaGFkb3c6IHRydWUsXG4gICAgICAgICAgd2lyZWZyYW1lOiB0cnVlXG4gICAgICAgIH0pO1xuICAgICAgICBtYXRlcmlhbEFycmF5LnB1c2goZmFjZS5jbG9uZSgpKTtcbiAgICAgICAgbWF0ZXJpYWxBcnJheS5wdXNoKGZhY2UuY2xvbmUoKSk7XG4gICAgICAgIHRoaXMuY2lyY2xlID0gbmV3IFRIUkVFLk1lc2gobmV3IFRIUkVFLlJpbmdHZW9tZXRyeShkaXN0IC0gMSwgZGlzdCArIDEsIDEyOCksIG5ldyBUSFJFRS5NZXNoRmFjZU1hdGVyaWFsKG1hdGVyaWFsQXJyYXkpKTtcbiAgICAgICAgdGhpcy5ob3N0T2JqZWN0Lmdlb21ldHJ5LmFkZCh0aGlzLmNpcmNsZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5hbmdsZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgdmFyIG15UG9zaXRpb24gPSB0aGlzLmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgaG9zdFBvc2l0aW9uID0gdGhpcy5ob3N0T2JqZWN0LmdldFBvc2l0aW9uKCk7XG4gICAgICB2YXIgeCA9IG15UG9zaXRpb24ueDtcbiAgICAgIHZhciB5ID0gbXlQb3NpdGlvbi55O1xuICAgICAgdmFyIGNlbnRlclggPSBob3N0UG9zaXRpb24ueDtcbiAgICAgIHZhciBjZW50ZXJZID0gaG9zdFBvc2l0aW9uLnk7XG4gICAgICB2YXIgb2Zmc2V0WCA9IHggLSBjZW50ZXJYO1xuICAgICAgdmFyIG9mZnNldFkgPSB5IC0gY2VudGVyWTtcbiAgICAgIHZhciBhbmdsZSA9IHRoaXMuYW5nbGVPZlZlbG9jaXR5KCk7XG4gICAgICB2YXIgbmV3WCA9IGNlbnRlclggKyBvZmZzZXRYICogTWF0aC5jb3MoYW5nbGUpIC0gb2Zmc2V0WSAqIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgIHZhciBuZXdZID0gY2VudGVyWSArIG9mZnNldFggKiBNYXRoLnNpbihhbmdsZSkgKyBvZmZzZXRZICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgdGhpcy5zZXRQb3NpdGlvbihuZXdYLCBuZXdZLCAwKTtcbiAgICAgIHRoaXMucm90YXRlKHRoaXMucm90YXRpb24ueCwgdGhpcy5yb3RhdGlvbi55LCB0aGlzLnJvdGF0aW9uLnopO1xuICAgICAgc3VwZXIucmVuZGVyKCk7XG4gICAgfVxuICB9XG5cbiAgZXhwb3J0IGNsYXNzIEhvc3RPYmplY3QgZXh0ZW5kcyBTY2VuZU9iamVjdEJhc2Uge1xuICAgIHByaXZhdGUgb2Zmc2V0WCA9IDIwMDtcbiAgICBwcml2YXRlIG9mZnNldFkgPSAyMDA7XG4gICAgcHVibGljIHBvZHMgPSB7fTtcbiAgICBwdWJsaWMgcm90YXRpb24gPSB7XG4gICAgICB4OiAwLFxuICAgICAgeTogMCxcbiAgICAgIHo6IE1hdGgucmFuZG9tKCkgKiBNYXRoLlBJIC8gMTAwMFxuICAgIH1cblxuICAgIGNvbnN0cnVjdG9yKHNjZW5lOiBhbnksIHB1YmxpYyBpZDpzdHJpbmcsIHB1YmxpYyBvYmo6YW55KSB7XG4gICAgICBzdXBlcihzY2VuZSwgbmV3IFRIUkVFLk9iamVjdDNEKCkpXG4gICAgICB2YXIgdGV4dHVyZSA9IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoJ2ltZy9zdW4tdGV4dHVyZS5qcGcnKTtcbiAgICAgIHRleHR1cmUubWluRmlsdGVyID0gVEhSRUUuTmVhcmVzdEZpbHRlcjtcbiAgICAgIHRoaXMuZ2VvbWV0cnkuYWRkKCBcbiAgICAgICAgICBuZXcgVEhSRUUuUG9pbnRMaWdodCgweGZmZDcwMCwgMSwgNTAwMCksXG4gICAgICAgICAgbmV3IFRIUkVFLk1lc2goXG4gICAgICAgICAgICBuZXcgVEhSRUUuU3BoZXJlR2VvbWV0cnkoMTAwLCAzMiwgMTYpLCBcbiAgICAgICAgICAgIG5ldyBUSFJFRS5NZXNoUGhvbmdNYXRlcmlhbCh7XG4gICAgICAgICAgICAgIGNvbG9yOiAweGZmZDcwMCwgXG4gICAgICAgICAgICAgIG1hcDogdGV4dHVyZSxcbiAgICAgICAgICAgICAgYnVtcE1hcDogdGV4dHVyZSxcbiAgICAgICAgICAgICAgc3BlY3VsYXI6IDB4MDBmZjAwLCBcbiAgICAgICAgICAgICAgc2hhZGluZzogVEhSRUUuU21vb3RoU2hhZGluZ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICApXG4gICAgICAgICk7XG4gICAgICBsb2cuZGVidWcoXCJDcmVhdGVkIGhvc3Qgb2JqZWN0IFwiLCBpZCk7XG4gICAgfVxuXG4gICAgcHVibGljIHVwZGF0ZShtb2RlbCwgaG9zdCkge1xuICAgICAgdGhpcy5vYmogPSBob3N0O1xuICAgICAgdmFyIHBvZHNUb1JlbW92ZSA9IFtdO1xuICAgICAgXy5mb3JJbih0aGlzLnBvZHMsIChwb2QsIGtleSkgPT4ge1xuICAgICAgICBpZiAoIShrZXkgaW4gbW9kZWwucG9kc0J5S2V5KSkge1xuICAgICAgICAgIHBvZHNUb1JlbW92ZS5wdXNoKGtleSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgXy5mb3JFYWNoKHBvZHNUb1JlbW92ZSwgKGlkKSA9PiB0aGlzLnJlbW92ZVBvZChpZCkpO1xuICAgICAgXy5mb3JFYWNoKHRoaXMub2JqLnBvZHMsIChwb2Q6YW55KSA9PiB7XG4gICAgICAgIHZhciBuYW1lID0gcG9kLl9rZXk7XG4gICAgICAgIGlmICghdGhpcy5oYXNQb2QobmFtZSkpIHtcbiAgICAgICAgICB0aGlzLmFkZFBvZChuYW1lLCBwb2QpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciBwb2RPYmogPSB0aGlzLnBvZHNbbmFtZV07XG4gICAgICAgICAgcG9kT2JqLnVwZGF0ZShtb2RlbCwgcG9kKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlYnVnKGVuYWJsZSkge1xuICAgICAgdmFyIGlkcyA9IF8ua2V5cyh0aGlzLnBvZHMpXG4gICAgICBfLmZvckVhY2goaWRzLCAoaWQpID0+IHRoaXMucG9kc1tpZF0uZGVidWcoZW5hYmxlKSk7XG4gICAgICBzdXBlci5kZWJ1ZyhlbmFibGUpO1xuICAgIH1cblxuICAgIHB1YmxpYyBkZXN0cm95KCkge1xuICAgICAgaWYgKHRoaXMucG9kcykge1xuICAgICAgICB2YXIgcG9kSWRzID0gXy5rZXlzKHRoaXMucG9kcyk7XG4gICAgICAgIF8uZm9yRWFjaChwb2RJZHMsIChpZCkgPT4gdGhpcy5yZW1vdmVQb2QoaWQpKTtcbiAgICAgIH1cbiAgICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgICAgIGxvZy5kZWJ1ZyhcIkRlc3Ryb3lpbmcgaG9zdCBvYmplY3QgXCIsIHRoaXMuaWQpO1xuICAgIH1cblxuICAgIHB1YmxpYyByZW1vdmVQb2QoaWQpIHtcbiAgICAgIHZhciBwb2QgPSB0aGlzLnBvZHNbaWRdO1xuICAgICAgaWYgKHBvZCkge1xuICAgICAgICBwb2QuZGVzdHJveSgpO1xuICAgICAgICBkZWxldGUgdGhpcy5wb2RzW2lkXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBwdWJsaWMgYWRkUG9kKGtleSwgcDphbnkpIHtcbiAgICAgIGlmICh0aGlzLmhhc1BvZChrZXkpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBteVBvc2l0aW9uID0gdGhpcy5nZXRQb3NpdGlvbigpO1xuICAgICAgdmFyIHBvZE9mZnNldFggPSB0aGlzLm9mZnNldFggLSBteVBvc2l0aW9uLng7XG4gICAgICB2YXIgcG9kT2Zmc2V0WSA9IG15UG9zaXRpb24ueTtcbiAgICAgIC8qXG4gICAgICB2YXIgYW5nbGUgPSBNYXRoLnJhbmRvbSgpICogMzYwO1xuICAgICAgdmFyIHBvZFggPSBteVBvc2l0aW9uLnggKyBwb2RPZmZzZXRYICogTWF0aC5jb3MoYW5nbGUpIC0gcG9kT2Zmc2V0WSAqIE1hdGguc2luKGFuZ2xlKTtcbiAgICAgIHZhciBwb2RZID0gbXlQb3NpdGlvbi55ICsgcG9kT2Zmc2V0WCAqIE1hdGguc2luKGFuZ2xlKSAtIHBvZE9mZnNldFkgKiBNYXRoLmNvcyhhbmdsZSk7XG4gICAgICAqL1xuICAgICAgdmFyIHBvZCA9IG5ldyBQb2RPYmplY3QodGhpcy5zY2VuZSwgdGhpcywga2V5LCBwKTtcbiAgICAgIHBvZC5zZXRQb3NpdGlvbihteVBvc2l0aW9uLngsIG15UG9zaXRpb24ueSwgbXlQb3NpdGlvbi56KTtcbiAgICAgIHBvZC5tb3ZlKHRoaXMub2Zmc2V0WCwgMCwgMCk7XG4gICAgICB0aGlzLm9mZnNldFggPSB0aGlzLm9mZnNldFggKyBNYXRoLnJhbmRvbSgpICogNTAgKyAxMDA7XG4gICAgICB0aGlzLm9mZnNldFkgPSB0aGlzLm9mZnNldFkgKyBNYXRoLnJhbmRvbSgpICogNTAgKyAxMDA7XG4gICAgICB0aGlzLnBvZHNba2V5XSA9IHBvZDtcbiAgICB9XG5cbiAgICBwdWJsaWMgaGFzUG9kKGlkKSB7XG4gICAgICByZXR1cm4gKGlkIGluIHRoaXMucG9kcyk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBzdGVwID0gMDtcbiAgICBcbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuICAgICAgdGhpcy5yb3RhdGUodGhpcy5yb3RhdGlvbi54LCB0aGlzLnJvdGF0aW9uLnksIHRoaXMucm90YXRpb24ueik7XG4gICAgICBfLmZvckluKHRoaXMucG9kcywgKHBvZE9iamVjdCwgaWQpID0+IHtcbiAgICAgICAgcG9kT2JqZWN0LnJlbmRlcigpO1xuICAgICAgfSk7XG4gICAgICB0aGlzLnN0ZXAgPSB0aGlzLnN0ZXAgKyAxO1xuICAgICAgc3VwZXIucmVuZGVyKCk7XG4gICAgfVxuXG5cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSGVscGVycy50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgdmFyIGxldmVsRGF0YSA9IFxuICAgIFtcbiAgICAgIFsgVywgVywgVywgVywgVywgVywgVywgVyBdLFxuICAgICAgWyBXLCBTLCBTLCBTLCBTLCBTLCBTLCBXIF0sXG4gICAgICBbIFcsIFMsIFMsIFMsIFMsIFMsIFMsIFcgXSxcbiAgICAgIFsgVywgUywgUywgUywgUywgUywgUywgVyBdLFxuICAgICAgWyBXLCBTLCBTLCBTLCBTLCBTLCBTLCBXIF0sXG4gICAgICBbIFcsIFMsIFMsIFMsIFMsIFMsIFMsIFcgXSxcbiAgICAgIFsgVywgUywgUywgUywgUywgUywgUywgVyBdLFxuICAgICAgWyBXLCBXLCBXLCBXLCBXLCBXLCBXLCBXIF1cbiAgICBdO1xuXG4gIHZhciBsZXZlbFdpZHRoID0gbGV2ZWxEYXRhWzBdLmxlbmd0aDtcbiAgdmFyIGxldmVsSGVpZ2h0ID0gbGV2ZWxEYXRhLmxlbmd0aDtcblxuICB2YXIgd2FsbFRleHR1cmUgPSBUSFJFRS5JbWFnZVV0aWxzLmxvYWRUZXh0dXJlKCdpbWcvSU1HUDE0NTAuanBnJyk7XG4gIHdhbGxUZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gIHZhciB3YWxsTWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaFBob25nTWF0ZXJpYWwoe1xuICAgIGNvbG9yOiAweDAwZmYwMCwgXG4gICAgbWFwOiB3YWxsVGV4dHVyZSxcbiAgICBjYXN0U2hhZG93OiB0cnVlLFxuICAgIHJlY2VpdmVTaGFkb3c6IHRydWUsXG4gICAgd2lyZWZyYW1lOiBmYWxzZVxuICB9KTtcbiAgdmFyIHdhbGwgPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQm94R2VvbWV0cnkoQ0VMTF9TSVpFLCBDRUxMX1NJWkUsIENFTExfU0laRSksIHdhbGxNYXRlcmlhbCk7XG5cbiAgdmFyIGZsb29yVGV4dHVyZSA9IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoJ2ltZy9JTUdQMTQ1MC5qcGcnKTtcbiAgZmxvb3JUZXh0dXJlLm1pbkZpbHRlciA9IFRIUkVFLk5lYXJlc3RGaWx0ZXI7XG4gIHZhciBmbG9vck1hdGVyaWFsID0gbmV3IFRIUkVFLk1lc2hQaG9uZ01hdGVyaWFsKHtcbiAgICBjb2xvcjogMHhmZjAwMDAsIFxuICAgIG1hcDogZmxvb3JUZXh0dXJlLFxuICAgIGNhc3RTaGFkb3c6IHRydWUsXG4gICAgcmVjZWl2ZVNoYWRvdzogdHJ1ZSxcbiAgICB3aXJlZnJhbWU6IGZhbHNlXG4gIH0pO1xuICB2YXIgZmxvb3IgPSBuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQm94R2VvbWV0cnkoQ0VMTF9TSVpFLCBDRUxMX1NJWkUsIENFTExfU0laRSksIGZsb29yTWF0ZXJpYWwpO1xuXG4gIGZ1bmN0aW9uIG1ha2VCb3goY2VsbFgsIGNlbGxZLCBpc0Zsb29yID0gZmFsc2UpIHtcbiAgICB2YXIgYm94ID0gaXNGbG9vciA/IGZsb29yLmNsb25lKCkgOiB3YWxsLmNsb25lKCk7XG4gICAgYm94LnBvc2l0aW9uLmZyb21BcnJheShwbGFjZU9iamVjdChjZWxsWCwgY2VsbFksIGlzRmxvb3IpKTtcbiAgICByZXR1cm4gYm94O1xuICB9XG5cbiAgZXhwb3J0IGNsYXNzIFdvcmxkIGltcGxlbWVudHMgUmVuZGVyYWJsZSB7XG4gICAgcHJpdmF0ZSBhbWJpZW50ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCggMHhmZmZmZmYgKTtcbiAgICBwcml2YXRlIGxpZ2h0ID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ODg4ODg4ICk7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IocHJpdmF0ZSBzY2VuZSkge1xuICAgICAgdGhpcy5hbWJpZW50LmNvbG9yLnNldEhTTCggMC4xLCAwLjMsIDAuMiApO1xuICAgICAgdGhpcy5saWdodC5wb3NpdGlvbi5zZXQoIDEsIDEsIDApO1xuICAgICAgLy9zY2VuZS5mb2cgPSBuZXcgVEhSRUUuRm9nKDB4ZmZmZmZmLCA1MDAsIDEwMDAwKVxuICAgICAgc2NlbmUuYWRkKHRoaXMuYW1iaWVudCk7XG4gICAgICBzY2VuZS5hZGQodGhpcy5saWdodCk7XG5cbiAgICAgIC8vIHNreWJveFxuICAgICAgdmFyIG1hdGVyaWFsQXJyYXkgPSBbXTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNjsgaSsrKVxuICAgICAgICBtYXRlcmlhbEFycmF5LnB1c2gobmV3IFRIUkVFLk1lc2hCYXNpY01hdGVyaWFsKHtcbiAgICAgICAgICBtYXA6IFRIUkVFLkltYWdlVXRpbHMubG9hZFRleHR1cmUoJ2ltZy9zcGFjZS1zZWFtbGVzcy5wbmcnKSxcbiAgICAgICAgICBzaWRlOiBUSFJFRS5CYWNrU2lkZVxuICAgICAgICB9KSk7XG4gICAgICB2YXIgc2t5TWF0ZXJpYWwgPSBuZXcgVEhSRUUuTWVzaEZhY2VNYXRlcmlhbChtYXRlcmlhbEFycmF5KTtcbiAgICAgIHNjZW5lLmFkZChuZXcgVEhSRUUuTWVzaChuZXcgVEhSRUUuQm94R2VvbWV0cnkoMTAwMDAsIDEwMDAwLCAxMDAwMCksIHNreU1hdGVyaWFsKSk7XG5cbiAgICAgIC8vIHdhbGxzL2Zsb29yXG4gICAgICBfLmZvckVhY2gobGV2ZWxEYXRhLCAocm93LCB5KSA9PiB7XG4gICAgICAgIF8uZm9yRWFjaChyb3csIChjZWxsLCB4KSA9PiB7XG4gICAgICAgICAgc3dpdGNoIChjZWxsKSB7XG4gICAgICAgICAgICBjYXNlIFdBTEw6XG4gICAgICAgICAgICAgIHNjZW5lLmFkZChtYWtlQm94KHgsIHksIGZhbHNlKSk7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzY2VuZS5hZGQobWFrZUJveCh4LCB5LCB0cnVlKSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIC8qXG4gICAgICAvLyBwYXJ0aWNsZSBjbG91ZFxuICAgICAgdmFyIGdlb21ldHJ5ID0gbmV3IFRIUkVFLkdlb21ldHJ5KCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDEwMDAwOyBpKyspIHtcbiAgICAgICAgdmFyIHZlcnRleCA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgICAgIHZlcnRleC54ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIHZlcnRleC55ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIHZlcnRleC56ID0gVEhSRUUuTWF0aC5yYW5kRmxvYXRTcHJlYWQoIDEwMDAwICk7XG4gICAgICAgIGdlb21ldHJ5LnZlcnRpY2VzLnB1c2godmVydGV4KTtcbiAgICAgIH1cbiAgICAgIHZhciBwYXJ0aWNsZXMgPSBuZXcgVEhSRUUuUG9pbnRDbG91ZCggZ2VvbWV0cnksIG5ldyBUSFJFRS5Qb2ludENsb3VkTWF0ZXJpYWwoe2NvbG9yOiAweDg4ODg4OCwgZm9nOiB0cnVlfSkpO1xuICAgICAgc2NlbmUuYWRkKHBhcnRpY2xlcyk7XG4gICAgICAqL1xuICAgIH1cblxuICAgIHB1YmxpYyBwbGFjZVBsYXllcihvYmplY3QpIHtcbiAgICAgIHRoaXMucGxhY2VPYmplY3Qob2JqZWN0KTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcGxhY2VPYmplY3Qob2JqZWN0KSB7XG4gICAgICBpZiAoIW9iamVjdCB8fCAhb2JqZWN0LnBvc2l0aW9uKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciB4LCB5O1xuICAgICAgZG8ge1xuICAgICAgICB4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGxldmVsV2lkdGggLSAyKSArIDEpO1xuICAgICAgICB5ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGxldmVsSGVpZ2h0IC0yKSArIDEpO1xuICAgICAgICBsb2cuZGVidWcoXCJ4OlwiLHgsXCJ5OlwiLHksXCJ2YWw6XCIsbGV2ZWxEYXRhW3ldW3hdKTtcbiAgICAgIH0gd2hpbGUgKGxldmVsRGF0YVt5XVt4XSAhPT0gU1BBQ0UpXG4gICAgICBvYmplY3QucG9zaXRpb24uZnJvbUFycmF5KHBsYWNlT2JqZWN0KHgsIHkpKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgcmVuZGVyKCkge1xuXG4gICAgfVxuXG4gICAgcHVibGljIGRlc3Ryb3koKSB7XG5cbiAgICB9XG5cbiAgfVxuXG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwia3ViZTNkSGVscGVycy50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJ3b3JsZC50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgZXhwb3J0IGNsYXNzIFBsYXllciBpbXBsZW1lbnRzIFJlbmRlcmFibGUge1xuICAgIHByaXZhdGUgbG9nOkxvZ2dpbmcuTG9nZ2VyID0gTG9nZ2VyLmdldCgna3ViZTNkLXBsYXllcicpO1xuICAgIHByaXZhdGUgZG9tRWxlbWVudDphbnkgPSBudWxsO1xuICAgIHByaXZhdGUgX2xvb2tBdDphbnkgPSBudWxsO1xuICAgIHByaXZhdGUgcGl0Y2ggPSBuZXcgVEhSRUUuT2JqZWN0M0QoKTtcbiAgICBwcml2YXRlIHlhdyA9IG5ldyBUSFJFRS5PYmplY3QzRCgpO1xuXG4gICAgcHJpdmF0ZSBfZW5hYmxlZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgX2RvY3VtZW50ID0gdW5kZWZpbmVkO1xuXG4gICAgcHJpdmF0ZSBnZXRXb3JsZE9iamVjdHM6YW55ID0gKCkgPT4gW107XG5cbiAgICBwcml2YXRlIHJheWNhc3RlciA9IG5ldyBUSFJFRS5SYXljYXN0ZXIobmV3IFRIUkVFLlZlY3RvcjMoKSwgbmV3IFRIUkVFLlZlY3RvcjMoMCwgLTEsIDApLCAwLCAxMCk7XG5cbiAgICAvLyBtb3ZlbWVudCBib29sZWFuc1xuICAgIHByaXZhdGUgZm9yd2FyZCA9IGZhbHNlO1xuICAgIHByaXZhdGUgYmFja3dhcmQgPSBmYWxzZTtcbiAgICBwcml2YXRlIGxlZnQgPSBmYWxzZTtcbiAgICBwcml2YXRlIHJpZ2h0ID0gZmFsc2U7XG4gICAgcHJpdmF0ZSBjYW5KdW1wID0gdHJ1ZTtcbiAgICBwcml2YXRlIHJ1bm5pbmcgPSBmYWxzZTtcblxuICAgIC8vIG1vdmVtZW50IHZlbG9jaXR5XG4gICAgcHJpdmF0ZSB2ZWxvY2l0eSA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG4gICAgcHJpdmF0ZSBwcmV2VGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuXG4gICAgLy8ga2V5L21vdXNlIGhhbmRsZXJzXG4gICAgcHJpdmF0ZSBoYW5kbGVyczphbnkgPSBudWxsO1xuXG4gICAgcHVibGljIGNvbnN0cnVjdG9yKHByaXZhdGUgc2NlbmUsIHByaXZhdGUgY2FtZXJhLCBwcml2YXRlIGQsIHByaXZhdGUgd29ybGQ6V29ybGQpIHtcblxuICAgICAgY2FtZXJhLnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICB0aGlzLnBpdGNoLmFkZChjYW1lcmEpO1xuICAgICAgdGhpcy55YXcuYWRkKHRoaXMucGl0Y2gpO1xuICAgICAgc2NlbmUuYWRkKHRoaXMueWF3KTtcblxuICAgICAgdGhpcy55YXcucG9zaXRpb24uc2V0KDAsIDAsIC01KTtcblxuICAgICAgdmFyIGRvbUVsZW1lbnQgPSB0aGlzLmRvbUVsZW1lbnQgPSAkKGQpO1xuXG4gICAgICBpZiAoIWhhdmVQb2ludGVyTG9jaykge1xuICAgICAgICB0aGlzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgIHNlbGYuaGFuZGxlcnMgPSB7XG4gICAgICAgICdrZXlkb3duJzogKGV2ZW50OmFueSkgPT4ge1xuICAgICAgICAgIHN3aXRjaCAoIGV2ZW50LmtleUNvZGUgKSB7XG4gICAgICAgICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICAgICAgICBzZWxmLmZvcndhcmQgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzc6IC8vIGxlZnRcbiAgICAgICAgICAgIGNhc2UgNjU6IC8vIGFcbiAgICAgICAgICAgICAgc2VsZi5sZWZ0ID0gdHJ1ZTsgXG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgICAgICAgY2FzZSA4MzogLy8gc1xuICAgICAgICAgICAgICBzZWxmLmJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICAgICAgICBzZWxmLnJpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICAgICAgICBzZWxmLnJ1bm5pbmcgPSB0cnVlO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgMzI6IC8vIHNwYWNlXG4gICAgICAgICAgICAgIGlmIChzZWxmLmNhbkp1bXAgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnZlbG9jaXR5LnkgKz0gMzUwO1xuICAgICAgICAgICAgICAgIHNlbGYuY2FuSnVtcCA9IGZhbHNlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgJ2tleXVwJzogKGV2ZW50OmFueSkgPT4ge1xuICAgICAgICAgIHN3aXRjaCAoIGV2ZW50LmtleUNvZGUgKSB7XG4gICAgICAgICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICAgICAgICBzZWxmLmZvcndhcmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICAgICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgICAgICAgIHNlbGYubGVmdCA9IGZhbHNlOyBcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICAgICAgICBjYXNlIDgzOiAvLyBzXG4gICAgICAgICAgICAgIHNlbGYuYmFja3dhcmQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICAgICAgICBzZWxmLnJpZ2h0ID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgICAgICAgc2VsZi5ydW5uaW5nID0gZmFsc2U7XG4gICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgJ21vdXNlbW92ZSc6IChldmVudDphbnkpID0+IHtcbiAgICAgICAgICBpZiAoIXNlbGYuX2VuYWJsZWQgfHwgIWhhdmVQb2ludGVyTG9jaykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgeWF3ID0gc2VsZi55YXc7XG4gICAgICAgICAgdmFyIHBpdGNoID0gc2VsZi5waXRjaDtcbiAgICAgICAgICB2YXIgZGVsdGFYID0gZXZlbnQubW92ZW1lbnRYIHx8IGV2ZW50Lm1vek1vdmVtZW50WCB8fCBldmVudC53ZWJraXRNb3ZlbWVudFggfHwgMDtcbiAgICAgICAgICB2YXIgZGVsdGFZID0gZXZlbnQubW92ZW1lbnRZIHx8IGV2ZW50Lm1vek1vdmVtZW50WCB8fCBldmVudC53ZWJraXRNb3ZlbWVudFggfHwgMDtcbiAgICAgICAgICB5YXcucm90YXRpb24ueSAtPSBkZWx0YVggKiAwLjAwMjtcbiAgICAgICAgICBwaXRjaC5yb3RhdGlvbi54IC09IGRlbHRhWSAqIDAuMDAyO1xuICAgICAgICAgIHBpdGNoLnJvdGF0aW9uLnggPSBNYXRoLm1heCgtSGFsZlBJLCBNYXRoLm1pbihIYWxmUEksIHBpdGNoLnJvdGF0aW9uLngpKTtcbiAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIF8uZm9ySW4odGhpcy5oYW5kbGVycywgKGhhbmRsZXIsIGV2dCkgPT4gZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihldnQsIGhhbmRsZXIsIGZhbHNlKSk7XG4gICAgfVxuXG4gICAgcHVibGljIHNldCBlbmFibGVkKGVuYWJsZWQpIHtcbiAgICAgIHRoaXMuX2VuYWJsZWQgPSBlbmFibGVkO1xuICAgICAgaWYgKGVuYWJsZWQpIHtcbiAgICAgICAgdGhpcy5jYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLmNhbWVyYS5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIHRoaXMub2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdmFyIGFuZ2xlID0gVEhSRUUuTWF0aC5kZWdUb1JhZChUSFJFRS5NYXRoLnJhbmRvbTE2KCkgKiAzNjApO1xuICAgICAgICB0aGlzLnlhdy5yb3RhdGlvbi5zZXQoMCwgYW5nbGUsIDApO1xuICAgICAgICB0aGlzLndvcmxkLnBsYWNlUGxheWVyKHRoaXMub2JqZWN0KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMueWF3LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgdGhpcy55YXcucm90YXRpb24uc2V0KDAsIDAsIDApO1xuICAgICAgICB0aGlzLnBpdGNoLnJvdGF0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgIH1cblxuICAgIH1cblxuICAgIHB1YmxpYyBzZXRXb3JsZE9iamVjdHNDYWxsYmFjayhmdW5jKSB7XG4gICAgICB0aGlzLmdldFdvcmxkT2JqZWN0cyA9IGZ1bmM7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBlbmFibGVkKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2VuYWJsZWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBvYmplY3QoKSB7XG4gICAgICByZXR1cm4gdGhpcy55YXc7XG4gICAgfVxuXG4gICAgcHVibGljIGxvb2tBdChib3gpIHtcbiAgICAgIHRoaXMuX2xvb2tBdCA9IGJveDtcbiAgICB9XG5cbiAgICBwdWJsaWMgZGVzdHJveSgpIHtcbiAgICAgIHRoaXMuc2NlbmUucmVtb3ZlKHRoaXMueWF3KTtcbiAgICAgIHRoaXMueWF3LmRpc3Bvc2UoKTtcbiAgICAgIHRoaXMucGl0Y2guZGlzcG9zZSgpO1xuICAgICAgXy5mb3JJbih0aGlzLmhhbmRsZXJzLCAoaGFuZGxlciwgZXZ0KSA9PiBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKGV2dCwgaGFuZGxlcikpO1xuICAgIH1cblxuICAgIHByaXZhdGUgd2Fsa2luZ01vZGlmaWVyID0gNTAwO1xuICAgIHByaXZhdGUgcnVubmluZ01vZGlmaWVyID0gMjAwO1xuXG4gICAgcHVibGljIHJlbmRlcigpIHtcbiAgICAgIGlmICghdGhpcy5lbmFibGVkIHx8ICFoYXZlUG9pbnRlckxvY2spIHtcbiAgICAgICAgaWYgKHRoaXMuX2xvb2tBdCkge1xuICAgICAgICAgIHZhciBhbmdsZSA9IERhdGUubm93KCkgKiAwLjAwMDE7XG4gICAgICAgICAgdGhpcy5jYW1lcmEuZm9jdXModGhpcy5fbG9va0F0LCBhbmdsZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgcmF5Y2FzdGVyID0gdGhpcy5yYXljYXN0ZXI7XG4gICAgICB2YXIgdmVsb2NpdHkgPSB0aGlzLnZlbG9jaXR5O1xuICAgICAgdmFyIG1lID0gdGhpcy5vYmplY3Q7XG5cbiAgICAgIHJheWNhc3Rlci5yYXkub3JpZ2luLmNvcHkoIHRoaXMueWF3LnBvc2l0aW9uICk7XG4gICAgICByYXljYXN0ZXIucmF5Lm9yaWdpbi55IC09IDEwO1xuXG4gICAgICB2YXIgb2JqZWN0cyA9IHRoaXMuZ2V0V29ybGRPYmplY3RzKCk7XG5cbiAgICAgIHZhciBpbnRlcnNlY3Rpb25zID0gcmF5Y2FzdGVyLmludGVyc2VjdE9iamVjdHMob2JqZWN0cyk7XG5cbiAgICAgIHZhciBpc09uT2JqZWN0ID0gaW50ZXJzZWN0aW9ucy5sZW5ndGggPiAwO1xuXG4gICAgICB2YXIgdGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xuICAgICAgdmFyIG1vZGlmaWVyID0gdGhpcy5ydW5uaW5nID8gdGhpcy5ydW5uaW5nTW9kaWZpZXIgOiB0aGlzLndhbGtpbmdNb2RpZmllcjtcbiAgICAgIHZhciBkZWx0YSA9ICh0aW1lIC0gdGhpcy5wcmV2VGltZSkgLyBtb2RpZmllcjtcblxuICAgICAgdmVsb2NpdHkueCAtPSB2ZWxvY2l0eS54ICogMTAuMCAqIGRlbHRhO1xuICAgICAgdmVsb2NpdHkueiAtPSB2ZWxvY2l0eS56ICogMTAuMCAqIGRlbHRhO1xuXG4gICAgICB2ZWxvY2l0eS55IC09IDkuOCAqIDEwMC4wICogZGVsdGE7IC8vIDEwMC4wID0gbWFzc1xuXG4gICAgICBpZiAodGhpcy5mb3J3YXJkKSB2ZWxvY2l0eS56IC09IDQwMC4wICogZGVsdGE7XG4gICAgICBpZiAodGhpcy5iYWNrd2FyZCkgdmVsb2NpdHkueiArPSA0MDAuMCAqIGRlbHRhO1xuICAgICAgaWYgKHRoaXMubGVmdCkgdmVsb2NpdHkueCAtPSA0MDAuMCAqIGRlbHRhO1xuICAgICAgaWYgKHRoaXMucmlnaHQpIHZlbG9jaXR5LnggKz0gNDAwLjAgKiBkZWx0YTtcblxuICAgICAgaWYgKCBpc09uT2JqZWN0ID09PSB0cnVlICkge1xuICAgICAgICB2ZWxvY2l0eS55ID0gTWF0aC5tYXgoIDAsIHZlbG9jaXR5LnkgKTtcbiAgICAgICAgdGhpcy5jYW5KdW1wID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgbWUudHJhbnNsYXRlWCggdmVsb2NpdHkueCAqIGRlbHRhICk7XG4gICAgICBtZS50cmFuc2xhdGVZKCB2ZWxvY2l0eS55ICogZGVsdGEgKTtcbiAgICAgIG1lLnRyYW5zbGF0ZVooIHZlbG9jaXR5LnogKiBkZWx0YSApO1xuXG4gICAgICBpZiAoIG1lLnBvc2l0aW9uLnkgPCAxMCApIHtcblxuICAgICAgICB2ZWxvY2l0eS55ID0gMDtcbiAgICAgICAgbWUucG9zaXRpb24ueSA9IDEwO1xuICAgICAgICB0aGlzLmNhbkp1bXAgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnByZXZUaW1lID0gdGltZTtcbiAgICB9XG4gIH1cbn1cbiIsIi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJrdWJlM2RQbHVnaW4udHNcIi8+XG5cbm1vZHVsZSBLdWJlM2Qge1xuXG4gIHZhciBkaXJlY3RpdmVOYW1lID0gJ3RocmVlanMnO1xuXG4gIF9tb2R1bGUuZGlyZWN0aXZlKGRpcmVjdGl2ZU5hbWUsIFsoKSA9PiB7XG4gICAgVEhSRUUuSW1hZ2VVdGlscy5jcm9zc09yaWdpbiA9ICcnO1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgcmVwbGFjZTogdHJ1ZSxcbiAgICAgIHNjb3BlOiB7XG4gICAgICAgIGNvbmZpZzogJz0/JyArIGRpcmVjdGl2ZU5hbWVcbiAgICAgIH0sXG4gICAgICBsaW5rOiAoc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSA9PiB7XG5cbiAgICAgICAgdmFyIHNjZW5lOmFueSA9IG51bGw7XG4gICAgICAgIHZhciBjYW1lcmE6YW55ID0gbnVsbDtcbiAgICAgICAgdmFyIHJlbmRlcmVyOmFueSA9IG51bGw7XG4gICAgICAgIHZhciBrZWVwUmVuZGVyaW5nID0gdHJ1ZTtcbiAgICAgICAgdmFyIHJlc2l6ZUhhbmRsZTphbnkgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIHN0b3AoKSB7XG4gICAgICAgICAga2VlcFJlbmRlcmluZyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgZnVuY3Rpb24gY2xlYW51cCgpIHtcbiAgICAgICAgICAkKHdpbmRvdykub2ZmKCdyZXNpemUnLCByZXNpemVGdW5jKTtcbiAgICAgICAgICBkZWxldGUgcmVuZGVyZXI7XG4gICAgICAgICAgZGVsZXRlIGNhbWVyYTtcbiAgICAgICAgICBkZWxldGUgc2NlbmU7XG4gICAgICAgICAgZWxlbWVudC5lbXB0eSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHJlc2l6ZUZ1bmMgPSAoKSA9PiB7XG4gICAgICAgICAgICBsb2cuZGVidWcoXCJyZXNpemluZ1wiKTtcbiAgICAgICAgICAgIGVsZW1lbnQuZmluZCgnY2FudmFzJykud2lkdGgoZWxlbWVudC53aWR0aCgpKS5oZWlnaHQoZWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICAgICAgICBjYW1lcmEuYXNwZWN0ID0gZWxlbWVudC53aWR0aCgpIC8gZWxlbWVudC5oZWlnaHQoKTtcbiAgICAgICAgICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XG4gICAgICAgICAgICByZW5kZXJlci5zZXRTaXplKGVsZW1lbnQud2lkdGgoKSwgZWxlbWVudC5oZWlnaHQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICBlbGVtZW50Lm9uKCckZGVzdHJveScsICgpID0+IHtcbiAgICAgICAgICBzdG9wKCk7XG4gICAgICAgICAgbG9nLmRlYnVnKFwic2NlbmUgZGVzdHJveWVkXCIpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzY29wZS4kd2F0Y2goJ2NvbmZpZycsIF8uZGVib3VuY2UoKGNvbmZpZykgPT4ge1xuICAgICAgICAgIHN0b3AoKTtcbiAgICAgICAgICBpZiAoIWNvbmZpZyB8fCAhY29uZmlnLmluaXRpYWxpemUpIHtcbiAgICAgICAgICAgIGxvZy5kZWJ1ZyhcIm5vIGNvbmZpZywgcmV0dXJuaW5nXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsb2cuZGVidWcoXCJjcmVhdGluZyBzY2VuZVwiKTtcbiAgICAgICAgICBzY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuICAgICAgICAgIGNhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYSg2MCwgZWxlbWVudC53aWR0aCgpIC8gZWxlbWVudC5oZWlnaHQoKSwgMC4xLCAyMDAwMCk7XG5cbiAgICAgICAgICBjYW1lcmEuZm9jdXMgPSAoYm94MzphbnksIGFuZ2xlLCBjOmFueSA9IGNhbWVyYSkgPT4ge1xuICAgICAgICAgICAgLy8gYWRqdXN0IHRoZSBjIHBvc2l0aW9uIHRvIGtlZXAgZXZlcnl0aGluZyBpbiB2aWV3LCB3ZSdsbCBkb1xuICAgICAgICAgICAgLy8gZ3JhZHVhbCBhZGp1c3RtZW50cyB0aG91Z2hcbiAgICAgICAgICAgIHZhciBoZWlnaHQgPSBib3gzLnNpemUoKS55O1xuICAgICAgICAgICAgdmFyIHdpZHRoID0gYm94My5zaXplKCkueCAvIChjYW1lcmEuYXNwZWN0IC8gMik7XG4gICAgICAgICAgICAvL2xvZy5kZWJ1ZyhcIndpZHRoOlwiLCB3aWR0aCwgXCIgaGVpZ2h0OlwiLCBoZWlnaHQpO1xuICAgICAgICAgICAgaWYgKHdpZHRoIDwgMCB8fCBoZWlnaHQgPCAwKSB7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBkaXN0WSA9IE1hdGgucm91bmQoaGVpZ2h0ICogTWF0aC50YW4oIChjYW1lcmEuZm92IC8gMiApICogKCBNYXRoLlBJIC8gMTgwICkpKTtcbiAgICAgICAgICAgIHZhciBkaXN0WCA9IE1hdGgucm91bmQod2lkdGggKiBNYXRoLnRhbiggKGNhbWVyYS5mb3YgLyAyICkgKiAoIE1hdGguUEkgLyAxODAgKSkpO1xuICAgICAgICAgICAgdmFyIGRpc3RaID0gKGRpc3RZICsgZGlzdFgpO1xuICAgICAgICAgICAgLy8gbG9nLmRlYnVnKFwiZGlzdFk6XCIsIGRpc3RZLCBcIiBkaXN0WDpcIiwgZGlzdFgsIFwiZGlzdFo6XCIsIGRpc3RaKTtcbiAgICAgICAgICAgIHZhciB6ID0gTWF0aC5yb3VuZChjLnBvc2l0aW9uLnopO1xuICAgICAgICAgICAgdmFyIHBlcmlvZCA9IDUuMDtcbiAgICAgICAgICAgIGMucG9zaXRpb24ueCA9IGRpc3RYICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICAgICAgYy5wb3NpdGlvbi55ID0gZGlzdFkgKiBNYXRoLnNpbihhbmdsZSk7XG4gICAgICAgICAgICBpZiAoeiAhPT0gZGlzdFopIHtcbiAgICAgICAgICAgICAgaWYgKHogPiBkaXN0Wikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKHogLSBkaXN0WikgLyBwZXJpb2Q7XG4gICAgICAgICAgICAgICAgYy5wb3NpdGlvbi56ID0geiAtIHY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKHogPCBkaXN0Wikge1xuICAgICAgICAgICAgICAgIHZhciB2ID0gKGRpc3RaIC0geikgLyBwZXJpb2Q7XG4gICAgICAgICAgICAgICAgYy5wb3NpdGlvbi56ID0geiArIHY7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGMubG9va0F0KGJveDMuY2VudGVyKCkpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICBpZiAoIHdlYmdsQXZhaWxhYmxlKCkgKSB7XG4gICAgICAgICAgICByZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJlbmRlcmVyID0gbmV3IFRIUkVFLkNhbnZhc1JlbmRlcmVyKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcigweGZmZmZmZik7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0UGl4ZWxSYXRpbyh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyk7XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U2l6ZShlbGVtZW50LndpZHRoKCksIGVsZW1lbnQuaGVpZ2h0KCkpO1xuICAgICAgICAgIHZhciBkb21FbGVtZW50ID0gcmVuZGVyZXIuZG9tRWxlbWVudDtcbiAgICAgICAgICBjb25maWcuaW5pdGlhbGl6ZShyZW5kZXJlciwgc2NlbmUsIGNhbWVyYSwgZG9tRWxlbWVudCk7XG5cbiAgICAgICAgICBlbGVtZW50LmFwcGVuZChkb21FbGVtZW50KTtcbiAgICAgICAgICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHJlc2l6ZUZ1bmMpO1xuXG4gICAgICAgICAgdmFyIHJlbmRlciA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmICgha2VlcFJlbmRlcmluZykge1xuICAgICAgICAgICAgICBjbGVhbnVwKCk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICAgICAgICAgICAgaWYgKGNvbmZpZy5yZW5kZXIpIHtcbiAgICAgICAgICAgICAgY29uZmlnLnJlbmRlcihyZW5kZXJlciwgc2NlbmUsIGNhbWVyYSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZW5kZXJlci5yZW5kZXIoc2NlbmUsIGNhbWVyYSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGtlZXBSZW5kZXJpbmcgPSB0cnVlO1xuICAgICAgICAgIHJlbmRlcigpO1xuICAgICAgICB9LCA1MDAsIHsgdHJhaWxpbmc6IHRydWUgfSkpO1xuICAgICAgfVxuICAgIH07XG4gIH1dKTtcblxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImt1YmUzZFBsdWdpbi50c1wiLz5cbi8vLyA8cmVmZXJlbmNlIHBhdGg9XCJwbGF5ZXIudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwid29ybGQudHNcIi8+XG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwib2JqZWN0cy50c1wiLz5cblxubW9kdWxlIEt1YmUzZCB7XG5cbiAgZXhwb3J0IHZhciBWaWV3Q29udHJvbGxlciA9IGNvbnRyb2xsZXIoJ1ZpZXdDb250cm9sbGVyJywgWyckc2NvcGUnLCAnS3ViZXJuZXRlc01vZGVsJywgJ0t1YmVybmV0ZXNTdGF0ZScsICckZWxlbWVudCcsICgkc2NvcGUsIG1vZGVsOkt1YmVybmV0ZXMuS3ViZXJuZXRlc01vZGVsU2VydmljZSwgc3RhdGUsICRlbGVtZW50KSA9PiB7XG5cbiAgICB2YXIgZGVidWdTY2VuZSA9IGZhbHNlO1xuXG4gICAgdmFyIHJlbmRlcmVyOmFueSA9IHVuZGVmaW5lZDtcbiAgICB2YXIgc2NlbmU6YW55ID0gdW5kZWZpbmVkO1xuICAgIHZhciBjYW1lcmE6YW55ID0gdW5kZWZpbmVkO1xuICAgIHZhciBkb21FbGVtZW50OmFueSA9IHVuZGVmaW5lZDtcblxuICAgIHZhciBzY2VuZUdlb21ldHJ5ID0gbmV3IFRIUkVFLk9iamVjdDNEKCk7XG4gICAgdmFyIHNjZW5lQm91bmRzID0gbmV3IFRIUkVFLkJvdW5kaW5nQm94SGVscGVyKHNjZW5lR2VvbWV0cnksIDB4ZmYwMDAwKTtcblxuICAgIHZhciBob3N0T2JqZWN0cyA9IHt9O1xuXG4gICAgdmFyIHVwZGF0aW5nID0gZmFsc2U7XG4gICAgdmFyIGhhc01vdXNlID0gZmFsc2U7XG5cbiAgICB2YXIgcGxheWVyOlBsYXllciA9IG51bGw7XG4gICAgdmFyIHdvcmxkOldvcmxkID0gbnVsbDtcblxuICAgICRzY29wZS5vbkxvY2sgPSAobG9jaykgPT4ge1xuICAgICAgaWYgKCFwbGF5ZXIpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcGxheWVyLmVuYWJsZWQgPSBsb2NrO1xuICAgIH1cblxuICAgICRzY29wZS5jb25maWcgPSB7XG4gICAgICBpbml0aWFsaXplOiAociwgcywgYywgZCkgPT4ge1xuICAgICAgICBsb2cuZGVidWcoXCJpbml0IGNhbGxlZFwiKTtcbiAgICAgICAgcmVuZGVyZXIgPSByO1xuICAgICAgICBzY2VuZSA9IHM7XG4gICAgICAgIGNhbWVyYSA9IGM7XG4gICAgICAgIGRvbUVsZW1lbnQgPSBkO1xuXG4gICAgICAgIHdvcmxkID0gbmV3IFdvcmxkKHNjZW5lKTtcbiAgICAgICAgcGxheWVyID0gbmV3IFBsYXllcihzY2VuZSwgY2FtZXJhLCBkLCB3b3JsZCk7XG5cbiAgICAgICAgc2NlbmUuYWRkKHNjZW5lR2VvbWV0cnkpO1xuXG4gICAgICAgIGlmIChkZWJ1Z1NjZW5lKSB7XG4gICAgICAgICAgLy8gZGVidWcgc3R1ZmZcbiAgICAgICAgICAvLyBwdXRzIGEgYm91bmRpbmcgYm94IGFyb3VuZCB0aGUgc2NlbmUgd2Ugd2FudCB0byB2aWV3XG4gICAgICAgICAgc2NlbmUuYWRkKHNjZW5lQm91bmRzKTtcblxuICAgICAgICB9XG4gICAgICAgIC8vIGFkZHMgbGluZXMgZm9yIHRoZSB4L3kveiBheGlzXG4gICAgICAgIC8vIFRoZSBYIGF4aXMgaXMgcmVkLiBUaGUgWSBheGlzIGlzIGdyZWVuLiBUaGUgWiBheGlzIGlzIGJsdWVcbiAgICAgICAgdmFyIGF4aXMgPSBuZXcgVEhSRUUuQXhpc0hlbHBlcigxMDAwKTtcbiAgICAgICAgc2NlbmUuYWRkKGF4aXMpO1xuXG4gICAgICAgIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueCA9IDkwO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnogPSA5MDtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5wb3NpdGlvbi54ID0gMDtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5wb3NpdGlvbi55ID0gMDtcbiAgICAgICAgc2NlbmVHZW9tZXRyeS5wb3NpdGlvbi56ID0gMDtcbiAgICAgICAgYnVpbGRTY2VuZSgpO1xuICAgICAgfSxcbiAgICAgIHJlbmRlcjogKHJlbmRlcmVyLCBzY2VuZSwgY2FtZXJhKSA9PiB7XG4gICAgICAgIC8vIE5PVEUgLSB0aGlzIGZ1bmN0aW9uIHJ1bnMgYXQgfiA2MGZwcyFcbiAgICAgICAgaWYgKHVwZGF0aW5nKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHdvcmxkLnJlbmRlcigpO1xuICAgICAgICB2YXIgYW5nbGUgPSBEYXRlLm5vdygpICogMC4wMDAxO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnggPSAxMDAwICogTWF0aC5jb3MoYW5nbGUpO1xuICAgICAgICBzY2VuZUdlb21ldHJ5LnBvc2l0aW9uLnogPSAxMDAwICogTWF0aC5zaW4oYW5nbGUpO1xuICAgICAgICAvLyBzY2VuZUdlb21ldHJ5LnJvdGF0aW9uLnggKz0gMC4wMDE7XG4gICAgICAgIC8vIHNjZW5lR2VvbWV0cnkucm90YXRpb24ueSArPSAwLjAwMTtcbiAgICAgICAgLy8gc2NlbmVHZW9tZXRyeS5yb3RhdGlvbi56ICs9IDAuMDAxO1xuICAgICAgICBfLmZvckluKGhvc3RPYmplY3RzLCAoaG9zdE9iamVjdCwga2V5KSA9PiB7XG4gICAgICAgICAgaG9zdE9iamVjdC5yZW5kZXIoKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHNjZW5lQm91bmRzLnVwZGF0ZSgpO1xuICAgICAgICBwbGF5ZXIubG9va0F0KHNjZW5lQm91bmRzLmJveCk7XG4gICAgICAgIHBsYXllci5yZW5kZXIoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBidWlsZFNjZW5lKCkge1xuICAgICAgaWYgKCFzY2VuZSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB1cGRhdGluZyA9IHRydWU7XG4gICAgICB2YXIgb3JpZ2luWCA9IDA7XG4gICAgICB2YXIgb3JpZ2luWSA9IDA7XG5cbiAgICAgIHZhciBob3N0c1RvUmVtb3ZlID0gW107XG5cbiAgICAgIF8uZm9ySW4oaG9zdE9iamVjdHMsIChob3N0T2JqZWN0LCBrZXkpID0+IHtcbiAgICAgICAgaWYgKF8uYW55KG1vZGVsLmhvc3RzLCAoaG9zdCkgPT4gaG9zdC5lbGVtZW50SWQgPT09IGtleSkpIHtcbiAgICAgICAgICBsb2cuZGVidWcoXCJLZWVwaW5nIGhvc3Q6IFwiLCBrZXkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGhvc3RzVG9SZW1vdmUucHVzaChrZXkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgXy5mb3JFYWNoKGhvc3RzVG9SZW1vdmUsIChrZXkpID0+IHtcbiAgICAgICAgdmFyIGhvc3RPYmplY3QgPSBob3N0T2JqZWN0c1trZXldO1xuICAgICAgICBpZiAoaG9zdE9iamVjdCkge1xuICAgICAgICAgIGhvc3RPYmplY3QuZGVzdHJveSgpO1xuICAgICAgICAgIGRlbGV0ZSBob3N0T2JqZWN0c1trZXldO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgXy5mb3JFYWNoKG1vZGVsLmhvc3RzLCAoaG9zdCkgPT4ge1xuICAgICAgICB2YXIgaWQgPSBob3N0LmVsZW1lbnRJZDtcbiAgICAgICAgbG9nLmRlYnVnKFwiaG9zdDogXCIsIGhvc3QpO1xuICAgICAgICB2YXIgaG9zdE9iamVjdCA9IGhvc3RPYmplY3RzW2lkXSB8fCBuZXcgSG9zdE9iamVjdChzY2VuZUdlb21ldHJ5LCBpZCwgaG9zdCk7XG4gICAgICAgIGlmICghKGlkIGluIGhvc3RPYmplY3RzKSkge1xuICAgICAgICAgIGhvc3RPYmplY3Quc2V0UG9zaXRpb24ob3JpZ2luWCwgb3JpZ2luWSwgMCk7XG4gICAgICAgICAgb3JpZ2luWCA9IG9yaWdpblggKyA1MDA7XG4gICAgICAgICAgb3JpZ2luWSA9IG9yaWdpblkgKyA1MDA7XG4gICAgICAgICAgaG9zdE9iamVjdHNbaWRdID0gaG9zdE9iamVjdDtcbiAgICAgICAgfVxuICAgICAgICBob3N0T2JqZWN0LnVwZGF0ZShtb2RlbCwgaG9zdCk7XG4gICAgICAgIGhvc3RPYmplY3QuZGVidWcoZGVidWdTY2VuZSk7XG4gICAgICB9KTtcblxuICAgICAgbG9nLmRlYnVnKFwibW9kZWwgdXBkYXRlZFwiKTtcbiAgICAgIHVwZGF0aW5nID0gZmFsc2U7XG4gICAgfVxuICAgICRzY29wZS4kb24oJ2t1YmVybmV0ZXNNb2RlbFVwZGF0ZWQnLCBidWlsZFNjZW5lKTtcbiAgfV0pO1xuXG59XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
angular.module("hawtio-kube3d-templates", []).run(["$templateCache", function($templateCache) {$templateCache.put("plugins/kube3d/html/view.html","<div class=\"kube3d-viewport\" ng-controller=\"Kube3d.ViewController\">\n  <div class=\"kube3d-control\" threejs=\"config\"></div>\n  <div class=\"kube3d-instructions\" request-lock=\'onLock(lock)\'>\n    <div class=\"kube3d-instructions-wrapper\">\n      <span class=\"kube3d-start-title\">Click to play</span>\n    </div>\n  </div>\n</div>\n");}]); hawtioPluginLoader.addModule("hawtio-kube3d-templates");